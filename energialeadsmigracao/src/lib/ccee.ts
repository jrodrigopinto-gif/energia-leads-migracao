import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";
import { cnpjRaiz, onlyDigits } from "@/lib/cnpj";

const CCEE_BASE_URL = process.env.CCEE_BASE_URL ?? "https://dadosabertos.ccee.org.br";
const CCEE_DATASET = "varejista_consumidor";

interface CkanResource {
  id: string;
  name: string;
  url: string;
  format: string;
  last_modified?: string;
}

interface CkanPackageShowResponse {
  result: { resources: CkanResource[] };
}

async function getLatestCsvResource(): Promise<CkanResource> {
  const res = await fetch(`${CCEE_BASE_URL}/api/3/action/package_show?id=${CCEE_DATASET}`);
  if (!res.ok) throw new Error(`Falha ao consultar dataset CCEE: HTTP ${res.status}`);
  const body = (await res.json()) as CkanPackageShowResponse;

  const csvResources = body.result.resources.filter(
    (r) => r.format?.toUpperCase() === "CSV"
  );
  if (csvResources.length === 0) throw new Error("Nenhum recurso CSV encontrado no dataset CCEE");

  csvResources.sort((a, b) => (a.name < b.name ? 1 : -1)); // nomes trazem o ano, ex: varejista_consumidor_2025
  return csvResources[0];
}

/** Tenta reconhecer a coluna de CNPJ/nome do consumidor independente do
 * cabeçalho exato do CSV publicado (o formato já variou entre publicações). */
function findColumn(headerRow: Record<string, string>, candidates: string[]): string | null {
  const keys = Object.keys(headerRow);
  for (const candidate of candidates) {
    const match = keys.find((k) => k.toLowerCase().includes(candidate));
    if (match) return match;
  }
  return null;
}

export async function syncCceeMigrated(): Promise<{ processed: number; resourceName: string }> {
  const resource = await getLatestCsvResource();
  const csvRes = await fetch(resource.url);
  if (!csvRes.ok) throw new Error(`Falha ao baixar CSV da CCEE: HTTP ${csvRes.status}`);
  const csvText = await csvRes.text();

  const rows: Record<string, string>[] = parse(csvText, {
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  if (rows.length === 0) return { processed: 0, resourceName: resource.name };

  const cnpjCol = findColumn(rows[0], ["cnpj"]);
  const nomeCol = findColumn(rows[0], ["consumidor", "razao", "nome"]);
  const varejistaCol = findColumn(rows[0], ["varejista", "comercializador"]);
  const submercadoCol = findColumn(rows[0], ["submercado"]);
  const perfilCol = findColumn(rows[0], ["perfil"]);

  if (!cnpjCol) throw new Error("Coluna de CNPJ não encontrada no CSV da CCEE");

  let processed = 0;
  const BATCH_SIZE = 200;
  let batch: Array<Parameters<typeof prisma.migratedConsumer.upsert>[0]["create"]> = [];

  async function flushBatch() {
    if (batch.length === 0) return;
    await prisma.$transaction(
      batch.map((data) =>
        prisma.migratedConsumer.upsert({
          where: { cnpj_dataReferencia: { cnpj: data.cnpj, dataReferencia: data.dataReferencia ?? "" } },
          create: data,
          update: data,
        })
      )
    );
    processed += batch.length;
    batch = [];
  }

  for (const row of rows) {
    const rawCnpj = row[cnpjCol];
    const cnpj = onlyDigits(rawCnpj);
    if (cnpj.length < 8) continue;

    batch.push({
      cnpj,
      cnpjRaiz: cnpjRaiz(cnpj),
      nomeConsumidor: nomeCol ? row[nomeCol] : "(não informado)",
      agenteVarejista: varejistaCol ? row[varejistaCol] : null,
      submercado: submercadoCol ? row[submercadoCol] : null,
      perfil: perfilCol ? row[perfilCol] : null,
      dataReferencia: resource.name,
      source: "CCEE",
      rawData: JSON.stringify(row),
    });

    if (batch.length >= BATCH_SIZE) await flushBatch();
  }
  await flushBatch();

  return { processed, resourceName: resource.name };
}

import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";
import { cnpjRaiz, onlyDigits } from "@/lib/cnpj";

const ANEEL_BASE_URL = process.env.ANEEL_BASE_URL ?? "https://dadosabertos.aneel.gov.br";
// Dataset "SIGA - Geração Distribuída": ao contrário da BDGD (anonimizada),
// este dataset traz o nome/CNPJ do titular da unidade consumidora com
// geração distribuída (mini/microgeração) — é a fonte correta para
// identificar consumidores com geração própria. Confirme o slug do dataset
// em https://dadosabertos.aneel.gov.br/dataset antes do primeiro sync: o
// nome exato já mudou entre publicações do portal CKAN da ANEEL.
const ANEEL_GD_DATASET = process.env.ANEEL_GD_DATASET ?? "siga-geracao-distribuida";

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
  const res = await fetch(`${ANEEL_BASE_URL}/api/3/action/package_show?id=${ANEEL_GD_DATASET}`);
  if (!res.ok) throw new Error(`Falha ao consultar dataset ANEEL SIGA-GD: HTTP ${res.status}`);
  const body = (await res.json()) as CkanPackageShowResponse;

  const csvResources = body.result.resources.filter(
    (r) => r.format?.toUpperCase() === "CSV"
  );
  if (csvResources.length === 0) throw new Error("Nenhum recurso CSV encontrado no dataset ANEEL SIGA-GD");

  csvResources.sort((a, b) => (a.name < b.name ? 1 : -1));
  return csvResources[0];
}

function findColumn(headerRow: Record<string, string>, candidates: string[]): string | null {
  const keys = Object.keys(headerRow);
  for (const candidate of candidates) {
    const match = keys.find((k) => k.toLowerCase().includes(candidate));
    if (match) return match;
  }
  return null;
}

/** Sincroniza consumidores com geração própria (GD) identificada, a partir do
 * dataset público SIGA-GD da ANEEL. Só considera titulares pessoa jurídica
 * (CNPJ com 14 dígitos) — geração residencial (CPF) é ignorada aqui. */
export async function syncAneelSelfGeneration(): Promise<{ processed: number; resourceName: string }> {
  const resource = await getLatestCsvResource();
  const csvRes = await fetch(resource.url);
  if (!csvRes.ok) throw new Error(`Falha ao baixar CSV do ANEEL SIGA-GD: HTTP ${csvRes.status}`);
  const csvText = await csvRes.text();

  const rows: Record<string, string>[] = parse(csvText, {
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  if (rows.length === 0) return { processed: 0, resourceName: resource.name };

  const docCol = findColumn(rows[0], ["cpfcnpj", "cnpj", "documento"]);
  const nomeCol = findColumn(rows[0], ["titular", "nome", "razao"]);
  const ufCol = findColumn(rows[0], ["uf", "sigufconsumidor"]);
  const municipioCol = findColumn(rows[0], ["municipio", "nommunicipio"]);
  const distribuidoraCol = findColumn(rows[0], ["distribuidora", "agente"]);
  const fonteCol = findColumn(rows[0], ["fonte", "combustivel"]);
  const tipoCol = findColumn(rows[0], ["tipo", "classe", "modalidade"]);
  const potenciaCol = findColumn(rows[0], ["potencia", "mdanuncio"]);
  const dataConexaoCol = findColumn(rows[0], ["conexao", "datacon"]);

  if (!docCol) throw new Error("Coluna de CPF/CNPJ não encontrada no CSV do ANEEL SIGA-GD");

  let processed = 0;
  const BATCH_SIZE = 200;
  let batch: Array<Parameters<typeof prisma.selfGenerationConsumer.upsert>[0]["create"]> = [];

  async function flushBatch() {
    if (batch.length === 0) return;
    await prisma.$transaction(
      batch.map((data) =>
        prisma.selfGenerationConsumer.upsert({
          where: {
            cnpj_dataConexao_potenciaKw: {
              cnpj: data.cnpj,
              dataConexao: data.dataConexao ?? "",
              potenciaKw: data.potenciaKw ?? 0,
            },
          },
          create: data,
          update: data,
        })
      )
    );
    processed += batch.length;
    batch = [];
  }

  for (const row of rows) {
    const doc = onlyDigits(row[docCol]);
    if (doc.length !== 14) continue; // mantém só pessoa jurídica

    const potenciaRaw = potenciaCol ? row[potenciaCol] : null;
    const potenciaKw = potenciaRaw
      ? Number.parseFloat(potenciaRaw.replace(/\./g, "").replace(",", "."))
      : null;

    batch.push({
      cnpj: doc,
      cnpjRaiz: cnpjRaiz(doc),
      nomeConsumidor: nomeCol ? row[nomeCol] : "(não informado)",
      uf: ufCol ? row[ufCol] : null,
      municipio: municipioCol ? row[municipioCol] : null,
      distribuidora: distribuidoraCol ? row[distribuidoraCol] : null,
      fonteGeracao: fonteCol ? row[fonteCol] : null,
      tipoGeracao: tipoCol ? row[tipoCol] : null,
      potenciaKw: Number.isFinite(potenciaKw) ? potenciaKw : null,
      dataConexao: dataConexaoCol ? row[dataConexaoCol] : null,
      dataReferencia: resource.name,
      source: "ANEEL_SIGA_GD",
      rawData: JSON.stringify(row),
    });

    if (batch.length >= BATCH_SIZE) await flushBatch();
  }
  await flushBatch();

  return { processed, resourceName: resource.name };
}

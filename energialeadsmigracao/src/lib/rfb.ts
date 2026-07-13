import unzipper from "unzipper";
import iconv from "iconv-lite";
import readline from "node:readline";
import { prisma } from "@/lib/prisma";
import { cnpjRaiz } from "@/lib/cnpj";
import { CNAE_CODES, ENERGY_INTENSIVE_CNAES } from "@/config/cnae";
import {
  parseCapitalSocial,
  parseEmpresaLine,
  parseEstabelecimentoLine,
  PORTE_EMPRESA,
  SITUACAO_CADASTRAL,
} from "@/lib/rfbLayout";

const RFB_BASE_URL =
  process.env.RFB_BASE_URL ?? "https://dadosabertos.rfb.gov.br/CNPJ/dados_abertos_cnpj";

const cnaeDescByCode = new Map(
  ENERGY_INTENSIVE_CNAES.map((c) => [c.codigo.replace(/\D/g, ""), c.descricao])
);

interface CandidateDraft {
  cnpjBasico: string;
  nomeFantasia: string;
  cnae: string;
  uf: string;
  municipio: string;
  dataAbertura: string;
}

/** Descobre a pasta mais recente (ex: "2026-06") disponível no índice da RFB. */
async function discoverLatestMonth(): Promise<string> {
  const configured = process.env.RFB_MONTH;
  if (configured) return configured;

  const res = await fetch(`${RFB_BASE_URL}/`);
  if (!res.ok) throw new Error(`Falha ao listar diretório da RFB: HTTP ${res.status}`);
  const html = await res.text();
  const months = Array.from(html.matchAll(/href="(\d{4}-\d{2})\/"/g)).map((m) => m[1]);
  if (months.length === 0) throw new Error("Nenhuma pasta mensal encontrada no índice da RFB");
  return months.sort().at(-1)!;
}

/** Lista os arquivos .zip de um determinado prefixo (Estabelecimentos/Empresas) na pasta do mês. */
async function listZipFiles(month: string, prefix: "Estabelecimentos" | "Empresas"): Promise<string[]> {
  const res = await fetch(`${RFB_BASE_URL}/${month}/`);
  if (!res.ok) throw new Error(`Falha ao listar pasta ${month}: HTTP ${res.status}`);
  const html = await res.text();
  const pattern = new RegExp(`href="(${prefix}\\d*\\.zip)"`, "g");
  const files = Array.from(html.matchAll(pattern)).map((m) => m[1]);
  return files.sort();
}

/** Faz o streaming de um .zip remoto linha a linha, sem baixar o arquivo inteiro em disco. */
async function forEachLineInRemoteZip(url: string, onLine: (line: string) => void): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Falha ao baixar ${url}: HTTP ${res.status}`);

  const { Readable } = await import("node:stream");
  const nodeStream = Readable.fromWeb(res.body as unknown as import("stream/web").ReadableStream);

  await new Promise<void>((resolve, reject) => {
    nodeStream
      .pipe(unzipper.Parse())
      .on("entry", (entry: unzipper.Entry) => {
        const decoded = entry.pipe(iconv.decodeStream("latin1"));
        const rl = readline.createInterface({ input: decoded });
        rl.on("line", onLine);
        rl.on("close", () => entry.autodrain());
      })
      .on("close", resolve)
      .on("error", reject);
  });
}

/**
 * Sincroniza o universo de candidatos a partir da base pública de CNPJ da RFB.
 * Estratégia em 2 fases para manter uso de memória baixo mesmo com arquivos
 * de dezenas de GB:
 *  1) Varre os arquivos "Estabelecimentos*.zip" e mantém em memória apenas os
 *     estabelecimentos ATIVOS cujo CNAE principal está na lista de interesse.
 *  2) Varre os arquivos "Empresas*.zip" e, para os CNPJs básicos encontrados
 *     na fase 1, completa razão social/porte/capital social e grava no banco.
 */
export async function syncRfbCandidates(): Promise<{ processed: number }> {
  const month = await discoverLatestMonth();
  const estabelecimentoFiles = await listZipFiles(month, "Estabelecimentos");
  const empresaFiles = await listZipFiles(month, "Empresas");

  const candidates = new Map<string, CandidateDraft>();

  for (const file of estabelecimentoFiles) {
    await forEachLineInRemoteZip(`${RFB_BASE_URL}/${month}/${file}`, (line) => {
      const row = parseEstabelecimentoLine(line);
      if (!row) return;
      if (row.situacaoCadastral !== "02") return; // apenas ativas
      if (!CNAE_CODES.includes(row.cnaeFiscalPrincipal)) return;
      candidates.set(row.cnpjBasico, {
        cnpjBasico: row.cnpjBasico,
        nomeFantasia: row.nomeFantasia,
        cnae: row.cnaeFiscalPrincipal,
        uf: row.uf,
        municipio: row.municipio,
        dataAbertura: row.dataInicioAtividade,
      });
    });
  }

  if (candidates.size === 0) return { processed: 0 };

  let processed = 0;
  const BATCH_SIZE = 200;
  let batch: Array<Parameters<typeof prisma.candidateCompany.upsert>[0]["create"]> = [];

  async function flushBatch() {
    if (batch.length === 0) return;
    await prisma.$transaction(
      batch.map((data) =>
        prisma.candidateCompany.upsert({
          where: { cnpj: data.cnpj },
          create: data,
          update: data,
        })
      )
    );
    processed += batch.length;
    batch = [];
  }

  for (const file of empresaFiles) {
    await forEachLineInRemoteZip(`${RFB_BASE_URL}/${month}/${file}`, (line) => {
      const row = parseEmpresaLine(line);
      if (!row) return;
      const draft = candidates.get(row.cnpjBasico);
      if (!draft) return;

      const cnpj = `${draft.cnpjBasico}000100`.slice(0, 14).padEnd(14, "0");
      batch.push({
        cnpj,
        cnpjRaiz: cnpjRaiz(cnpj),
        razaoSocial: row.razaoSocial || draft.nomeFantasia || "(sem razão social)",
        nomeFantasia: draft.nomeFantasia || null,
        cnae: draft.cnae,
        cnaeDescricao: cnaeDescByCode.get(draft.cnae) ?? null,
        uf: draft.uf,
        municipio: draft.municipio || null,
        porte: PORTE_EMPRESA[row.porteEmpresa] ?? null,
        situacaoCadastral: SITUACAO_CADASTRAL["02"],
        dataAbertura: draft.dataAbertura || null,
        capitalSocial: parseCapitalSocial(row.capitalSocial),
        source: "RFB",
      });
    });

    while (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }
  await flushBatch();

  return { processed };
}

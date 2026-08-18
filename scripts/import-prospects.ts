// Importa a planilha "prospects_FINAL_organizado.xlsx" (uma aba por UF) para
// a tabela Prospect. Uso: tsx scripts/import-prospects.ts <caminho-do-xlsx>
import "dotenv/config";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";

interface Row {
  distribuidora: string;
  pn_con: string | number | null;
  cnpj_completo: string | number;
  razao_social: string;
  nome_fantasia: string | null;
  natureza_juridica: string | number | null;
  porte_empresa: string | number | null;
  capital_social: number | null;
  uf: string;
  cep: string | number | null;
  bairro: string | null;
  tipo_logradouro: string | null;
  logradouro: string | null;
  numero: string | number | null;
  cnae: string | number;
  grupo_tensao: string | null;
  grupo_tarifario: string | null;
  demanda_contratada_kw: number;
  origem_match: string | null;
  qtd_candidatos_para_essa_uc: number | null;
}

const BATCH_SIZE = 2000;

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Uso: tsx scripts/import-prospects.ts <caminho-do-xlsx>");
    process.exit(1);
  }

  console.log(`Lendo ${path}...`);
  const buf = readFileSync(path);
  const wb = XLSX.read(buf, { type: "buffer" });

  const sheetNames = wb.SheetNames.filter((n) => n !== "Resumo");
  console.log(`Abas encontradas (UFs): ${sheetNames.join(", ")}`);

  let totalImported = 0;

  for (const sheetName of sheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows: Row[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

    const data = rows.map((r) => ({
      distribuidora: String(r.distribuidora ?? ""),
      pnCon: r.pn_con != null ? String(r.pn_con) : null,
      cnpj: String(r.cnpj_completo).padStart(14, "0"),
      razaoSocial: String(r.razao_social ?? ""),
      nomeFantasia: r.nome_fantasia != null ? String(r.nome_fantasia) : null,
      naturezaJuridica: r.natureza_juridica != null ? String(r.natureza_juridica) : null,
      porteEmpresa: r.porte_empresa != null ? String(r.porte_empresa) : null,
      capitalSocial: r.capital_social != null ? Number(r.capital_social) : null,
      uf: String(r.uf ?? sheetName),
      cep: r.cep != null ? String(r.cep) : null,
      bairro: r.bairro != null ? String(r.bairro) : null,
      tipoLogradouro: r.tipo_logradouro != null ? String(r.tipo_logradouro) : null,
      logradouro: r.logradouro != null ? String(r.logradouro) : null,
      numero: r.numero != null ? String(r.numero) : null,
      cnae: String(r.cnae ?? ""),
      grupoTensao: r.grupo_tensao != null ? String(r.grupo_tensao) : null,
      grupoTarifario: r.grupo_tarifario != null ? String(r.grupo_tarifario) : null,
      demandaContratadaKw: Number(r.demanda_contratada_kw ?? 0),
      origemMatch: r.origem_match != null ? String(r.origem_match) : null,
      qtdCandidatosParaEssaUc:
        r.qtd_candidatos_para_essa_uc != null ? Number(r.qtd_candidatos_para_essa_uc) : null,
    }));

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      await prisma.prospect.createMany({ data: batch });
      totalImported += batch.length;
    }
    console.log(`  ${sheetName}: ${data.length} prospects importados`);
  }

  console.log(`Concluído. Total importado: ${totalImported}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

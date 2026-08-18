// Exporta os CNPJs distintos da base Prospect para CSV, para servir de
// entrada ao enriquecimento de contato (scripts/enrich_contacts_rfb.py).
// Uso: tsx scripts/export-prospect-cnpjs.ts [saida.csv]
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const outPath = process.argv[2] ?? "prospect-cnpjs.csv";
  const rows = await prisma.prospect.findMany({ select: { cnpj: true }, distinct: ["cnpj"] });
  const csv = ["cnpj", ...rows.map((r) => r.cnpj)].join("\n");
  writeFileSync(outPath, csv, "utf-8");
  console.log(`Exportados ${rows.length} CNPJs distintos para ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

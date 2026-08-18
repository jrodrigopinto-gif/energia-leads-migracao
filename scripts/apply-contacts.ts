// Aplica o CSV de contatos encontrados (gerado por
// scripts/enrich_contacts_rfb.py) na tabela Prospect.
// Uso: tsx scripts/apply-contacts.ts contacts_found.csv
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";

interface ContactRow {
  cnpj: string;
  ddd1: string;
  telefone1: string;
  ddd2: string;
  telefone2: string;
  email: string;
}

function parseCsv(content: string): ContactRow[] {
  const lines = content.trim().split("\n");
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {} as ContactRow;
    header.forEach((h, i) => {
      (row as unknown as Record<string, string>)[h.trim()] = (cols[i] ?? "").trim();
    });
    return row;
  });
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Uso: tsx scripts/apply-contacts.ts <contacts_found.csv>");
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(path, "utf-8"));
  console.log(`Lidos ${rows.length} contatos de ${path}`);

  let updated = 0;
  for (const row of rows) {
    if (!row.cnpj) continue;
    const result = await prisma.prospect.updateMany({
      where: { cnpj: row.cnpj },
      data: {
        telefoneDdd1: row.ddd1 || null,
        telefone1: row.telefone1 || null,
        telefoneDdd2: row.ddd2 || null,
        telefone2: row.telefone2 || null,
        email: row.email || null,
        contatoFonte: "RFB",
        contatoAtualizadoPor: "sync:rfb-contatos",
        contatoAtualizadoEm: new Date(),
      },
    });
    updated += result.count;
  }

  console.log(`Concluído. ${updated} unidades consumidoras (Prospect) atualizadas com contato.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

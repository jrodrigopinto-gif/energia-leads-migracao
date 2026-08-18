// Aplica o CSV de contatos encontrados (gerado por
// scripts/enrich_contacts_rfb.py ou enrich_contacts_rfb_local.py) na
// tabela Prospect.
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

const CONCURRENCY = 50;

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

/** Descarta telefones inválidos/placeholder (vazio, "0000", "00000000", etc). */
function cleanPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0 || /^0+$/.test(digits)) return null;
  return digits;
}

function cleanEmail(value: string): string | null {
  const v = value.trim().toLowerCase();
  return v.length > 3 && v.includes("@") ? v : null;
}

async function processRow(row: ContactRow): Promise<0 | 1> {
  if (!row.cnpj) return 0;

  const telefone1 = cleanPhone(row.telefone1);
  const telefoneDdd1 = telefone1 ? cleanPhone(row.ddd1) : null;
  const telefone2 = cleanPhone(row.telefone2);
  const telefoneDdd2 = telefone2 ? cleanPhone(row.ddd2) : null;
  const email = cleanEmail(row.email);

  if (!telefone1 && !telefone2 && !email) return 0;

  const result = await prisma.prospect.updateMany({
    where: { cnpj: row.cnpj },
    data: {
      telefoneDdd1,
      telefone1,
      telefoneDdd2,
      telefone2,
      email,
      contatoFonte: "RFB",
      contatoAtualizadoPor: "sync:rfb-contatos",
      contatoAtualizadoEm: new Date(),
    },
  });
  return result.count > 0 ? 1 : 0;
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
  let skipped = 0;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(processRow));
    for (const r of results) {
      if (r) updated++;
      else skipped++;
    }

    if ((i / CONCURRENCY) % 20 === 0) {
      console.log(`  ...${Math.min(i + CONCURRENCY, rows.length)}/${rows.length} processados (${updated} atualizados)`);
    }
  }

  console.log(`Concluído. ${updated} leads atualizados com contato, ${skipped} sem contato válido/ignorados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

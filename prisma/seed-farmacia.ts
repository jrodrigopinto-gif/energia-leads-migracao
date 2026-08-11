/**
 * Seed de produtos exemplo para a farmácia.
 * Execute: npx tsx prisma/seed-farmacia.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const produtos = [
  // Analgésicos / Antitérmicos
  { code: "ANA001", name: "Dipirona Sódica 500mg c/10 comp", category: "Analgésico", price: 4.9, discountPct: 0, stock: 200, unit: "cx" },
  { code: "ANA002", name: "Dipirona Sódica Gotas 20ml", category: "Analgésico", price: 5.5, discountPct: 10, stock: 120, unit: "fr" },
  { code: "ANA003", name: "Paracetamol 500mg c/20 comp", category: "Analgésico", price: 6.8, discountPct: 0, stock: 180, unit: "cx" },
  { code: "ANA004", name: "Tylenol Sinus c/16 comp", category: "Antigripal", price: 18.9, discountPct: 5, stock: 80, unit: "cx" },
  { code: "ANA005", name: "Ibuprofeno 600mg c/20 comp", category: "Anti-inflamatório", price: 14.5, discountPct: 0, stock: 100, unit: "cx" },
  { code: "ANA006", name: "Nimesulida 100mg c/12 comp", category: "Anti-inflamatório", price: 9.9, discountPct: 15, stock: 90, unit: "cx" },
  { code: "ANA007", name: "Buscopan Composto c/10 comp", category: "Antiespasmódico", price: 16.8, discountPct: 0, stock: 70, unit: "cx" },

  // Antibióticos (requer receita)
  { code: "ATB001", name: "Amoxicilina 500mg c/21 cap", category: "Antibiótico", price: 22.9, discountPct: 0, stock: 60, unit: "cx", requiresPrescription: true },
  { code: "ATB002", name: "Azitromicina 500mg c/3 comp", category: "Antibiótico", price: 28.5, discountPct: 0, stock: 40, unit: "cx", requiresPrescription: true },

  // Digestivos / Estômago
  { code: "DIG001", name: "Omeprazol 20mg c/14 cap", category: "Digestivo", price: 12.9, discountPct: 20, stock: 150, unit: "cx" },
  { code: "DIG002", name: "Pantoprazol 40mg c/14 comp", category: "Digestivo", price: 18.5, discountPct: 10, stock: 80, unit: "cx" },
  { code: "DIG003", name: "Luftal Gotas 15ml", category: "Digestivo", price: 9.9, discountPct: 0, stock: 90, unit: "fr" },

  // Vitaminas / Suplementos
  { code: "VIT001", name: "Vitamina C 1000mg c/30 comp", category: "Vitamina", price: 24.9, discountPct: 10, stock: 100, unit: "cx" },
  { code: "VIT002", name: "Vitamina D 2000UI c/60 cap", category: "Vitamina", price: 32.9, discountPct: 15, stock: 80, unit: "cx" },
  { code: "VIT003", name: "Vitamina B12 1000mcg c/30 comp", category: "Vitamina", price: 28.9, discountPct: 0, stock: 70, unit: "cx" },
  { code: "VIT004", name: "Sulfato Ferroso 40mg c/30 comp", category: "Vitamina", price: 8.9, discountPct: 0, stock: 120, unit: "cx" },
  { code: "VIT005", name: "Complexo B c/60 comp", category: "Vitamina", price: 19.9, discountPct: 5, stock: 90, unit: "cx" },

  // Antialérgicos
  { code: "ALE001", name: "Loratadina 10mg c/12 comp", category: "Antialérgico", price: 8.5, discountPct: 0, stock: 130, unit: "cx" },
  { code: "ALE002", name: "Cetirizina 10mg c/10 comp", category: "Antialérgico", price: 10.9, discountPct: 5, stock: 100, unit: "cx" },

  // Cardiologia (requer receita)
  { code: "CAR001", name: "Losartana 50mg c/30 comp", category: "Cardiologia", price: 18.9, discountPct: 0, stock: 80, unit: "cx", requiresPrescription: true },
  { code: "CAR002", name: "Atenolol 50mg c/30 comp", category: "Cardiologia", price: 14.9, discountPct: 0, stock: 60, unit: "cx", requiresPrescription: true },

  // Diabetes (requer receita)
  { code: "DIA001", name: "Metformina 500mg c/60 comp", category: "Diabetes", price: 12.9, discountPct: 0, stock: 70, unit: "cx", requiresPrescription: true },

  // Antigripais / Descongestionantes
  { code: "GRI001", name: "Resfenol c/16 comp", category: "Antigripal", price: 14.9, discountPct: 0, stock: 100, unit: "cx" },
  { code: "GRI002", name: "Descongex Plus c/16 comp", category: "Descongestionante", price: 16.9, discountPct: 10, stock: 80, unit: "cx" },
  { code: "GRI003", name: "Spray Nasal Sorine 30ml", category: "Descongestionante", price: 22.9, discountPct: 0, stock: 60, unit: "fr" },

  // Higiene / Primeiros Socorros
  { code: "HIG001", name: "Álcool Gel 70% 500ml", category: "Higiene", price: 12.9, discountPct: 0, stock: 200, unit: "fr" },
  { code: "HIG002", name: "Água Oxigenada 10 vol 100ml", category: "Primeiros Socorros", price: 3.5, discountPct: 0, stock: 150, unit: "fr" },
  { code: "HIG003", name: "Band-Aid c/40 un", category: "Primeiros Socorros", price: 9.9, discountPct: 5, stock: 80, unit: "cx" },

  // Beleza / Dermatologia
  { code: "BEL001", name: "Protetor Solar FPS50 50ml", category: "Dermatologia", price: 38.9, discountPct: 10, stock: 60, unit: "fr" },
  { code: "BEL002", name: "Bepantol Derma Creme 30g", category: "Dermatologia", price: 32.9, discountPct: 0, stock: 50, unit: "tb" },

  // Cuidados
  { code: "CUI001", name: "Fralda Geriátrica G c/8 un", category: "Cuidados", price: 34.9, discountPct: 5, stock: 40, unit: "pc" },
  { code: "CUI002", name: "Termômetro Digital", category: "Equipamentos", price: 29.9, discountPct: 15, stock: 30, unit: "un" },
];

async function main() {
  console.log("Inserindo produtos da farmácia...");

  for (const p of produtos) {
    await prisma.pharmacyProduct.upsert({
      where: { code: p.code },
      update: { ...p },
      create: {
        code: p.code,
        name: p.name,
        category: p.category,
        price: p.price,
        discountPct: p.discountPct,
        stock: p.stock,
        unit: p.unit,
        requiresPrescription: (p as { requiresPrescription?: boolean }).requiresPrescription ?? false,
        active: true,
      },
    });
  }

  console.log(`✓ ${produtos.length} produtos inseridos/atualizados.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

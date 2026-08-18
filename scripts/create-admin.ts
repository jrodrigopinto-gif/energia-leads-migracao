// Cria (ou atualiza) o usuário administrador inicial do LeadVolt.
// Uso: tsx scripts/create-admin.ts <email> <senha> [nome]
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Uso: tsx scripts/create-admin.ts <email> <senha> [nome]");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("A senha deve ter no mínimo 8 caracteres.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), name: name ?? "Admin LeadVolt", passwordHash, role: "ADMIN" },
    update: { passwordHash, role: "ADMIN" },
  });

  console.log(`Admin pronto: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { prisma } from "../src/lib/prisma";
import { syncCceeMigrated } from "../src/lib/ccee";

async function main() {
  const log = await prisma.syncLog.create({ data: { source: "CCEE" } });
  try {
    const { processed, resourceName } = await syncCceeMigrated();
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "success", recordsProcessed: processed, message: `Recurso: ${resourceName}`, finishedAt: new Date() },
    });
    console.log(`OK: ${processed} consumidores migrados sincronizados (${resourceName})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncLog.update({ where: { id: log.id }, data: { status: "error", message, finishedAt: new Date() } });
    console.error(`Erro no sync CCEE: ${message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

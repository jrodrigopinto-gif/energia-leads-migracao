import { prisma } from "../src/lib/prisma";
import { syncAneelSelfGeneration } from "../src/lib/siga";

async function main() {
  const log = await prisma.syncLog.create({ data: { source: "ANEEL_SIGA_GD" } });
  try {
    const { processed, resourceName } = await syncAneelSelfGeneration();
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "success", recordsProcessed: processed, message: `Recurso: ${resourceName}`, finishedAt: new Date() },
    });
    console.log(`OK: ${processed} consumidores com geração própria sincronizados (${resourceName})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncLog.update({ where: { id: log.id }, data: { status: "error", message, finishedAt: new Date() } });
    console.error(`Erro no sync ANEEL SIGA-GD: ${message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

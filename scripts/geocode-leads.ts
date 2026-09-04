import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { geocodeCandidates } from "../src/lib/geocode";

async function main() {
  const log = await prisma.syncLog.create({ data: { source: "GEOCODE" } });
  let totalProcessed = 0;
  let totalWithCoordinates = 0;
  let totalSkipped = 0;

  try {
    // Roda em lotes até não sobrar candidato pendente (geocodedAt null),
    // ao invés de um único lote gigante, para dar visibilidade de progresso.
    for (;;) {
      const { processed, withCoordinates, skippedNoValidCep } = await geocodeCandidates({ limit: 500 });
      totalProcessed += processed;
      totalWithCoordinates += withCoordinates;
      totalSkipped += skippedNoValidCep;
      console.log(`Lote: ${processed} processados (${withCoordinates} com coordenadas, ${skippedNoValidCep} sem CEP válido)`);
      if (processed === 0) break;
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "success",
        recordsProcessed: totalProcessed,
        message: `Com coordenadas: ${totalWithCoordinates}, sem CEP válido: ${totalSkipped}`,
        finishedAt: new Date(),
      },
    });
    console.log(`OK: ${totalProcessed} candidatos geocodificados (${totalWithCoordinates} com coordenadas)`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncLog.update({ where: { id: log.id }, data: { status: "error", message, finishedAt: new Date() } });
    console.error(`Erro na geocodificação: ${message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

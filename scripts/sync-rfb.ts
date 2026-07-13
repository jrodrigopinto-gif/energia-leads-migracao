import { prisma } from "../src/lib/prisma";
import { syncRfbCandidates } from "../src/lib/rfb";

/**
 * Executa a varredura completa da base de CNPJ da Receita Federal.
 * Isso baixa e processa dezenas de GB em streaming (Estabelecimentos +
 * Empresas) — pode levar horas dependendo da banda disponível. Rode como
 * job de background/cron em um servidor com boa conexão, não como request
 * HTTP síncrono.
 */
async function main() {
  const log = await prisma.syncLog.create({ data: { source: "RFB" } });
  try {
    const { processed } = await syncRfbCandidates();
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "success", recordsProcessed: processed, finishedAt: new Date() },
    });
    console.log(`OK: ${processed} candidatos sincronizados`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncLog.update({ where: { id: log.id }, data: { status: "error", message, finishedAt: new Date() } });
    console.error(`Erro no sync RFB: ${message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

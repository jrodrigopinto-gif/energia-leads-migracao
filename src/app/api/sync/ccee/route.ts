import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncCceeMigrated } from "@/lib/ccee";

export async function POST() {
  const log = await prisma.syncLog.create({ data: { source: "CCEE" } });
  try {
    const { processed, resourceName } = await syncCceeMigrated();
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "success",
        recordsProcessed: processed,
        message: `Recurso: ${resourceName}`,
        finishedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, processed, resourceName });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "error", message, finishedAt: new Date() },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncRfbCandidates } from "@/lib/rfb";
import { getCurrentUser } from "@/lib/dal";

export const maxDuration = 300;

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  const log = await prisma.syncLog.create({ data: { source: "RFB" } });
  try {
    const { processed } = await syncRfbCandidates();
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "success", recordsProcessed: processed, finishedAt: new Date() },
    });
    return NextResponse.json({ ok: true, processed });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "error", message, finishedAt: new Date() },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geocodeCandidates } from "@/lib/geocode";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "500");

  const log = await prisma.syncLog.create({ data: { source: "GEOCODE" } });
  try {
    const { processed, withCoordinates, skippedNoValidCep } = await geocodeCandidates({ limit });
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "success",
        recordsProcessed: processed,
        message: `Com coordenadas: ${withCoordinates}, sem CEP válido: ${skippedNoValidCep}`,
        finishedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, processed, withCoordinates, skippedNoValidCep });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: "error", message, finishedAt: new Date() },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

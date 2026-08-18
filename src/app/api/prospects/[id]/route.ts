import { NextRequest, NextResponse } from "next/server";
import { getProspectById, updateProspectContact, type ContactUpdateInput } from "@/lib/prospects";
import { requireActiveSubscription } from "@/lib/dal";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireActiveSubscription();
  const { id } = await params;

  const prospect = await getProspectById(id);
  if (!prospect) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }
  return NextResponse.json(prospect);
}

function sanitize(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireActiveSubscription();
  const { id } = await params;

  const existing = await getProspectById(id);
  if (!existing) {
    return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: ContactUpdateInput = {
    telefoneDdd1: sanitize(body.telefoneDdd1),
    telefone1: sanitize(body.telefone1),
    telefoneDdd2: sanitize(body.telefoneDdd2),
    telefone2: sanitize(body.telefone2),
    email: sanitize(body.email),
  };

  const updated = await updateProspectContact(id, data, user.name);
  return NextResponse.json(updated);
}

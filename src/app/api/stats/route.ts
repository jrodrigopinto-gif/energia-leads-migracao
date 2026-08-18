import { NextResponse } from "next/server";
import { getStats } from "@/lib/leads";
import { getCurrentUser } from "@/lib/dal";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  const stats = await getStats();
  return NextResponse.json(stats);
}

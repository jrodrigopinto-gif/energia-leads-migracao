import { NextResponse } from "next/server";
import { getPharmacyStats } from "@/lib/pharmacy";

export async function GET() {
  const stats = await getPharmacyStats();
  return NextResponse.json(stats);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  const where = {
    active: true,
    ...(category ? { category: { contains: category, mode: "insensitive" as const } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { code: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.pharmacyProduct.count({ where }),
    prisma.pharmacyProduct.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    rows: rows.map((p) => ({
      ...p,
      finalPrice: p.price * (1 - p.discountPct / 100),
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, name, description, category, price, discountPct, stock, unit, requiresPrescription } = body;

  if (!code || !name || price == null) {
    return NextResponse.json({ error: "code, name e price são obrigatórios" }, { status: 400 });
  }

  const product = await prisma.pharmacyProduct.create({
    data: {
      code,
      name,
      description: description ?? null,
      category: category ?? null,
      price: Number(price),
      discountPct: Number(discountPct ?? 0),
      stock: Number(stock ?? 0),
      unit: unit ?? "un",
      requiresPrescription: Boolean(requiresPrescription),
    },
  });

  return NextResponse.json(product, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const product = await prisma.pharmacyProduct.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.price !== undefined ? { price: Number(data.price) } : {}),
      ...(data.discountPct !== undefined ? { discountPct: Number(data.discountPct) } : {}),
      ...(data.stock !== undefined ? { stock: Number(data.stock) } : {}),
      ...(data.active !== undefined ? { active: Boolean(data.active) } : {}),
    },
  });

  return NextResponse.json(product);
}

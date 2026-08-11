import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const date = searchParams.get("date"); // YYYY-MM-DD
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  const dateFilter = date
    ? {
        cashierSentAt: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`),
        },
      }
    : {};

  const where = {
    ...(status ? { status } : {}),
    ...dateFilter,
  };

  const [total, rows] = await Promise.all([
    prisma.pharmacyOrder.count({ where }),
    prisma.pharmacyOrder.findMany({
      where,
      orderBy: { cashierSentAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        conversation: { select: { customerName: true, waId: true } },
        items: { select: { productName: true, quantity: true, unitPrice: true, discount: true, subtotal: true } },
      },
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, totalPages: Math.ceil(total / pageSize), rows });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: "id e status obrigatórios" }, { status: 400 });

  const order = await prisma.pharmacyOrder.update({ where: { id }, data: { status } });
  return NextResponse.json(order);
}

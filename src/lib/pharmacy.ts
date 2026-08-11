import { prisma } from "./prisma";

export type ProductSummary = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  price: number;
  discountPct: number;
  finalPrice: number;
  stock: number;
  unit: string;
  requiresPrescription: boolean;
};

export async function searchProducts(query: string, category?: string): Promise<ProductSummary[]> {
  const rows = await prisma.pharmacyProduct.findMany({
    where: {
      active: true,
      stock: { gt: 0 },
      ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
        { code: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 8,
    orderBy: { name: "asc" },
  });

  return rows.map(toSummary);
}

export async function getProduct(id: string): Promise<ProductSummary | null> {
  const row = await prisma.pharmacyProduct.findUnique({ where: { id } });
  return row ? toSummary(row) : null;
}

function toSummary(row: {
  id: string;
  code: string;
  name: string;
  category: string | null;
  price: number;
  discountPct: number;
  stock: number;
  unit: string;
  requiresPrescription: boolean;
}): ProductSummary {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    price: row.price,
    discountPct: row.discountPct,
    finalPrice: row.price * (1 - row.discountPct / 100),
    stock: row.stock,
    unit: row.unit,
    requiresPrescription: row.requiresPrescription,
  };
}

type OrderInput = {
  conversationId: string;
  items: { productId: string; quantity: number }[];
  deliveryType: "pickup" | "delivery";
  paymentMethod: "cash" | "pix" | "credit_card";
  address?: string;
  notes?: string;
};

export async function createOrder(input: OrderInput) {
  const products = await Promise.all(
    input.items.map((i) => prisma.pharmacyProduct.findUnique({ where: { id: i.productId } })),
  );

  let total = 0;
  const itemsData = input.items.map((item, idx) => {
    const p = products[idx];
    if (!p) throw new Error(`Produto não encontrado: ${item.productId}`);
    const discount = p.price * (p.discountPct / 100);
    const unitPrice = p.price;
    const subtotal = (unitPrice - discount) * item.quantity;
    total += subtotal;
    return { productId: p.id, productName: p.name, quantity: item.quantity, unitPrice, discount, subtotal };
  });

  const orderNumber = generateOrderNumber();

  const order = await prisma.pharmacyOrder.create({
    data: {
      conversationId: input.conversationId,
      orderNumber,
      deliveryType: input.deliveryType,
      paymentMethod: input.paymentMethod,
      address: input.address,
      total,
      notes: input.notes,
      items: { create: itemsData },
    },
    include: { items: { include: { product: true } } },
  });

  return order;
}

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${datePart}-${rand}`;
}

export async function getOrdersByDate(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return prisma.pharmacyOrder.findMany({
    where: { cashierSentAt: { gte: start, lte: end } },
    include: { items: true, conversation: true },
    orderBy: { cashierSentAt: "desc" },
  });
}

export async function getPharmacyStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalProducts, activeConversations, ordersToday, totalRevenue] = await Promise.all([
    prisma.pharmacyProduct.count({ where: { active: true } }),
    prisma.pharmacyConversation.count({ where: { status: "active" } }),
    prisma.pharmacyOrder.count({ where: { cashierSentAt: { gte: today } } }),
    prisma.pharmacyOrder.aggregate({
      where: { cashierSentAt: { gte: today } },
      _sum: { total: true },
    }),
  ]);

  return {
    totalProducts,
    activeConversations,
    ordersToday,
    revenueToday: totalRevenue._sum.total ?? 0,
  };
}

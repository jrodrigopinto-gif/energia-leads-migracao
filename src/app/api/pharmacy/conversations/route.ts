import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  // Detalhe de uma conversa específica com histórico de mensagens
  if (id) {
    const conv = await prisma.pharmacyConversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        orders: { orderBy: { cashierSentAt: "desc" }, take: 10 },
      },
    });
    if (!conv) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });

    // Filtra apenas mensagens com texto visível para o painel
    const readable = conv.messages
      .map((m) => {
        try {
          const content = JSON.parse(m.contentJson);
          if (typeof content === "string") return { role: m.role, text: content, at: m.createdAt };
          if (Array.isArray(content)) {
            const text = content
              .filter((b) => b.type === "text")
              .map((b) => b.text as string)
              .join("\n");
            return text ? { role: m.role, text, at: m.createdAt } : null;
          }
        } catch {
          return { role: m.role, text: m.contentJson, at: m.createdAt };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({ ...conv, readableMessages: readable });
  }

  // Lista de conversas
  const [total, rows] = await Promise.all([
    prisma.pharmacyConversation.count(),
    prisma.pharmacyConversation.findMany({
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { messages: true, orders: true } },
        orders: { orderBy: { cashierSentAt: "desc" }, take: 1, select: { total: true, status: true } },
      },
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, totalPages: Math.ceil(total / pageSize), rows });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentClient, isMercadoPagoConfigured } from "@/lib/mercadopago";

// Notificação assíncrona do Mercado Pago (webhook). Ver:
// https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/notifications/webhooks
export async function POST(req: NextRequest) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { type?: string; data?: { id?: string } } | null;
  const paymentId = body?.data?.id;

  if (body?.type !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true });
  }

  const paymentClient = getPaymentClient();
  const payment = await paymentClient.get({ id: paymentId });

  const subscriptionId = payment.external_reference;
  if (!subscriptionId) {
    return NextResponse.json({ ok: true });
  }

  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) {
    return NextResponse.json({ ok: true });
  }

  const status = payment.status === "approved" ? "ACTIVE" : payment.status === "rejected" ? "CANCELED" : "PENDING";

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status,
        mpPaymentId: String(payment.id),
        currentPeriodEnd: status === "ACTIVE" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : subscription.currentPeriodEnd,
      },
    }),
    prisma.payment.upsert({
      where: { mpPaymentId: String(payment.id) },
      create: {
        subscriptionId: subscription.id,
        mpPaymentId: String(payment.id),
        status: payment.status ?? "unknown",
        amountCents: Math.round((payment.transaction_amount ?? 0) * 100),
        rawPayload: JSON.stringify(payment),
      },
      update: {
        status: payment.status ?? "unknown",
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

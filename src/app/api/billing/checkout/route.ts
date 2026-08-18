import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getPreferenceClient, isMercadoPagoConfigured } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { planId } = (await req.json().catch(() => ({}))) as { planId?: string };
  if (!planId) {
    return NextResponse.json({ error: "planId é obrigatório." }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.active) {
    return NextResponse.json({ error: "Plano indisponível." }, { status: 404 });
  }

  const subscription = await prisma.subscription.create({
    data: { userId: user.id, planId: plan.id, status: "PENDING" },
  });

  if (!isMercadoPagoConfigured()) {
    // Ambiente ainda sem credenciais do Mercado Pago configuradas
    // (MERCADOPAGO_ACCESS_TOKEN). A assinatura fica pendente até a
    // integração ser concluída — ver README da seção de cobrança.
    return NextResponse.json(
      { error: "Cobrança ainda não configurada. Fale com o suporte LeadVolt." },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const preferenceClient = getPreferenceClient();

  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: plan.id,
          title: `LeadVolt — ${plan.name}`,
          quantity: 1,
          unit_price: plan.priceCents / 100,
          currency_id: "BRL",
        },
      ],
      payer: { email: user.email, name: user.name },
      back_urls: {
        success: `${appUrl}/dashboard?checkout=success`,
        failure: `${appUrl}/planos?checkout=failure`,
        pending: `${appUrl}/planos?checkout=pending`,
      },
      auto_return: "approved",
      external_reference: subscription.id,
      notification_url: `${appUrl}/api/billing/webhook`,
    },
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { mpPreferenceId: preference.id },
  });

  return NextResponse.json({ checkoutUrl: preference.init_point });
}

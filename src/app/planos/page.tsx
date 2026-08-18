import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { CheckoutButton } from "@/components/CheckoutButton";
import { isMercadoPagoConfigured } from "@/lib/mercadopago";

export default async function PlanosPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { priceCents: "asc" } });
  const activePlanId = user.subscriptions[0]?.planId;

  return (
    <AppShell userName={user.name} role={user.role}>
      <h1 className="text-2xl font-semibold">Sua licença</h1>
      <p className="mt-1 text-muted">
        {activePlanId
          ? "Sua assinatura está ativa. Você pode trocar de plano quando quiser."
          : "Escolha um plano para liberar o acesso à base de leads."}
      </p>

      {!isMercadoPagoConfigured() && (
        <div className="lv-panel mt-6 border-danger/40 p-4 text-sm text-muted">
          O checkout via Mercado Pago ainda não foi configurado neste ambiente
          (variável <code className="text-brand">MERCADOPAGO_ACCESS_TOKEN</code>). Assim que a
          iGreen Energy configurar as credenciais, os planos abaixo ficam ativos.
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {plans.map((plan) => {
          const isActive = plan.id === activePlanId;
          return (
            <div key={plan.id} className={`lv-panel flex flex-col p-6 ${isActive ? "border-brand" : ""}`}>
              {isActive && (
                <span className="mb-2 w-fit rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                  Plano atual
                </span>
              )}
              <h3 className="font-medium">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted">{plan.description}</p>
              <p className="mt-6 text-3xl font-semibold">
                R$ {(plan.priceCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                <span className="text-base font-normal text-muted">/mês</span>
              </p>
              <div className="mt-6">
                {isActive ? (
                  <div className="rounded-lg border border-border px-4 py-2.5 text-center text-sm text-muted">
                    Assinatura ativa
                  </div>
                ) : (
                  <CheckoutButton planId={plan.id} disabled={!isMercadoPagoConfigured()} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

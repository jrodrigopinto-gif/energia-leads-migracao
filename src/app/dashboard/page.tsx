import { requireActiveSubscription } from "@/lib/dal";
import { AppShell } from "@/components/AppShell";
import { ProspectsTable } from "@/components/ProspectsTable";

export default async function DashboardPage() {
  const user = await requireActiveSubscription();

  return (
    <AppShell userName={user.name} role={user.role}>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Seus leads de energia</h1>
        <p className="mt-1 text-muted">
          Unidades consumidoras de alta tensão (Grupo A) prováveis candidatas à migração para o
          mercado livre — já excluídas as que aparecem como migradas na base pública da CCEE.
        </p>
      </header>
      <ProspectsTable />
    </AppShell>
  );
}

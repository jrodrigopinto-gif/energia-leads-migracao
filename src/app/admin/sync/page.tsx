import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { AppShell } from "@/components/AppShell";
import { AdminSyncPanel } from "@/components/AdminSyncPanel";

export default async function AdminSyncPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <AppShell userName={user.name} role={user.role}>
      <h1 className="text-2xl font-semibold">Administração — Pipeline de dados</h1>
      <div className="mt-6">
        <AdminSyncPanel />
      </div>
    </AppShell>
  );
}

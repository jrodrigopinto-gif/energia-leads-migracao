import Link from "next/link";
import { Logo } from "@/components/Logo";
import { logout } from "@/app/actions/auth";

interface AppShellProps {
  userName: string;
  role: "ADMIN" | "CONSULTOR";
  children: React.ReactNode;
}

export function AppShell({ userName, role, children }: AppShellProps) {
  return (
    <div className="lv-grid-bg flex min-h-full flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard"><Logo /></Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/dashboard" className="text-muted hover:text-foreground">Leads</Link>
            <Link href="/planos" className="text-muted hover:text-foreground">Licença</Link>
            {role === "ADMIN" && (
              <Link href="/admin/sync" className="text-muted hover:text-foreground">Admin</Link>
            )}
            <span className="text-muted">{userName}</span>
            <form action={logout}>
              <button type="submit" className="rounded-md border border-border px-3 py-1.5 hover:border-brand">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

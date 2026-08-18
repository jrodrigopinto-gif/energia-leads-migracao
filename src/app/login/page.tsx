"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="lv-grid-bg flex flex-1 items-center justify-center px-6 py-16">
      <div className="lv-panel w-full max-w-sm p-8">
        <Link href="/"><Logo className="text-lg" /></Link>
        <h1 className="mt-6 text-xl font-semibold">Entrar</h1>
        <p className="mt-1 text-sm text-muted">Acesse sua conta de consultor LeadVolt.</p>

        <form action={action} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs text-muted">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="lv-input w-full rounded-md px-3 py-2 text-sm"
              placeholder="voce@igreen.energy"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs text-muted">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="lv-input w-full rounded-md px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </div>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <button type="submit" disabled={pending} className="lv-btn-primary mt-2 rounded-md px-4 py-2.5 text-sm">
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Ainda não tem conta?{" "}
          <Link href="/registrar" className="text-brand hover:underline">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}

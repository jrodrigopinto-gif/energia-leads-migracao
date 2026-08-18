"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="lv-grid-bg flex flex-1 items-center justify-center px-6 py-16">
      <div className="lv-panel w-full max-w-sm p-8">
        <Link href="/"><Logo className="text-lg" /></Link>
        <h1 className="mt-6 text-xl font-semibold">Criar conta</h1>
        <p className="mt-1 text-sm text-muted">Para consultores da iGreen Energy.</p>

        <form action={action} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs text-muted">Nome completo</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="lv-input w-full rounded-md px-3 py-2 text-sm"
              placeholder="Seu nome"
            />
          </div>
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
              minLength={8}
              className="lv-input w-full rounded-md px-3 py-2 text-sm"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <button type="submit" disabled={pending} className="lv-btn-primary mt-2 rounded-md px-4 py-2.5 text-sm">
            {pending ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="text-brand hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

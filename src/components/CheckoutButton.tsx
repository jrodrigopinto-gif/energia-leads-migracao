"use client";

import { useState } from "react";

export function CheckoutButton({ planId, disabled }: { planId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível iniciar o checkout.");
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Erro de rede ao iniciar o checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className="lv-btn-primary w-full rounded-lg px-4 py-2.5 text-sm"
      >
        {loading ? "Redirecionando..." : "Assinar com Mercado Pago"}
      </button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

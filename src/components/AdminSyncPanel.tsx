"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCnpj } from "@/lib/cnpj";

interface Stats {
  totalCandidates: number;
  migratedRaizCount: number;
  totalLeads: number;
  lastCceeSync: { finishedAt: string | null; status: string; recordsProcessed: number } | null;
  lastRfbSync: { finishedAt: string | null; status: string; recordsProcessed: number } | null;
}

interface Lead {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnae: string;
  uf: string;
  municipio: string | null;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="lv-panel p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-brand">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function SyncButton({ label, endpoint, lastSync }: { label: string; endpoint: string; lastSync: Stats["lastCceeSync"] }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      setResult(data.ok ? `OK: ${data.processed} registros` : `Erro: ${data.error}`);
    } catch {
      setResult("Erro de rede ao chamar o sync");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lv-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted">
            Última execução:{" "}
            {lastSync?.finishedAt
              ? `${new Date(lastSync.finishedAt).toLocaleString("pt-BR")} (${lastSync.status}, ${lastSync.recordsProcessed} reg.)`
              : "nunca"}
          </p>
        </div>
        <button onClick={run} disabled={loading} className="lv-btn-primary rounded-md px-3 py-1.5 text-sm">
          {loading ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>
      {result && <p className="mt-2 text-xs text-muted">{result}</p>}
    </div>
  );
}

export function AdminSyncPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/stats");
    setStats(await res.json());
  }, []);

  const loadLeads = useCallback(async () => {
    const res = await fetch("/api/leads?pageSize=10");
    const data = await res.json();
    setLeads(data.items ?? []);
    setTotal(data.total ?? 0);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    loadStats();
    loadLeads();
  }, [loadStats, loadLeads]);

  return (
    <div>
      <p className="mb-6 text-sm text-muted">
        Pipeline interno de construção do universo de candidatos (Receita Federal por CNAE/porte)
        excluindo migrados CCEE — usado antes de a base rica &quot;prospects&quot; (ANEEL + distribuidoras)
        ser importada. Ferramenta de uso administrativo, não visível aos consultores.
      </p>

      {stats && (
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Universo de candidatos (RFB)" value={stats.totalCandidates} />
          <StatCard label="Já migrados (CCEE)" value={stats.migratedRaizCount} />
          <StatCard label="Leads (pipeline legado)" value={stats.totalLeads} />
        </section>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SyncButton label="Sincronizar CCEE (migrados)" endpoint="/api/sync/ccee" lastSync={stats?.lastCceeSync ?? null} />
        <SyncButton label="Sincronizar RFB (universo por CNAE)" endpoint="/api/sync/rfb" lastSync={stats?.lastRfbSync ?? null} />
      </section>

      <section className="lv-panel overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">Razão Social</th>
              <th className="px-4 py-2">CNPJ</th>
              <th className="px-4 py-2">CNAE</th>
              <th className="px-4 py-2">UF</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2">{lead.razaoSocial}</td>
                <td className="px-4 py-2 tabular-nums">{formatCnpj(lead.cnpj)}</td>
                <td className="px-4 py-2">{lead.cnae}</td>
                <td className="px-4 py-2">{lead.uf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="mt-2 text-xs text-muted">{total.toLocaleString("pt-BR")} candidatos no pipeline legado.</p>
    </div>
  );
}

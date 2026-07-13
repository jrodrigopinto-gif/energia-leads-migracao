"use client";

import { useCallback, useEffect, useState } from "react";

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
  cnaeDescricao: string | null;
  uf: string;
  municipio: string | null;
  porte: string | null;
}

interface FilterOptions {
  ufs: string[];
  cnaes: { cnae: string; cnaeDescricao: string | null }[];
  portes: string[];
}

function formatCnpjDisplay(cnpj: string): string {
  const d = cnpj.padStart(14, "0");
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString("pt-BR")}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

function SyncButton({
  label,
  endpoint,
  lastSync,
}: {
  label: string;
  endpoint: string;
  lastSync: Stats["lastCceeSync"];
}) {
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
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-neutral-500">
            Última execução:{" "}
            {lastSync?.finishedAt
              ? `${new Date(lastSync.finishedAt).toLocaleString("pt-BR")} (${lastSync.status}, ${lastSync.recordsProcessed} reg.)`
              : "nunca"}
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>
      {result && <p className="mt-2 text-xs text-neutral-600">{result}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [uf, setUf] = useState("");
  const [cnae, setCnae] = useState("");
  const [porte, setPorte] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const pageSize = 25;

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/stats");
    setStats(await res.json());
  }, []);

  const loadOptions = useCallback(async () => {
    const res = await fetch("/api/leads?options=1");
    setOptions(await res.json());
  }, []);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (uf) params.set("uf", uf);
    if (cnae) params.set("cnae", cnae);
    if (porte) params.set("porte", porte);
    if (q) params.set("q", q);
    const res = await fetch(`/api/leads?${params.toString()}`);
    const data = await res.json();
    setLeads(data.items);
    setTotal(data.total);
    setLoading(false);
  }, [page, uf, cnae, porte, q]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, não sincroniza com estado externo
    loadStats();
    loadOptions();
  }, [loadStats, loadOptions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch ao mudar filtros/página
    loadLeads();
  }, [loadLeads]);

  function exportUrl() {
    const params = new URLSearchParams({ format: "csv" });
    if (uf) params.set("uf", uf);
    if (cnae) params.set("cnae", cnae);
    if (porte) params.set("porte", porte);
    if (q) params.set("q", q);
    return `/api/leads?${params.toString()}`;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Energia Leads Migração</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Universo de grandes/médios consumidores de energia (Grupo A) construído por CNAE/porte
          (Receita Federal), excluindo quem já aparece como migrado para o mercado livre na base
          pública da CCEE. Leads = candidatos ainda não encontrados como migrados — uma
          aproximação, não uma confirmação técnica de status cativo.
        </p>
      </header>

      {stats && (
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Universo de candidatos (Grupo A por perfil)" value={stats.totalCandidates} />
          <StatCard label="Já migrados (CCEE)" value={stats.migratedRaizCount} />
          <StatCard label="Leads (provavelmente ainda cativos)" value={stats.totalLeads} />
        </section>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SyncButton label="Sincronizar CCEE (migrados)" endpoint="/api/sync/ccee" lastSync={stats?.lastCceeSync ?? null} />
        <SyncButton label="Sincronizar RFB (universo por CNAE)" endpoint="/api/sync/rfb" lastSync={stats?.lastRfbSync ?? null} />
      </section>

      <section className="mb-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-neutral-500">UF</label>
            <select
              value={uf}
              onChange={(e) => { setUf(e.target.value); setPage(1); }}
              className="mt-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            >
              <option value="">Todas</option>
              {options?.ufs.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500">CNAE</label>
            <select
              value={cnae}
              onChange={(e) => { setCnae(e.target.value); setPage(1); }}
              className="mt-1 max-w-[16rem] rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {options?.cnaes.map((c) => (
                <option key={c.cnae} value={c.cnae}>{c.cnaeDescricao ?? c.cnae}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Porte</label>
            <select
              value={porte}
              onChange={(e) => { setPorte(e.target.value); setPage(1); }}
              className="mt-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {options?.portes.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[10rem]">
            <label className="block text-xs text-neutral-500">Buscar (razão social, CNPJ)</label>
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Ex: Indústria, 12.345..."
              className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <a
            href={exportUrl()}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Exportar CSV
          </a>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-2">Razão Social</th>
              <th className="px-4 py-2">CNPJ</th>
              <th className="px-4 py-2">CNAE</th>
              <th className="px-4 py-2">UF</th>
              <th className="px-4 py-2">Município</th>
              <th className="px-4 py-2">Porte</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-400">Carregando...</td></tr>
            )}
            {!loading && leads.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                Nenhum lead encontrado. Rode as sincronizações acima para popular a base.
              </td></tr>
            )}
            {!loading && leads.map((lead) => (
              <tr key={lead.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2">
                  <div className="font-medium">{lead.razaoSocial}</div>
                  {lead.nomeFantasia && <div className="text-xs text-neutral-500">{lead.nomeFantasia}</div>}
                </td>
                <td className="px-4 py-2 tabular-nums">{formatCnpjDisplay(lead.cnpj)}</td>
                <td className="px-4 py-2">
                  <div>{lead.cnae}</div>
                  {lead.cnaeDescricao && <div className="text-xs text-neutral-500">{lead.cnaeDescricao}</div>}
                </td>
                <td className="px-4 py-2">{lead.uf}</td>
                <td className="px-4 py-2">{lead.municipio}</td>
                <td className="px-4 py-2">{lead.porte}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
        <span>{total.toLocaleString("pt-BR")} leads encontrados</span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-neutral-300 px-2 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <span>Página {page} de {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-neutral-300 px-2 py-1 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>
    </main>
  );
}

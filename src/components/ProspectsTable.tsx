"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCnpj } from "@/lib/cnpj";
import { LeadDetailDrawer } from "@/components/LeadDetailDrawer";

interface Prospect {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  distribuidora: string;
  uf: string;
  bairro: string | null;
  cnae: string;
  grupoTarifario: string | null;
  demandaContratadaKw: number;
}

interface FilterOptions {
  ufs: string[];
  gruposTarifarios: string[];
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="lv-panel p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-brand">{value}</p>
    </div>
  );
}

export function ProspectsTable() {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [items, setItems] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [uf, setUf] = useState("");
  const [grupoTarifario, setGrupoTarifario] = useState("");
  const [demandaMin, setDemandaMin] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageSize = 25;

  const loadOptions = useCallback(async () => {
    const res = await fetch("/api/prospects?options=1");
    setOptions(await res.json());
  }, []);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (uf) params.set("uf", uf);
    if (grupoTarifario) params.set("grupoTarifario", grupoTarifario);
    if (demandaMin) params.set("demandaMin", demandaMin);
    if (q) params.set("q", q);
    return params;
  }, [page, uf, grupoTarifario, demandaMin, q]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/prospects?${buildParams().toString()}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [buildParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch ao mudar filtros/página
    loadItems();
  }, [loadItems]);

  function exportUrl() {
    const params = buildParams();
    params.set("format", "csv");
    return `/api/prospects?${params.toString()}`;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Leads na sua base" value={total.toLocaleString("pt-BR")} />
        <StatCard label="Estados disponíveis" value={String(options?.ufs.length ?? "—")} />
        <StatCard label="Página atual" value={`${page} de ${totalPages}`} />
      </section>

      <section className="lv-panel mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-muted">UF</label>
            <select
              value={uf}
              onChange={(e) => { setUf(e.target.value); setPage(1); }}
              className="lv-input mt-1 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">Todas</option>
              {options?.ufs.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted">Grupo tarifário</label>
            <select
              value={grupoTarifario}
              onChange={(e) => { setGrupoTarifario(e.target.value); setPage(1); }}
              className="lv-input mt-1 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {options?.gruposTarifarios.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted">Demanda mín. (kW)</label>
            <input
              type="number"
              value={demandaMin}
              onChange={(e) => { setDemandaMin(e.target.value); setPage(1); }}
              placeholder="Ex: 100"
              className="lv-input mt-1 w-28 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label className="block text-xs text-muted">Buscar (razão social, CNPJ)</label>
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Ex: Indústria, 12.345..."
              className="lv-input mt-1 w-full rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <a
            href={exportUrl()}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-brand"
          >
            Exportar CSV
          </a>
        </div>
      </section>

      <p className="mb-2 text-xs text-muted">Clique em um lead para ver contato, mapa e endereço.</p>
      <section className="lv-panel lv-scrollbar overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">Razão Social</th>
              <th className="px-4 py-2">CNPJ</th>
              <th className="px-4 py-2">Distribuidora</th>
              <th className="px-4 py-2">UF</th>
              <th className="px-4 py-2">Grupo Tarifário</th>
              <th className="px-4 py-2">Demanda (kW)</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Carregando...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Nenhum lead encontrado com esses filtros.</td></tr>
            )}
            {!loading && items.map((p) => (
              <tr
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-white/[0.03]"
              >
                <td className="px-4 py-2">
                  <div className="font-medium">{p.razaoSocial}</div>
                  {p.nomeFantasia && <div className="text-xs text-muted">{p.nomeFantasia}</div>}
                </td>
                <td className="px-4 py-2 tabular-nums">{formatCnpj(p.cnpj)}</td>
                <td className="px-4 py-2">{p.distribuidora}</td>
                <td className="px-4 py-2">{p.uf}</td>
                <td className="px-4 py-2">{p.grupoTarifario ?? "—"}</td>
                <td className="px-4 py-2 tabular-nums text-brand">
                  {p.demandaContratadaKw.toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>{total.toLocaleString("pt-BR")} leads encontrados</span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <span>Página {page} de {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>

      {selectedId && <LeadDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

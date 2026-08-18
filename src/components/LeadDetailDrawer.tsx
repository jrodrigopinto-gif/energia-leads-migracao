"use client";

import { useEffect, useState } from "react";
import { formatCnpj } from "@/lib/cnpj";
import {
  formatAddress,
  formatPhoneDisplay,
  googleMapsSearchUrl,
  mailtoUrl,
  telUrl,
  whatsappUrl,
} from "@/lib/geo";

interface ProspectDetail {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  distribuidora: string;
  uf: string;
  cep: string | null;
  bairro: string | null;
  tipoLogradouro: string | null;
  logradouro: string | null;
  numero: string | null;
  cnae: string;
  grupoTarifario: string | null;
  demandaContratadaKw: number;
  telefoneDdd1: string | null;
  telefone1: string | null;
  telefoneDdd2: string | null;
  telefone2: string | null;
  email: string | null;
  contatoFonte: string | null;
  contatoAtualizadoPor: string | null;
  contatoAtualizadoEm: string | null;
}

function ActionLink({
  href,
  label,
  disabledHint,
}: {
  href: string | null;
  label: string;
  disabledHint: string;
}) {
  if (!href) {
    return (
      <span className="lv-panel flex-1 cursor-not-allowed px-4 py-2.5 text-center text-sm text-muted opacity-60">
        {disabledHint}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="lv-btn-primary flex-1 rounded-lg px-4 py-2.5 text-center text-sm"
    >
      {label}
    </a>
  );
}

export function LeadDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ telefoneDdd1: "", telefone1: "", telefoneDdd2: "", telefone2: "", email: "" });

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount ao trocar de lead selecionado
    setLoading(true);
    fetch(`/api/prospects/${id}`)
      .then((res) => res.json())
      .then((data: ProspectDetail) => {
        if (cancelled) return;
        setProspect(data);
        setForm({
          telefoneDdd1: data.telefoneDdd1 ?? "",
          telefone1: data.telefone1 ?? "",
          telefoneDdd2: data.telefoneDdd2 ?? "",
          telefone2: data.telefone2 ?? "",
          email: data.email ?? "",
        });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function saveContact() {
    setSaving(true);
    try {
      const res = await fetch(`/api/prospects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setProspect(data);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="lv-scrollbar h-full w-full max-w-lg overflow-y-auto border-l border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="mb-4 text-sm text-muted hover:text-foreground">
          ← Fechar
        </button>

        {loading && <p className="text-muted">Carregando...</p>}

        {!loading && prospect && (
          <>
            <h2 className="text-xl font-semibold">{prospect.razaoSocial}</h2>
            {prospect.nomeFantasia && <p className="text-sm text-muted">{prospect.nomeFantasia}</p>}
            <p className="mt-1 text-sm tabular-nums text-muted">{formatCnpj(prospect.cnpj)}</p>

            <div className="lv-panel mt-4 p-4 text-sm">
              <p className="text-muted">Endereço</p>
              <p className="mt-1">{formatAddress(prospect) || "Endereço não disponível"}</p>
              <p className="mt-3 text-muted">Distribuidora / UF</p>
              <p className="mt-1">{prospect.distribuidora} — {prospect.uf}</p>
              <p className="mt-3 text-muted">Grupo tarifário / Demanda contratada</p>
              <p className="mt-1">{prospect.grupoTarifario ?? "—"} · {prospect.demandaContratadaKw.toLocaleString("pt-BR")} kW</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ActionLink
                href={googleMapsSearchUrl(prospect, prospect.razaoSocial)}
                label="Ver no mapa"
                disabledHint="Sem endereço"
              />
              <ActionLink
                href={whatsappUrl(prospect.telefoneDdd1, prospect.telefone1)}
                label="WhatsApp"
                disabledHint="Sem WhatsApp cadastrado"
              />
              <ActionLink
                href={telUrl(prospect.telefoneDdd1, prospect.telefone1)}
                label="Ligar"
                disabledHint="Sem telefone cadastrado"
              />
              <ActionLink
                href={mailtoUrl(prospect.email)}
                label="E-mail"
                disabledHint="Sem e-mail cadastrado"
              />
            </div>

            <div className="lv-panel mt-4 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Contato direto</p>
                {!editing && (
                  <button onClick={() => setEditing(true)} className="text-xs text-brand hover:underline">
                    {prospect.telefone1 || prospect.email ? "Editar" : "+ Adicionar contato"}
                  </button>
                )}
              </div>

              {!editing && (
                <div className="mt-2 space-y-1 text-sm text-muted">
                  <p>Telefone: {formatPhoneDisplay(prospect.telefoneDdd1, prospect.telefone1) ?? "não informado"}</p>
                  <p>Telefone 2: {formatPhoneDisplay(prospect.telefoneDdd2, prospect.telefone2) ?? "não informado"}</p>
                  <p>E-mail: {prospect.email ?? "não informado"}</p>
                  {prospect.contatoAtualizadoEm && (
                    <p className="text-xs text-muted">
                      Atualizado por {prospect.contatoAtualizadoPor} em{" "}
                      {new Date(prospect.contatoAtualizadoEm).toLocaleDateString("pt-BR")}
                      {prospect.contatoFonte === "RFB" && " (base RFB)"}
                    </p>
                  )}
                </div>
              )}

              {editing && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      value={form.telefoneDdd1}
                      onChange={(e) => setForm((f) => ({ ...f, telefoneDdd1: e.target.value }))}
                      placeholder="DDD"
                      maxLength={2}
                      className="lv-input w-16 rounded-md px-2 py-1.5 text-sm"
                    />
                    <input
                      value={form.telefone1}
                      onChange={(e) => setForm((f) => ({ ...f, telefone1: e.target.value }))}
                      placeholder="Telefone / WhatsApp"
                      className="lv-input flex-1 rounded-md px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={form.telefoneDdd2}
                      onChange={(e) => setForm((f) => ({ ...f, telefoneDdd2: e.target.value }))}
                      placeholder="DDD"
                      maxLength={2}
                      className="lv-input w-16 rounded-md px-2 py-1.5 text-sm"
                    />
                    <input
                      value={form.telefone2}
                      onChange={(e) => setForm((f) => ({ ...f, telefone2: e.target.value }))}
                      placeholder="Telefone 2 (opcional)"
                      className="lv-input flex-1 rounded-md px-2 py-1.5 text-sm"
                    />
                  </div>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="E-mail"
                    type="email"
                    className="lv-input w-full rounded-md px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveContact} disabled={saving} className="lv-btn-primary flex-1 rounded-md px-3 py-1.5 text-sm">
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                    <button onClick={() => setEditing(false)} className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

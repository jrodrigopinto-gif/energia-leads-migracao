import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface LeadFilters {
  uf?: string;
  cnae?: string;
  porte?: string;
  q?: string;
  excludeSelfGeneration?: boolean;
  page?: number;
  pageSize?: number;
}

async function migratedRaizSet(): Promise<Set<string>> {
  const rows = await prisma.migratedConsumer.findMany({
    select: { cnpjRaiz: true },
    distinct: ["cnpjRaiz"],
  });
  return new Set(rows.map((r) => r.cnpjRaiz));
}

async function selfGenerationRaizSet(): Promise<Set<string>> {
  const rows = await prisma.selfGenerationConsumer.findMany({
    select: { cnpjRaiz: true },
    distinct: ["cnpjRaiz"],
  });
  return new Set(rows.map((r) => r.cnpjRaiz));
}

function buildWhere(
  filters: LeadFilters,
  excludeRaiz: string[],
  selfGenRaiz: Set<string>
): Prisma.CandidateCompanyWhereInput {
  const where: Prisma.CandidateCompanyWhereInput = {
    cnpjRaiz: { notIn: excludeRaiz },
  };
  if (filters.uf) where.uf = filters.uf;
  if (filters.cnae) where.cnae = filters.cnae;
  if (filters.porte) where.porte = filters.porte;
  if (filters.excludeSelfGeneration && selfGenRaiz.size > 0) {
    where.cnpjRaiz = { notIn: [...excludeRaiz, ...selfGenRaiz] };
  }
  if (filters.q) {
    where.OR = [
      { razaoSocial: { contains: filters.q } },
      { nomeFantasia: { contains: filters.q } },
      { cnpj: { contains: filters.q } },
    ];
  }
  return where;
}

/** Status de mercado do candidato:
 * - "migrado": já aparece como agente varejista/consumidor livre na CCEE
 * - "geracao_propria": tem geração distribuída/autoprodução identificada na ANEEL (SIGA-GD)
 * - "cativo": nenhuma das anteriores — provável lead de migração (aproximação por CNAE/porte)
 */
export type MarketStatus = "migrado" | "geracao_propria" | "cativo";

function statusFor(cnpjRaiz: string, migratedRaiz: Set<string>, selfGenRaiz: Set<string>): MarketStatus {
  if (migratedRaiz.has(cnpjRaiz)) return "migrado";
  if (selfGenRaiz.has(cnpjRaiz)) return "geracao_propria";
  return "cativo";
}

/** Leads = candidatos (universo Grupo A por CNAE/porte) cujo CNPJ raiz NÃO
 * aparece na base de migrados da CCEE. Cada item traz também se tem geração
 * própria identificada (ANEEL SIGA-GD), para não confundir "ainda cativo" com
 * "já reduz consumo da rede via geração distribuída". Ver README para a
 * ressalva de que isto é uma aproximação, não uma confirmação técnica de
 * status cativo/subgrupo tarifário. */
export async function getLeads(filters: LeadFilters) {
  const [migratedRaiz, selfGenRaiz] = await Promise.all([migratedRaizSet(), selfGenerationRaizSet()]);
  const excludeRaiz = Array.from(migratedRaiz);
  const where = buildWhere(filters, excludeRaiz, selfGenRaiz);
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;

  const [items, total] = await Promise.all([
    prisma.candidateCompany.findMany({
      where,
      orderBy: { razaoSocial: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.candidateCompany.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      temGeracaoPropria: selfGenRaiz.has(item.cnpjRaiz),
      status: statusFor(item.cnpjRaiz, migratedRaiz, selfGenRaiz),
    })),
    total,
    page,
    pageSize,
  };
}

export async function getAllLeadsForExport(filters: LeadFilters) {
  const [migratedRaiz, selfGenRaiz] = await Promise.all([migratedRaizSet(), selfGenerationRaizSet()]);
  const excludeRaiz = Array.from(migratedRaiz);
  const where = buildWhere(filters, excludeRaiz, selfGenRaiz);
  const items = await prisma.candidateCompany.findMany({ where, orderBy: { razaoSocial: "asc" } });
  return items.map((item) => ({
    ...item,
    temGeracaoPropria: selfGenRaiz.has(item.cnpjRaiz),
    status: statusFor(item.cnpjRaiz, migratedRaiz, selfGenRaiz),
  }));
}

export async function getFilterOptions() {
  const [ufs, cnaes, portes] = await Promise.all([
    prisma.candidateCompany.findMany({ select: { uf: true }, distinct: ["uf"], orderBy: { uf: "asc" } }),
    prisma.candidateCompany.findMany({
      select: { cnae: true, cnaeDescricao: true },
      distinct: ["cnae"],
      orderBy: { cnae: "asc" },
    }),
    prisma.candidateCompany.findMany({
      select: { porte: true },
      distinct: ["porte"],
      orderBy: { porte: "asc" },
    }),
  ]);
  return {
    ufs: ufs.map((u) => u.uf).filter(Boolean),
    cnaes: cnaes.filter((c) => c.cnae),
    portes: portes.map((p) => p.porte).filter((p): p is string => Boolean(p)),
  };
}

export async function getStats() {
  const [totalCandidates, migratedRaizCount, selfGenRaizCount, totalLeads, lastCceeSync, lastRfbSync, lastSigaSync] =
    await Promise.all([
      prisma.candidateCompany.count(),
      prisma.migratedConsumer
        .findMany({ select: { cnpjRaiz: true }, distinct: ["cnpjRaiz"] })
        .then((r) => r.length),
      prisma.selfGenerationConsumer
        .findMany({ select: { cnpjRaiz: true }, distinct: ["cnpjRaiz"] })
        .then((r) => r.length),
      (async () => {
        const excludeRaiz = Array.from(await migratedRaizSet());
        return prisma.candidateCompany.count({ where: { cnpjRaiz: { notIn: excludeRaiz } } });
      })(),
      prisma.syncLog.findFirst({ where: { source: "CCEE" }, orderBy: { startedAt: "desc" } }),
      prisma.syncLog.findFirst({ where: { source: "RFB" }, orderBy: { startedAt: "desc" } }),
      prisma.syncLog.findFirst({ where: { source: "ANEEL_SIGA_GD" }, orderBy: { startedAt: "desc" } }),
    ]);

  return {
    totalCandidates,
    migratedRaizCount,
    selfGenRaizCount,
    totalLeads,
    lastCceeSync,
    lastRfbSync,
    lastSigaSync,
  };
}

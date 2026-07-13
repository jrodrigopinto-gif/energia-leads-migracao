import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface LeadFilters {
  uf?: string;
  cnae?: string;
  porte?: string;
  q?: string;
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

function buildWhere(filters: LeadFilters, excludeRaiz: string[]): Prisma.CandidateCompanyWhereInput {
  const where: Prisma.CandidateCompanyWhereInput = {
    cnpjRaiz: { notIn: excludeRaiz },
  };
  if (filters.uf) where.uf = filters.uf;
  if (filters.cnae) where.cnae = filters.cnae;
  if (filters.porte) where.porte = filters.porte;
  if (filters.q) {
    where.OR = [
      { razaoSocial: { contains: filters.q } },
      { nomeFantasia: { contains: filters.q } },
      { cnpj: { contains: filters.q } },
    ];
  }
  return where;
}

/** Leads = candidatos (universo Grupo A por CNAE/porte) cujo CNPJ raiz NÃO
 * aparece na base de migrados da CCEE. Ver README para a ressalva de que
 * isto é uma aproximação, não uma confirmação técnica de status cativo. */
export async function getLeads(filters: LeadFilters) {
  const excludeRaiz = Array.from(await migratedRaizSet());
  const where = buildWhere(filters, excludeRaiz);
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

  return { items, total, page, pageSize };
}

export async function getAllLeadsForExport(filters: LeadFilters) {
  const excludeRaiz = Array.from(await migratedRaizSet());
  const where = buildWhere(filters, excludeRaiz);
  return prisma.candidateCompany.findMany({ where, orderBy: { razaoSocial: "asc" } });
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
  const [totalCandidates, migratedRaizCount, totalLeads, lastCceeSync, lastRfbSync] = await Promise.all([
    prisma.candidateCompany.count(),
    prisma.migratedConsumer
      .findMany({ select: { cnpjRaiz: true }, distinct: ["cnpjRaiz"] })
      .then((r) => r.length),
    (async () => {
      const excludeRaiz = Array.from(await migratedRaizSet());
      return prisma.candidateCompany.count({ where: { cnpjRaiz: { notIn: excludeRaiz } } });
    })(),
    prisma.syncLog.findFirst({ where: { source: "CCEE" }, orderBy: { startedAt: "desc" } }),
    prisma.syncLog.findFirst({ where: { source: "RFB" }, orderBy: { startedAt: "desc" } }),
  ]);

  return {
    totalCandidates,
    migratedRaizCount,
    totalLeads,
    lastCceeSync,
    lastRfbSync,
  };
}

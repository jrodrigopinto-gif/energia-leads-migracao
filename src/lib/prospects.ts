import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface ProspectFilters {
  uf?: string;
  cnae?: string;
  grupoTarifario?: string;
  q?: string;
  demandaMin?: number;
  page?: number;
  pageSize?: number;
}

function buildWhere(filters: ProspectFilters): Prisma.ProspectWhereInput {
  const where: Prisma.ProspectWhereInput = {};
  if (filters.uf) where.uf = filters.uf;
  if (filters.cnae) where.cnae = filters.cnae;
  if (filters.grupoTarifario) where.grupoTarifario = filters.grupoTarifario;
  if (filters.demandaMin) where.demandaContratadaKw = { gte: filters.demandaMin };
  if (filters.q) {
    where.OR = [
      { razaoSocial: { contains: filters.q, mode: "insensitive" } },
      { nomeFantasia: { contains: filters.q, mode: "insensitive" } },
      { cnpj: { contains: filters.q } },
    ];
  }
  return where;
}

export async function getProspects(filters: ProspectFilters) {
  const where = buildWhere(filters);
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;

  const [items, total] = await Promise.all([
    prisma.prospect.findMany({
      where,
      orderBy: { demandaContratadaKw: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.prospect.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getAllProspectsForExport(filters: ProspectFilters) {
  const where = buildWhere(filters);
  return prisma.prospect.findMany({ where, orderBy: { demandaContratadaKw: "desc" }, take: 20000 });
}

export async function getProspectFilterOptions() {
  const [ufs, grupos] = await Promise.all([
    prisma.prospect.findMany({ select: { uf: true }, distinct: ["uf"], orderBy: { uf: "asc" } }),
    prisma.prospect.findMany({
      select: { grupoTarifario: true },
      distinct: ["grupoTarifario"],
      orderBy: { grupoTarifario: "asc" },
    }),
  ]);
  return {
    ufs: ufs.map((u) => u.uf).filter(Boolean),
    gruposTarifarios: grupos.map((g) => g.grupoTarifario).filter((g): g is string => Boolean(g)),
  };
}

export async function getProspectById(id: string) {
  return prisma.prospect.findUnique({ where: { id } });
}

export interface ContactUpdateInput {
  telefoneDdd1?: string | null;
  telefone1?: string | null;
  telefoneDdd2?: string | null;
  telefone2?: string | null;
  email?: string | null;
}

export async function updateProspectContact(id: string, data: ContactUpdateInput, updatedByName: string) {
  return prisma.prospect.update({
    where: { id },
    data: {
      ...data,
      contatoFonte: "manual",
      contatoAtualizadoPor: updatedByName,
      contatoAtualizadoEm: new Date(),
    },
  });
}

export async function getProspectStats() {
  const [total, byUf] = await Promise.all([
    prisma.prospect.count(),
    prisma.prospect.groupBy({
      by: ["uf"],
      _count: { _all: true },
      orderBy: { _count: { uf: "desc" } },
      take: 5,
    }),
  ]);
  return { total, topUfs: byUf.map((r) => ({ uf: r.uf, count: r._count._all })) };
}

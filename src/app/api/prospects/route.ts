import { NextRequest, NextResponse } from "next/server";
import { getAllProspectsForExport, getProspectFilterOptions, getProspects, type ProspectFilters } from "@/lib/prospects";
import { formatCnpj } from "@/lib/cnpj";
import { requireActiveSubscription } from "@/lib/dal";

function parseFilters(searchParams: URLSearchParams): ProspectFilters {
  return {
    uf: searchParams.get("uf") ?? undefined,
    cnae: searchParams.get("cnae") ?? undefined,
    grupoTarifario: searchParams.get("grupoTarifario") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    demandaMin: searchParams.get("demandaMin") ? Number(searchParams.get("demandaMin")) : undefined,
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "25"),
  };
}

function toCsv(rows: Awaited<ReturnType<typeof getAllProspectsForExport>>): string {
  const header = [
    "CNPJ", "Razão Social", "Nome Fantasia", "Distribuidora", "UF", "Bairro",
    "CNAE", "Grupo Tarifário", "Demanda Contratada (kW)",
  ];
  const lines = rows.map((r) =>
    [
      formatCnpj(r.cnpj),
      r.razaoSocial,
      r.nomeFantasia ?? "",
      r.distribuidora,
      r.uf,
      r.bairro ?? "",
      r.cnae,
      r.grupoTarifario ?? "",
      r.demandaContratadaKw,
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(";")
  );
  return [header.join(";"), ...lines].join("\n");
}

export async function GET(req: NextRequest) {
  await requireActiveSubscription();

  const { searchParams } = new URL(req.url);
  const filters = parseFilters(searchParams);

  if (searchParams.get("format") === "csv") {
    const rows = await getAllProspectsForExport(filters);
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=leadvolt-prospects.csv",
      },
    });
  }

  if (searchParams.get("options") === "1") {
    const options = await getProspectFilterOptions();
    return NextResponse.json(options);
  }

  const result = await getProspects(filters);
  return NextResponse.json(result);
}

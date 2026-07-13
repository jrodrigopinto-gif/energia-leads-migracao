import { NextRequest, NextResponse } from "next/server";
import { getAllLeadsForExport, getFilterOptions, getLeads, type LeadFilters } from "@/lib/leads";
import { formatCnpj } from "@/lib/cnpj";

function parseFilters(searchParams: URLSearchParams): LeadFilters {
  return {
    uf: searchParams.get("uf") ?? undefined,
    cnae: searchParams.get("cnae") ?? undefined,
    porte: searchParams.get("porte") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "25"),
  };
}

function toCsv(rows: Awaited<ReturnType<typeof getAllLeadsForExport>>): string {
  const header = ["CNPJ", "Razão Social", "Nome Fantasia", "CNAE", "Descrição CNAE", "UF", "Município", "Porte"];
  const lines = rows.map((r) =>
    [
      formatCnpj(r.cnpj),
      r.razaoSocial,
      r.nomeFantasia ?? "",
      r.cnae,
      r.cnaeDescricao ?? "",
      r.uf,
      r.municipio ?? "",
      r.porte ?? "",
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(";")
  );
  return [header.join(";"), ...lines].join("\n");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filters = parseFilters(searchParams);

  if (searchParams.get("format") === "csv") {
    const rows = await getAllLeadsForExport(filters);
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=leads-energia.csv",
      },
    });
  }

  if (searchParams.get("options") === "1") {
    const options = await getFilterOptions();
    return NextResponse.json(options);
  }

  const result = await getLeads(filters);
  return NextResponse.json(result);
}

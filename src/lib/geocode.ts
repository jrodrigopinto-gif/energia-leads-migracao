import { prisma } from "@/lib/prisma";

const BRASILAPI_BASE_URL = process.env.BRASILAPI_BASE_URL ?? "https://brasilapi.com.br/api";

interface BrasilApiCep {
  cep: string;
  location?: {
    coordinates?: { longitude?: number; latitude?: number };
  };
}

/** Consulta o CEP na BrasilAPI (sem chave) e devolve lat/lng quando o
 * provedor tem essa informação. Nem todo CEP tem coordenadas — nesse caso
 * `found` fica `true` (CEP existe) mas latitude/longitude ficam `null`, e o
 * cache evita reconsultar. */
async function fetchCepCoordinates(
  cep: string
): Promise<{ latitude: number | null; longitude: number | null; found: boolean }> {
  const res = await fetch(`${BRASILAPI_BASE_URL}/cep/v2/${cep}`);
  if (res.status === 404) return { latitude: null, longitude: null, found: false };
  if (!res.ok) throw new Error(`BrasilAPI CEP respondeu HTTP ${res.status} para ${cep}`);

  const body = (await res.json()) as BrasilApiCep;
  const coords = body.location?.coordinates;
  const latitude = typeof coords?.latitude === "number" ? coords.latitude : null;
  const longitude = typeof coords?.longitude === "number" ? coords.longitude : null;
  return { latitude, longitude, found: true };
}

async function getOrFetchCep(cep: string): Promise<{ latitude: number | null; longitude: number | null }> {
  const cached = await prisma.cepGeocode.findUnique({ where: { cep } });
  if (cached) return { latitude: cached.latitude, longitude: cached.longitude };

  const result = await fetchCepCoordinates(cep);
  await prisma.cepGeocode.upsert({
    where: { cep },
    create: { cep, ...result },
    update: result,
  });
  return { latitude: result.latitude, longitude: result.longitude };
}

/** Geocodifica os candidatos que ainda não têm latitude/longitude, usando o
 * CEP já persistido (vindo da RFB) contra a BrasilAPI. Processa em lotes
 * pequenos com uma pequena pausa entre chamadas para não sobrecarregar a API
 * gratuita. Só considera CEPs válidos (8 dígitos). */
export async function geocodeCandidates(options?: { limit?: number }): Promise<{
  processed: number;
  withCoordinates: number;
  skippedNoValidCep: number;
}> {
  const limit = options?.limit ?? 500;

  const pending = await prisma.candidateCompany.findMany({
    where: { geocodedAt: null, cep: { not: null } },
    select: { id: true, cep: true },
    take: limit,
  });

  let processed = 0;
  let withCoordinates = 0;
  let skippedNoValidCep = 0;

  for (const candidate of pending) {
    const cep = (candidate.cep ?? "").replace(/\D/g, "");
    if (cep.length !== 8) {
      skippedNoValidCep += 1;
      await prisma.candidateCompany.update({
        where: { id: candidate.id },
        data: { geocodedAt: new Date() },
      });
      continue;
    }

    const { latitude, longitude } = await getOrFetchCep(cep);
    await prisma.candidateCompany.update({
      where: { id: candidate.id },
      data: { latitude, longitude, geocodedAt: new Date() },
    });

    processed += 1;
    if (latitude != null && longitude != null) withCoordinates += 1;

    // Pequena pausa para não estourar limite de requisições da API gratuita.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return { processed, withCoordinates, skippedNoValidCep };
}

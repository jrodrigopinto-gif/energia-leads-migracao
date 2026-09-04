import "dotenv/config";
/**
 * Dados de exemplo (fictícios) para demonstrar o dashboard sem depender de
 * acesso à internet para a CCEE/RFB. Não representam empresas reais.
 */
import { prisma } from "../src/lib/prisma";
import { cnpjRaiz } from "../src/lib/cnpj";

const SAMPLE_CANDIDATES = [
  { cnpj: "11222333000181", razaoSocial: "Metalúrgica Vale Forte S.A.", cnae: "24230000", cnaeDescricao: "Produção de laminados de aço", uf: "MG", municipio: "Betim", bairro: "Distrito Industrial", cep: "32677000", logradouro: "Avenida das Indústrias", numero: "1200", telefone: "3135551200", porte: "Demais (Médio/Grande Porte)" },
  { cnpj: "22333444000162", razaoSocial: "Frigorífico Boa Terra Ltda.", cnae: "10112001", cnaeDescricao: "Frigorífico - abate de aves", uf: "GO", municipio: "Rio Verde", bairro: "Zona Rural", cep: "75901000", logradouro: "Rodovia GO-174, km 12", numero: "S/N", telefone: "6435551300", porte: "Demais (Médio/Grande Porte)" },
  { cnpj: "33444555000143", razaoSocial: "Cimentos Serra Azul S.A.", cnae: "23915001", cnaeDescricao: "Fabricação de cimento", uf: "SP", municipio: "Sorocaba", bairro: "Éden", cep: "18103000", logradouro: "Rodovia Raposo Tavares, km 98", numero: "S/N", telefone: "1535551400", porte: "Demais (Médio/Grande Porte)" },
  { cnpj: "44555666000124", razaoSocial: "Shopping Praça Central Administradora Ltda.", cnae: "68226000", cnaeDescricao: "Gestão e administração de shopping centers", uf: "PR", municipio: "Curitiba", bairro: "Centro", cep: "80010000", logradouro: "Rua XV de Novembro", numero: "500", telefone: "4135551500", porte: "Demais (Médio/Grande Porte)" },
  { cnpj: "55666777000105", razaoSocial: "Hospital Santa Clara S.A.", cnae: "86101001", cnaeDescricao: "Atividades de atendimento hospitalar", uf: "RS", municipio: "Caxias do Sul", bairro: "Exposição", cep: "95050000", logradouro: "Rua Visconde de Pelotas", numero: "1780", telefone: "5435551600", porte: "Demais (Médio/Grande Porte)" },
  { cnpj: "66777888000186", razaoSocial: "Supermercados Reunidos do Nordeste S.A.", cnae: "47113002", cnaeDescricao: "Comércio varejista de hipermercados", uf: "BA", municipio: "Feira de Santana", bairro: "Centro", cep: "44001000", logradouro: "Avenida Getúlio Vargas", numero: "890", telefone: "7535551700", porte: "Demais (Médio/Grande Porte)" },
  { cnpj: "77888999000167", razaoSocial: "Celulose Rio Doce Ltda.", cnae: "17109000", cnaeDescricao: "Fabricação de celulose e outras pastas para papel", uf: "ES", municipio: "Aracruz", bairro: "Barra do Riacho", cep: "29197000", logradouro: "Rodovia do Sol, km 25", numero: "S/N", telefone: "2735551800", porte: "Demais (Médio/Grande Porte)" },
  { cnpj: "88999000000148", razaoSocial: "Data Center Brasil Sul Ltda.", cnae: "63119000", cnaeDescricao: "Tratamento de dados, hospedagem", uf: "SC", municipio: "Joinville", bairro: "América", cep: "89201000", logradouro: "Rua Ottokar Doerffel", numero: "220", telefone: "4735551900", porte: "Demais (Médio/Grande Porte)" },
  { cnpj: "99000111000129", razaoSocial: "Química Industrial Guararapes S.A.", cnae: "20102000", cnaeDescricao: "Fabricação de produtos químicos inorgânicos", uf: "PE", municipio: "Cabo de Santo Agostinho", bairro: "Suape", cep: "54590000", logradouro: "Via Local 3, Complexo Industrial Suape", numero: "S/N", telefone: "8135552000", porte: "Demais (Médio/Grande Porte)" },
  { cnpj: "10111222000100", razaoSocial: "Alumínio do Norte S.A.", cnae: "24415000", cnaeDescricao: "Metalurgia do alumínio e suas ligas", uf: "PA", municipio: "Barcarena", bairro: "Distrito Industrial", cep: "68447000", logradouro: "Rodovia PA-481, km 8", numero: "S/N", telefone: "9135552100", porte: "Demais (Médio/Grande Porte)" },
];

const SAMPLE_MIGRATED = [
  { cnpj: "33444555000143", nomeConsumidor: "Cimentos Serra Azul S.A.", agenteVarejista: "Comercializadora Livre Energia", submercado: "Sudeste" },
  { cnpj: "77888999000167", nomeConsumidor: "Celulose Rio Doce Ltda.", agenteVarejista: "EnergyTrade Comercializadora", submercado: "Sudeste" },
];

const SAMPLE_SELF_GENERATION = [
  { cnpj: "88999000000148", nomeConsumidor: "Data Center Brasil Sul Ltda.", uf: "SC", municipio: "Joinville", distribuidora: "Celesc", fonteGeracao: "Solar", tipoGeracao: "Autoprodução", potenciaKw: 850, dataConexao: "2025-03-10" },
];

async function main() {
  console.log("Seeding sample data (fictício, apenas para demo do dashboard)...");

  for (const c of SAMPLE_CANDIDATES) {
    await prisma.candidateCompany.upsert({
      where: { cnpj: c.cnpj },
      create: { ...c, cnpjRaiz: cnpjRaiz(c.cnpj), source: "RFB", situacaoCadastral: "Ativa" },
      update: { ...c, cnpjRaiz: cnpjRaiz(c.cnpj) },
    });
  }

  for (const m of SAMPLE_MIGRATED) {
    await prisma.migratedConsumer.upsert({
      where: { cnpj_dataReferencia: { cnpj: m.cnpj, dataReferencia: "sample_2026" } },
      create: { ...m, cnpjRaiz: cnpjRaiz(m.cnpj), dataReferencia: "sample_2026", source: "CCEE" },
      update: { ...m, cnpjRaiz: cnpjRaiz(m.cnpj) },
    });
  }

  for (const g of SAMPLE_SELF_GENERATION) {
    await prisma.selfGenerationConsumer.upsert({
      where: { cnpj_dataConexao_potenciaKw: { cnpj: g.cnpj, dataConexao: g.dataConexao, potenciaKw: g.potenciaKw } },
      create: { ...g, cnpjRaiz: cnpjRaiz(g.cnpj), source: "ANEEL_SIGA_GD" },
      update: { ...g, cnpjRaiz: cnpjRaiz(g.cnpj) },
    });
  }

  console.log(
    `Ok: ${SAMPLE_CANDIDATES.length} candidatos, ${SAMPLE_MIGRATED.length} migrados, ${SAMPLE_SELF_GENERATION.length} com geração própria.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

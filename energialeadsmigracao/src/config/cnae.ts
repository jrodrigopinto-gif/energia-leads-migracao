/**
 * CNAEs (classe, 7 dígitos) de setores com perfil de grande/médio consumidor
 * de energia elétrica (indústria de base, shoppings, hospitais, data centers,
 * grandes redes de varejo/supermercado, frigoríficos, cimenteiras etc.).
 *
 * Esta lista é o principal parâmetro de ajuste do "universo de candidatos":
 * edite/expanda conforme o perfil de cliente que você quer prospectar.
 * Fonte dos códigos: tabela CNAE 2.3 do IBGE/Receita Federal.
 */
export const ENERGY_INTENSIVE_CNAES: { codigo: string; descricao: string }[] = [
  { codigo: "1091-1/00", descricao: "Fabricação de produtos de panificação industrial" },
  { codigo: "1011-2/01", descricao: "Frigorífico - abate de bovinos" },
  { codigo: "1012-1/01", descricao: "Frigorífico - abate de aves" },
  { codigo: "1610-2/01", descricao: "Serrarias com desdobramento de madeira" },
  { codigo: "1710-9/00", descricao: "Fabricação de celulose e outras pastas para fabricação de papel" },
  { codigo: "2010-2/00", descricao: "Fabricação de produtos químicos inorgânicos" },
  { codigo: "2110-6/00", descricao: "Fabricação de produtos farmoquímicos" },
  { codigo: "2229-3/00", descricao: "Fabricação de artefatos de material plástico" },
  { codigo: "2330-3/00", descricao: "Fabricação de artefatos de concreto, cimento, fibrocimento e gesso" },
  { codigo: "2391-5/01", descricao: "Fabricação de cimento" },
  { codigo: "2411-3/00", descricao: "Produção de ferro-gusa" },
  { codigo: "2421-1/00", descricao: "Produção de semiacabados de aço" },
  { codigo: "2423-7/00", descricao: "Produção de laminados de aço" },
  { codigo: "2441-5/00", descricao: "Metalurgia do alumínio e suas ligas" },
  { codigo: "2539-0/01", descricao: "Serviços de usinagem, tornearia e solda" },
  { codigo: "3600-6/01", descricao: "Captação, tratamento e distribuição de água" },
  { codigo: "3811-4/00", descricao: "Coleta de resíduos não perigosos" },
  { codigo: "4711-3/02", descricao: "Comércio varejista de hipermercados" },
  { codigo: "4711-3/01", descricao: "Comércio varejista de supermercados" },
  { codigo: "6110-8/01", descricao: "Serviços de telefonia fixa (data centers/POPs)" },
  { codigo: "6311-9/00", descricao: "Tratamento de dados, provedores de aplicação e serviços de hospedagem" },
  { codigo: "6420-4/00", descricao: "Bancos múltiplos, com carteira comercial (data centers próprios)" },
  { codigo: "8610-1/01", descricao: "Atividades de atendimento hospitalar" },
  { codigo: "6822-6/00", descricao: "Gestão e administração de shopping centers" },
];

export const CNAE_CODES = ENERGY_INTENSIVE_CNAES.map((c) => c.codigo.replace(/\D/g, ""));

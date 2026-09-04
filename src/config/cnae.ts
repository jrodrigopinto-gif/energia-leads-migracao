/**
 * CNAEs (classe, 7 dígitos) de setores com perfil de grande/médio consumidor
 * de energia elétrica — candidatos a unidade consumidora do Grupo A (alta ou
 * média tensão): indústria de base e de transformação intensiva em energia,
 * mineração, agroindústria, grandes instalações comerciais/institucionais
 * (shoppings, hospitais, hotéis, universidades, data centers) e infraestrutura.
 *
 * Esta lista é o principal parâmetro de ajuste do "universo de candidatos":
 * edite/expanda conforme o perfil de cliente que você quer prospectar.
 * Fonte dos códigos: tabela CNAE 2.3 do IBGE/Receita Federal.
 *
 * Setores de consumo tipicamente baixo (varejo pulverizado, escritórios
 * pequenos, serviços pessoais) foram deliberadamente deixados de fora para
 * manter a lista assertiva — o objetivo é maximizar cobertura de quem
 * realmente tem perfil Grupo A, não capturar qualquer CNPJ.
 */
export const ENERGY_INTENSIVE_CNAES: { codigo: string; descricao: string }[] = [
  // --- Mineração e extração ---
  { codigo: "0710-3/01", descricao: "Extração de minério de ferro" },
  { codigo: "0721-9/01", descricao: "Extração de minério de urânio" },
  { codigo: "0722-7/01", descricao: "Extração de minério de alumínio (bauxita)" },
  { codigo: "0724-3/01", descricao: "Extração de minério de manganês" },
  { codigo: "0725-1/00", descricao: "Extração de minério de níquel" },
  { codigo: "0729-4/01", descricao: "Extração de minério de estanho" },
  { codigo: "0729-4/94", descricao: "Extração de minerais radioativos" },
  { codigo: "0810-0/01", descricao: "Extração de ardósia e beneficiamento associado" },
  { codigo: "0810-0/03", descricao: "Extração de granito e beneficiamento associado" },
  { codigo: "0810-0/06", descricao: "Extração de calcário e dolomita e beneficiamento associado" },
  { codigo: "0891-6/00", descricao: "Extração de minerais para fabricação de adubos, fertilizantes e outros produtos químicos" },
  { codigo: "0899-1/01", descricao: "Extração de sal marinho" },
  { codigo: "0899-1/02", descricao: "Extração de sal-gema" },

  // --- Alimentos, bebidas e agroindústria ---
  { codigo: "1011-2/01", descricao: "Frigorífico - abate de bovinos" },
  { codigo: "1012-1/01", descricao: "Frigorífico - abate de aves" },
  { codigo: "1012-1/02", descricao: "Abate de pequenos animais" },
  { codigo: "1013-9/01", descricao: "Preparação de produtos de carne - industrialização" },
  { codigo: "1020-1/01", descricao: "Preservação de peixes, crustáceos e moluscos" },
  { codigo: "1041-4/00", descricao: "Fabricação de óleos vegetais em bruto" },
  { codigo: "1042-2/00", descricao: "Fabricação de óleos vegetais refinados" },
  { codigo: "1051-1/00", descricao: "Preparação do leite - laticínios" },
  { codigo: "1052-0/00", descricao: "Fabricação de laticínios" },
  { codigo: "1061-9/01", descricao: "Beneficiamento de arroz" },
  { codigo: "1065-1/01", descricao: "Fabricação de amidos e féculas de vegetais" },
  { codigo: "1071-6/00", descricao: "Fabricação de açúcar em bruto" },
  { codigo: "1072-4/01", descricao: "Fabricação de açúcar refinado" },
  { codigo: "1091-1/00", descricao: "Fabricação de produtos de panificação industrial" },
  { codigo: "1112-7/00", descricao: "Fabricação de aguardente e outras destilarias" },
  { codigo: "1113-5/02", descricao: "Fabricação de cervejas e chopes" },
  { codigo: "1122-4/01", descricao: "Fabricação de refrigerantes" },

  // --- Têxtil, couro e madeira ---
  { codigo: "1311-1/00", descricao: "Preparação e fiação de fibras de algodão" },
  { codigo: "1351-1/00", descricao: "Fabricação de artefatos têxteis para uso doméstico" },
  { codigo: "1610-2/01", descricao: "Serrarias com desdobramento de madeira" },
  { codigo: "1710-9/00", descricao: "Fabricação de celulose e outras pastas para fabricação de papel" },
  { codigo: "1721-4/00", descricao: "Fabricação de papel" },
  { codigo: "1722-2/00", descricao: "Fabricação de cartolina e papel-cartão" },
  { codigo: "1911-8/00", descricao: "Curtimento e outras preparações de couro" },

  // --- Química, petroquímica e farmoquímica ---
  { codigo: "1921-7/00", descricao: "Fabricação de produtos do refino de petróleo" },
  { codigo: "1922-5/00", descricao: "Fabricação de produtos derivados do petróleo" },
  { codigo: "1931-4/00", descricao: "Fabricação de álcool" },
  { codigo: "2011-8/00", descricao: "Fabricação de cloro e álcalis" },
  { codigo: "2012-6/00", descricao: "Fabricação de intermediários para fertilizantes" },
  { codigo: "2013-4/00", descricao: "Fabricação de adubos e fertilizantes" },
  { codigo: "2019-3/99", descricao: "Fabricação de outros produtos químicos inorgânicos" },
  { codigo: "2021-5/00", descricao: "Fabricação de produtos petroquímicos básicos" },
  { codigo: "2029-1/00", descricao: "Fabricação de outros produtos químicos orgânicos" },
  { codigo: "2110-6/00", descricao: "Fabricação de produtos farmoquímicos" },
  { codigo: "2091-6/00", descricao: "Fabricação de tintas, vernizes, esmaltes e lacas" },

  // --- Plástico, borracha e minerais não metálicos ---
  { codigo: "2211-1/00", descricao: "Fabricação de pneumáticos e câmaras de ar" },
  { codigo: "2229-3/00", descricao: "Fabricação de artefatos de material plástico" },
  { codigo: "2320-6/00", descricao: "Fabricação de vidro plano e de segurança" },
  { codigo: "2330-3/00", descricao: "Fabricação de artefatos de concreto, cimento, fibrocimento e gesso" },
  { codigo: "2341-9/00", descricao: "Fabricação de produtos cerâmicos refratários" },
  { codigo: "2342-7/01", descricao: "Fabricação de azulejos e pisos" },
  { codigo: "2391-5/01", descricao: "Fabricação de cimento" },
  { codigo: "2392-3/01", descricao: "Fabricação de cal" },
  { codigo: "2399-1/99", descricao: "Fabricação de outros produtos de minerais não metálicos" },

  // --- Metalurgia e siderurgia ---
  { codigo: "2411-3/00", descricao: "Produção de ferro-gusa" },
  { codigo: "2412-1/00", descricao: "Produção de ferroligas" },
  { codigo: "2421-1/00", descricao: "Produção de semiacabados de aço" },
  { codigo: "2422-9/01", descricao: "Produção de laminados planos de aço" },
  { codigo: "2423-7/00", descricao: "Produção de laminados de aço" },
  { codigo: "2424-5/00", descricao: "Produção de relaminados, trefilados e perfilados de aço" },
  { codigo: "2431-8/00", descricao: "Produção de tubos de aço com costura" },
  { codigo: "2439-3/00", descricao: "Produção de tubos de aço sem costura" },
  { codigo: "2441-5/00", descricao: "Metalurgia do alumínio e suas ligas" },
  { codigo: "2442-3/00", descricao: "Metalurgia dos metais preciosos" },
  { codigo: "2443-1/00", descricao: "Metalurgia do cobre" },
  { codigo: "2449-1/00", descricao: "Metalurgia dos metais não ferrosos" },
  { codigo: "2451-2/00", descricao: "Fundição de ferro e aço" },
  { codigo: "2452-1/00", descricao: "Fundição de metais não ferrosos e suas ligas" },
  { codigo: "2539-0/01", descricao: "Serviços de usinagem, tornearia e solda" },

  // --- Máquinas, veículos e equipamentos ---
  { codigo: "2910-7/01", descricao: "Fabricação de automóveis, camionetas e utilitários" },
  { codigo: "2920-4/01", descricao: "Fabricação de caminhões e ônibus" },
  { codigo: "3011-3/01", descricao: "Construção de embarcações de grande porte" },

  // --- Infraestrutura e serviços de utilidade pública ---
  { codigo: "3600-6/01", descricao: "Captação, tratamento e distribuição de água" },
  { codigo: "3701-1/00", descricao: "Gestão de redes de esgoto" },
  { codigo: "3811-4/00", descricao: "Coleta de resíduos não perigosos" },
  { codigo: "3821-1/00", descricao: "Tratamento e disposição de resíduos não perigosos" },

  // --- Comércio de grande porte ---
  { codigo: "4711-3/01", descricao: "Comércio varejista de hipermercados" },
  { codigo: "4711-3/02", descricao: "Comércio varejista de supermercados" },
  { codigo: "4713-0/02", descricao: "Comércio varejista de mercadorias em geral - lojas de departamentos" },

  // --- Transporte, logística e armazenagem refrigerada ---
  { codigo: "5223-1/00", descricao: "Atividades auxiliares dos transportes aéreos (aeroportos/terminais)" },
  { codigo: "5231-1/01", descricao: "Administração da infraestrutura portuária" },
  { codigo: "5211-7/01", descricao: "Armazéns gerais - emissão de warrant" },
  { codigo: "5211-7/02", descricao: "Guarda-móveis" },

  // --- Hospedagem, educação e saúde de grande porte ---
  { codigo: "5510-8/01", descricao: "Hotéis" },
  { codigo: "8532-5/00", descricao: "Educação superior - graduação" },
  { codigo: "8610-1/01", descricao: "Atividades de atendimento hospitalar" },
  { codigo: "8610-1/02", descricao: "Atividades de atendimento em pronto-socorro e unidades hospitalares" },

  // --- Data centers, telecom e serviços financeiros com infraestrutura própria ---
  { codigo: "6110-8/01", descricao: "Serviços de telefonia fixa (data centers/POPs)" },
  { codigo: "6311-9/00", descricao: "Tratamento de dados, provedores de aplicação e serviços de hospedagem na internet (data centers)" },
  { codigo: "6420-4/00", descricao: "Bancos múltiplos, com carteira comercial (data centers próprios)" },

  // --- Shopping centers e grandes complexos comerciais/de eventos ---
  { codigo: "6822-6/00", descricao: "Gestão e administração de shopping centers" },
  { codigo: "9329-8/99", descricao: "Outras atividades de recreação e lazer (parques temáticos, arenas)" },
] as const;

export const CNAE_CODES = ENERGY_INTENSIVE_CNAES.map((c) => c.codigo.replace(/\D/g, ""));

#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║   Motor de Prospecção — Mercado Livre de Energia | Brasil  v3.0            ║
║   Roda LOCAL no seu PC com os arquivos que você já tem                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

INSTALAÇÃO (rodar uma vez no terminal/prompt):
    pip install pandas openpyxl xlrd tqdm

COMO USAR:
    1. Edite a seção CONFIGURAÇÃO abaixo com os caminhos dos seus arquivos
    2. Salve e execute:  python motor_prospeccao_brasil.py
    3. O arquivo ALVOS_BRASIL_YYYYMMDD.xlsx será gerado na PASTA_SAIDA

FONTES DOS DADOS:
    BDGD   → https://dadosabertos.aneel.gov.br  (buscar "BDGD", camadas UCMT e UCAT)
    CCEE   → https://dadosabertos.ccee.org.br/dataset/lista_perfil_v1
    CNPJ   → https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj
             (arquivo Estabelecimentos*.zip — extraia o CSV)
    GD     → https://dadosabertos.aneel.gov.br  (buscar "Geração Distribuída")
"""

# ──────────────────────────────────────────────────────────────────────────────
#  CONFIGURAÇÃO — edite só esta seção
# ──────────────────────────────────────────────────────────────────────────────

# Pasta raiz onde estão os arquivos (deixe "" se usar caminhos completos abaixo)
PASTA_DADOS = ""

# ── BDGD Nacional: informe a PASTA com todos os arquivos UCMT baixados ────────
# O motor lê TODOS os CSV/Excel da pasta automaticamente e empilha os dados.
# Deixe "" para usar os arquivos individuais ARQUIVO_BDGD / ARQUIVO_BDGD_2 abaixo.
PASTA_BDGD = r"C:\Users\RODRIGO\Desktop\Motor de Prospecção\BDGD_Nacional"

# Caminhos individuais — usados apenas se PASTA_BDGD estiver vazio
ARQUIVO_BDGD    = r"C:\Users\RODRIGO\Desktop\EXCEL\ucmt_pj.csv"
ARQUIVO_BDGD_2  = ""   # UCAT (alta tensão) — opcional
ARQUIVO_CCEE    = r"C:\Users\RODRIGO\Desktop\Motor de Prospecção\files (1)\lista_perfil_v1_2026.csv"
ARQUIVO_CNPJ    = r"C:\Users\RODRIGO\Desktop\Motor de Prospecção\Automacoes\CONSULTA CNPJ\enderecos_cnpj.csv"
ARQUIVO_CNPJ_EMP= r"C:\Users\RODRIGO\Desktop\Motor de Prospecção\Automacoes\CNPJs_Enderecos.xlsx"
ARQUIVO_GD      = ""   # GD ANEEL — opcional

# Pasta onde o resultado será salvo
PASTA_SAIDA = r"C:\Users\RODRIGO\Desktop\Motor de Prospecção"

# ── Parâmetros comerciais ─────────────────────────────────────────────────────
TARIFA_CATIVA        = 0.82     # R$/kWh — tarifa média cativa com impostos
ECONOMIA_PERCENTUAL  = 0.20     # 20% de economia estimada no mercado livre
CONSUMO_MINIMO       = 15_000   # kWh/mês — abaixo disso raramente compensa

# Pesos do score (devem somar 100)
PESO_CONSUMO    = 60
PESO_SEM_GD     = 25
PESO_CNAE       = 15

# Consumo de referência para nota máxima de volume (kWh/mês)
CONSUMO_REF_MAX = 200_000

# Filtros opcionais — deixe lista vazia [] para não filtrar
FILTRAR_UF   = []    # ex: ["SP", "RJ", "MG"]  — filtra por estado
FILTRAR_CNAE = []    # ex: ["1012", "8610"]     — filtra por CNAE específico

# ──────────────────────────────────────────────────────────────────────────────
#  MAPEAMENTO DE CNAE — prioridade comercial (0-10)
# ──────────────────────────────────────────────────────────────────────────────
CNAE_PRIORIDADE = {
    "2320":10, "3600":10, "1012":10, "2341":10, "1311":10, "6810":10,
    "1011":10, "8211":10, "1321":10, "8610":10, "1052":10, "5211":10,
    "2312": 9, "6311": 9, "1122": 9, "2342": 9, "2431": 9, "8531": 9,
    "2451": 9, "1510": 9, "1340": 9, "1071": 9, "2110": 8, "2121": 8,
    "2392": 8, "1721": 8, "3701": 8, "0119": 8, "4711": 7, "4930": 7,
    "3511": 9, "3512": 8, "3600": 10,"4623": 7, "4622": 7, "2091": 7,
    "2093": 7, "2094": 7, "1096": 8, "1031": 8, "0311": 7, "1220": 7,
}

CNAE_DESCRICAO = {
    "2320":"Cimento", "3600":"Saneamento/Água", "1012":"Abate de aves",
    "2341":"Revestimentos cerâmicos", "1311":"Fiação têxtil", "6810":"Imóveis/Shopping",
    "1011":"Abate de carnes", "8211":"Adm de shoppings", "1321":"Tecelagem",
    "8610":"Hospitais", "1052":"Laticínios", "5211":"Armazéns/Câmaras frigoríficas",
    "2312":"Vidro", "6311":"Data centers", "1122":"Refrigerantes", "2342":"Louças",
    "2431":"Fundição de aço", "8531":"Ensino superior", "2451":"Fundição metais",
    "1510":"Couro", "1340":"Acabamento têxtil", "1071":"Açúcar", "2110":"Farmoquímicos",
    "2121":"Medicamentos", "2392":"Cal e gesso", "1721":"Embalagens papel",
    "3701":"Gestão de esgoto", "0119":"Agricultura irrigada", "4711":"Supermercados",
    "4930":"Transportes", "3511":"Geração elétrica", "4623":"Atacado agropecuário",
}

# ──────────────────────────────────────────────────────────────────────────────
#  CÓDIGO — não editar abaixo desta linha
# ──────────────────────────────────────────────────────────────────────────────

import sys, os, re, warnings
from pathlib import Path
from datetime import datetime

warnings.filterwarnings("ignore")

try:
    import pandas as pd
except ImportError:
    print("ERRO: pandas não instalado. Execute: pip install pandas openpyxl xlrd tqdm")
    sys.exit(1)

try:
    from tqdm import tqdm
    def progresso(it, **kw): return tqdm(it, **kw)
except ImportError:
    def progresso(it, desc="", **kw):
        print(f"  {desc}...")
        return it

# ── Utilitários ───────────────────────────────────────────────────────────────

def log(msg, nivel="INFO"):
    print(f"[{datetime.now():%H:%M:%S}] {nivel}: {msg}")

def normalizar(s):
    """Remove acentos, espaços extras e coloca em maiúsculas para comparação."""
    if pd.isna(s) or s is None:
        return ""
    import unicodedata
    s = str(s).upper().strip()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"\s+", " ", s)
    return s

def limpar_cnpj(v):
    """Retorna CNPJ como string de 14 dígitos."""
    if pd.isna(v):
        return ""
    return re.sub(r"\D", "", str(v)).zfill(14)

def limpar_cep(v):
    """Retorna CEP como string de 8 dígitos."""
    if pd.isna(v):
        return ""
    return re.sub(r"\D", "", str(v)).zfill(8)

def limpar_cnae(v):
    """Retorna CNAE como string de 4-7 dígitos (sem traços/pontos)."""
    if pd.isna(v):
        return ""
    return re.sub(r"\D", "", str(v))[:7]

def ler_arquivo(caminho, encoding_tentativas=("utf-8", "latin-1", "cp1252"), **kwargs):
    """Lê CSV ou Excel com detecção automática de separador e encoding."""
    p = Path(caminho)
    if not p.exists():
        log(f"Arquivo não encontrado: {caminho}", "AVISO")
        return None

    ext = p.suffix.lower()
    size_mb = p.stat().st_size / 1_048_576
    log(f"Lendo {p.name} ({size_mb:.1f} MB)...")

    if ext in (".xlsx", ".xls", ".xlsm"):
        try:
            return pd.read_excel(caminho, dtype=str, **kwargs)
        except Exception as e:
            log(f"Erro lendo Excel: {e}", "ERRO")
            return None

    # CSV — detecta separador
    for enc in encoding_tentativas:
        for sep in (";", ",", "\t", "|"):
            try:
                df = pd.read_csv(caminho, sep=sep, dtype=str, encoding=enc,
                                 on_bad_lines="skip", low_memory=False, **kwargs)
                if df.shape[1] > 2:
                    log(f"  → {len(df):,} linhas | {df.shape[1]} colunas | sep='{sep}' enc={enc}")
                    return df
            except Exception:
                continue

    log(f"Não foi possível ler {caminho}", "ERRO")
    return None

def encontrar_coluna(df, candidatos):
    """Retorna o nome da coluna cujo nome normalizado bate com algum candidato."""
    cols_norm = {normalizar(c): c for c in df.columns}
    for cand in candidatos:
        chave = normalizar(cand)
        if chave in cols_norm:
            return cols_norm[chave]
        # busca parcial
        for norm, orig in cols_norm.items():
            if chave in norm or norm in chave:
                return orig
    return None

# ── Loaders ───────────────────────────────────────────────────────────────────

def _carregar_mapa_ibge():
    """Retorna dict {codigo_ibge_str: nome_municipio} a partir do CSV local ou GitHub."""
    import urllib.request, io
    # Tenta primeiro CSV local (caso o usuário tenha baixado)
    candidatos_locais = [
        Path(__file__).parent / "municipios_br.csv",
        Path.home() / "Downloads" / "municipios_br.csv",
        Path("municipios_br.csv"),
    ]
    for p in candidatos_locais:
        if p.exists():
            try:
                df = pd.read_csv(str(p), dtype=str)
                return dict(zip(df["codigo_ibge"].str.strip(), df["nome"].str.strip()))
            except Exception:
                pass
    # Tenta baixar do GitHub
    url = "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv"
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            df = pd.read_csv(io.StringIO(r.read().decode("utf-8")), dtype=str)
            return dict(zip(df["codigo_ibge"].str.strip(), df["nome"].str.strip()))
    except Exception:
        pass
    # Fallback: mapa com principais capitais e cidades grandes
    return {
        "2504009":"Campina Grande","2507507":"João Pessoa","3550308":"São Paulo",
        "3304557":"Rio de Janeiro","3106200":"Belo Horizonte","4314902":"Porto Alegre",
        "4106902":"Curitiba","2927408":"Salvador","2304400":"Fortaleza","2611606":"Recife",
        "1302603":"Manaus","5300108":"Brasília","1501402":"Belém","2111300":"São Luís",
        "2704302":"Maceió","2800308":"Aracaju","2209100":"Teresina","2408102":"Natal",
        "3205309":"Vitória","5002704":"Campo Grande","5103403":"Cuiabá","5208707":"Goiânia",
    }


def carregar_bdgd(arquivo1, arquivo2=""):
    """
    Carrega UCMT e/ou UCAT da BDGD ANEEL.
    Se PASTA_BDGD estiver configurado, lê todos os CSV/Excel da pasta.
    Caso contrário usa arquivo1 e arquivo2 individualmente.
    """
    frames = []

    # Modo pasta: lê todos os arquivos UCMT da pasta nacional
    if PASTA_BDGD and Path(PASTA_BDGD).exists():
        ext_validas = {".csv", ".xlsx", ".xls", ".txt"}
        arquivos_pasta = sorted(
            p for p in Path(PASTA_BDGD).rglob("*")
            if p.suffix.lower() in ext_validas and p.is_file()
        )
        log(f"PASTA_BDGD: {len(arquivos_pasta)} arquivo(s) encontrado(s) em {PASTA_BDGD}")
        for arq in arquivos_pasta:
            df = ler_arquivo(str(arq))
            if df is not None:
                df["_fonte"] = arq.stem  # marca de qual distribuidora veio
                frames.append(df)
    else:
        # Modo individual
        for arq in [arquivo1, arquivo2]:
            if not arq:
                continue
            p = Path(arq)
            caminho = p if p.is_absolute() else Path(PASTA_DADOS) / arq
            df = ler_arquivo(str(caminho))
            if df is not None:
                frames.append(df)

    if not frames:
        log("Nenhum arquivo BDGD carregado.", "AVISO")
        return None

    df = pd.concat(frames, ignore_index=True)

    # Detectar colunas
    mapeamento = {
        "cnpj":        ["cnpj", "num_cpf_cnpj", "cpf_cnpj", "cpf_cnpj_titular", "cnpj_cpf"],
        "municipio":   ["municipio", "nom_mun", "mun_nome", "nome_municipio", "mun"],
        "cnae":        ["cnae", "cod_cnae", "cnae_principal", "classe_cnae"],
        "subgrupo":    ["subgrupo", "subgru", "sub_grupo", "subgrupo_tensao", "classe"],
        "consumo":     ["consumo", "ene_cons_12m", "cons_med", "consumo_medio",
                        "consumo_anual", "mwh", "kwh", "energia"],
        "demanda":     ["demanda", "dem_cont", "dem_cont_p", "dem_contratada",
                        "potencia", "kw"],
        "cep":         ["cep", "cod_cep", "cep_logradouro"],
        "distribuidora":["distribuidora", "sig_agente", "agente", "concessionaria"],
        "uf":          ["uf", "sig_uf", "estado", "sg_uf"],
        "latitude":    ["lat", "latitude", "lat_y", "coord_lat"],
        "longitude":   ["lon", "longitude", "lon_x", "coord_lon"],
    }

    renomear = {}
    for chave, candidatos in mapeamento.items():
        col = encontrar_coluna(df, candidatos)
        if col:
            renomear[col] = chave

    df = df.rename(columns=renomear)

    # Garantir que colunas essenciais existam
    for col in ["municipio", "cnae", "consumo", "cep"]:
        if col not in df.columns:
            df[col] = ""

    # Limpar e converter
    df["cnae"]    = df["cnae"].apply(limpar_cnae)
    df["cep"]     = df["cep"].apply(limpar_cep)
    if "cnpj" in df.columns:
        df["cnpj"] = df["cnpj"].apply(limpar_cnpj)
        n_cnpj = df["cnpj"].str.len().ge(14).sum()
        log(f"  CNPJ do BDGD: {n_cnpj:,} de {len(df):,} registros com CNPJ")

    # Município: pode vir como código IBGE (7 dígitos) — mapear para nome se possível
    col_mun_orig = renomear.get("municipio") or encontrar_coluna(df, ["municipio","nom_mun","mun_nome","nome_municipio","mun","cod_municipio","codigo_municipio"])
    # Detectar se o campo município é código IBGE (numérico de 7 dígitos)
    mun_sample = df["municipio"].dropna().head(20)
    eh_codigo_ibge = mun_sample.str.match(r"^\d{7}$").sum() > 10 if len(mun_sample) else False
    if eh_codigo_ibge:
        log("Município detectado como código IBGE — mapeando para nomes...")
        ibge_map = _carregar_mapa_ibge()
        df["municipio"] = df["municipio"].map(ibge_map).fillna(df["municipio"])
        log(f"  Municípios mapeados: {df['municipio'].isin(ibge_map.values()).sum():,} de {len(df):,}")

    df["municipio"] = df["municipio"].apply(normalizar)

    # Consumo: converter para numérico (kWh/mês)
    # Detectar se o campo mapeado vem de coluna anual (ene_cons_12m, consumo_anual, etc.)
    col_consumo_orig = next((c for c in renomear if renomear[c] == "consumo"), "")
    consumo_eh_anual = any(kw in col_consumo_orig.lower() for kw in ("12m", "anual", "ano", "_12"))
    df["consumo_num"] = (
        df["consumo"]
        .str.replace(",", ".", regex=False)
        .str.replace(r"[^\d.]", "", regex=True)
        .pipe(pd.to_numeric, errors="coerce")
        .fillna(0)
    )
    if consumo_eh_anual:
        log(f"Campo '{col_consumo_orig}' detectado como anual — dividindo por 12")
        df["consumo_num"] = df["consumo_num"] / 12
    else:
        # Fallback: se mediana > 500k ainda assim parece anual
        med = df["consumo_num"].median()
        if med > 500_000:
            log("Consumo parece anual (mediana alta) — convertendo para mensal (/12)")
            df["consumo_num"] = df["consumo_num"] / 12

    # Filtrar consumo mínimo
    antes = len(df)
    df = df[df["consumo_num"] >= CONSUMO_MINIMO].copy()
    log(f"BDGD: {antes:,} UCs → {len(df):,} elegíveis (>= {CONSUMO_MINIMO:,} kWh/mês)")

    # Aplicar filtros de UF
    if FILTRAR_UF and "uf" in df.columns:
        df = df[df["uf"].str.upper().isin([u.upper() for u in FILTRAR_UF])]
        log(f"  Após filtro UF {FILTRAR_UF}: {len(df):,} UCs")

    if FILTRAR_CNAE:
        df = df[df["cnae"].isin(FILTRAR_CNAE)]
        log(f"  Após filtro CNAE: {len(df):,} UCs")

    return df

def carregar_ccee(arquivo):
    """
    Carrega a lista de perfis CCEE (quem já está no mercado livre).
    Retorna conjunto de CNPJ-raiz (8 dígitos) de consumidores ativos.
    """
    _p = Path(arquivo); caminho = _p if _p.is_absolute() else Path(PASTA_DADOS) / arquivo
    df = ler_arquivo(str(caminho))
    if df is None:
        return set()

    col_cnpj   = encontrar_coluna(df, ["cnpj", "num_cpf_cnpj", "cpf_cnpj"])
    col_classe  = encontrar_coluna(df, ["classe", "classe_perfil", "tipo_perfil", "categoria"])
    col_status  = encontrar_coluna(df, ["status", "situacao", "ativo"])

    if col_cnpj is None:
        log("CCEE: coluna de CNPJ não encontrada — ignorando arquivo", "AVISO")
        return set()

    df["_cnpj"] = df[col_cnpj].apply(limpar_cnpj)
    df["_raiz"] = df["_cnpj"].str[:8]

    # Filtrar apenas consumidores ativos (excluir geradores, distribuidoras, comercializadoras)
    if col_classe and col_status:
        consumidores = df[
            df[col_status].str.upper().str.contains("ATIVO", na=False)
        ]
    else:
        consumidores = df

    raizes = set(consumidores["_raiz"].dropna().unique())
    log(f"CCEE: {len(raizes):,} CNPJs-raiz no mercado livre (lista de exclusão)")
    return raizes

def carregar_cnpj(arquivo_estab, arquivo_emp=""):
    """
    Carrega a base da Receita Federal.
    Detecta automaticamente se é o formato raw (sem cabeçalho) ou já processado.
    """
    _p = Path(arquivo_estab); caminho = _p if _p.is_absolute() else Path(PASTA_DADOS) / arquivo_estab
    df = ler_arquivo(str(caminho))
    if df is None:
        return None

    # ── Detectar se é formato RAW da Receita Federal (colunas numéricas) ──
    is_raw = all(str(c).isdigit() or str(c).startswith("Unnamed") for c in df.columns[:5])

    if is_raw:
        log("Detectado formato RAW da Receita Federal — aplicando cabeçalho padrão")
        colunas_raw = [
            "cnpj_basico","cnpj_ordem","cnpj_dv","matriz_filial","nome_fantasia",
            "situacao_cadastral","data_situacao","motivo_situacao","cidade_exterior",
            "pais","data_inicio","cnae_principal","cnae_secundario","tipo_logradouro",
            "logradouro","numero","complemento","bairro","cep","uf","municipio_ibge",
            "ddd1","telefone1","ddd2","telefone2","ddd_fax","fax","email",
            "situacao_especial","data_sit_especial"
        ]
        df.columns = colunas_raw[:len(df.columns)]
        df["cnpj"] = (df["cnpj_basico"].fillna("") +
                      df["cnpj_ordem"].fillna("").str.zfill(4) +
                      df["cnpj_dv"].fillna("").str.zfill(2))
        df["cnae"] = df["cnae_principal"].apply(limpar_cnae)
        df["cep"]  = df["cep"].apply(limpar_cep)
        df["uf"]   = df.get("uf", pd.Series([""] * len(df)))
        df["telefone"] = ("(" + df["ddd1"].fillna("").str.strip() + ") " +
                          df["telefone1"].fillna("").str.strip())
        df["situacao"] = df["situacao_cadastral"].map(
            {"1":"Nula","2":"Ativa","3":"Suspensa","4":"Inapta","8":"Baixada"}
        ).fillna(df["situacao_cadastral"])
        # Razão social (pode precisar do arquivo Empresas)
        df["razao_social"] = ""
        if arquivo_emp:
            log("Carregando razão social do arquivo Empresas...")
            _pe = Path(arquivo_emp); caminho_emp = _pe if _pe.is_absolute() else Path(PASTA_DADOS) / arquivo_emp
            df_emp = ler_arquivo(str(caminho_emp))
            if df_emp is not None:
                colunas_emp = ["cnpj_basico","razao_social","nat_juridica","qualif",
                               "capital","porte","ente"]
                df_emp.columns = colunas_emp[:len(df_emp.columns)]
                df = df.merge(
                    df_emp[["cnpj_basico","razao_social"]],
                    on="cnpj_basico", how="left", suffixes=("","_emp")
                )
                if "razao_social_emp" in df.columns:
                    df["razao_social"] = df["razao_social_emp"].fillna(df["razao_social"])
                    df.drop(columns=["razao_social_emp"], inplace=True)
        # Município: tentar converter código IBGE → nome
        df["municipio"] = df.get("municipio_ibge", pd.Series([""] * len(df))).apply(normalizar)
    else:
        # Formato já processado (com cabeçalho em português)
        mapeamento = {
            "cnpj":        ["cnpj","cnpj_completo","num_cnpj"],
            "razao_social":["razao_social","razao social","nome_empresa","empresa"],
            "nome_fantasia":["nome_fantasia","fantasia","nome fantasia"],
            "cnae":        ["cnae","cnae_principal","cnae principal"],
            "municipio":   ["municipio","cidade","nom_municipio"],
            "uf":          ["uf","estado","sg_uf"],
            "cep":         ["cep","cod_cep"],
            "telefone":    ["telefone","fone","ddd_telefone","contato"],
            "situacao":    ["situacao","situacao_cadastral","status"],
            "porte":       ["porte","porte_empresa","tamanho"],
        }
        renomear = {}
        for chave, candidatos in mapeamento.items():
            col = encontrar_coluna(df, candidatos)
            if col and col != chave:
                renomear[col] = chave
        df = df.rename(columns=renomear)

        df["cnpj"] = df.get("cnpj", pd.Series([""] * len(df))).apply(limpar_cnpj)
        df["cnae"] = df.get("cnae", pd.Series([""] * len(df))).apply(limpar_cnae)
        df["cep"]  = df.get("cep",  pd.Series([""] * len(df))).apply(limpar_cep)
        df["municipio"] = df.get("municipio", pd.Series([""] * len(df))).apply(normalizar)
        for col in ["razao_social","nome_fantasia","uf","telefone","situacao"]:
            if col not in df.columns:
                df[col] = ""

    # Filtrar apenas empresas ativas
    df = df[~df["situacao"].str.upper().str.contains("BAIXAD|INAP|NULA", na=False)].copy()
    log(f"CNPJ: {len(df):,} estabelecimentos ativos carregados")
    return df

def carregar_gd(arquivo):
    """
    Carrega lista de quem tem Geração Distribuída (solar etc.) da ANEEL.
    Retorna conjunto de nomes normalizados dos titulares.
    """
    _p = Path(arquivo); caminho = _p if _p.is_absolute() else Path(PASTA_DADOS) / arquivo
    df = ler_arquivo(str(caminho))
    if df is None:
        return set()

    col_titular = encontrar_coluna(df, ["titular","titular_empreendimento","proprietario","nome"])
    col_mun     = encontrar_coluna(df, ["municipio","cidade"])

    if col_titular is None:
        return set()

    nomes = set(df[col_titular].dropna().apply(normalizar))
    nomes.discard("")
    nomes.discard("***")
    log(f"GD ANEEL: {len(nomes):,} titulares com geração própria")
    return nomes

# ── Cruzamento e scoring ──────────────────────────────────────────────────────

def cruzar_bdgd_cnpj(df_bdgd, df_cnpj):
    """
    Cruza BDGD (Grupo A) com base de CNPJs.
    Tentativa 0: CNPJ direto do BDGD (quando BDGD já tem CNPJ — mais preciso)
    Tentativa 1: CEP + CNAE (fallback)
    Tentativa 2: Município + CNAE (fallback)
    """
    def _preencher_ausentes(df):
        for col, default in [("cnpj",""), ("razao_social",""), ("nome_fantasia",""),
                              ("telefone",""), ("situacao","Ativa")]:
            if col not in df.columns:
                df[col] = default
            else:
                df[col] = df[col].fillna(default)
        return df

    if df_cnpj is None:
        log("Base RFB não disponível — retornando BDGD sem CNPJ", "AVISO")
        df_bdgd = _preencher_ausentes(df_bdgd.copy())
        if not df_bdgd["razao_social"].any():
            df_bdgd["razao_social"] = "Sem CNPJ — cole base RFB"
        return df_bdgd

    # Tentativa 0: CNPJ direto (BDGD contém CNPJ)
    if "cnpj" in df_bdgd.columns and "cnpj" in df_cnpj.columns:
        bdgd_com_cnpj = df_bdgd[df_bdgd["cnpj"].str.len() >= 14].copy()
        if len(bdgd_com_cnpj) > 0:
            log("Cruzando por CNPJ direto (BDGD já contém CNPJ)...")
            cols_rfb = [c for c in ["cnpj","razao_social","nome_fantasia","uf",
                                     "municipio","telefone","situacao","cnae"]
                        if c in df_cnpj.columns]
            rfb_dedup = df_cnpj[cols_rfb].drop_duplicates(subset=["cnpj"])
            resultado = bdgd_com_cnpj.merge(rfb_dedup, on="cnpj", how="left",
                                            suffixes=("", "_rfb"))
            for col in ["razao_social","nome_fantasia","telefone","situacao"]:
                col_rfb = col + "_rfb"
                if col_rfb in resultado.columns:
                    resultado[col] = resultado[col_rfb].fillna(resultado.get(col, ""))
                    resultado.drop(columns=[col_rfb], inplace=True)
            resultado = _preencher_ausentes(resultado)
            sem_nome = (resultado["razao_social"] == "").sum()
            log(f"  CNPJ direto: {len(resultado) - sem_nome:,} com nome | {sem_nome:,} CNPJ não localizado")
            # Incluir registros do BDGD sem CNPJ (se houver)
            bdgd_sem_cnpj = df_bdgd[df_bdgd["cnpj"].str.len() < 14].copy()
            if len(bdgd_sem_cnpj) > 0:
                bdgd_sem_cnpj = _preencher_ausentes(bdgd_sem_cnpj)
                resultado = pd.concat([resultado, bdgd_sem_cnpj], ignore_index=True)
            return resultado

    log("Cruzando BDGD com Receita Federal por CEP/Município+CNAE...")
    total = 0

    # Tentativa 1: CEP + CNAE
    t1 = df_bdgd.merge(
        df_cnpj[["cnpj","razao_social","nome_fantasia","cnae","cep","uf",
                 "telefone","situacao","municipio"]].rename(columns={"municipio":"municipio_rfb"}),
        on=["cep","cnae"], how="inner"
    )
    total += len(t1)
    log(f"  Cruzamento CEP+CNAE: {len(t1):,} matches")

    # Tentativa 2: Município + CNAE (para quem não bateu por CEP)
    ceps_com_match = set(t1["cep"].unique())
    bdgd_restante  = df_bdgd[~df_bdgd["cep"].isin(ceps_com_match)].copy()

    if len(bdgd_restante) > 0:
        t2 = bdgd_restante.merge(
            df_cnpj[["cnpj","razao_social","nome_fantasia","cnae","cep","uf",
                     "telefone","situacao","municipio"]].rename(columns={"municipio":"municipio_rfb",
                                                                          "cep":"cep_rfb"}),
            left_on=["municipio","cnae"], right_on=["municipio","cnae"], how="inner"
        )
        total += len(t2)
        log(f"  Cruzamento Município+CNAE: {len(t2):,} matches adicionais")
        resultado = pd.concat([t1, t2], ignore_index=True)
    else:
        resultado = t1

    if len(resultado) == 0:
        log("Nenhum cruzamento BDGD×RFB — verifique os formatos dos arquivos", "AVISO")
        return df_bdgd

    log(f"  Total cruzado: {len(resultado):,} alvos potenciais")
    return resultado

def aplicar_exclusoes(df, cnpjs_ccee, nomes_gd):
    """
    Exclui quem já está no mercado livre (CCEE) e
    marca quem tem geração própria (GD).
    """
    # Coluna CNPJ raiz
    df["cnpj_raiz"] = df["cnpj"].apply(lambda x: x[:8] if len(x) >= 8 else x)
    df["ja_migrado"] = df["cnpj_raiz"].isin(cnpjs_ccee)

    # Geração própria: compara nome normalizado
    razoes_norm = df["razao_social"].apply(normalizar)
    df["tem_gd"] = razoes_norm.isin(nomes_gd)

    # Excluir migrados
    antes = len(df)
    df = df[~df["ja_migrado"]].copy()
    log(f"Excluídos já migrados (CCEE): {antes - len(df):,} empresas")
    log(f"  → Alvos restantes: {len(df):,}")

    return df

def calcular_score(df):
    """Calcula score 0-100 e prioridade A/B/C para cada alvo."""
    # Consumo (60 pts)
    consumo = df["consumo_num"].clip(upper=CONSUMO_REF_MAX)
    pts_consumo = (consumo / CONSUMO_REF_MAX) * PESO_CONSUMO

    # Sem GD (25 pts)
    pts_gd = df["tem_gd"].map({False: PESO_SEM_GD, True: 0}).fillna(PESO_SEM_GD)

    # CNAE (15 pts)
    pts_cnae = df["cnae"].map(CNAE_PRIORIDADE).fillna(5) / 10 * PESO_CNAE

    df["score"] = (pts_consumo + pts_gd + pts_cnae).clip(0, 100).round(1)

    df["prioridade"] = pd.cut(
        df["score"],
        bins=[-1, 49, 74, 100],
        labels=["C — oportunidade futura", "B — médio prazo", "A — atacar agora"]
    )

    # Economia estimada
    df["conta_estimada"]   = (df["consumo_num"] * TARIFA_CATIVA).round(0)
    df["economia_mensal"]  = (df["conta_estimada"] * ECONOMIA_PERCENTUAL).round(0)
    df["economia_anual"]   = (df["economia_mensal"] * 12).round(0)
    df["elegivel"]         = df["consumo_num"].apply(
        lambda x: "SIM" if x >= CONSUMO_MINIMO else "NAO"
    )

    return df.sort_values("score", ascending=False)

# ── Exportação Excel ──────────────────────────────────────────────────────────

def exportar_excel(df, caminho_saida):
    """Gera o Excel final com formatação e múltiplas abas."""
    log(f"Gerando Excel: {caminho_saida}")

    # Colunas para a aba ALVOS
    colunas_saida = [
        "cnpj", "razao_social", "nome_fantasia", "municipio", "uf",
        "cnae", "cnae_descricao", "consumo_num", "elegivel",
        "conta_estimada", "economia_mensal", "economia_anual",
        "ja_migrado", "tem_gd", "score", "prioridade", "telefone", "status_contato"
    ]

    # Adicionar colunas que existirem
    df["cnae_descricao"] = df["cnae"].map(CNAE_DESCRICAO).fillna("Outros")
    df["status_contato"] = ""

    for col in colunas_saida:
        if col not in df.columns:
            df[col] = ""

    df_out = df[colunas_saida].copy()
    df_out = df_out.rename(columns={
        "cnpj":           "CNPJ",
        "razao_social":   "Razão Social",
        "nome_fantasia":  "Nome Fantasia",
        "municipio":      "Município",
        "uf":             "UF",
        "cnae":           "CNAE",
        "cnae_descricao": "Atividade",
        "consumo_num":    "Consumo (kWh/mês)",
        "elegivel":       "Elegível?",
        "conta_estimada": "Conta Est. (R$/mês)",
        "economia_mensal":"Economia Est. (R$/mês)",
        "economia_anual": "Economia Est. (R$/ano)",
        "ja_migrado":     "Já Migrado?",
        "tem_gd":         "Tem GD?",
        "score":          "Score (0-100)",
        "prioridade":     "Prioridade",
        "telefone":       "Telefone",
        "status_contato": "Status / Próximo passo",
    })

    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils.dataframe import dataframe_to_rows
    from openpyxl.utils import get_column_letter

    wb = openpyxl.Workbook()

    # ── Aba ALVOS ─────────────────────────────────────────────────────────
    ws = wb.active
    ws.title = "ALVOS"

    VERDE_ESCURO = "1F7A4B"
    VERDE_CLARO  = "D6F0E0"
    CINZA        = "F2F2F2"
    LARANJA      = "FF9900"
    AMARELO      = "FFFF99"
    VERMELHO_BG  = "FFD7D7"

    # Cabeçalho
    ws.append(list(df_out.columns))
    for cell in ws[1]:
        cell.font      = Font(bold=True, color="FFFFFF", size=10)
        cell.fill      = PatternFill(fgColor=VERDE_ESCURO, fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    ws.row_dimensions[1].height = 30

    # Dados
    for row_idx, row in enumerate(dataframe_to_rows(df_out, index=False, header=False), 2):
        ws.append(row)
        prioridade = str(ws.cell(row=row_idx, column=16).value)
        if "A —" in prioridade:
            bg = VERDE_CLARO
        elif "B —" in prioridade:
            bg = AMARELO
        else:
            bg = CINZA
        for cell in ws[row_idx]:
            cell.fill      = PatternFill(fgColor=bg, fill_type="solid")
            cell.alignment = Alignment(vertical="center")
            cell.font      = Font(size=9)

    # Larguras das colunas
    larguras = [18,35,25,22,6,8,22,16,10,18,18,18,12,10,12,22,16,25]
    for i, w in enumerate(larguras, 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions

    # ── Aba Resumo ────────────────────────────────────────────────────────
    ws2 = wb.create_sheet("Resumo")
    ws2.title = "Resumo"
    ts = datetime.now().strftime("%d/%m/%Y %H:%M")

    resumo_dados = [
        ("Motor de Prospecção — Mercado Livre Brasil", ""),
        (f"Gerado em: {ts}", ""),
        ("", ""),
        ("TOTAIS GERAIS", ""),
        ("Total de alvos encontrados",    len(df_out)),
        ("Prioridade A (atacar agora)",   len(df_out[df_out["Prioridade"].str.contains("A —", na=False)])),
        ("Prioridade B (médio prazo)",    len(df_out[df_out["Prioridade"].str.contains("B —", na=False)])),
        ("Prioridade C (oportunidade)",   len(df_out[df_out["Prioridade"].str.contains("C —", na=False)])),
        ("", ""),
        ("ECONOMIA POTENCIAL (todo portfólio)", ""),
        ("Economia total anual estimada (R$)", df["economia_anual"].sum()),
        ("Consumo total (kWh/mês)",            df["consumo_num"].sum()),
        ("", ""),
        ("POR ESTADO", ""),
    ]

    for row in resumo_dados:
        ws2.append(list(row))

    # Top estados
    if "uf" in df.columns:
        top_uf = df.groupby("uf")["economia_anual"].agg(["count","sum"]).sort_values("sum", ascending=False)
        ws2.append(["UF", "Nº de alvos", "Economia anual total (R$)"])
        for uf, row in top_uf.iterrows():
            ws2.append([uf, int(row["count"]), row["sum"]])

    # ── Aba FUNIL ─────────────────────────────────────────────────────────
    ws3 = wb.create_sheet("FUNIL")
    ws3.append(["CNPJ", "Empresa", "Etapa", "Data contato", "Próximo passo",
                "Retorno em", "Responsável", "Economia/ano (R$)", "Obs"])
    for cell in ws3[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(fgColor=VERDE_ESCURO, fill_type="solid")

    # ── Aba Parâmetros usados ─────────────────────────────────────────────
    ws4 = wb.create_sheet("Parametros")
    ws4.append(["Parâmetro", "Valor"])
    params = [
        ("Tarifa cativa (R$/kWh)", TARIFA_CATIVA),
        ("Economia estimada (%)",  f"{ECONOMIA_PERCENTUAL*100:.0f}%"),
        ("Consumo mínimo (kWh/mês)", CONSUMO_MINIMO),
        ("Consumo ref. máximo (kWh/mês)", CONSUMO_REF_MAX),
        ("Peso: consumo",  PESO_CONSUMO),
        ("Peso: sem GD",   PESO_SEM_GD),
        ("Peso: CNAE",     PESO_CNAE),
        ("Filtro UF",      str(FILTRAR_UF) if FILTRAR_UF else "Todos"),
        ("Filtro CNAE",    str(FILTRAR_CNAE) if FILTRAR_CNAE else "Todos"),
        ("Data de geração", ts),
    ]
    for p in params:
        ws4.append(list(p))

    wb.save(caminho_saida)
    log(f"✓ Salvo: {caminho_saida}")

# ── Principal ─────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("  Motor de Prospecção — Mercado Livre de Energia | Brasil")
    print("=" * 70)

    if PASTA_DADOS and not Path(PASTA_DADOS).exists():
        log(f"PASTA_DADOS não encontrada: {PASTA_DADOS}", "ERRO")
        log("Edite a variável PASTA_DADOS no topo do script.", "ERRO")
        sys.exit(1)

    if PASTA_BDGD and not Path(PASTA_BDGD).exists():
        log(f"PASTA_BDGD não encontrada: {PASTA_BDGD}", "AVISO")
        log("Usando arquivos ARQUIVO_BDGD / ARQUIVO_BDGD_2 individuais.", "AVISO")

    # ── Carregar dados ────────────────────────────────────────────────────
    log("─── Carregando arquivos ───")

    df_bdgd  = carregar_bdgd(ARQUIVO_BDGD, ARQUIVO_BDGD_2)
    ccee_set = carregar_ccee(ARQUIVO_CCEE)         if ARQUIVO_CCEE    else set()

    # Tenta carregar CNPJ: primeiro ARQUIVO_CNPJ, depois ARQUIVO_CNPJ_EMP como fallback
    df_cnpj = None
    if ARQUIVO_CNPJ:
        df_cnpj = carregar_cnpj(ARQUIVO_CNPJ, ARQUIVO_CNPJ_EMP)
    if df_cnpj is None and ARQUIVO_CNPJ_EMP:
        log("Tentando carregar CNPJ de ARQUIVO_CNPJ_EMP como fonte primária...")
        df_cnpj = carregar_cnpj(ARQUIVO_CNPJ_EMP)

    gd_set   = carregar_gd(ARQUIVO_GD)             if ARQUIVO_GD      else set()

    if df_bdgd is None or len(df_bdgd) == 0:
        log("Sem dados BDGD para processar. Verifique os arquivos.", "ERRO")
        sys.exit(1)

    # ── Cruzar ───────────────────────────────────────────────────────────
    log("─── Cruzando fontes ───")
    df = cruzar_bdgd_cnpj(df_bdgd, df_cnpj)
    df = aplicar_exclusoes(df, ccee_set, gd_set)

    if len(df) == 0:
        log("Nenhum alvo restou após os filtros. Revise os parâmetros.", "ERRO")
        sys.exit(1)

    # ── Score ─────────────────────────────────────────────────────────────
    log("─── Calculando scores ───")
    df = calcular_score(df)

    # ── Exportar ─────────────────────────────────────────────────────────
    log("─── Exportando ───")
    pasta_saida = Path(PASTA_SAIDA) if PASTA_SAIDA else Path(__file__).parent
    pasta_saida.mkdir(parents=True, exist_ok=True)
    nome_saida = f"Prospeccao_GrupoA_Brasil_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    saida = pasta_saida / nome_saida
    exportar_excel(df, str(saida))

    # ── Resumo final ──────────────────────────────────────────────────────
    print()
    print("=" * 70)
    print(f"  CONCLUÍDO — {len(df):,} alvos encontrados")
    print("=" * 70)
    pri_a = len(df[df["prioridade"].astype(str).str.contains("A —", na=False)])
    pri_b = len(df[df["prioridade"].astype(str).str.contains("B —", na=False)])
    pri_c = len(df) - pri_a - pri_b
    print(f"  Prioridade A (atacar agora) : {pri_a:>6,}")
    print(f"  Prioridade B (médio prazo)  : {pri_b:>6,}")
    print(f"  Prioridade C (oportunidade) : {pri_c:>6,}")
    print(f"  Economia total anual (R$)   : {df['economia_anual'].sum():>12,.0f}")
    print()
    print(f"  Arquivo salvo em: {saida}")
    print("=" * 70)


if __name__ == "__main__":
    main()

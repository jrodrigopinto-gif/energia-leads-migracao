#!/usr/bin/env python3
"""
filtrar_rfb.py — Pré-filtra a base da Receita Federal pelos CEPs/CNAEs dos alvos BDGD.

Gera um CSV pequeno (rfb_filtrado.csv) que o motor_v4.py usa como ARQUIVO_CNPJ
para enriquecer os alvos com Razão Social, telefone e situação cadastral.

INSTALAÇÃO:
    pip install pandas openpyxl

COMO USAR:
    1. Baixe de dados.gov.br → "Cadastro Nacional da Pessoa Jurídica - CNPJ":
       - Estabelecimentos*.zip  (todos os arquivos, ex: Estabelecimentos0.zip ... Estabelecimentos9.zip)
       - Empresas*.zip          (todos os arquivos, ex: Empresas0.zip ... Empresas9.zip)
    2. Extraia TODOS os arquivos numa mesma pasta (ex: C:\\RFB)
    3. Configure os caminhos abaixo e execute:
           python filtrar_rfb.py
    4. No motor_v4.py, aponte ARQUIVO_CNPJ para o rfb_filtrado.csv gerado.
"""

import re, sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("ERRO: pip install pandas openpyxl")
    sys.exit(1)

# ──────────────────────────────────────────────────────────────────────────────
#  CONFIGURAÇÃO
# ──────────────────────────────────────────────────────────────────────────────

# Pasta onde estão os arquivos RFB extraídos (Estabelecimentos*.csv, Empresas*.csv)
PASTA_RFB = r"C:\Users\RODRIGO\Desktop\Motor de Prospecção"

# Arquivo BDGD original com os alvos (ucmt_pj.csv)
ARQUIVO_BDGD = r"C:\Users\RODRIGO\Desktop\EXCEL\ucmt_pj.csv"

# Onde salvar o resultado
SAIDA = r"C:\Users\RODRIGO\Desktop\Motor de Prospecção\rfb_filtrado.csv"

# Consumo mínimo (kWh/mês) — mesmo filtro do motor
CONSUMO_MINIMO = 15_000

# ──────────────────────────────────────────────────────────────────────────────
#  CÓDIGO
# ──────────────────────────────────────────────────────────────────────────────

# Colunas dos arquivos RFB (layout padrão Receita Federal 2023+)
COLS_ESTAB = [
    "cnpj_basico", "cnpj_ordem", "cnpj_dv", "matriz_filial", "nome_fantasia",
    "situacao", "data_situacao", "motivo_situacao", "cidade_exterior",
    "pais", "data_inicio", "cnae", "cnae_secundario", "tipo_logradouro",
    "logradouro", "numero", "complemento", "bairro", "cep", "uf", "municipio_ibge",
    "ddd1", "telefone1", "ddd2", "telefone2", "ddd_fax", "fax", "email",
    "situacao_especial", "data_sit_especial",
]

COLS_EMP = [
    "cnpj_basico", "razao_social", "nat_juridica", "qualif",
    "capital", "porte", "ente",
]

SITUACOES_INATIVAS = {"02", "03", "04", "08", "2", "3", "4", "8",
                      "BAIXADA", "INAPTA", "SUSPENSA", "NULA"}


def _strip_digits(v, n=None):
    s = re.sub(r"\D", "", str(v)) if not pd.isna(v) else ""
    return s[:n] if n else s


def _carregar_bdgd_ceps_cnaes():
    """Lê ucmt_pj.csv e devolve (set_ceps_8dig, set_cnaes_7dig) dos elegíveis."""
    print(f"Lendo BDGD: {ARQUIVO_BDGD}")
    df = None
    for enc in ("latin-1", "utf-8", "cp1252"):
        for sep in (";", ",", "\t"):
            try:
                df = pd.read_csv(ARQUIVO_BDGD, sep=sep, dtype=str, encoding=enc,
                                 on_bad_lines="skip", low_memory=False, nrows=5)
                if df.shape[1] > 5:
                    df = pd.read_csv(ARQUIVO_BDGD, sep=sep, dtype=str, encoding=enc,
                                     on_bad_lines="skip", low_memory=False)
                    break
            except Exception:
                continue
        if df is not None and df.shape[1] > 5:
            break

    if df is None or df.shape[1] <= 5:
        print("ERRO: não foi possível ler o arquivo BDGD.")
        sys.exit(1)

    cols_upper = {c.upper(): c for c in df.columns}
    print(f"  {len(df):,} linhas | {df.shape[1]} colunas")

    # Filtrar elegíveis por consumo
    col_cons = next((cols_upper[k] for k in cols_upper
                     if any(kw in k for kw in ("ENE_CONS_12M", "CONSUMO_ANUAL", "CONSUMO"))), None)
    if col_cons:
        nums = (df[col_cons].str.replace(",", ".", regex=False)
                             .str.replace(r"[^\d.]", "", regex=True)
                             .pipe(pd.to_numeric, errors="coerce")
                             .fillna(0))
        if "12M" in col_cons.upper() or "ANUAL" in col_cons.upper():
            nums = nums / 12
        df = df[nums >= CONSUMO_MINIMO]
        print(f"  Após filtro consumo >= {CONSUMO_MINIMO:,} kWh/mês: {len(df):,} UCs elegíveis")

    # CEPs únicos
    col_cep = next((cols_upper[k] for k in cols_upper if "CEP" in k), None)
    ceps = set()
    if col_cep:
        ceps = {_strip_digits(v, 8) for v in df[col_cep].dropna()
                if len(_strip_digits(v, 8)) == 8}
        print(f"  CEPs únicos: {len(ceps):,}")

    # CNAEs únicos
    col_cnae = next((cols_upper[k] for k in cols_upper if "CNAE" in k), None)
    cnaes = set()
    if col_cnae:
        cnaes = {_strip_digits(v, 7) for v in df[col_cnae].dropna()
                 if _strip_digits(v, 7)}
        print(f"  CNAEs únicos: {len(cnaes):,}")

    return ceps, cnaes


def _filtrar_estabelecimentos(ceps_alvo, cnaes_alvo):
    """Lê Estabelecimentos*.csv em chunks e retorna só os que batem com ceps/cnaes."""
    pasta = Path(PASTA_RFB)
    arqs = sorted(pasta.glob("Estabelecimentos*.csv"))
    if not arqs:
        arqs = sorted(pasta.glob("Estabelecimento*.csv"))
    if not arqs:
        print(f"ERRO: nenhum arquivo Estabelecimentos*.csv encontrado em {PASTA_RFB}")
        sys.exit(1)

    print(f"\nFiltrando {len(arqs)} arquivo(s) de Estabelecimentos...")
    frames = []
    total_lido = 0

    for arq in arqs:
        print(f"  {arq.name}...", end=" ", flush=True)
        n_arq = 0
        try:
            for chunk in pd.read_csv(str(arq), sep=";", header=None, dtype=str,
                                     encoding="latin-1", chunksize=200_000,
                                     on_bad_lines="skip"):
                chunk.columns = COLS_ESTAB[:len(chunk.columns)]
                total_lido += len(chunk)

                # Normalizar CEP e CNAE para comparação
                chunk["_cep"]  = chunk["cep"].apply(lambda x: _strip_digits(x, 8))
                chunk["_cnae"] = chunk["cnae"].apply(lambda x: _strip_digits(x, 7))

                # Manter apenas empresas ativas E (CEP match OU CNAE match)
                ativo = ~chunk["situacao"].isin(SITUACOES_INATIVAS)
                bate  = (chunk["_cep"].isin(ceps_alvo) | chunk["_cnae"].isin(cnaes_alvo))
                sel   = ativo & bate

                if sel.sum() > 0:
                    frames.append(chunk[sel].drop(columns=["_cep", "_cnae"]))
                    n_arq += sel.sum()

        except Exception as e:
            print(f"[ERRO: {e}]", end=" ")

        print(f"{n_arq:,} matches")

    if not frames:
        print("\nNenhum match encontrado. Verifique PASTA_RFB e o formato dos arquivos.")
        sys.exit(1)

    df = pd.concat(frames, ignore_index=True)
    print(f"\n  Total: {len(df):,} estabelecimentos ({total_lido:,} linhas processadas)")
    return df


def _juntar_razao_social(df_estab):
    """Lê Empresas*.csv em chunks e adiciona razao_social ao df_estab."""
    pasta = Path(PASTA_RFB)
    arqs = sorted(pasta.glob("Empresa*.csv"))
    if not arqs:
        print("Arquivo Empresa*.csv não encontrado — razao_social ficará em branco.")
        df_estab["razao_social"] = ""
        return df_estab

    print(f"\nCarregando Razão Social de {len(arqs)} arquivo(s) de Empresas...")
    cnpjs_basicos = set(df_estab["cnpj_basico"].dropna().unique())
    frames_emp = []

    for arq in arqs:
        print(f"  {arq.name}...", end=" ", flush=True)
        n = 0
        try:
            for chunk in pd.read_csv(str(arq), sep=";", header=None, dtype=str,
                                     encoding="latin-1", chunksize=200_000,
                                     on_bad_lines="skip"):
                chunk.columns = COLS_EMP[:len(chunk.columns)]
                sel = chunk["cnpj_basico"].isin(cnpjs_basicos)
                if sel.sum() > 0:
                    frames_emp.append(chunk[sel][["cnpj_basico", "razao_social"]])
                    n += sel.sum()
        except Exception as e:
            print(f"[ERRO: {e}]", end=" ")
        print(f"{n:,} matches")

    if not frames_emp:
        df_estab["razao_social"] = ""
        return df_estab

    df_emp = pd.concat(frames_emp, ignore_index=True).drop_duplicates("cnpj_basico")
    df_estab = df_estab.merge(df_emp, on="cnpj_basico", how="left")
    n_com_nome = df_estab["razao_social"].notna().sum()
    print(f"  Razão Social preenchida: {n_com_nome:,} de {len(df_estab):,}")
    return df_estab


def main():
    # 1. Extrair CEPs e CNAEs dos alvos BDGD
    ceps_alvo, cnaes_alvo = _carregar_bdgd_ceps_cnaes()

    if not ceps_alvo and not cnaes_alvo:
        print("ERRO: nenhum CEP ou CNAE encontrado no BDGD.")
        sys.exit(1)

    # 2. Filtrar Estabelecimentos RFB
    df_estab = _filtrar_estabelecimentos(ceps_alvo, cnaes_alvo)

    # 3. Adicionar Razão Social
    df_estab = _juntar_razao_social(df_estab)

    # 4. Montar CNPJ completo (14 dígitos)
    df_estab["cnpj"] = (
        df_estab["cnpj_basico"].fillna("").str.zfill(8) +
        df_estab["cnpj_ordem"].fillna("").str.zfill(4) +
        df_estab["cnpj_dv"].fillna("").str.zfill(2)
    )

    # 5. Telefone formatado
    df_estab["telefone"] = (
        "(" + df_estab["ddd1"].fillna("").str.strip() +
        ") " + df_estab["telefone1"].fillna("").str.strip()
    ).str.strip()

    # 6. Limpar CEP e CNAE para o motor
    df_estab["cep"]  = df_estab["cep"].apply(lambda x: _strip_digits(x, 8))
    df_estab["cnae"] = df_estab["cnae"].apply(lambda x: _strip_digits(x, 7))

    # 7. Renomear municipio_ibge → municipio (mantém o código; motor tenta mapear)
    if "municipio_ibge" in df_estab.columns:
        df_estab.rename(columns={"municipio_ibge": "municipio"}, inplace=True)

    # 8. Salvar
    colunas = ["cnpj", "razao_social", "nome_fantasia", "cnae", "cep", "uf",
               "municipio", "logradouro", "numero", "bairro", "telefone", "situacao"]
    colunas = [c for c in colunas if c in df_estab.columns]
    df_estab[colunas].to_csv(SAIDA, index=False, encoding="utf-8")

    print(f"""
=======================================================
  CONCLUÍDO — {len(df_estab):,} empresas salvas em:
  {SAIDA}
=======================================================

Próximo passo: abra motor_v4.py e altere:
  ARQUIVO_CNPJ = r"{SAIDA}"

Depois execute:
  python motor_v4.py
""")


if __name__ == "__main__":
    main()

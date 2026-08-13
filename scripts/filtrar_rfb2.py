#!/usr/bin/env python3
"""
filtrar_rfb2.py — Pré-filtra a base da Receita Federal pelos CEPs/CNAEs dos alvos BDGD.
Varredura COMPLETA: percorre todas as subpastas procurando arquivos de Estabelecimentos e Empresas.
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

# Pasta raiz onde estão TODOS os arquivos (o script varre subpastas automaticamente)
PASTA_RAIZ = r"C:\Users\RODRIGO\Desktop\Motor de Prospecção"

# Arquivo BDGD com os alvos
ARQUIVO_BDGD = r"C:\Users\RODRIGO\Desktop\EXCEL\ucmt_pj.csv"

# Arquivo de saída
SAIDA = r"C:\Users\RODRIGO\Desktop\Motor de Prospecção\rfb_filtrado.csv"

# Consumo mínimo (kWh/mês)
CONSUMO_MINIMO = 15_000

# ──────────────────────────────────────────────────────────────────────────────

COLS_ESTAB = [
    "cnpj_basico","cnpj_ordem","cnpj_dv","matriz_filial","nome_fantasia",
    "situacao","data_situacao","motivo_situacao","cidade_exterior",
    "pais","data_inicio","cnae","cnae_secundario","tipo_logradouro",
    "logradouro","numero","complemento","bairro","cep","uf","municipio_ibge",
    "ddd1","telefone1","ddd2","telefone2","ddd_fax","fax","email",
    "situacao_especial","data_sit_especial",
]

COLS_EMP = [
    "cnpj_basico","razao_social","nat_juridica","qualif",
    "capital","porte","ente",
]

SITUACOES_INATIVAS = {"02","03","04","08","2","3","4","8",
                      "BAIXADA","INAPTA","SUSPENSA","NULA"}


def _strip(v, n=None):
    s = re.sub(r"\D", "", str(v)) if not pd.isna(v) else ""
    return s[:n] if n else s


def _encontrar_csvs(pasta_raiz, palavra):
    """
    Busca recursiva: retorna todos os .csv cujo CAMINHO contém 'palavra' (case-insensitive),
    ou cujo NOME contém 'palavra'.
    """
    raiz = Path(pasta_raiz)
    palavra_up = palavra.upper()
    encontrados = []

    for p in raiz.rglob("*.csv"):
        partes_up = p.as_posix().upper()
        if palavra_up in partes_up:
            encontrados.append(p)

    # Fallback: arquivos sem extensão (formato antigo RFB)
    if not encontrados:
        for p in raiz.rglob("*"):
            if p.is_file() and not p.suffix and palavra_up in p.name.upper():
                encontrados.append(p)

    return sorted(set(encontrados))


def _carregar_bdgd_filtros():
    print(f"Lendo BDGD: {ARQUIVO_BDGD}")
    df = None
    for enc in ("latin-1","utf-8","cp1252"):
        for sep in (";",",","\t"):
            try:
                tmp = pd.read_csv(ARQUIVO_BDGD, sep=sep, dtype=str, encoding=enc,
                                  on_bad_lines="skip", low_memory=False, nrows=3)
                if tmp.shape[1] > 5:
                    df = pd.read_csv(ARQUIVO_BDGD, sep=sep, dtype=str, encoding=enc,
                                     on_bad_lines="skip", low_memory=False)
                    break
            except Exception:
                continue
        if df is not None:
            break

    if df is None:
        print("ERRO: não foi possível ler o BDGD.")
        sys.exit(1)

    cols_up = {c.upper(): c for c in df.columns}
    print(f"  {len(df):,} linhas | {df.shape[1]} colunas")

    # Filtrar por consumo
    col_cons = next((cols_up[k] for k in cols_up
                     if any(kw in k for kw in ("ENE_CONS_12M","CONSUMO_ANUAL","CONSUMO"))), None)
    if col_cons:
        nums = (df[col_cons].str.replace(",",".",regex=False)
                            .str.replace(r"[^\d.]","",regex=True)
                            .pipe(pd.to_numeric, errors="coerce").fillna(0))
        if any(kw in col_cons.upper() for kw in ("12M","ANUAL")):
            nums /= 12
        df = df[nums >= CONSUMO_MINIMO]

    col_cep  = next((cols_up[k] for k in cols_up if "CEP"  in k), None)
    col_cnae = next((cols_up[k] for k in cols_up if "CNAE" in k), None)

    ceps  = {_strip(v,8)  for v in df[col_cep].dropna()  if col_cep  and len(_strip(v,8))==8}
    cnaes = {_strip(v,7)  for v in df[col_cnae].dropna() if col_cnae and _strip(v,7)}

    print(f"  {len(df):,} UCs elegíveis | {len(ceps):,} CEPs únicos | {len(cnaes):,} CNAEs únicos")
    return ceps, cnaes


def _ler_em_chunks(arq, cols_padrao):
    """Lê CSV RFB sem cabeçalho em chunks de 200k linhas."""
    for chunk in pd.read_csv(str(arq), sep=";", header=None, dtype=str,
                             encoding="latin-1", chunksize=200_000,
                             on_bad_lines="skip"):
        chunk.columns = cols_padrao[:len(chunk.columns)]
        yield chunk


def _filtrar_estabelecimentos(ceps_alvo, cnaes_alvo):
    arqs = _encontrar_csvs(PASTA_RAIZ, "Estabelecimento")

    if not arqs:
        print(f"\nNão encontrei arquivos de Estabelecimentos em '{PASTA_RAIZ}'.")
        print("Arquivos CSV existentes na pasta:")
        for p in sorted(Path(PASTA_RAIZ).rglob("*.csv"))[:40]:
            print(f"  {p.relative_to(PASTA_RAIZ)}")
        sys.exit(1)

    print(f"\nArquivos de Estabelecimentos encontrados ({len(arqs)}):")
    for a in arqs:
        print(f"  {a.relative_to(PASTA_RAIZ)}")

    frames = []
    total_lido = 0
    for arq in arqs:
        print(f"\nProcessando: {arq.name} ...", end=" ", flush=True)
        n = 0
        try:
            for chunk in _ler_em_chunks(arq, COLS_ESTAB):
                total_lido += len(chunk)
                chunk["_cep"]  = chunk["cep"].apply(lambda x: _strip(x,8))
                chunk["_cnae"] = chunk["cnae"].apply(lambda x: _strip(x,7))
                ativo = ~chunk["situacao"].isin(SITUACOES_INATIVAS)
                bate  = chunk["_cep"].isin(ceps_alvo) | chunk["_cnae"].isin(cnaes_alvo)
                sel   = ativo & bate
                if sel.sum() > 0:
                    frames.append(chunk[sel].drop(columns=["_cep","_cnae"]))
                    n += sel.sum()
        except Exception as e:
            print(f"[ERRO: {e}]", end=" ")
        print(f"{n:,} matches")

    print(f"\nTotal: {sum(len(f) for f in frames):,} registros ({total_lido:,} lidos)")

    if not frames:
        print("Nenhum match encontrado — verifique se os CEPs/CNAEs do BDGD batem com o RFB.")
        sys.exit(1)

    return pd.concat(frames, ignore_index=True)


def _juntar_razao_social(df_estab):
    arqs = _encontrar_csvs(PASTA_RAIZ, "Empresa")
    if not arqs:
        print("Arquivos de Empresas não encontrados — razao_social ficará em branco.")
        df_estab["razao_social"] = ""
        return df_estab

    print(f"\nArquivos de Empresas ({len(arqs)}) — carregando Razão Social...")
    cnpjs_basicos = set(df_estab["cnpj_basico"].dropna().unique())
    frames_emp = []

    for arq in arqs:
        print(f"  {arq.name}...", end=" ", flush=True)
        n = 0
        try:
            for chunk in _ler_em_chunks(arq, COLS_EMP):
                sel = chunk["cnpj_basico"].isin(cnpjs_basicos)
                if sel.sum() > 0:
                    frames_emp.append(chunk[sel][["cnpj_basico","razao_social"]])
                    n += sel.sum()
        except Exception as e:
            print(f"[ERRO: {e}]", end=" ")
        print(f"{n:,}")

    if not frames_emp:
        df_estab["razao_social"] = ""
        return df_estab

    df_emp = pd.concat(frames_emp, ignore_index=True).drop_duplicates("cnpj_basico")
    df_estab = df_estab.merge(df_emp, on="cnpj_basico", how="left")
    print(f"  Razão Social: {df_estab['razao_social'].notna().sum():,} de {len(df_estab):,}")
    return df_estab


def main():
    ceps, cnaes = _carregar_bdgd_filtros()

    df = _filtrar_estabelecimentos(ceps, cnaes)
    df = _juntar_razao_social(df)

    # CNPJ completo 14 dígitos
    df["cnpj"] = (df["cnpj_basico"].fillna("").str.zfill(8) +
                  df["cnpj_ordem"].fillna("").str.zfill(4) +
                  df["cnpj_dv"].fillna("").str.zfill(2))

    df["telefone"] = ("(" + df["ddd1"].fillna("").str.strip() +
                      ") " + df["telefone1"].fillna("").str.strip()).str.strip()
    df["cep"]  = df["cep"].apply(lambda x: _strip(x,8))
    df["cnae"] = df["cnae"].apply(lambda x: _strip(x,7))
    if "municipio_ibge" in df.columns:
        df.rename(columns={"municipio_ibge":"municipio"}, inplace=True)

    cols = ["cnpj","razao_social","nome_fantasia","cnae","cep","uf",
            "municipio","logradouro","numero","bairro","telefone","situacao"]
    cols = [c for c in cols if c in df.columns]
    df[cols].to_csv(SAIDA, index=False, encoding="utf-8")

    print(f"""
=======================================================
  CONCLUÍDO — {len(df):,} empresas → {SAIDA}
=======================================================
Próximo passo — no motor_v4.py, configure:
  ARQUIVO_CNPJ = r"{SAIDA}"
Depois execute:
  python motor_v4.py
""")


if __name__ == "__main__":
    main()

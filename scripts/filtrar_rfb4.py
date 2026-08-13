#!/usr/bin/env python3
"""
filtrar_rfb4.py — Pré-filtra a base da Receita Federal pelos CEPs/CNAEs dos alvos BDGD.
Extrai ZIPs automaticamente e faz varredura completa de subpastas.
"""

import re, sys, zipfile, shutil
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("ERRO: pip install pandas openpyxl")
    sys.exit(1)

# ──────────────────────────────────────────────────────────────────────────────
#  CONFIGURAÇÃO
# ──────────────────────────────────────────────────────────────────────────────

# Pasta onde estão os arquivos RFB (pode conter ZIPs ou CSVs)
PASTA_RAIZ = r"C:\Cprospeccaorfb"

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


def _extrair_zips(pasta):
    """Extrai todos os ZIPs encontrados na pasta para subpastas."""
    pasta = Path(pasta)
    zips = list(pasta.rglob("*.zip")) + list(pasta.rglob("*.ZIP"))
    if not zips:
        return

    print(f"\nEncontrado(s) {len(zips)} arquivo(s) ZIP — extraindo...")
    for zp in zips:
        destino = zp.parent / zp.stem
        if destino.exists():
            print(f"  {zp.name} → já extraído em {destino.name}/")
            continue
        print(f"  Extraindo {zp.name} → {destino.name}/ ...", end=" ", flush=True)
        try:
            destino.mkdir(exist_ok=True)
            with zipfile.ZipFile(zp, "r") as z:
                z.extractall(destino)
            print("OK")
        except Exception as e:
            print(f"ERRO: {e}")


def _encontrar_csvs(pasta_raiz, palavra):
    """Busca recursiva: csvs cujo CAMINHO contenha 'palavra' (case-insensitive)."""
    raiz = Path(pasta_raiz)
    palavra_up = palavra.upper()
    encontrados = []

    for p in raiz.rglob("*.csv"):
        if palavra_up in p.as_posix().upper():
            encontrados.append(p)
    for p in raiz.rglob("*.CSV"):
        if palavra_up in p.as_posix().upper():
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

    ceps  = {_strip(v,8) for v in df[col_cep].dropna()  if col_cep  and len(_strip(v,8))==8}
    cnaes = {_strip(v,7) for v in df[col_cnae].dropna() if col_cnae and _strip(v,7)}

    print(f"  {len(df):,} UCs elegíveis | {len(ceps):,} CEPs únicos | {len(cnaes):,} CNAEs únicos")
    return ceps, cnaes


def _ler_em_chunks(arq, cols_padrao):
    for chunk in pd.read_csv(str(arq), sep=";", header=None, dtype=str,
                             encoding="latin-1", chunksize=200_000,
                             on_bad_lines="skip"):
        chunk.columns = cols_padrao[:len(chunk.columns)]
        yield chunk


def _filtrar_estabelecimentos(pasta_raiz, ceps_alvo, cnaes_alvo):
    arqs = _encontrar_csvs(pasta_raiz, "Estabelecimento")

    if not arqs:
        print(f"\n  Nenhum CSV de Estabelecimentos encontrado — listando o que há em {pasta_raiz}:")
        todos = list(Path(pasta_raiz).rglob("*"))
        for p in sorted(todos)[:50]:
            if p.is_file():
                print(f"    {p.relative_to(pasta_raiz)}  ({p.stat().st_size // 1024:,} KB)")
        sys.exit(1)

    print(f"\nArquivos de Estabelecimentos ({len(arqs)}):")
    for a in arqs:
        try:
            print(f"  {a.relative_to(pasta_raiz)}")
        except ValueError:
            print(f"  {a}")

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
        print("Nenhum match — verifique CEPs/CNAEs do BDGD vs. RFB.")
        sys.exit(1)

    return pd.concat(frames, ignore_index=True)


def _juntar_razao_social(pasta_raiz, df_estab):
    arqs = _encontrar_csvs(pasta_raiz, "Empresa")
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
    pasta_rfb = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(PASTA_RAIZ)
    print(f"Pasta RFB: {pasta_rfb}")

    if not pasta_rfb.exists():
        print(f"\nERRO: pasta não existe: {pasta_rfb}")
        print("Verifique o caminho e tente novamente.")
        sys.exit(1)

    # Extrai ZIPs antes de procurar CSVs
    _extrair_zips(pasta_rfb)

    ceps, cnaes = _carregar_bdgd_filtros()

    df = _filtrar_estabelecimentos(pasta_rfb, ceps, cnaes)
    df = _juntar_razao_social(pasta_rfb, df)

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

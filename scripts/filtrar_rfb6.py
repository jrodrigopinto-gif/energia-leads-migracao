#!/usr/bin/env python3
"""
filtrar_rfb6.py — Extrai Estabelecimentos0-9 e Empresas0-9 e filtra pelos alvos BDGD.
"""

import re, sys, zipfile
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("ERRO: pip install pandas openpyxl")
    sys.exit(1)

# ──────────────────────────────────────────────────────────────────────────────
PASTA_RAIZ   = r"C:\mkdir Cprospeccaorfb\download"
ARQUIVO_BDGD = r"C:\Users\RODRIGO\Desktop\EXCEL\ucmt_pj.csv"
SAIDA        = r"C:\Users\RODRIGO\Desktop\Motor de Prospecção\rfb_filtrado.csv"
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
COLS_EMP = ["cnpj_basico","razao_social","nat_juridica","qualif","capital","porte","ente"]
SITUACOES_INATIVAS = {"02","03","04","08","2","3","4","8",
                      "BAIXADA","INAPTA","SUSPENSA","NULA"}


def _strip(v, n=None):
    s = re.sub(r"\D", "", str(v)) if not pd.isna(v) else ""
    return s[:n] if n else s


def _encontrar_zip(raiz, nome_base):
    """
    Procura o arquivo ZIP pelo nome (com ou sem extensão).
    Retorna o Path se encontrado, None caso contrário.
    """
    raiz = Path(raiz)
    for ext in (".zip", ".ZIP", ""):
        p = raiz / f"{nome_base}{ext}"
        # É um arquivo real (não pasta virtual)?
        try:
            if p.exists() and p.stat().st_size > 1000:
                # Confirma que é ZIP válido
                with zipfile.ZipFile(p, "r") as _:
                    return p
        except Exception:
            continue
    return None


def _extrair_grupo(raiz, prefixo, indices=range(10)):
    """
    Extrai todos os ZIPs do grupo (ex: Estabelecimentos0..9).
    Retorna lista de pastas extraídas.
    """
    raiz = Path(raiz)
    pasta_extraida = raiz / "_extraido"
    pasta_extraida.mkdir(exist_ok=True)

    extraidos = []
    for i in indices:
        nome_base = f"{prefixo}{i}"
        zip_path  = _encontrar_zip(raiz, nome_base)
        destino   = pasta_extraida / nome_base

        if destino.exists() and any(destino.iterdir()):
            print(f"  {nome_base}: já extraído — OK")
            extraidos.append(destino)
            continue

        if zip_path is None:
            print(f"  {nome_base}: não encontrado — pulando")
            continue

        print(f"  Extraindo {zip_path.name} ({zip_path.stat().st_size // 1_048_576:,} MB)...",
              end=" ", flush=True)
        destino.mkdir(exist_ok=True)
        try:
            with zipfile.ZipFile(zip_path, "r") as z:
                z.extractall(destino)
            print("OK")
            extraidos.append(destino)
        except Exception as e:
            print(f"ERRO: {e}")

    return extraidos


def _carregar_bdgd_filtros():
    print(f"\nLendo BDGD: {ARQUIVO_BDGD}")
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

    print(f"  {len(df):,} UCs elegíveis | {len(ceps):,} CEPs | {len(cnaes):,} CNAEs")
    return ceps, cnaes


def _ler_em_chunks(arq, cols_padrao):
    for chunk in pd.read_csv(str(arq), sep=";", header=None, dtype=str,
                             encoding="latin-1", chunksize=200_000,
                             on_bad_lines="skip"):
        chunk.columns = cols_padrao[:len(chunk.columns)]
        yield chunk


def _encontrar_csvs_em(pastas, palavra):
    """Busca arquivos cujo caminho contém 'palavra' dentro das pastas extraídas."""
    palavra_up = palavra.upper()
    encontrados = []
    for pasta in pastas:
        for p in Path(pasta).rglob("*"):
            if p.is_file() and p.suffix.lower() in (".csv",""):
                encontrados.append(p)
    return sorted(set(encontrados))


def _filtrar_estabelecimentos(pastas_estab, ceps_alvo, cnaes_alvo):
    arqs = _encontrar_csvs_em(pastas_estab, "")
    if not arqs:
        print("ERRO: nenhum arquivo encontrado nas pastas extraídas de Estabelecimentos.")
        sys.exit(1)

    print(f"\nArquivos de Estabelecimentos ({len(arqs)}):")
    for a in arqs:
        print(f"  {a.name}")

    frames, total_lido = [], 0
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

    print(f"\nTotal Estabelecimentos: {sum(len(f) for f in frames):,} ({total_lido:,} lidos)")
    if not frames:
        print("Nenhum match encontrado.")
        sys.exit(1)
    return pd.concat(frames, ignore_index=True)


def _juntar_razao_social(pastas_emp, df_estab):
    arqs = _encontrar_csvs_em(pastas_emp, "")
    if not arqs:
        print("Empresas não encontradas — razao_social ficará em branco.")
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
    raiz = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(PASTA_RAIZ)
    print(f"Pasta RFB: {raiz}")

    if not raiz.exists():
        print(f"\nERRO: pasta não encontrada: {raiz}")
        sys.exit(1)

    # ── EXTRAÇÃO ──────────────────────────────────────────────────────────────
    print("\n=== EXTRAINDO Estabelecimentos0..9 ===")
    pastas_estab = _extrair_grupo(raiz, "Estabelecimentos")
    if not pastas_estab:
        # Tenta singular
        pastas_estab = _extrair_grupo(raiz, "Estabelecimento")

    print("\n=== EXTRAINDO Empresas0..9 ===")
    pastas_emp = _extrair_grupo(raiz, "Empresas")
    if not pastas_emp:
        pastas_emp = _extrair_grupo(raiz, "Empresa")

    # ── BDGD ──────────────────────────────────────────────────────────────────
    ceps, cnaes = _carregar_bdgd_filtros()

    # ── FILTRAR ───────────────────────────────────────────────────────────────
    df = _filtrar_estabelecimentos(pastas_estab, ceps, cnaes)
    df = _juntar_razao_social(pastas_emp, df)

    # ── SAÍDA ─────────────────────────────────────────────────────────────────
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

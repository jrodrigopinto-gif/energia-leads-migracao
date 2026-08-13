#!/usr/bin/env python3
"""
filtrar_rfb3.py — Pré-filtra a base da Receita Federal pelos CEPs/CNAEs dos alvos BDGD.

USO:
    python filtrar_rfb3.py                          # busca automática em todos os drives
    python filtrar_rfb3.py "D:\\RFB"               # pasta específica
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

COLS_EMP = [
    "cnpj_basico","razao_social","nat_juridica","qualif",
    "capital","porte","ente",
]

SITUACOES_INATIVAS = {"02","03","04","08","2","3","4","8",
                      "BAIXADA","INAPTA","SUSPENSA","NULA"}


def _strip(v, n=None):
    s = re.sub(r"\D", "", str(v)) if not pd.isna(v) else ""
    return s[:n] if n else s


def _listar_drives_windows():
    """Retorna lista de drives disponíveis no Windows (C:, D:, etc.)."""
    drives = []
    try:
        import string, ctypes
        bitmask = ctypes.windll.kernel32.GetLogicalDrives()
        for letra in string.ascii_uppercase:
            if bitmask & 1:
                drives.append(Path(f"{letra}:\\"))
            bitmask >>= 1
    except Exception:
        drives = [Path("C:\\")]
    return drives


def _encontrar_pasta_rfb():
    """
    Procura automaticamente em todos os drives por uma pasta que contenha
    arquivos de Estabelecimentos da Receita Federal.
    Retorna o Path da pasta encontrada, ou None.
    """
    drives = _listar_drives_windows()
    print(f"\nBuscando arquivos RFB nos drives: {[str(d) for d in drives]}")
    print("(Isso pode levar alguns segundos...)")

    # Pastas comuns onde usuários costumam salvar a RFB
    sugestoes = [
        "RFB", "rfb", "CNPJ", "cnpj",
        "Receita Federal", "ReceitaFederal",
        "Dados RFB", "DadosRFB",
        "Motor de Prospecção",
    ]

    for drive in drives:
        if not drive.exists():
            continue
        print(f"  Varrendo {drive}...", end=" ", flush=True)
        try:
            # Primeiro checa as pastas sugeridas na raiz do drive
            for nome in sugestoes:
                candidata = drive / nome
                if candidata.exists():
                    for p in candidata.rglob("*.csv"):
                        if "ESTAB" in p.as_posix().upper():
                            print(f"ENCONTRADO!")
                            return candidata

            # Busca geral (mais lenta)
            for p in drive.rglob("*.csv"):
                if "ESTAB" in p.as_posix().upper() and "RFBCNPJ" not in p.as_posix().upper():
                    pasta = p.parent
                    # Sobe até encontrar a pasta que contém ambos Estab e Emp
                    for ancestor in [pasta] + list(pasta.parents)[:3]:
                        estabs = list(ancestor.rglob("*.csv"))
                        nomes  = " ".join(q.as_posix().upper() for q in estabs)
                        if "ESTAB" in nomes and "EMPRES" in nomes:
                            print(f"ENCONTRADO!")
                            return ancestor
        except PermissionError:
            pass
        except Exception:
            pass
        print("não encontrado")

    return None


def _encontrar_csvs(pasta_raiz, palavra):
    """Busca recursiva por csvs cujo CAMINHO contenha 'palavra'."""
    raiz = Path(pasta_raiz)
    palavra_up = palavra.upper()
    encontrados = []

    for p in raiz.rglob("*.csv"):
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

    ceps  = {_strip(v,8)  for v in df[col_cep].dropna()  if col_cep  and len(_strip(v,8))==8}
    cnaes = {_strip(v,7)  for v in df[col_cnae].dropna() if col_cnae and _strip(v,7)}

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
        print(f"\n{'='*60}")
        print(f"ERRO: arquivos de Estabelecimentos NÃO encontrados em:")
        print(f"  {pasta_raiz}")
        print(f"\nOs arquivos da Receita Federal têm nomes como:")
        print(f"  Estabelecimentos0.csv ... Estabelecimentos9.csv")
        print(f"  (ou em subpastas com 'Estabelecimento' no caminho)")
        print(f"\nSe os arquivos RFB estão em outra pasta, rode assim:")
        print(f'  python filtrar_rfb3.py "D:\\caminho\\para\\rfb"')
        print(f"{'='*60}")
        sys.exit(1)

    print(f"\nArquivos de Estabelecimentos encontrados ({len(arqs)}):")
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
        print("Nenhum match encontrado — verifique se os CEPs/CNAEs do BDGD batem com o RFB.")
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
    # Determinar pasta RFB
    if len(sys.argv) > 1:
        pasta_rfb = Path(sys.argv[1])
        print(f"[INFO] Pasta RFB fornecida: {pasta_rfb}")
    else:
        pasta_rfb = _encontrar_pasta_rfb()
        if pasta_rfb is None:
            print("\n" + "="*60)
            print("Não foi possível encontrar os arquivos da Receita Federal")
            print("automaticamente em nenhum drive.")
            print("\nBaixe os arquivos RFB em:")
            print("  https://dados.gov.br → buscar 'CNPJ'")
            print("  → Estabelecimentos0..9.zip + Empresas0..9.zip")
            print("  → Extraia numa pasta e rode:")
            print('  python filtrar_rfb3.py "D:\\pasta\\rfb"')
            print("="*60)
            sys.exit(1)
        print(f"\n[INFO] Pasta RFB detectada automaticamente: {pasta_rfb}")

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

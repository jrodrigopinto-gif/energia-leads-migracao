#!/usr/bin/env python3
"""
filtrar_rfb7.py — Extrai Estabelecimentos e Empresas do download.zip e filtra pelos alvos BDGD.

O Explorer mostra o conteúdo do download.zip como pasta virtual — este script
abre o zip diretamente e extrai só os arquivos necessários para disco.
"""

import re, sys, zipfile
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("ERRO: pip install pandas openpyxl")
    sys.exit(1)

# ──────────────────────────────────────────────────────────────────────────────
# PASTA onde está o download.zip (pai do folder "download")
PASTA_PAI    = r"C:\mkdir Cprospeccaorfb"
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


def _encontrar_download_zip(pasta_pai):
    """Procura download.zip em C:\mkdir Cprospeccaorfb e subpastas."""
    raiz = Path(pasta_pai)
    # Verifica locais mais prováveis primeiro
    candidatos = [
        raiz / "download.zip",
        raiz / "download" / "download.zip",
        raiz / "Download.zip",
    ]
    for c in candidatos:
        if c.exists() and c.is_file():
            return c

    # Busca geral
    for p in raiz.rglob("*.zip"):
        if p.stem.lower() == "download":
            return p
    return None


def _listar_inner_zips(download_zip):
    """Lista os ZIPs internos do download.zip que têm Estabelecimento ou Empresa no nome."""
    with zipfile.ZipFile(download_zip, "r") as z:
        nomes = z.namelist()

    estab, emp = [], []
    for nome in nomes:
        nome_up = nome.upper()
        # Pega apenas o arquivo raiz (não subpastas dentro dos zips aninhados)
        if "ESTABELE" in nome_up or "ESTABELECIMENTO" in nome_up:
            estab.append(nome)
        elif "EMPRESA" in nome_up:
            emp.append(nome)

    return sorted(set(estab)), sorted(set(emp))


def _extrair_item_do_zip(download_zip, nome_interno, pasta_destino):
    """
    Extrai um item do download.zip para pasta_destino.
    Se o item for ele mesmo um ZIP, extrai o ZIP interno também.
    """
    pasta_destino = Path(pasta_destino)
    pasta_destino.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(download_zip, "r") as outer:
        info = outer.getinfo(nome_interno)
        # Extrai o item (pode ser zip interno ou arquivo direto)
        outer.extract(info, pasta_destino)
        caminho_extraido = pasta_destino / nome_interno

    # Se o item extraído for um ZIP, extrai o conteúdo dele também
    if caminho_extraido.suffix.lower() == ".zip" or _e_zip(caminho_extraido):
        subpasta = pasta_destino / Path(nome_interno).stem
        subpasta.mkdir(exist_ok=True)
        print(f"    → descomprimindo conteúdo interno...", end=" ", flush=True)
        try:
            with zipfile.ZipFile(caminho_extraido, "r") as inner:
                inner.extractall(subpasta)
            caminho_extraido.unlink()  # remove o zip intermediário
            print("OK")
            return subpasta
        except Exception as e:
            print(f"ERRO: {e}")
            return caminho_extraido
    return caminho_extraido


def _e_zip(path):
    try:
        with open(path, "rb") as f:
            return f.read(4) == b"PK\x03\x04"
    except Exception:
        return False


def _extrair_estabelecimentos_empresas(download_zip, pasta_extraido):
    """
    Abre download.zip e extrai os Estabelecimentos e Empresas para pasta_extraido.
    Retorna (lista_pastas_estab, lista_pastas_emp).
    """
    print(f"\nAbrindo {download_zip.name} ({download_zip.stat().st_size // 1_048_576:,} MB)...")

    with zipfile.ZipFile(download_zip, "r") as z:
        todos = z.namelist()

    print(f"  {len(todos)} itens dentro do zip:")
    for n in sorted(todos):
        print(f"    {n}")

    pasta_extraido = Path(pasta_extraido)
    pasta_extraido.mkdir(parents=True, exist_ok=True)

    pastas_estab, pastas_emp = [], []

    for nome in sorted(todos):
        nome_up = nome.upper().replace("/","").replace("\\","")
        eh_estab = "ESTABELE" in nome_up or "ESTABELECIMENTO" in nome_up
        eh_emp   = "EMPRESA" in nome_up and "ESTABELE" not in nome_up

        if not eh_estab and not eh_emp:
            continue

        tipo = "Estabelecimentos" if eh_estab else "Empresas"
        destino_item = pasta_extraido / tipo
        destino_item.mkdir(exist_ok=True)

        # Verifica se já foi extraído
        arquivos_ja = list(destino_item.rglob("*"))
        nome_base = Path(nome).stem
        ja_existe = any(nome_base.upper() in str(f).upper() for f in arquivos_ja)
        if ja_existe:
            print(f"  {nome}: já extraído — OK")
        else:
            print(f"  Extraindo {nome}...", end=" ", flush=True)
            try:
                with zipfile.ZipFile(download_zip, "r") as z:
                    z.extract(nome, destino_item)
                caminho_ext = destino_item / nome
                # Se é zip aninhado, extrai o conteúdo
                if _e_zip(caminho_ext):
                    subpasta = destino_item / Path(nome).stem
                    subpasta.mkdir(exist_ok=True)
                    print(f"(zip interno)...", end=" ", flush=True)
                    with zipfile.ZipFile(caminho_ext, "r") as inner:
                        inner.extractall(subpasta)
                    caminho_ext.unlink()
                print("OK")
            except Exception as e:
                print(f"ERRO: {e}")
                continue

        if eh_estab and destino_item not in pastas_estab:
            pastas_estab.append(destino_item)
        if eh_emp and destino_item not in pastas_emp:
            pastas_emp.append(destino_item)

    return pastas_estab, pastas_emp


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


def _todos_arquivos_dados(pastas):
    """Encontra todos os arquivos de dados nas pastas (qualquer extensão)."""
    encontrados = []
    for pasta in pastas:
        for p in Path(pasta).rglob("*"):
            if p.is_file() and p.stat().st_size > 10_000:
                encontrados.append(p)
    return sorted(set(encontrados))


def _filtrar_estabelecimentos(pastas_estab, ceps_alvo, cnaes_alvo):
    arqs = _todos_arquivos_dados(pastas_estab)
    if not arqs:
        print("ERRO: nenhum arquivo de Estabelecimentos encontrado.")
        sys.exit(1)

    print(f"\nArquivos de Estabelecimentos ({len(arqs)}):")
    for a in arqs:
        print(f"  {a.name}  ({a.stat().st_size // 1_048_576:,} MB)")

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

    print(f"\nTotal: {sum(len(f) for f in frames):,} ({total_lido:,} lidos)")
    if not frames:
        print("Nenhum match encontrado.")
        sys.exit(1)
    return pd.concat(frames, ignore_index=True)


def _juntar_razao_social(pastas_emp, df_estab):
    arqs = _todos_arquivos_dados(pastas_emp)
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
    pasta_pai = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(PASTA_PAI)
    pasta_extraido = pasta_pai / "_extraido_rfb"

    # 1. Encontrar download.zip
    download_zip = _encontrar_download_zip(pasta_pai)
    if download_zip is None:
        print(f"\nERRO: download.zip não encontrado em {pasta_pai}")
        print("Verifique o caminho e tente:")
        print(f'  python filtrar_rfb7.py "C:\\caminho\\correto"')
        sys.exit(1)

    print(f"ZIP encontrado: {download_zip}")

    # 2. Extrair Estabelecimentos e Empresas do zip
    pastas_estab, pastas_emp = _extrair_estabelecimentos_empresas(download_zip, pasta_extraido)

    if not pastas_estab:
        print("\nERRO: Estabelecimentos não encontrados dentro do download.zip.")
        sys.exit(1)

    # 3. Carregar filtros BDGD
    ceps, cnaes = _carregar_bdgd_filtros()

    # 4. Filtrar estabelecimentos
    df = _filtrar_estabelecimentos(pastas_estab, ceps, cnaes)

    # 5. Juntar razão social
    df = _juntar_razao_social(pastas_emp, df)

    # 6. Formatar e salvar
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

#!/usr/bin/env python3
"""
Converte arquivos BDGD (.gdb) para CSV, extraindo apenas a camada UCMT e UCAT.
Rode este script antes do motor_prospeccao_brasil.py.

Instalação:
    pip install geopandas fiona pyogrio
"""

import sys
from pathlib import Path

PASTA_MOTOR = Path(r"C:\Users\RODRIGO\Desktop\Motor de Prospecção")
PASTA_SAIDA = PASTA_MOTOR / "BDGD_Nacional"

CAMADAS_ALVO = ["UCMT", "UCAT", "ucmt", "ucat",
                "UC_MT", "UC_AT", "uc_mt", "uc_at"]

try:
    import fiona
    import geopandas as gpd
except ImportError:
    print("ERRO: Instale as dependências primeiro:")
    print("    pip install geopandas fiona pyogrio")
    sys.exit(1)

def encontrar_gdbs(pasta: Path):
    gdbs = []
    for p in pasta.rglob("*.gdb"):
        if p.is_dir():
            gdbs.append(p)
    return sorted(gdbs)

def listar_camadas(gdb: Path):
    try:
        return fiona.listlayers(str(gdb))
    except Exception as e:
        print(f"  [!] Não foi possível listar camadas: {e}")
        return []

def extrair_camada(gdb: Path, camada: str, saida: Path):
    try:
        gdf = gpd.read_file(str(gdb), layer=camada, engine="pyogrio")
        # Remover geometria — só queremos dados tabulares
        if "geometry" in gdf.columns:
            df = gdf.drop(columns=["geometry"])
        else:
            df = gdf
        df.to_csv(str(saida), index=False, encoding="utf-8")
        return len(df)
    except Exception as e:
        print(f"  [!] Erro extraindo {camada}: {e}")
        return 0

def main():
    print("=" * 65)
    print("  Conversor BDGD (.gdb) → CSV")
    print("=" * 65)

    PASTA_SAIDA.mkdir(parents=True, exist_ok=True)
    gdbs = encontrar_gdbs(PASTA_MOTOR)

    if not gdbs:
        print(f"\n  Nenhum arquivo .gdb encontrado em:\n  {PASTA_MOTOR}")
        print("  Verifique se os ZIPs foram extraídos corretamente.")
        sys.exit(1)

    print(f"\n  {len(gdbs)} arquivo(s) .gdb encontrado(s)\n")

    total_registros = 0
    convertidos = 0
    nao_encontrou_ucmt = []

    for gdb in gdbs:
        print(f"[ {gdb.name} ]")
        camadas = listar_camadas(gdb)
        if not camadas:
            continue

        print(f"  Camadas disponíveis: {camadas}")

        for alvo in CAMADAS_ALVO:
            if alvo in camadas:
                nome_saida = f"{gdb.stem}_{alvo}.csv"
                caminho_saida = PASTA_SAIDA / nome_saida

                if caminho_saida.exists():
                    print(f"  [=] {alvo} já convertido — pulando")
                    convertidos += 1
                    continue

                print(f"  [>] Extraindo camada '{alvo}'...")
                n = extrair_camada(gdb, alvo, caminho_saida)
                if n > 0:
                    print(f"  [OK] {n:,} registros → {nome_saida}")
                    total_registros += n
                    convertidos += 1

        # Verifica se tinha UCMT
        tem_ucmt = any(c in camadas for c in CAMADAS_ALVO)
        if not tem_ucmt:
            nao_encontrou_ucmt.append(gdb.name)
            print(f"  [!] Nenhuma camada UCMT/UCAT encontrada — camadas: {camadas}")

        print()

    print("=" * 65)
    print(f"  CONCLUÍDO")
    print(f"  Arquivos convertidos : {convertidos}")
    print(f"  Total de registros   : {total_registros:,}")
    print(f"  CSVs salvos em       : {PASTA_SAIDA}")
    print("=" * 65)

    if nao_encontrou_ucmt:
        print(f"\n  [!] Sem UCMT/UCAT em {len(nao_encontrou_ucmt)} arquivo(s):")
        for n in nao_encontrou_ucmt:
            print(f"      - {n}")

    print(f"\n  Próximo passo: rode o motor_prospeccao_brasil.py")
    print(f"  (PASTA_BDGD já aponta para {PASTA_SAIDA})")
    input("\n  Pressione Enter para sair...")

if __name__ == "__main__":
    main()

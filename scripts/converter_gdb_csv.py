#!/usr/bin/env python3
"""
Converte arquivos BDGD (.gdb) para CSV extraindo camadas UCMT e UCAT.
Usa pyogrio (GDAL embutido — sem necessidade de instalação separada).

Instalação:
    pip install pyogrio pandas
"""

import sys
from pathlib import Path

PASTA_MOTOR = Path(r"C:\Users\RODRIGO\Desktop\Motor de Prospecção")
PASTA_SAIDA = PASTA_MOTOR / "BDGD_Nacional"

CAMADAS_ALVO = ["UCMT", "UCAT", "ucmt", "ucat",
                "UC_MT", "UC_AT", "uc_mt", "uc_at",
                "UCMT_PJ", "UCAT_PJ", "ucmt_pj", "ucat_pj"]

try:
    import pyogrio
    import pandas as pd
except ImportError:
    print("ERRO: Instale as dependências:")
    print("    pip install pyogrio pandas")
    sys.exit(1)


def encontrar_gdbs(pasta: Path):
    return sorted(p for p in pasta.rglob("*.gdb") if p.is_dir())


def listar_camadas(gdb: Path):
    try:
        info = pyogrio.list_layers(str(gdb))
        return [row[0] for row in info]
    except Exception as e:
        print(f"  [!] Erro listando camadas: {e}")
        return []


def extrair_camada(gdb: Path, camada: str, saida: Path):
    try:
        df = pyogrio.read_dataframe(str(gdb), layer=camada, use_arrow=False)
        # Remover coluna de geometria
        if "geometry" in df.columns:
            df = df.drop(columns=["geometry"])
        df.to_csv(str(saida), index=False, encoding="utf-8")
        return len(df)
    except Exception as e:
        print(f"  [!] Erro extraindo {camada}: {e}")
        return 0


def main():
    print("=" * 65)
    print("  Conversor BDGD (.gdb) → CSV  |  pyogrio")
    print("=" * 65)

    PASTA_SAIDA.mkdir(parents=True, exist_ok=True)
    gdbs = encontrar_gdbs(PASTA_MOTOR)

    if not gdbs:
        print(f"\n  Nenhum .gdb encontrado em:\n  {PASTA_MOTOR}")
        sys.exit(1)

    print(f"\n  {len(gdbs)} arquivo(s) .gdb encontrado(s)\n")

    total_registros = 0
    convertidos = 0
    sem_ucmt = []

    for gdb in gdbs:
        print(f"[ {gdb.name} ]")
        camadas = listar_camadas(gdb)
        if not camadas:
            sem_ucmt.append(gdb.name)
            print()
            continue

        print(f"  Camadas: {camadas}")

        achou = False
        for alvo in CAMADAS_ALVO:
            if alvo in camadas:
                nome_csv = f"{gdb.stem}_{alvo}.csv"
                dest = PASTA_SAIDA / nome_csv

                if dest.exists():
                    print(f"  [=] {alvo} já convertido — pulando")
                    convertidos += 1
                    achou = True
                    continue

                print(f"  [>] Extraindo '{alvo}'...")
                n = extrair_camada(gdb, alvo, dest)
                if n > 0:
                    print(f"  [OK] {n:,} registros → {nome_csv}")
                    total_registros += n
                    convertidos += 1
                    achou = True

        if not achou:
            sem_ucmt.append(gdb.name)
            print(f"  [!] Nenhuma camada UCMT/UCAT encontrada")
        print()

    print("=" * 65)
    print(f"  CONCLUÍDO")
    print(f"  Arquivos convertidos : {convertidos}")
    print(f"  Total de registros   : {total_registros:,}")
    print(f"  CSVs em              : {PASTA_SAIDA}")
    print("=" * 65)

    if sem_ucmt:
        print(f"\n  Sem UCMT em {len(sem_ucmt)} arquivo(s):")
        for n in sem_ucmt:
            print(f"    - {n}")

    print(f"\n  Próximo passo: rode motor_prospeccao_brasil.py")
    input("\n  Enter para sair...")


if __name__ == "__main__":
    main()

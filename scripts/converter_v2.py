import pyogrio, pandas as pd, sys
from pathlib import Path

PASTA = Path(r"C:\Users\RODRIGO\Desktop\Motor de Prospecção")
SAIDA = PASTA / "BDGD_Nacional"
SAIDA.mkdir(parents=True, exist_ok=True)

ALVOS = [
    "UCMT", "UCAT", "ucmt", "ucat",
    "UC_MT", "UC_AT", "uc_mt", "uc_at",
    "UCMT_tab", "UCAT_tab", "ucmt_tab", "ucat_tab",
    "UCMT_PJ", "UCAT_PJ", "ucmt_pj", "ucat_pj",
    "UCMT_PJ_tab", "UCAT_PJ_tab",
]

# Deduplica caminhos para evitar processar o mesmo .gdb duas vezes
_todos = (p.resolve() for p in PASTA.rglob("*.gdb") if p.is_dir())
gdbs = sorted(set(_todos))
print(f"\n{len(gdbs)} arquivo(s) .gdb encontrado(s)\n")

total = 0
for gdb in gdbs:
    print(f"[ {gdb.name} ]")
    try:
        camadas = [r[0] for r in pyogrio.list_layers(str(gdb))]
        print(f"  Camadas: {camadas}")
        achou = False
        for alvo in ALVOS:
            if alvo in camadas:
                dest = SAIDA / f"{gdb.stem}_{alvo}.csv"
                if dest.exists():
                    print(f"  [=] {alvo} ja convertido")
                    achou = True
                    continue
                print(f"  [>] Extraindo {alvo}...")
                df = pyogrio.read_dataframe(str(gdb), layer=alvo)
                if "geometry" in df.columns:
                    df = df.drop(columns=["geometry"])
                df.to_csv(str(dest), index=False, encoding="utf-8")
                print(f"  [OK] {len(df):,} registros -> {dest.name}")
                total += len(df)
                achou = True
        if not achou:
            print(f"  [!] Sem UCMT/UCAT neste arquivo")
    except Exception as e:
        print(f"  [ERRO] {e}")
    print()

print(f"CONCLUIDO — {total:,} registros em {SAIDA}")

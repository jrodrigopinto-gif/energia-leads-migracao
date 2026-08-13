import zipfile
from pathlib import Path

pasta = Path(r"C:\Users\RODRIGO\Desktop\Motor de Prospecção")
zips = list(pasta.glob("*.zip"))
print(f"{len(zips)} arquivo(s) ZIP encontrado(s)\n")

for z in zips:
    print(f"Extraindo: {z.name}...")
    try:
        with zipfile.ZipFile(z) as zf:
            zf.extractall(pasta / z.stem)
        print(f"  OK -> {z.stem}/")
    except Exception as e:
        print(f"  ERRO: {e}")

print("\nConcluido!")

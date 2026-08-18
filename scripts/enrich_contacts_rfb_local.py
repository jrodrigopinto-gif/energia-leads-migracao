#!/usr/bin/env python3
"""
Igual a enrich_contacts_rfb.py, mas lê os arquivos Estabelecimentos*.zip
já baixados no seu disco em vez de baixar da internet.

Uso:
  python enrich_contacts_rfb_local.py prospect-cnpjs.csv C:\\Users\\RODRIGO\\Desktop\\ENERGIA

Só usa a biblioteca padrão do Python 3 (sem pip install).
"""
from __future__ import annotations

import csv
import io
import os
import re
import sys
import zipfile
from pathlib import Path

# Layout do arquivo "Estabelecimentos*.zip" (mesmo layout usado em
# src/lib/rfbLayout.ts) — CSV ";"-separado, sem cabeçalho, encoding latin1.
ESTABELECIMENTO_COLUMNS = [
    "cnpjBasico", "cnpjOrdem", "cnpjDv", "identificadorMatrizFilial",
    "nomeFantasia", "situacaoCadastral", "dataSituacaoCadastral",
    "motivoSituacaoCadastral", "nomeCidadeExterior", "pais",
    "dataInicioAtividade", "cnaeFiscalPrincipal", "cnaeFiscalSecundaria",
    "tipoLogradouro", "logradouro", "numero", "complemento", "bairro",
    "cep", "uf", "municipio", "ddd1", "telefone1", "ddd2", "telefone2",
    "dddFax", "fax", "correioEletronico", "situacaoEspecial",
    "dataSituacaoEspecial",
]


def load_target_cnpjs(csv_path: str) -> set[str]:
    targets: set[str] = set()
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cnpj = re.sub(r"\D", "", row.get("cnpj", ""))
            if len(cnpj) == 14:
                targets.add(cnpj)
    return targets


def process_local_zip(zip_path: Path, targets: set[str], found: dict[str, dict[str, str]]) -> None:
    print(f"  Processando {zip_path.name} ({zip_path.stat().st_size / 1_000_000:.0f} MB)...", flush=True)
    with zipfile.ZipFile(zip_path) as zf:
        for name in zf.namelist():
            with zf.open(name) as raw, io.TextIOWrapper(raw, encoding="latin-1") as text:
                count = 0
                for line in text:
                    count += 1
                    if count % 500_000 == 0:
                        print(f"    ...{count:,} linhas lidas, {len(found)}/{len(targets)} encontrados", flush=True)
                    fields = [f.strip().strip('"') for f in line.rstrip("\n").split(";")]
                    if len(fields) < len(ESTABELECIMENTO_COLUMNS):
                        continue
                    row = dict(zip(ESTABELECIMENTO_COLUMNS, fields))
                    cnpj = row["cnpjBasico"] + row["cnpjOrdem"] + row["cnpjDv"]
                    if cnpj in targets and cnpj not in found:
                        found[cnpj] = {
                            "cnpj": cnpj,
                            "ddd1": row["ddd1"],
                            "telefone1": row["telefone1"],
                            "ddd2": row["ddd2"],
                            "telefone2": row["telefone2"],
                            "email": row["correioEletronico"].lower(),
                        }


def main() -> None:
    if len(sys.argv) < 3:
        print("Uso: python enrich_contacts_rfb_local.py <prospect-cnpjs.csv> <pasta com Estabelecimentos*.zip> [saida.csv]")
        sys.exit(1)

    cnpjs_csv = sys.argv[1]
    folder = Path(sys.argv[2])
    out_csv = sys.argv[3] if len(sys.argv) > 3 else "contacts_found.csv"

    targets = load_target_cnpjs(cnpjs_csv)
    print(f"Alvo: {len(targets)} CNPJs distintos carregados de {cnpjs_csv}")

    zips = sorted(folder.glob("Estabelecimentos*.zip"))
    if not zips:
        print(f"Nenhum arquivo Estabelecimentos*.zip encontrado em {folder}")
        sys.exit(1)
    print(f"{len(zips)} arquivos encontrados em {folder}")

    found: dict[str, dict[str, str]] = {}
    for i, zip_path in enumerate(zips, start=1):
        if len(found) >= len(targets):
            print("Todos os CNPJs alvo já encontrados, parando antecipadamente.")
            break
        print(f"[{i}/{len(zips)}] {zip_path.name} — encontrados até agora: {len(found)}/{len(targets)}")
        process_local_zip(zip_path, targets, found)

    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["cnpj", "ddd1", "telefone1", "ddd2", "telefone2", "email"])
        writer.writeheader()
        for row in found.values():
            writer.writerow(row)

    print(f"Concluído: {len(found)}/{len(targets)} CNPJs com dados encontrados na RFB.")
    print(f"Saída: {out_csv}")
    print(f"Próximo passo: npm run apply:contacts -- {out_csv}")


if __name__ == "__main__":
    main()

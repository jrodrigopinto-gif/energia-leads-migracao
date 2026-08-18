#!/usr/bin/env python3
"""
Enriquece contato (telefone/e-mail) dos leads LeadVolt usando a base pública
de CNPJ da Receita Federal (Dados Abertos do CNPJ), que já traz DDD/telefone
e e-mail cadastrados por estabelecimento.

*** Rode este script na SUA máquina (ou servidor), não dentro do sandbox do
    Claude Code — o ambiente de desenvolvimento usado para construir o app
    bloqueia acesso de saída a dadosabertos.rfb.gov.br por política de rede. ***

Fluxo completo:
  1) No projeto: `npm run export:cnpjs` -> gera prospect-cnpjs.csv
  2) Aqui:       `python3 scripts/enrich_contacts_rfb.py prospect-cnpjs.csv`
                 -> gera contacts_found.csv (pode levar horas: baixa e
                    processa todos os arquivos nacionais de Estabelecimentos,
                    dezenas de GB)
  3) No projeto: `npm run apply:contacts -- contacts_found.csv`
                 -> grava telefone/e-mail em cada Prospect no banco

Só usa a biblioteca padrão do Python 3 (sem pip install).
"""
from __future__ import annotations

import csv
import io
import os
import re
import sys
import tempfile
import urllib.request
import zipfile
from html.parser import HTMLParser

RFB_BASE_URL = os.environ.get(
    "RFB_BASE_URL", "https://dadosabertos.rfb.gov.br/CNPJ/dados_abertos_cnpj"
)

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


class HrefCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            for name, value in attrs:
                if name == "href" and value:
                    self.hrefs.append(value)


def list_hrefs(url: str) -> list[str]:
    with urllib.request.urlopen(url, timeout=60) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
    parser = HrefCollector()
    parser.feed(html)
    return parser.hrefs


def discover_latest_month() -> str:
    configured = os.environ.get("RFB_MONTH")
    if configured:
        return configured
    hrefs = list_hrefs(f"{RFB_BASE_URL}/")
    months = sorted({h.strip("/") for h in hrefs if re.fullmatch(r"\d{4}-\d{2}", h.strip("/"))})
    if not months:
        raise RuntimeError("Nenhuma pasta mensal encontrada no índice da RFB")
    return months[-1]


def list_estabelecimento_zips(month: str) -> list[str]:
    hrefs = list_hrefs(f"{RFB_BASE_URL}/{month}/")
    return sorted(h for h in hrefs if re.fullmatch(r"Estabelecimentos\d*\.zip", h))


def load_target_cnpjs(csv_path: str) -> set[str]:
    targets: set[str] = set()
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cnpj = re.sub(r"\D", "", row.get("cnpj", ""))
            if len(cnpj) == 14:
                targets.add(cnpj)
    return targets


def process_zip(url: str, targets: set[str], found: dict[str, dict[str, str]]) -> None:
    print(f"  Baixando {url} ...", flush=True)
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
        tmp_path = tmp.name
        with urllib.request.urlopen(url, timeout=300) as resp:
            while True:
                chunk = resp.read(1024 * 1024)
                if not chunk:
                    break
                tmp.write(chunk)

    try:
        with zipfile.ZipFile(tmp_path) as zf:
            for name in zf.namelist():
                print(f"  Processando {name} ...", flush=True)
                with zf.open(name) as raw, io.TextIOWrapper(raw, encoding="latin-1") as text:
                    for line in text:
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
    finally:
        os.remove(tmp_path)


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/enrich_contacts_rfb.py <prospect-cnpjs.csv> [saida.csv]")
        sys.exit(1)

    cnpjs_csv = sys.argv[1]
    out_csv = sys.argv[2] if len(sys.argv) > 2 else "contacts_found.csv"

    targets = load_target_cnpjs(cnpjs_csv)
    print(f"Alvo: {len(targets)} CNPJs distintos carregados de {cnpjs_csv}")

    month = discover_latest_month()
    print(f"Mês mais recente disponível na RFB: {month}")

    zips = list_estabelecimento_zips(month)
    print(f"{len(zips)} arquivos Estabelecimentos*.zip encontrados")

    found: dict[str, dict[str, str]] = {}
    for i, zip_name in enumerate(zips, start=1):
        if len(found) >= len(targets):
            print("Todos os CNPJs alvo já encontrados, parando antecipadamente.")
            break
        print(f"[{i}/{len(zips)}] {zip_name} — encontrados até agora: {len(found)}/{len(targets)}")
        process_zip(f"{RFB_BASE_URL}/{month}/{zip_name}", targets, found)

    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["cnpj", "ddd1", "telefone1", "ddd2", "telefone2", "email"])
        writer.writeheader()
        for row in found.values():
            writer.writerow(row)

    print(f"Concluído: {len(found)}/{len(targets)} CNPJs com dados encontrados na RFB.")
    print(f"Saída: {out_csv}")
    print("Próximo passo: npm run apply:contacts -- " + out_csv)


if __name__ == "__main__":
    main()

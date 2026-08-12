#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║   BUSCA DE ARQUIVOS — Motor de Prospecção Grupo A                          ║
║   Localiza automaticamente BDGD, CCEE, CNPJ e GD no seu PC                ║
╚══════════════════════════════════════════════════════════════════════════════╝

Execute este script ANTES do motor_prospeccao_brasil.py.
Ele varre seu PC, mostra os arquivos encontrados e gera a configuração pronta.

Como rodar:
    python buscar_arquivos.py
"""

import os, sys, re
from pathlib import Path

# ── Pastas para varrer ────────────────────────────────────────────────────────
PASTAS_BUSCA = [
    Path.home() / "Desktop",
    Path.home() / "Downloads",
    Path.home() / "Documents",
    Path.home() / "OneDrive",
    Path.home() / "OneDrive" / "Desktop",
    Path.home() / "OneDrive" / "Downloads",
    Path.home() / "OneDrive" / "Documents",
    Path("C:/") / "dados_energia",
    Path("D:/"),
    Path("E:/"),
]

# ── Padrões de nome por categoria ─────────────────────────────────────────────
PADROES = {
    "BDGD_UCMT": [
        r"ucmt", r"uc.*mt", r"media.*tensao", r"mt.*uc",
        r"bdgd.*mt", r"ucmt.*bdgd",
    ],
    "BDGD_UCAT": [
        r"ucat", r"uc.*at", r"alta.*tensao", r"at.*uc",
        r"bdgd.*at", r"ucat.*bdgd",
    ],
    "CCEE": [
        r"ccee", r"migrado", r"mercado.*livre", r"perfil.*agente",
        r"lista.*perfil", r"agente.*ccee",
    ],
    "CNPJ_ESTAB": [
        r"estabelecimento", r"estab\b", r"cnpj.*estab", r"rfb.*estab",
        r"^k\d{8}", r"empresa.*estab",
    ],
    "CNPJ_EMP": [
        r"^empresa", r"cnpj.*emp", r"rfb.*emp", r"razao.*social",
    ],
    "GD_ANEEL": [
        r"gd_aneel", r"geracao.*distribuida", r"micro.*geracao",
        r"mini.*geracao", r"gd.*aneel", r"aneel.*gd",
        r"sistema.*fotovoltaico", r"solar",
    ],
}

EXTENSOES = {".csv", ".xlsx", ".xls", ".txt", ".zip"}

# ─────────────────────────────────────────────────────────────────────────────

def normalizar(nome: str) -> str:
    return nome.lower().replace(" ", "_").replace("-", "_")


def combina(nome_arq: str, padroes: list) -> bool:
    n = normalizar(nome_arq)
    for p in padroes:
        if re.search(p, n):
            return True
    return False


def varrer(pasta: Path, profundidade: int = 4) -> list:
    """Retorna lista de Paths de arquivos relevantes dentro de pasta."""
    encontrados = []
    if not pasta.exists():
        return encontrados
    try:
        for raiz, dirs, arquivos in os.walk(pasta):
            nivel = raiz.replace(str(pasta), "").count(os.sep)
            if nivel >= profundidade:
                dirs.clear()
                continue
            # Pular pastas do sistema
            dirs[:] = [d for d in dirs if d not in {
                "Windows", "System32", "Program Files", "Program Files (x86)",
                "AppData", "node_modules", ".git", "__pycache__",
            }]
            for arq in arquivos:
                if Path(arq).suffix.lower() in EXTENSOES:
                    encontrados.append(Path(raiz) / arq)
    except PermissionError:
        pass
    return encontrados


def classificar(arquivos: list) -> dict:
    resultado = {cat: [] for cat in PADROES}
    for caminho in arquivos:
        nome = caminho.name
        for cat, padroes in PADROES.items():
            if combina(nome, padroes):
                resultado[cat].append(caminho)
    return resultado


def escolher(opcoes: list, categoria: str) -> str:
    if not opcoes:
        return ""
    if len(opcoes) == 1:
        return str(opcoes[0])
    print(f"\n  Encontrei {len(opcoes)} arquivo(s) para [{categoria}] — qual usar?")
    for i, p in enumerate(opcoes, 1):
        tamanho = p.stat().st_size / (1024 * 1024)
        print(f"    [{i}] {p}  ({tamanho:.1f} MB)")
    while True:
        try:
            escolha = int(input("  Digite o número: "))
            if 1 <= escolha <= len(opcoes):
                return str(opcoes[escolha - 1])
        except (ValueError, KeyboardInterrupt):
            pass
        print("  Número inválido, tente novamente.")


def gerar_configuracao(selecionados: dict) -> str:
    def fmt(v):
        return f'r"{v}"' if v else '""  # NÃO ENCONTRADO — informe manualmente'

    bdgd_ucmt = fmt(selecionados.get("BDGD_UCMT", ""))
    bdgd_ucat = fmt(selecionados.get("BDGD_UCAT", ""))
    ccee      = fmt(selecionados.get("CCEE", ""))
    cnpj_est  = fmt(selecionados.get("CNPJ_ESTAB", ""))
    cnpj_emp  = fmt(selecionados.get("CNPJ_EMP", ""))
    gd        = fmt(selecionados.get("GD_ANEEL", ""))

    return f"""
# ════════════════════════════════════════════════════════
#  CONFIGURAÇÃO GERADA AUTOMATICAMENTE — cole no motor
# ════════════════════════════════════════════════════════

PASTA_DADOS    = ""  # não obrigatório quando caminhos completos estão abaixo

ARQUIVO_BDGD_UCMT  = {bdgd_ucmt}
ARQUIVO_BDGD_UCAT  = {bdgd_ucat}
ARQUIVO_CCEE       = {ccee}
ARQUIVO_CNPJ_ESTAB = {cnpj_est}
ARQUIVO_CNPJ_EMP   = {cnpj_emp}
ARQUIVO_GD         = {gd}

# Filtros (deixe "" para não filtrar)
FILTRO_UF          = ""   # ex: "PB" ou "SP"
FILTRO_MUNICIPIO   = ""   # ex: "Campina Grande"

# Parâmetros financeiros
TARIFA_CATIVA      = 0.82   # R$/kWh — ajuste para a distribuidora-alvo
ECONOMIA_PERCENTUAL = 0.20  # 20% de desconto esperado no ML
CONSUMO_MINIMO     = 15_000 # kWh/mês mínimo para entrar na lista
"""


def aplicar_no_motor(config_texto: str) -> None:
    motor = Path(__file__).parent / "motor_prospeccao_brasil.py"
    if not motor.exists():
        print(f"\n  [!] motor_prospeccao_brasil.py não encontrado em {motor.parent}")
        print("      Cole a configuração acima manualmente no script.")
        return

    conteudo = motor.read_text(encoding="utf-8")

    # Localizar bloco de configuração entre os dois marcadores
    inicio = conteudo.find("# ─" * 1)  # primeiro separador
    marcador_ini = "PASTA_DADOS"
    marcador_fim = "# ─────────────────────────"

    idx_ini = conteudo.find(marcador_ini)
    idx_fim = conteudo.find(marcador_fim, idx_ini)

    if idx_ini == -1 or idx_fim == -1:
        print("\n  [!] Não consegui localizar o bloco de configuração no motor.")
        print("      Cole a configuração acima manualmente.")
        return

    # Extrair apenas as linhas de variáveis da config gerada
    linhas_config = []
    for linha in config_texto.strip().splitlines():
        if linha.startswith("#") or linha.strip() == "":
            continue
        linhas_config.append(linha)

    novo_bloco = "\n".join(linhas_config) + "\n"
    novo_conteudo = (
        conteudo[:idx_ini]
        + novo_bloco
        + conteudo[idx_fim:]
    )
    motor.write_text(novo_conteudo, encoding="utf-8")
    print(f"\n  ✓ motor_prospeccao_brasil.py atualizado com os caminhos encontrados!")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("  BUSCA DE ARQUIVOS — Motor de Prospecção Grupo A")
    print("=" * 70)
    print("\n  Varrendo seu PC... (pode levar alguns segundos)\n")

    todos_arquivos = []
    for pasta in PASTAS_BUSCA:
        print(f"  Verificando: {pasta}")
        encontrados = varrer(pasta)
        todos_arquivos.extend(encontrados)

    print(f"\n  Total de arquivos relevantes encontrados: {len(todos_arquivos)}\n")

    classificados = classificar(todos_arquivos)

    # Mostrar resultado por categoria
    print("=" * 70)
    print("  RESULTADO DA BUSCA")
    print("=" * 70)

    LABELS = {
        "BDGD_UCMT":  "BDGD — Unidades Consumidoras Média Tensão (UCMT)",
        "BDGD_UCAT":  "BDGD — Unidades Consumidoras Alta Tensão  (UCAT)",
        "CCEE":       "CCEE — Migrados para o Mercado Livre",
        "CNPJ_ESTAB": "CNPJ RFB — Estabelecimentos",
        "CNPJ_EMP":   "CNPJ RFB — Empresas (Razão Social)",
        "GD_ANEEL":   "GD ANEEL — Geração Distribuída",
    }

    tem_ausente = False
    for cat, arquivos in classificados.items():
        label = LABELS[cat]
        if arquivos:
            print(f"\n  ✓ {label}")
            for a in arquivos:
                mb = a.stat().st_size / (1024 * 1024)
                print(f"      {a}  [{mb:.1f} MB]")
        else:
            print(f"\n  ✗ {label}")
            print(f"      NÃO ENCONTRADO")
            tem_ausente = True

    if tem_ausente:
        print("\n  [!] Alguns arquivos não foram localizados automaticamente.")
        print("      Verifique se estão em outra pasta ou com nome diferente.")

    # Deixar usuário selecionar quando há múltiplas opções
    print("\n" + "=" * 70)
    print("  SELEÇÃO FINAL")
    print("=" * 70)

    selecionados = {}
    for cat, arquivos in classificados.items():
        if len(arquivos) == 0:
            selecionados[cat] = ""
        elif len(arquivos) == 1:
            selecionados[cat] = str(arquivos[0])
            print(f"  [{cat}] → {arquivos[0].name}")
        else:
            selecionados[cat] = escolher(arquivos, cat)

    # Gerar configuração
    config = gerar_configuracao(selecionados)

    print("\n" + "=" * 70)
    print("  CONFIGURAÇÃO GERADA")
    print("=" * 70)
    print(config)

    # Salvar configuração em arquivo
    cfg_path = Path(__file__).parent / "configuracao_gerada.txt"
    cfg_path.write_text(config, encoding="utf-8")
    print(f"  Configuração salva em: {cfg_path}")

    # Tentar aplicar automaticamente no motor
    resp = input("\n  Aplicar configuração no motor_prospeccao_brasil.py agora? (S/N): ").strip().upper()
    if resp == "S":
        aplicar_no_motor(config)
        print("\n  Tudo pronto! Agora rode:")
        print("      python motor_prospeccao_brasil.py")
    else:
        print("\n  Ok. Cole manualmente a configuração acima no motor_prospeccao_brasil.py")

    input("\n  Pressione Enter para sair...")


if __name__ == "__main__":
    main()

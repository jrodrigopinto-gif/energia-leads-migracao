# Prompt 21 — Auditoria Arquitetural de Projeto Legado

**Categoria:** Planejamento e Analise de Codebase
**Objetivo:** Obter um diagnostico arquitetural honesto de um projeto que ja existe ha anos, apontando os principais pontos fracos estruturais, divida tecnica concentrada e acoplamentos perigosos, sem ser inutilmente generico.
**Quando usar:** Quando voce precisa decidir se vale refatorar, reescrever, ou apenas manter um projeto legado. Tambem util para priorizar trabalho de limpeza tecnica.

---

## PROMPT

```
Quero uma auditoria arquitetural honesta deste projeto. Nao quero elogios. Nao quero generalidades de livro. Quero que voce me aponte onde mora a dor real.

## Protocolo

### Etapa 1 — Reconhecimento (nao escreva analise ainda)

1. Liste a topologia ate 2 niveis.
2. Identifique: linguagem(s), framework(s), idade aproximada (git log inicial), tamanho em linhas (use `find src -name "*.ts" | xargs wc -l` ou equivalente).
3. Me diga em 5 linhas o que e o projeto.

### Etapa 2 — Os 10 arquivos "quentes"

Use git para identificar os 10 arquivos mais modificados no ultimo ano:

```
git log --since="1 year ago" --pretty=format: --name-only | sort | uniq -c | sort -rn | head -30
```

Arquivos quentes sao pistas poderosas: ou sao pontos de alta atividade legitima, ou sao pontos de dor cronica. Analise e classifique em:

- **Hotspot legitimo**: arquivo central que naturalmente recebe muita mudanca.
- **Foco de dor**: arquivo que muda sempre porque esta bagunca e cada feature precisa tocar la.

Liste cada um com classificacao e evidencia (tamanho, complexidade visual, numero de responsabilidades).

### Etapa 3 — Camadas e respeito de limites

Investigue se ha camadas definidas (UI, API, services, domain, data) e se os limites sao respeitados.

Sinais de violacao comum (procure):
- UI importando direto de data/repository
- Service importando UI
- Domain tendo conhecimento de framework
- "Utils" que fazem tudo (god module)

Para cada violacao encontrada, cite arquivo:linha e descreva a violacao.

### Etapa 4 — Deteccao de god modules

Procure arquivos com:
- > 800 linhas
- > 20 exports
- Nome generico (`utils`, `helpers`, `common`, `core`, `main`)

Liste-os. God modules sao o debito tecnico mais caro de destrincar depois.

### Etapa 5 — Ciclos de dependencia

Se o projeto tem uma ferramenta de deteccao de ciclo (madge, dep-tree), rode. Se nao tem, faca uma amostra: pegue 5 modulos principais e rastreie imports ate 2 niveis procurando ciclo. Reporte os achados.

### Etapa 6 — Testes: cobertura e confianca

1. Ha testes? Que tipo (unit, integration, e2e)?
2. Rode-os. Quanto tempo demora? Quanto falha?
3. Olhe alguns: eles testam comportamento real ou so acoplam a implementacao?
4. Me diga o nivel de confianca que voce da aos testes deste projeto (0-10).

### Etapa 7 — Padroes inconsistentes

Encontre 3 exemplos de inconsistencia relevante. Ex:
- 2 formas diferentes de fazer logging
- 2 formas diferentes de lidar com erro
- Mistura de estilos (callback + promises, este lint + aquele, commonjs + esm)

### Etapa 8 — Relatorio final

Entregue `docs/claude/AUDITORIA.md` com:

1. **Sumario em 5 bullets** — estado geral (use palavras honestas como "bagunca", "fragil", "solido mas arcaico", nao eufemismos)
2. **Pontos fortes** — 3 coisas que estao bem
3. **Pontos fracos criticos** — 5 pontos, com evidencia (arquivo:linha)
4. **Debito tecnico por impacto/esforco** — tabela 2x2 (alto impacto / baixo esforco = fazer primeiro)
5. **Recomendacao** — uma das tres:
   - Manter e patchar (se dor contida)
   - Refatorar em fases (se dor distribuida mas pagavel)
   - Reescrever (so se dor sistemica e inreversivel)
   Justifique em 5 linhas.
6. **Riscos de inacao** — o que acontece se ninguem fizer nada por 1 ano

## Regras

- Nenhuma secao generica de "boas praticas".
- Toda afirmacao precisa de evidencia (caminho:linha ou comando rodado).
- Seja direto. Eu nao vou me ofender. Vou me ofender se voce for vago.
- Portugues do Brasil.

Comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Projeto pequeno (< 20k linhas):** corte as etapas 4 e 5 se nao houver sinal de god modules.

**Projeto com dono claro que quer defender o codigo:** ainda assim, seja direto. A auditoria vale pelo que expoe.

**Projeto que voce nao conhece nada:** faca primeiro o Prompt 20 (exploracao sistematica), depois a auditoria.

---

## Dicas de uso

- Compartilhe o `AUDITORIA.md` com o time. Use como base para decisao de investimento tecnico.
- Reaplique a cada 6-12 meses. A saude de um codebase muda.
- Se a recomendacao for "reescrever", resista 2 vezes antes de aceitar. Reescrita quase sempre custa mais do que parece.

## Sinal de que deu certo

A auditoria aponta pelo menos 1 coisa que o time "sabia mas nunca foi formalizado". Vira ponto de partida real para priorizacao.

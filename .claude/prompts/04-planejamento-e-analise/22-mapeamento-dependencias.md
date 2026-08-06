# Prompt 22 — Mapeamento Completo de Dependencias

**Categoria:** Planejamento e Analise de Codebase
**Objetivo:** Produzir um inventario real das dependencias externas do projeto (nao apenas `package.json`), classificando-as por criticidade, uso real no codigo, risco e alternativas.
**Quando usar:** Antes de um upgrade grande, ao planejar reducao de superficie de ataque, ao avaliar custo de manutencao, ou simplesmente para saber o que voce tem no prato.

---

## PROMPT

```
Quero um inventario completo das dependencias externas deste projeto. Nao me de o `package.json` de volta. Me de um mapa REAL.

## Protocolo

### Etapa 1 — Inventario bruto

1. Leia `package.json` (ou equivalente).
2. Liste:
   - Total de dependencies
   - Total de devDependencies
   - Total somando
3. Ordene as dependencies por ordem alfabetica.

### Etapa 2 — Classificacao por uso real

Para CADA dependencia em `dependencies` (nao devDeps), faca Grep pelo nome do pacote no codigo. Classifique em:

- **Essencial**: usada em 10+ lugares, no caminho critico do app
- **Relevante**: usada em 3-9 lugares
- **Marginal**: usada em 1-2 lugares
- **Orfa**: nao encontrada em nenhum lugar (alerta!)

Liste cada uma com classificacao e numero de usos.

### Etapa 3 — Dependencias orfas

Para cada dependencia classificada como "orfa":

1. Confirme com grep mais amplo (pode estar em JSON, YAML, string dinamica).
2. Se ainda orfa, recomende remover.
3. Explique como testar que a remocao e segura.

### Etapa 4 — Dependencias criticas

Para as "essenciais":

1. Para cada uma, descreva em 1 linha o que ela faz no projeto.
2. Pergunte: "se essa dependencia desaparecer amanha, qual o blast radius?"
3. Liste se ha ou nao alternativa viavel (nome da alternativa se souber).

### Etapa 5 — Deteccao de redundancia

Procure por:
- Dois pacotes que fazem a mesma coisa (ex: `moment` + `dayjs`, `axios` + `node-fetch`, `lodash` + `underscore`)
- Pacotes que ja tem equivalente nativo (ex: `lodash.map` em 2026 pode ser `Array.prototype.map`)
- Polyfills obsoletos para runtimes que voce nao suporta mais

Liste os achados.

### Etapa 6 — Risco e manutencao

Para cada essencial e relevante:

1. Verifique (via WebFetch, se permitido) quando foi o ultimo release publico. Nao investigue a fundo — so uma olhada rapida.
2. Marque como:
   - **Ativa**: ultimo release < 6 meses
   - **Lenta**: ultimo release 6-18 meses
   - **Abandonada**: ultimo release > 18 meses ou repo arquivado
3. Para "abandonadas" que sejam essenciais, sinalize como risco critico.

### Etapa 7 — Superficie de ataque

Conte quantas dependencias TRANSITIVAS o projeto tem (use `npm ls --all | wc -l` ou equivalente). Compare com o numero direto. Se for 100 diretas -> 1500 transitivas, esse e o "tamanho" real da confianca externa.

### Etapa 8 — Output: DEPENDENCIAS.md

Salve em `docs/claude/DEPENDENCIAS.md` com:

1. Sumario (numeros totais)
2. Essenciais (tabela: nome | descricao | usos | status)
3. Relevantes (tabela mais curta)
4. Marginais e sugestao (deixar ou internalizar?)
5. Orfas para remover
6. Redundancias para consolidar
7. Abandonadas (risco)
8. Recomendacoes por ordem de impacto

## Regras

- Nao inclua devDependencies no inventario principal. Faca secao separada curta.
- Nao abra codigo de dependencia externa. So grep no codigo deste projeto.
- Nao sugira migracao de framework. So consolidar ou remover.

Comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Projeto Python:** substitua `package.json` por `pyproject.toml` / `requirements.txt` e use `pip list`.

**Projeto Rust:** use `cargo tree -d` para achar duplicacoes.

**Projeto Go:** use `go mod graph` para investigar dependencias transitivas.

**Projeto com muitas libs pequenas (micro-libs):** reforce a etapa 5. Projetos JS antigos tem dezenas de libs que hoje sao triviais em nativo.

---

## Dicas de uso

- Este e um exercicio que costuma encontrar 3-10% de dependencias removiveis logo na primeira rodada.
- Faca 1-2 vezes por ano. A superficie de ataque cresce por si so.
- Dependencias abandonadas sao o pior risco — priorize substituicao antes de bugs aparecerem.

## Sinal de que deu certo

Voce remove 5-20 dependencias sem quebrar nada. Seu `package.json` volta a caber no cerebro.

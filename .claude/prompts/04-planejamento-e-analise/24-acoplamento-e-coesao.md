# Prompt 24 — Analise de Acoplamento e Coesao

**Categoria:** Planejamento e Analise de Codebase
**Objetivo:** Avaliar, com criterios concretos e nao subjetivos, o grau de acoplamento entre modulos do projeto e o grau de coesao interna de cada modulo, para identificar candidatos a refatoracao onde ela rende mais.
**Quando usar:** Quando voce suspeita que o projeto esta ficando dificil de evoluir, mas nao sabe onde exatamente mora a dor. Tambem util antes de sugerir extracao de servicos ou divisao de monolito.

---

## PROMPT

```
Quero uma analise de acoplamento e coesao deste projeto com foco em identificar os 5 pontos de maior "friccao" estrutural — lugares onde uma mudanca pequena propaga muito, ou onde um modulo faz coisas demais que nao se relacionam entre si.

## Definicoes operacionais (nao subjetivas)

- **Acoplamento eferente (Ce)**: quantos OUTROS modulos este modulo IMPORTA.
- **Acoplamento aferente (Ca)**: quantos OUTROS modulos importam ESTE.
- **Instabilidade (I)** = Ce / (Ce + Ca). Vai de 0 (estavel) a 1 (instavel).
- **Coesao**: para uma pasta/modulo com N arquivos, quantos dos arquivos tem imports entre si (quanto maior, mais coeso).

## Etapas

### Etapa 1 — Lista de modulos

Defina "modulo" como:

- Em JS/TS: cada subpasta de primeiro nivel dentro de `src/` (ex: `src/auth/`, `src/billing/`).
- Em Python: cada package top-level de `src/` ou `<projeto>/`.
- Em Go: cada `package`.
- Em Rust: cada `mod` de primeiro nivel.

Liste todos.

### Etapa 2 — Matriz de dependencias

Para cada par de modulos (A, B), conte quantos arquivos em A importam de B. Produza uma tabela.

Nao precisa ser perfeita — aproximacao por grep de `import.*from '.*B'` e suficiente.

### Etapa 3 — Metricas por modulo

Para cada modulo, calcule:

- Ce (quantos modulos este importa)
- Ca (quantos importam este)
- I = Ce / (Ce + Ca)
- Tamanho (linhas de codigo)
- Coesao interna (fracao de arquivos internos que se referenciam)

Coloque em uma tabela.

### Etapa 4 — Zonas de atencao

Destaque modulos que satisfazem pelo menos 1 destes criterios:

1. **Hub instavel**: Ce alto (> 5) E Ca alto (> 5). Esse tipo de modulo mexe em tudo e tudo mexe nele. Candidato forte a ser dividido.
2. **God module**: tamanho > 2000 linhas E > 6 responsabilidades logicas (voce avalia abrindo rapidamente).
3. **Pseudo-coeso**: baixo acoplamento interno. Pasta que tem 20 arquivos e quase nenhum se refere aos outros. Geralmente significa que ali ha varios modulos grudados.
4. **Modulo fantasma**: baixo Ce e baixo Ca. Pode estar orfao (ver Prompt 23).
5. **Contagio**: modulo com > 15 aferentes. Mudar esse modulo quebra meio projeto. Candidato a estabilizar (congelar API + versionar).

Para cada zona, liste os modulos que caem nela e explique o sintoma.

### Etapa 5 — Ciclos e camadas

Identifique:

- Ciclos de importacao diretos (A importa B, B importa A)
- Ciclos indiretos (A -> B -> C -> A)
- Violacoes de camada (ex: camada "presentation" importando direto de "data")

Para cada, mostre o caminho e diga por que e problema.

### Etapa 6 — Recomendacoes

Para cada achado, proponha uma acao concreta e citavel:

- "Mover X de modulo A para modulo B porque..."
- "Quebrar modulo A em A1 (X) e A2 (Y) porque..."
- "Introduzir interface I para quebrar ciclo entre A e B"
- "Criar adaptador em modulo B para isolar API de X"

Cada recomendacao deve ter:
- Impacto (alto/medio/baixo)
- Esforco (baixo/medio/alto)
- Risco (baixo/medio/alto)

### Etapa 7 — Output

Entregue `docs/claude/ACOPLAMENTO.md` com:

1. Matriz de dependencias
2. Tabela de metricas por modulo
3. Zonas de atencao
4. Ciclos
5. Top 5 recomendacoes (impacto alto, esforco baixo primeiro)

## Regras

- Nao fale em termos vagos. Se diz "acoplado demais", diga *quanto* e *com quem*.
- Nao sugira mudancas fora do escopo (ex: "migrar para outra linguagem").
- Priorize recomendacoes que nao quebrem a API publica.

Comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Projeto pequeno (< 10 modulos):** pule a matriz completa e va direto para as zonas de atencao. Matriz de 3x3 nao rende insight.

**Projeto com DI (injecao de dependencia):** analise acoplamento pelas interfaces, nao pelas implementacoes.

**Projeto com eventos:** acoplamento por eventos e mais sutil. Grep por nomes de eventos emitidos e escutados.

---

## Dicas de uso

- Use o resultado para priorizar refatoracoes onde ela rende mais.
- Revisite anualmente. O acoplamento tende a crescer por entropia.
- Nao tente resolver tudo de uma vez. Pegue a pior zona, resolva, reavalie.

## Sinal de que deu certo

Voce consegue apontar, com evidencia numerica, os 3 lugares do codigo onde vale investir em refactor. Sai da conversa subjetiva ("isso aqui ta feio") para decisao baseada em metricas.

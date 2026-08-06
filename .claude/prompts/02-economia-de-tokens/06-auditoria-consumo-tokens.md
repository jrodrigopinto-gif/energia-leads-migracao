# Prompt 06 — Auditoria de Consumo de Tokens do Projeto

**Categoria:** Economia Inteligente de Tokens
**Objetivo:** Fazer o Claude olhar seu projeto com olhos de auditor de custo, identificar o que infla o contexto em cada sessao, e propor 5 mudancas concretas que reduzam consumo sem perder qualidade.
**Quando usar:** Quando voce percebe que suas sessoes estao ficando caras, a barra de contexto enche rapido, ou voce comeca a ter compactacao automatica com frequencia.

---

## Por que este prompt existe

Muita gente culpa o Claude por "ser caro" sem perceber que e o proprio projeto que esta empurrando coisa desnecessaria para dentro do contexto: `CLAUDE.md` gigante, arquivos imensos que deveriam estar modularizados, schemas tipo `.d.ts` com 20 mil linhas que aparecem em toda sessao, logs acumulados, dumps no repo.

Este prompt transforma o Claude em um auditor de custo — ele olha o projeto como um forense e aponta os pontos de "peso morto" que voce carrega sem ganho.

---

## PROMPT

```
Voce vai fazer uma auditoria de consumo de tokens deste projeto, como se eu estivesse pagando uma consultoria para reduzir meu custo mensal com Claude Code em 30-50%.

Siga este protocolo:

## Etapa 1 — Contexto Automatico

1. Leia o `CLAUDE.md`. Me diga: quantas linhas, quantos caracteres, e estime os tokens (1 token ~= 4 caracteres em portugues).
2. Liste arquivos na raiz que podem ser carregados automaticamente (README, docs, etc).
3. Identifique o conteudo que TODA sessao carrega sem voce perceber.

## Etapa 2 — Arquivos Pesados

Rode esta investigacao:

1. Liste os 20 arquivos de codigo (nao binarios) com mais linhas no projeto.
2. Classifique cada um como:
   - **Saudavel**: arquivo grande mas coeso (ex: tipos gerados, schema consolidado).
   - **Bomba**: arquivo grande por ser monolito que deveria estar dividido.
   - **Entulho**: arquivo grande por ser dump, log, fixture gigante, ou snapshot sem valor.

3. Para cada "bomba", sugira uma divisao concreta (qual parte sai para qual arquivo).
4. Para cada "entulho", sugira mover para fora do repo, para `.gitignore`, ou para `docs/archive/`.

## Etapa 3 — Arquivos Gerados no Git

1. Procure por sinais de arquivos gerados commitados: `*.d.ts` gigantes, `generated/`, `dist/`, `build/`, `*.pb.go`, snapshots enormes.
2. Para cada um, verifique se esta em `.gitignore`. Se nao esta, avalie se faz sentido estar.
3. Se faz sentido commitar, avalie se faz sentido estar "visivel" para o Claude — pode adicionar ao `.claude/ignore` (se suportado) ou documentar no CLAUDE.md que o Claude nao deve abrir.

## Etapa 4 — Dump no Repo

Procure por padroes de "dump":

- Arquivos JSON/CSV > 1MB no repo
- Arquivos `.log`, `.sql` gigantes
- Fixtures de teste com centenas de milhares de linhas
- Exports acidentais

Liste os encontrados com tamanho e sugestao (ignorar, mover, descartar).

## Etapa 5 — CLAUDE.md

Abra o `CLAUDE.md`. Avalie:

- Linhas obvias que poderiam ser inferidas do codigo (remova)
- Repetidas informacoes da stack ja visiveis em package.json (remova)
- Secoes com "TODO preencher" (remova)
- Paragrafos longos que poderiam virar listas de 1 linha (reescreva)

Proponha uma versao enxuta com menos linhas, mantendo 100% do valor.

## Etapa 6 — Relatorio Final

Entregue um relatorio com:

1. **Top 5 maiores ganhos** (ordenados por impacto estimado em tokens poupados por sessao).
2. Para cada ganho: acao concreta + estimativa de tokens economizados + esforco (baixo/medio/alto).
3. **Ganho total estimado** se todas as acoes forem implementadas.

## Regras

- Nao sugira "use um modelo mais barato". O foco e o contexto.
- Nao sugira quebrar o projeto ou reescrever codigo por performance. Foco em peso morto, nao em refactor.
- Nada de sugestao generica como "escreva prompts melhores". Seja concreto sobre arquivos e pastas.
- Portugues do Brasil.
```

---

## Variacoes e Ajustes

**Projeto com poucos arquivos grandes mas muitos pequenos:** adicione *"Verifique tambem numero total de arquivos — projetos com 10 mil arquivos de 20 linhas cada tambem pesam em exploracao."*

**Projeto TypeScript com `.d.ts` gerados:** peca para o Claude avaliar se os tipos gerados podem ser movidos para fora da area de busca padrao.

**Projeto com muitos testes e snapshots:** peca auditoria especifica em `__snapshots__/` — snapshots gigantes sao tokens invisiveis.

---

## Dicas de uso

- Aplique as mudancas em ordem de impacto. A primeira implementacao ja costuma render 30-40% de economia.
- Reaplique este prompt a cada 3 meses. Projetos acumulam entulho naturalmente.
- Mantenha uma regra pessoal: se precisar abrir um arquivo > 1500 linhas repetidamente, ele esta grande demais.

## Sinal de que deu certo

Suas proximas 5 sessoes consomem sensivelmente menos contexto para tarefas equivalentes. A barra de "tokens usados" sobe mais devagar.

# Prompt 31 — Commit Messages Semanticamente Corretas

**Categoria:** Git, Commits e Colaboracao
**Objetivo:** Gerar mensagens de commit que descrevem o PORQUE e a mudanca real, seguindo Conventional Commits (ou o padrao do projeto), e que nao sejam commit messages inuteis tipo "fix" ou "update code".
**Quando usar:** Toda vez que voce for commitar algo significativo. Especialmente em time, onde a mensagem vira parte do blame futuro.

---

## PROMPT

```
Quero gerar uma commit message de qualidade para o estado atual do git. Nao quero "wip" ou "fix stuff".

## Protocolo

### Passo 1 — Investigar

Rode em paralelo (ou sequencia):

1. `git status` — ver arquivos modificados/staged
2. `git diff --staged` — se ha coisas staged, olhe primeiro
3. `git diff` — para nao staged, se nao houver staged
4. `git log --oneline -10` — para ver o padrao de commit do projeto

### Passo 2 — Detectar padrao do projeto

Baseado nos ultimos 10 commits, identifique:

- O projeto usa Conventional Commits (`feat:`, `fix:`, `chore:`)?
- O projeto usa gitmoji (`✨`, `🐛`)?
- O projeto usa prefixo de issue (`JIRA-123`)?
- O projeto usa ingles ou portugues?
- O projeto usa titulo curto ou titulo + body?

Adote o padrao existente. NUNCA imponha um novo.

### Passo 3 — Analisar a mudanca

Agrupe o diff por "tema". Se ha mudancas heterogeneas que deveriam ser commits separados, pare e me avise: "detectei N temas diferentes, sugiro dividir em N commits. Quer que eu proponha a divisao?"

Para cada tema (ou para o tema unico):

- Qual a intencao? (feat/fix/refactor/chore/docs/test/perf/style)
- Qual o escopo? (area afetada)
- O que MUDOU em termos de comportamento ou estrutura?
- POR QUE mudou? (tente inferir do diff; se nao conseguir, pergunta-me)

### Passo 4 — Redigir

Use este formato base (adaptando ao padrao do projeto):

```
<tipo>(<escopo>): <titulo curto em imperativo, < 72 chars>

<corpo opcional, explicando o POR QUE, nao o o que>
<2-5 linhas>

<footer opcional: refs, breaking changes>
```

Regras para o titulo:
- Imperativo ("adiciona", nao "adicionado" — ou "add", nao "added")
- Minusculo (exceto nomes proprios)
- Sem ponto final
- Nunca "update" sozinho. Sempre especifique o que foi updated.

Regras para o corpo:
- Nao repita o titulo com outras palavras.
- Foque em POR QUE a mudanca era necessaria, nao O QUE mudou (o diff ja mostra).
- Cite ticket/issue se relevante.
- Mencione breaking change em footer com "BREAKING CHANGE:"

### Passo 5 — Mostrar antes de commitar

Apresente a mensagem proposta. NAO execute `git commit` sem minha aprovacao.

Se eu aprovar, execute:

```
git commit -m "$(cat <<'EOF'
<mensagem>
EOF
)"
```

Use HEREDOC para preservar quebras de linha.

### Passo 6 — Verificar

Apos commitar, rode `git log -1` para mostrar que ficou bem.

## Regras rigidas

- NAO execute `git add -A` / `git add .` sem me dizer o que esta sendo staged.
- NAO commit com `--no-verify`.
- NAO amend commits existentes.
- NAO commit arquivos que pareca com secret (`.env`, chaves, tokens) — pare e avise.
- NAO invente um "por que" que voce nao sabe. Pergunte.

## Comeca

[Opcional: cole o contexto da mudanca, issue, ou deixe vazio para eu explicar quando Claude perguntar.]
```

---

## Variacoes e Ajustes

**Multi-commit (voce fez muita coisa e quer dividir):** peca *"analise a diff e proponha dividir em N commits coerentes, cada um com mensagem propria e lista de arquivos."*

**Commit de merge/revert:** o Claude deve usar mensagem automatica do git para merge/revert, e adicionar uma linha explicativa ao final, nao reescrever.

**Projeto com hook de commit (commitlint):** peca para respeitar regex do commitlint do projeto. Voce pode colar o `.commitlintrc` no comeco.

---

## Dicas de uso

- Bom commit message = melhor `git log`. Melhor git log = debug mais rapido no futuro. Vale o investimento.
- Nao aceite "atualiza arquivo X" como mensagem. Pergunte "o que ele FAZ agora que nao fazia antes?"
- Se voce commitou errado, use `git commit --amend` apenas em commits LOCAIS, nunca depois de push.

## Sinal de que deu certo

3 meses depois, voce ou outra pessoa consegue ler `git log --oneline` e entender a evolucao do projeto sem precisar abrir codigo.

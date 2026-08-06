# Prompt 35 — Investigacao Profunda via git log e git blame

**Categoria:** Git, Commits e Colaboracao
**Objetivo:** Usar o git como ferramenta de arqueologia — descobrir quem fez, quando, por que, e em que contexto, uma linha/bloco/decisao que hoje parece esquisita no codigo.
**Quando usar:** Quando voce olha um codigo e pensa "por que isso e assim?" — antes de sair refatorando, descubra a historia. Tambem util para debugar regressoes e entender decisoes antigas.

---

## PROMPT

```
Quero investigar a historia de um trecho/arquivo/decisao especifica usando git. O objetivo e entender o CONTEXTO original antes de tocar.

## Alvo da investigacao

[Descreva: arquivo, funcao, linha(s), ou "essa decisao de arquitetura"]

## Protocolo

### Etapa 1 — Quando foi criado

Rode (substituindo pelo alvo):

```
git log --diff-filter=A -- <arquivo>          # primeiro commit que adicionou o arquivo
git log --follow --oneline -- <arquivo>       # historia inteira do arquivo
```

Me diga:
- Quando foi criado (commit + data)
- Quem criou
- Qual a mensagem do commit original
- Quantos commits tocaram o arquivo desde entao

### Etapa 2 — Quem tocou recentemente

```
git log -15 --pretty=format:'%h %ad %an — %s' --date=short -- <arquivo>
```

Lista os 15 commits mais recentes. Liste com autor, data e mensagem. Identifique: mudancas triviais (rename, style) vs mudancas substantivas.

### Etapa 3 — git blame da linha/bloco especifico

```
git blame -L <start>,<end> <arquivo>
```

Me mostre quem adicionou cada linha do bloco. Para cada commit unico:

- Hash
- Autor
- Data
- Mensagem

### Etapa 4 — Ler os commits-chave

Para os 2-3 commits que parecem importantes (da Etapa 3):

```
git show <hash>
```

Leia a mensagem completa e o diff do commit. Me diga:

- Qual era a intencao da mudanca?
- Quais outros arquivos foram tocados juntos? (pistas do contexto)
- Ha referencia a issue/PR?

### Etapa 5 — Pickaxe (procurar por texto especifico)

Se voce esta investigando uma string, constante ou nome de funcao que apareceu/sumiu:

```
git log -S '<texto>' --all --oneline
```

Isso encontra os commits que ADICIONARAM ou REMOVERAM aquele texto. Extremamente util para achar "quem removeu X" ou "quando surgiu Y".

### Etapa 6 — Procurar ocorrencias da mudanca em outros arquivos

Se o commit-chave tocou outros arquivos, e util ver:

```
git show --stat <hash>
```

Lista arquivos afetados. Da para entender se foi uma refatoracao grande, uma feature, ou ajuste pontual.

### Etapa 7 — Contexto de PR (se disponivel)

Se o repo usa GitHub/GitLab e voce tem `gh` / `glab`:

```
gh pr list --search '<hash>'      # achar PR que incluiu esse commit
gh pr view <numero> --comments    # ler discussao do PR
```

PRs frequentemente tem contexto que o commit sozinho nao tem.

### Etapa 8 — Sumario

Entregue um resumo de arqueologia:

1. **O trecho**: o que e, onde esta
2. **Origem**: quando, quem, por que (baseado no commit)
3. **Evolucao**: principais mudancas desde a origem
4. **Ultimo tocou**: quem e quando
5. **Contexto de PR**: se houver, resumo da discussao
6. **Hipotese sobre o motivo de estar assim**: com nivel de confianca (alta/media/baixa)
7. **Pontos nao esclarecidos**: o que a historia nao explica

## Regras

- Use apenas comandos de leitura do git. Nao reescreva nada.
- Se um commit tem mensagem inutil ("fix", "wip"), tente inferir do diff e dos arquivos tocados.
- Nao culpe pessoas. "Quem" e contexto, nao acusacao.
- Se voce nao encontrar o que procurava, diga claramente — nao invente conclusao.

## Comeca

Execute Etapa 1 e me apresente o que achou.
```

---

## Variacoes e Ajustes

**Investigacao de regressao:** adicione `git bisect` no fluxo — ache o commit que introduziu o bug por busca binaria.

**Investigacao de linha unica:** reduza para Etapa 3 e 4, so blame + show do commit.

**Investigacao em fork/codigo espelhado:** considere que a historia original pode estar em outro repo. Diga ao Claude qual e o repo upstream.

---

## Dicas de uso

- `git log -S` (pickaxe) e sub-utilizado. Aprenda a usar.
- Quando achar a resposta ("ah, isso foi adicionado por causa de X"), adicione um comentario no codigo se for util para quem vier depois. Ou um entry em `docs/claude/decisoes.md`.
- Arqueologia antes de refactor evita "desfazer sem querer uma decisao deliberada".

## Sinal de que deu certo

Voce evita refatorar algo que tinha contexto importante, ou descobre que algo pode sim ser removido porque a razao original nao existe mais.

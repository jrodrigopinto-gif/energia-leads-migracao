# Prompt 34 — Rebase (e Reescrita de Historia) sem Perder Trabalho

**Categoria:** Git, Commits e Colaboracao
**Objetivo:** Executar operacoes de reescrita de historia git — squash, reorder, split, fixup — com seguranca, sem perder commits, sem forcar push em main, e sem deixar voce pelado caso algo de errado.
**Quando usar:** Ao limpar historico de branch antes de merge, quando a branch ficou feia com commits tipo "wip", "fix lint", "more fixes".

---

## Importante

O Claude Code nao executa `git rebase -i` (precisa de TTY). Este prompt te guia a REESCRITA DE HISTORIA usando ferramentas nao interativas equivalentes: `git commit --fixup`, `git rebase --autosquash`, `git reset --soft`, `git cherry-pick`. Tudo seguro.

---

## PROMPT

```
Quero reescrever a historia desta branch. Use ferramentas nao interativas (sem `rebase -i`). Siga o protocolo.

## Protocolo

### Passo 1 — Diagnostico

```
git log --oneline -30
git status
git branch --show-current
```

Me diga:
- Quantos commits estao na branch acima do main
- Quais commits parecem ser "sujeira" (wip, fix typo, ajustes)
- Qual a intencao de limpeza: squash tudo? manter alguns? reordenar?

### Passo 2 — BACKUP obrigatorio

Antes de qualquer reescrita, crie uma branch de backup:

```
git branch backup/<nome-branch-atual>-<timestamp>
```

Me mostre que a branch de backup foi criada. Se algo der errado, voltamos com `git reset --hard backup/...`.

### Passo 3 — Propor plano

Dado o diagnostico, proponha um plano de reescrita. Opcoes comuns:

#### Opcao A — Squash tudo em 1 commit
- Simples: `git reset --soft <base>` + `git commit -m "<nova mensagem>"`
- Bom quando a branch inteira e uma unidade logica

#### Opcao B — Squash em grupos
- Complexo: usamos `git reset --soft <base>` + commits parciais `git add <arquivos>` + `git commit`
- Bom quando a branch faz 2-3 coisas relacionadas mas separaveis

#### Opcao C — Manter ordem mas juntar fixups
- `git commit --fixup=<hash>` + `git rebase --autosquash <base>`
- Bom quando ha commits de "fix typo" que pertencem a commits anteriores

#### Opcao D — Reordenar
- Usar cherry-pick em nova branch
- Bom quando a ordem dos commits ficou invertida

Me mostre o plano e aguarde minha aprovacao.

### Passo 4 — Executar com seguranca

Apos aprovacao, execute. Apos CADA passo:

- `git log --oneline -5` para ver o estado
- Me mostre o que aconteceu
- Se algo parece errado, PARE e me diga

### Passo 5 — Verificacao

Apos reescrita:

1. `git log --oneline -20` — historia limpa?
2. `git diff backup/<branch>..HEAD` — ZERO diferenca no conteudo final? Se sim, a reescrita preservou o resultado.
3. `git status` — limpo?
4. Rode build e testes para confirmar que nada quebrou.

Se o diff contra backup nao e vazio, ALGO foi perdido. PARE e restaure do backup.

### Passo 6 — Push

Se a branch ja estava pushada, voce vai precisar fazer force push. Regras:

- NUNCA force push em `main`, `master`, `production`, `release/*`.
- Use `--force-with-lease` (nao `--force`): `git push --force-with-lease origin <branch>`.
- Antes, confirme comigo que posso fazer force push.

### Passo 7 — Se algo der errado

Reverta:

```
git reset --hard backup/<nome>
```

A branch de backup salva voce.

## Regras rigidas

- Branch de backup SEMPRE, antes de qualquer reescrita.
- NUNCA `rebase -i` (voce nao tem TTY).
- NUNCA force push sem `--force-with-lease` e sem confirmacao.
- NUNCA force push em branches protegidas.
- Se a reescrita envolve commits ja mergeados, PARE e avise que isso e MUITO perigoso.

## Comeca

Rode o diagnostico.
```

---

## Variacoes e Ajustes

**Apenas limpar mensagens sem mudar conteudo:** prefira `git commit --amend` em commit local, ou `git rebase --autosquash` com commits fixup.

**Squash final antes de merge:** se o GitHub/GitLab suporta "squash and merge" no PR, use ESSA opcao em vez de reescrever localmente. Mais seguro.

**Dividir um commit:** use `git reset HEAD~1` (mantem as mudancas) + `git add -p` + commits incrementais.

---

## Dicas de uso

- Regra de ouro: nunca reescreva historia que ja foi consumida por outros (merge em main, outros devs pullaram). Reescreva so em SUAS branches.
- `--force-with-lease` e seu amigo. `--force` e seu inimigo.
- Quando em duvida, nao reescreva. Um historico feio mas correto e melhor que um historico limpo mas corrompido.

## Sinal de que deu certo

A historia final da branch e limpa, os testes passam, `git diff backup..HEAD` e vazio, o backup ficou como seguro. Voce nao perdeu nada.

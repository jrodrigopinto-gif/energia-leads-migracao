# Prompt 32 — PR Descriptions que Facilitam Review

**Categoria:** Git, Commits e Colaboracao
**Objetivo:** Gerar descricao de PR (pull request) que torna o review 5x mais rapido — contexto, resumo, decisoes, testes, checklists, screenshots quando relevante.
**Quando usar:** Ao abrir qualquer PR nao trivial. Tambem util para reescrever PR description ruim de PR existente.

---

## PROMPT

```
Quero criar a descricao de PR para esta branch. Quero que facilite a vida do revisor, nao que seja burocracia.

## Protocolo

### Passo 1 — Investigar

Execute em paralelo:

1. `git status` — arquivos modificados
2. `git diff <base>...HEAD` — onde `<base>` e a branch padrao (main, master, develop). Descubra a base com `git symbolic-ref refs/remotes/origin/HEAD` ou pergunte.
3. `git log <base>..HEAD --oneline` — lista de commits da branch
4. `git log <base>..HEAD --stat` — arquivos e linhas por commit

### Passo 2 — Detectar template

Verifique se existe `.github/PULL_REQUEST_TEMPLATE.md` ou equivalente em `.gitlab/`, `.bitbucket/`. Se existir, siga a estrutura do template.

Se nao existir, use a estrutura padrao abaixo.

### Passo 3 — Redigir

Estrutura padrao:

```
## Contexto
<1-3 linhas explicando POR QUE este PR existe. O problema/necessidade de negocio ou tecnica.>

## Resumo das mudancas
- <bullet 1: mudanca principal, em linguagem de alto nivel>
- <bullet 2>
- <bullet 3>

## Como testar
1. <passo 1>
2. <passo 2>
3. <resultado esperado>

## Decisoes e trade-offs
- **Decisao X**: escolhi A em vez de B porque <razao curta>.
- **Alternativa nao escolhida**: considerei fazer C, mas <razao>.

## Impacto
- **Breaking change?** Sim/Nao. Se sim: <detalhes + migracao>.
- **Performance:** <algum impacto medido ou estimado?>
- **Deploy:** <algum passo especial? migracao? feature flag?>

## Screenshots / Output
<se for UI, screenshots antes/depois. Se CLI/API, exemplo de output.>

## Checklist do autor
- [ ] Testes adicionados/atualizados
- [ ] Lint passa
- [ ] Typecheck passa
- [ ] Build passa
- [ ] Documentacao atualizada (se aplicavel)
- [ ] Nao quebra API publica (ou documentado no breaking change)

## Referencias
- Issue: #XXX
- Relacionado a: #YYY
```

### Passo 4 — Preencher cada secao com base no diff REAL

- **Contexto**: olhe nome da branch, titulo do ultimo commit e diff. Infira. Se nao ficar claro, pergunte.
- **Resumo**: agrupe por tema, nao por arquivo.
- **Como testar**: se ha testes automatizados, "rode `npm test`". Se ha teste manual necessario (UI, fluxo), passos reais.
- **Decisoes**: so escreva esta secao se ha decisao nao obvia. Se tudo foi linear, remova.
- **Impacto**: honestidade. Se ha breaking change, DIGA.
- **Screenshots**: se for mudanca visual, peca a mim.

### Passo 5 — Criar PR

Apos eu aprovar a descricao, crie o PR via `gh pr create` usando HEREDOC:

```
gh pr create --title "<titulo conciso>" --body "$(cat <<'EOF'
<conteudo>
EOF
)"
```

Regra para o titulo:
- Conciso, < 72 caracteres
- Em imperativo
- Pode ter prefixo tipo `[area]` se o projeto usa

Antes, rode `git push -u origin <branch>` se a branch ainda nao esta no remoto. Avise antes de executar o push.

## Regras

- NAO faca `git push` sem me avisar.
- NAO crie PR contra branch errada. Sempre pergunte qual a base se nao for obvia.
- NAO abra PR se voce ve que ha coisa grande faltando (teste, lint quebrando). Avise primeiro.
- NAO inclua "gerado por IA" na descricao — nao e relevante para o revisor.
- Se o diff e muito grande (> 800 linhas), sugira dividir em PRs menores antes.

## Comeca

[Opcional: descreva o PR ou deixe Claude deduzir do diff.]
```

---

## Variacoes e Ajustes

**PR pequeno (< 50 linhas):** use descricao mais curta — contexto + resumo + como testar, so.

**PR de refactor:** adicione secao "O que ficou igual" para tranquilizar o revisor de que nao ha mudanca comportamental.

**PR de hotfix:** adicione prioridade e link para incidente. Peca review expresso.

---

## Dicas de uso

- PR description boa = review rapido. PR description ruim = review demora semanas.
- Nao seja prolixo. Revisores escaneiam, nao leem.
- Use bullets. Blocos de texto longos sao desencorajadores.

## Sinal de que deu certo

Revisores respondem mais rapido e fazem perguntas de substancia, nao de contexto.

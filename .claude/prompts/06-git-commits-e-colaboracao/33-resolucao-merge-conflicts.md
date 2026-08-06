# Prompt 33 — Resolucao Segura de Conflitos de Merge

**Categoria:** Git, Commits e Colaboracao
**Objetivo:** Resolver conflitos de merge/rebase entendendo a INTENCAO de cada lado antes de escolher, sem "aceitar tudo da esquerda" ou "aceitar tudo da direita" no escuro.
**Quando usar:** Toda vez que um merge ou rebase gera conflito. Especialmente em conflitos em multiplos arquivos ou em logica nao trivial.

---

## PROMPT

```
Preciso resolver conflitos de merge nesta branch. Siga o protocolo abaixo. NUNCA resolva conflito "no automatico" sem entender os dois lados.

## Protocolo

### Etapa 1 — Inventario de conflitos

Execute:

```
git status
git diff --name-only --diff-filter=U
```

Liste todos os arquivos conflitados. Para cada um:

- Caminho
- Quantidade de regioes conflitadas (grep por `<<<<<<<`)

### Etapa 2 — Entender as duas bases

Antes de tocar nos arquivos, rode:

```
git log --oneline <branch1>..HEAD       # commits exclusivos de HEAD
git log --oneline HEAD..<branch1>       # commits exclusivos da outra branch
```

Me diga em 3-5 linhas: o que esta acontecendo. Qual dos lados introduziu a mudanca que conflita?

### Etapa 3 — Arquivo por arquivo, regiao por regiao

Para cada arquivo conflitado, abra-o e identifique cada regiao `<<<<<<<` ... `=======` ... `>>>>>>>`.

Para CADA regiao, siga este sub-protocolo:

#### Sub-passo 3.1 — Ler as tres versoes

- **HEAD (ours)**: o que esta na branch atual
- **Other (theirs)**: o que vem da outra branch
- **Base**: o ancestral comum. Use `git show :1:<arquivo>` ou `git merge-base` para ver.

Entender a base e CRITICO. Sem a base, voce nao sabe quem mudou o que.

#### Sub-passo 3.2 — Classificar a natureza do conflito

- **Ambos adicionaram algo diferente no mesmo lugar**
- **Ambos modificaram a mesma linha de forma diferente**
- **Um removeu e o outro modificou**
- **Um movimentou e o outro editou**

Cada tipo tem estrategia propria.

#### Sub-passo 3.3 — Entender a INTENCAO de cada lado

Olhe os commits relacionados:

- O que o commit do HEAD estava tentando fazer quando tocou essa linha?
- O que o commit do other estava tentando fazer?

Se as duas intencoes podem coexistir, combine.
Se sao conflitantes (um desfaz o outro), tem que escolher ou fazer uma terceira versao.

#### Sub-passo 3.4 — Propor resolucao

Para cada regiao, me mostre:

- O que HEAD tem (cite)
- O que other tem (cite)
- Qual a intencao de cada (1 linha cada)
- Sua proposta de resolucao (pode ser HEAD, other, combine, ou terceira via)
- Justificativa (1 linha)

Aguarde minha aprovacao ANTES de aplicar.

#### Sub-passo 3.5 — Aplicar

Ao aplicar, remova TODOS os marcadores `<<<<<<<`, `=======`, `>>>>>>>`. Se sobrou algum, o arquivo esta quebrado.

### Etapa 4 — Verificacao apos resolucao de cada arquivo

Para cada arquivo resolvido:

1. Rode linter no arquivo (`eslint <arquivo>`, `ruff check <arquivo>`, etc).
2. Rode typecheck no projeto (`tsc --noEmit`).
3. Rode testes relevantes ao arquivo.

Se algo quebra, a resolucao esta errada. Volte.

### Etapa 5 — Verificacao global

Apos todos os arquivos resolvidos:

1. `git status` — nenhum arquivo em estado de conflito
2. `git diff --check` — sem marcadores sobrando
3. Rode suite de testes completa
4. Rode build completo

### Etapa 6 — Finalizar

Apos tudo verde:

```
git add <arquivos resolvidos>
```

E entao, dependendo do caso:

- Se era merge: commite com a mensagem padrao do merge
- Se era rebase: `git rebase --continue`
- Se era cherry-pick: `git cherry-pick --continue`

Eu te aviso qual.

## Regras rigidas

- NUNCA resolva conflito com "accept theirs" ou "accept ours" cegamente.
- NUNCA rode `git reset --hard` para escapar de um conflito sem me avisar e explicar o impacto.
- NUNCA use `git checkout --theirs .` sem me mostrar o que esta perdendo.
- Se o conflito e muito complexo ou voce nao entende, PARE e pergunte.
- Se durante a resolucao voce notar que um dos lados parece estar desfazendo trabalho do outro, ALERTE ANTES de continuar.

## Comeca

Rode Etapa 1 e me apresente o inventario.
```

---

## Variacoes e Ajustes

**Conflito em arquivo binario:** Claude nao consegue resolver. Deixe claro: "arquivo binario, resolva manualmente."

**Conflito em lockfile (package-lock, pnpm-lock):** nao tente editar manualmente. O correto e: aceitar um lado, rodar `npm install` / `pnpm install` para regenerar.

**Conflito em migracao:** perigoso. Nunca faca merge automatico. Regra: crie NOVA migracao em vez de mergear duas existentes.

---

## Dicas de uso

- Se voce esta em pressao de tempo, nao pule passos. Conflito mal resolvido vira bug silencioso.
- Commitar resolucao em commit separado facilita reverter se der errado.
- Conflito grande = sinal de que a branch ficou fora do main por tempo demais. Integre mais frequentemente.

## Sinal de que deu certo

Apos o merge, tudo que funcionava antes continua funcionando. Nenhum "perdemos X" descoberto uma semana depois.

# Prompt 10 — Reducao de Ruido em Tool Results

**Categoria:** Economia Inteligente de Tokens
**Objetivo:** Fazer comandos Bash, builds, testes e outros outputs volumosos retornarem apenas o que importa, de forma que o Claude nao encha o contexto com stack traces gigantes, logs de npm, ou 10 mil linhas de build do webpack.
**Quando usar:** Em projetos onde rodar teste/build gera muito output mesmo em sucesso, ou onde erros vem acompanhados de centenas de linhas irrelevantes.

---

## Por que este prompt existe

Um simples `npm test` pode jogar 8 mil linhas no contexto mesmo quando tudo passa. Um `npm run build` do webpack pode retornar 3 mil linhas de progresso. Isso e tudo "ruido": o Claude nao ganha nada com isso, voce paga pelos tokens.

A boa noticia: voce pode filtrar o ruido antes mesmo de ele chegar ao contexto, usando flags de verbosidade baixa, grep no comando, ou capturando saida em arquivo.

---

## PROMPT

```
Nesta sessao, eu quero reduzir o ruido nos resultados das ferramentas, especialmente Bash. Adote a politica abaixo.

## Regras de execucao de comandos

### Regra 1 — Prefira flags silenciosas

Sempre que um comando tiver modo silencioso, use:

- `npm test -- --silent`
- `npm run build 2>&1 | tail -40`
- `pnpm lint --quiet`
- `pytest -q` (quiet) ou `pytest --tb=short`
- `cargo test 2>&1 | tail -60`
- `go test ./... 2>&1 | tail -40`

### Regra 2 — Cap no tamanho do output

Para qualquer comando que possa retornar mais de 200 linhas, adicione `| tail -40` ou `| head -40` conforme o caso. Se o resultado cortado deixar duvida, eu pergunto e voce roda de novo com mais linhas.

### Regra 3 — Filtrar por padrao util

Se voce esta procurando algo especifico no output, filtre direto:

- Erros: `2>&1 | grep -E "error|Error|FAIL" -A 5`
- Warnings relevantes: `... | grep -v "warning: unused" | head -30`
- Apenas o primeiro erro: `... 2>&1 | grep -m1 -A 20 "error"`

### Regra 4 — Builds verbosos

Para comandos que fazem build e costumam cuspir progresso, redirecione para arquivo e leia apenas final/erros:

```
npm run build > /tmp/build.log 2>&1; tail -60 /tmp/build.log
```

Ou, se der erro, leia apenas a secao de erro:

```
grep -m1 -B2 -A20 "error" /tmp/build.log
```

### Regra 5 — Nunca rode watch ou servidores em modo bloqueante

Nao rode `npm run dev`, `npm start`, `webpack --watch` em primeiro plano. Se precisar subir um servidor, rode em background (`run_in_background: true`) e leia o output de forma estruturada.

### Regra 6 — `find`, `ls`, listagens

Nao use `find` com output grande. Se precisa encontrar arquivos, use Glob. Se precisa listar, use Glob com padrao. Nunca `ls -R`.

### Regra 7 — Paginacao manual

Se um output for pago-por-linha e voce precisar ver mais, pague em incrementos de 40 linhas, nao o arquivo inteiro. Voce pode usar `sed -n '41,80p' arquivo.log`.

### Regra 8 — Anuncie antes de comando verboso

Se voce precisar rodar um comando que provavelmente vai gerar > 300 linhas, me avise antes: "vou rodar X, pode demorar e retornar muito output, ok?" Eu aprovo ou sugiro filtro.

## Confirme

Responda "modo silencioso ativo" e aguarde minha tarefa.
```

---

## Variacoes e Ajustes

**Projeto com CI verboso intencional:** mantenha verbosidade apenas para runs de CI rodados localmente para debugar; no dia-a-dia, silencio.

**Projeto Rust/C++:** `cargo build` e compiladores C++ podem gerar MUITO warning. Use `2>&1 | grep -E "error" -A 10` agressivamente.

**Projeto Python com pytest:** use `pytest -x --tb=line` para stack trace de 1 linha por erro, suficiente em 80% dos casos.

---

## Dicas de uso

- Coloque uma versao desta regra no `CLAUDE.md` como "politica de execucao de comandos".
- Se algum comando for cronicamente verboso, crie um alias ou script `scripts/quiet-test.sh` que ja aplica filtros e peca ao Claude para usar o script.
- Monitore sua media de tokens por resposta. Esta politica deve reduzir sensivelmente em sessoes com muitos Bash.

## Sinal de que deu certo

Seus tool results no historico ficam drasticamente menores. Builds e testes retornam com 20-50 linhas em vez de milhares.

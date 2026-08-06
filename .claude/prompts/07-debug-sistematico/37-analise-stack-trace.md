# Prompt 37 — Analise Profunda de Stack Trace

**Categoria:** Debug Sistematico
**Objetivo:** Extrair o maximo de informacao de um stack trace — identificar linha culpada, sinais secundarios, contexto de concorrencia, informacoes escondidas — em vez de olhar apenas a primeira linha e adivinhar.
**Quando usar:** Quando voce recebe um erro com stack trace e quer entender de verdade, nao so silenciar. Especialmente util para erros obscuros, wrapped errors, ou stacks que parecem apontar para lugar errado.

---

## PROMPT

```
Tenho um stack trace. Quero uma analise profunda, nao apenas a primeira linha.

## Stack trace

```
[COLE AQUI O STACK TRACE INTEIRO. Se for longo, cole inteiro mesmo. Inclua logs ao redor se tiver.]
```

## Contexto adicional

- **Quando ocorreu:** [producao, teste, local, sempre, intermitente]
- **Operacao que disparou:** [o que o usuario/sistema estava fazendo]
- **Ambiente:** [Node vX, Python vY, prod/stage/dev]
- **Versao do codigo:** [commit hash se souber]

## Protocolo

### Etapa 1 — Classificar o erro

Olhe o topo do stack trace. Classifique:

1. **Tipo**: TypeError, ValueError, NullPointerException, ReferenceError, etc.
2. **Origem**: codigo do projeto, dependencia, runtime.
3. **Natureza provavel**: null/undefined, tipo errado, parse, timeout, recurso nao encontrado, permissao, rede, memoria.

### Etapa 2 — Mapear o caminho completo

Vai pelo stack de baixo pra cima (do mais interno para o mais externo). Para CADA frame:

- Arquivo:linha
- Nome da funcao
- E codigo do projeto ou de biblioteca?
- Qual o papel dessa frame no fluxo?

Ignore frames de runtime irrelevantes (node_modules internal, async wrappers, decorator magic). Mas NAO ignore frames do projeto.

### Etapa 3 — Identificar o frame de origem REAL

O topo do stack nem sempre e onde o bug MORA. Frequentemente:

- O erro e lancado em util/helper
- A causa real esta no codigo que CHAMA o helper passando dado ruim

Identifique:

- **Frame que lanca o erro** (o topo)
- **Frame que provavelmente INTRODUZIU a causa** (algum frame anterior onde os dados ainda estavam ok vs onde ficaram quebrados)

Para achar a origem, leia o codigo nos frames intermediarios. Siga os dados.

### Etapa 4 — Wrapped errors / causes

Muitos erros modernos tem `cause` (Error.cause, exception chaining em Python, `wrap` em Go). Leia a cadeia inteira, nao apenas o nivel mais externo.

Se o erro envolve "Promise rejected" ou "async", preste atencao especial — o stack do JS as vezes parece apontar pra lugar errado em async.

### Etapa 5 — Leitura do codigo no frame de origem

Abra o arquivo do frame de origem. Le o bloco em volta da linha (offset + limit, 20 linhas em volta). Responda:

- O que essa funcao esta fazendo?
- Quais variaveis estao em jogo?
- Sob que condicoes o erro pode acontecer?
- Ha validacao de input ausente?

### Etapa 6 — Hipotese da causa

Formule uma hipotese:

- "O erro acontece quando X acontece porque Y nao e verificado"
- "O erro surge por race condition quando X e Y chegam juntos"
- "O erro e de tipo quando a API retorna null em campo que o codigo assume objeto"

Marque a hipotese com nivel de confianca (alta, media, baixa).

### Etapa 7 — Confirmar

Como confirmar a hipotese?

- Test unitario que reproduza?
- Log extra antes da linha para ver o valor?
- Repro local com input especifico?

Proponha UMA forma de confirmar. Nao corrija ainda.

### Etapa 8 — Fix sugerido

Apos confirmar, proponha o fix. Aplique as regras do Prompt 12 (bug fix cirurgico) ou do Prompt 36 (root cause).

## Regras

- Nao pule para o fix. Confirme a causa antes.
- Nao ignore frames "feias" do projeto. Elas costumam ter a origem.
- Se o trace esta truncado ou minificado, diga isso e pergunte source map.
- Em Node.js: preste atencao a async stack traces e unhandledRejection.
- Em Python: leia o `__cause__` e `__context__` se o erro vier de re-raise.

Comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Stack trace com codigo minificado/produzido por bundler:** pergunte pelo source map antes de analisar.

**Stack em linguagem com laziness (Haskell, Scala):** o frame topo pode estar LONGE da causa real. Seja extra cauteloso.

**Erro dentro de framework web (Express, Django, Rails):** ignore wrappers do framework, foque no frame do user-land.

---

## Dicas de uso

- Guarde stacks interessantes. Comparar traces de bugs similares revela padroes.
- Nunca silencie um erro com try/catch vazio "para nao poluir log". Trate ou propague.
- Logs estruturados (JSON) + correlationId fazem analise de stack 10x mais facil.

## Sinal de que deu certo

Voce descobre a origem REAL do bug — as vezes a 3 frames de distancia do topo. O fix entra no lugar certo e o bug nao volta.

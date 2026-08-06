# Prompt 25 — Code Review Profundo (Nivel Staff Engineer)

**Categoria:** Qualidade, Testes e Seguranca
**Objetivo:** Submeter um diff (ou arquivo) a um code review de nivel staff engineer — nao um "LGTM" sem leitura, nao um nitpick de estilo, mas um review que caca bugs reais, premissas fracas, edge cases, riscos e decisoes de design.
**Quando usar:** Antes de abrir PR, antes de aprovar PR de outro dev, ou quando voce quer um segundo par de olhos antes de confiar em uma entrega do proprio Claude.

---

## PROMPT

```
Voce e um staff engineer senior deste stack. Eu vou te dar um diff (ou indicar arquivos para voce revisar). Faca um code review RIGOROSO seguindo o protocolo abaixo. Nao seja simpatico. Seja tecnico.

## Protocolo de review

### Passo 1 — Contexto

Antes de analisar, confirme que voce entendeu:

1. Qual a intencao da mudanca (peca se nao estiver clara)?
2. Qual o escopo declarado (o que deveria ter mudado)?
3. O diff esta dentro do escopo declarado? Se nao, aponte as extrapolacoes.

### Passo 2 — Correcao funcional

Para cada trecho modificado, pergunte:

- Este codigo faz o que ele se propoe a fazer?
- Ha edge case nao tratado? (null, undefined, lista vazia, overflow, concorrencia, timeout, retry, permissao)
- Ha condicao off-by-one?
- Ha raca de condicao possivel?
- O retorno corresponde ao esperado pelo chamador?

Liste cada achado com arquivo:linha, descricao, severidade (baixa/media/alta/critica).

### Passo 3 — Premissas ocultas

Identifique premissas que o autor fez sem declarar:

- "Assume que a lista nunca e vazia"
- "Assume que o banco sempre retorna o campo X"
- "Assume que esta funcao nunca e chamada concorrentemente"
- "Assume que o usuario ja esta autenticado neste ponto"

Para cada premissa, pergunte: e se nao for verdade? Vale defender?

### Passo 4 — Seguranca

Olhe com lente de atacante:

- Input validado? Sanitizado?
- SQL injection, XSS, SSRF, XXE, path traversal?
- Secrets vazando em log/erro?
- Permissao verificada no endpoint certo?
- Rate limit onde precisa?
- Estado sensivel em client-side?

Aponte qualquer sinal.

### Passo 5 — Desempenho

- N+1 queries?
- Loop ineficiente em hot path?
- Alocacao em loop quente?
- Regex lenta / complexidade catastrofica?
- Promises em serie que poderiam ser paralelas?
- Ausencia de cache onde faria sentido?

### Passo 6 — Tratamento de erro

- Erros sao capturados onde ha algo significativo a fazer?
- try/catch vazio?
- Erros silenciados em Promise sem `.catch`?
- Erros sao propagados corretamente para o chamador?
- Mensagens de erro ajudam o proximo dev a debugar?

### Passo 7 — Testes

- Existem testes para esta mudanca?
- Os testes sao de comportamento ou de implementacao?
- Cobrem os casos felizes e os edge cases identificados acima?
- Algum teste esta desabilitado com `skip`?

Se nao ha teste, sugira O TESTE minimo que cobriria o risco central, nao uma suite.

### Passo 8 — Design

- A mudanca respeita as camadas/padroes do projeto?
- Ha abstracao desnecessaria (over-engineering)?
- Ha repeticao que pediria DRY?
- Nomes sao claros ou precisam de melhorar?

### Passo 9 — Legibilidade

- Trechos que um dev medio nao entenderia em 30 segundos?
- Comentarios explicam o "por que" (bom) ou o "o que" (redundante)?

### Passo 10 — Veredito

De um veredito em 1 linha:

- **APROVADO** — pode merge sem mudancas
- **APROVADO COM SUGESTOES** — pode merge apos mudancas nao-bloqueantes
- **MUDANCAS REQUERIDAS** — nao pode merge ate resolver pontos criticos
- **REJEITADO** — approach fundamentalmente errado, voltar a prancheta

E justifique o veredito em 3-5 linhas.

## Formato do output

Estruture o review assim:

```
## Contexto entendido
...

## Achados criticos (bloqueantes)
- [arquivo:linha] ...

## Achados altos
- ...

## Achados medios
- ...

## Achados baixos / nits
- ...

## Veredito
...
```

## Regras

- Nada de "parece bom". Se voce nao encontrou nada ruim, diga "revisei X pontos e nao encontrei problemas relevantes".
- Prefira citar linha a fazer parafrase.
- Nao fique listando nits de estilo se ja ha ferramenta de lint. Foque no que o lint nao pega.
- Portugues do Brasil.

## O que revisar

[COLE O DIFF OU APONTE OS ARQUIVOS. Se for diff grande, eu posso te dar o comando `git diff HEAD~3` ou similar.]

Comece pelo Passo 1.
```

---

## Variacoes e Ajustes

**Review de PR de outra pessoa:** troque "voce e staff engineer" por "voce vai revisar o trabalho de um dev semi-junior. Seja educado mas direto. Explique o 'por que' em cada achado para ser didatico."

**Review em modo de pairing:** peca para o Claude pausar a cada passo e aguardar voce concordar antes de avancar. Mais lento mas didatico.

**Review de codigo critico de producao:** enderece o Passo 4 com mais profundidade, rode o Prompt 28 (OWASP) em seguida.

---

## Dicas de uso

- Rode este prompt antes de pedir review humano. Libere os olhos humanos para pegar o que o Claude nao pega.
- Nao aceite "parece ok" como resposta. Se vier assim, peca "cite 5 coisas especificas que voce analisou".
- Se o Claude entregar review com zero achados em um diff grande, duvide. Peca "voce realmente olhou os casos vazios? null? permissao?"

## Sinal de que deu certo

Voce pega 1-2 achados altos que teriam virado bug em producao. O review economiza 1 incidente por mes.

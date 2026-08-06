# Prompt 39 — Profiling de Performance

**Categoria:** Debug Sistematico
**Objetivo:** Identificar o gargalo real de performance em uma funcao/rota/tarefa lenta, com medicao concreta (nao intuicao), e propor otimizacoes ordenadas por impacto.
**Quando usar:** Quando "ficou lento", "request demora 3 segundos", "build leva 5 minutos", "job noturno nao terminou". Evitar "parece lento, bora refatorar".

---

## PROMPT

```
Tenho um problema de performance. Quero investigacao baseada em medicao, nao em palpite.

## Descricao

- **O que esta lento:** [funcao, rota, endpoint, script, etc]
- **Quanto tempo demora hoje:** [medicao real se tiver; se nao, "sensacao" ate conseguirmos medir]
- **Quanto tempo e aceitavel:** [alvo]
- **Contexto:** [producao, carga tipica, pico, desenvolvimento]
- **Dados de entrada tipicos:** [tamanho, caracteristicas]

## Protocolo

### Etapa 1 — Baseline confiavel

Antes de otimizar, MEA. Sem numero, voce nao sabe se melhorou.

Ajude-me a medir:

1. Se e funcao: criar benchmark simples (`console.time`, `time.perf_counter`, `testing.B`, etc).
2. Se e rota: rodar `curl -w` ou `hey`/`wrk` para medir p50, p95, p99.
3. Se e script: rodar 3-5 vezes e tirar media e variance.
4. Se e query de banco: `EXPLAIN ANALYZE` (Postgres) ou equivalente.

Me apresente o baseline. Nao comece otimizar ate tenhamos numero.

### Etapa 2 — Profile de onde o tempo vai

Sem profile, voce otimiza no lugar errado. Dependendo da linguagem:

- **Node.js**: `node --prof`, `clinic.js`, `0x`
- **Python**: `cProfile`, `py-spy`, `scalene`
- **Go**: `pprof`
- **Rust**: `perf`, `cargo-flamegraph`
- **Banco**: EXPLAIN ANALYZE
- **HTTP**: logs de timing, APM, opentelemetry

Se nao ha profiler instalado, ou o projeto e simples demais, use instrumentacao manual:

```
const t0 = performance.now(); doThing(); console.log('thing', performance.now() - t0);
```

Em 3-10 pontos estrategicos.

Rode e traga os numeros. Me mostre:

- Top 5 operacoes pelo tempo total
- Operacoes com surpresa (algo que voce nao esperava ser lento)

### Etapa 3 — Hipotese do gargalo

Baseado no profile, formule hipotese:

- **CPU-bound**: calculo pesado, loop apertado, expressao regular
- **I/O bound — rede**: muitas chamadas externas, latencia
- **I/O bound — disco**: leitura/escrita frequente
- **I/O bound — banco**: queries lentas, N+1, falta de indice
- **Aloc/GC**: muita criacao de objetos em loop
- **Bloqueio / lock**: contention em recurso
- **Logging excessivo**: saida de log e gargalo
- **Cold start**: primeiro request e lento por carregamento

Cada categoria tem solucoes diferentes. NAO otimize sem saber em qual voce esta.

### Etapa 4 — Analise especifica

Com a categoria identificada, mergulhe:

#### Se for banco
- Pegue a query mais cara
- Rode EXPLAIN ANALYZE
- Identifique sequential scan, falta de indice, join caro
- Antes de criar indice, pense no custo de escrita

#### Se for N+1
- Identifique o loop que dispara multiple queries
- Substituir por eager loading / join / IN (array)

#### Se for loop apertado
- Ha calculo repetido que pode ser movido para fora?
- Ha array sendo copiado sem precisao?
- Ha regex sendo compilada a cada iteracao?

#### Se for rede
- Quantas chamadas? Podem ser batcheadas?
- Pode haver paralelizacao?
- Ha retry multiplicando tempo?
- Ha cache possivel?

### Etapa 5 — Plano de otimizacao ordenado

Crie uma lista de mudancas ordenadas por `impacto estimado / esforco`. Exemplo:

| # | Mudanca | Impacto estimado | Esforco | Risco |
|---|---------|------------------|---------|-------|
| 1 | Adicionar indice em users(email) | -200ms | baixo | baixo |
| 2 | Substituir N+1 por JOIN | -500ms | medio | baixo |
| 3 | Cache de 30s em lookup frequente | -100ms | medio | medio |

Comece pelo top da lista. Uma mudanca por vez.

### Etapa 6 — Medir depois de cada mudanca

Apos CADA otimizacao:

1. Rode o mesmo benchmark da Etapa 1
2. Compare numero antes / depois
3. Se o ganho e menor do que esperado, entenda por que

### Etapa 7 — Parar quando suficiente

Performance e marginal. Cada ms a menos custa mais. Pare quando bater o alvo definido na descricao. Nao otimize alem disso — troca de contexto, complexidade, legibilidade — todos pioram.

## Regras rigidas

- NUNCA otimize sem medir antes.
- NUNCA aplique "otimizacao conhecida" sem profile que confirme o gargalo.
- NUNCA troque legibilidade por ms se voce ja esta dentro do alvo.
- Atenha-se ao escopo do gargalo. Nao saia refatorando tudo.
- Cache e um hack: resolve sintoma, pode mascarar bug. Prefira a solucao de fundo primeiro.

Comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Frontend:** adicione Lighthouse, Chrome DevTools Performance tab, React Profiler. Metricas: LCP, CLS, INP, FID, TTI.

**Build:** ferramentas de profile de build (`--profile` no Webpack/Vite, turbopack trace). Nao confunda com performance de runtime.

**Jobs batch:** paralelize em worker pool apenas apos saber se eh I/O ou CPU bound.

---

## Dicas de uso

- Regra 80/20: 80% do tempo esta em 20% do codigo. Ache os 20%.
- Profile em ambiente semelhante a producao (dados reais, escala real). Profile em dev e enganoso.
- Depois de otimizar, grava o benchmark como teste para evitar regressao futura.

## Sinal de que deu certo

Voce atinge o alvo numerico. O profile pos-mudanca mostra o gargalo movido (ou sumido), nao apenas reduzido 5%.

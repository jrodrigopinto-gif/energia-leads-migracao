# Prompt 40 — Caca ao Memory Leak

**Categoria:** Debug Sistematico
**Objetivo:** Detectar vazamento de memoria em servico de longo prazo (Node.js, Python, Go, etc), identificar o retentor que esta segurando objetos alem do necessario, e corrigir sem chute.
**Quando usar:** Quando voce ve consumo de memoria crescendo progressivamente ate OOM, restart forcado, ou sensacao de "vai degradando ao longo do dia".

---

## PROMPT

```
Suspeito de memory leak no projeto. Quero investigacao metodica.

## Descricao

- **Servico:** [nome do processo / rota / job]
- **Linguagem/runtime:** [Node vX, Python vY, Go vZ]
- **Sintoma:** [memoria cresce de X para Y em T tempo; OOM apos Z; nao libera apos pico]
- **Ambiente:** [producao, staging, local]
- **Carga:** [qualitativa ou metrica]
- **Ferramentas disponiveis:** [heap dump? APM? metricas?]

## Protocolo

### Etapa 1 — Confirmar que e leak, nao so uso normal

Cuidado: memoria alta nao e leak. Leak e CRESCIMENTO sustentado que nao estabiliza, mesmo com carga estavel ou sem carga.

Para confirmar:

1. Observe a memoria ao longo do tempo. Em carga constante, ela deveria estabilizar (e oscilar por GC).
2. Se cresce sem parar, e leak.
3. Se estabiliza em X e reinicia so no pico, e uso alto mas nao leak.

Me diga o que voce tem de evidencia.

### Etapa 2 — Hipoteses comuns (por linguagem)

#### Node.js
- Listeners de eventos adicionados e nao removidos
- Closures segurando referencia a objetos grandes
- setInterval nao limpado
- Cache sem limite (Map, objeto global)
- Buffers nao liberados
- Referencia circular com DOM (se frontend)
- Promises nao resolvidas segurando contexto

#### Python
- Cache (`lru_cache` sem maxsize, dict global)
- Referencias circulares com `__del__` (impedem GC)
- `logging` com handlers acumulados
- `threading.Thread` nao finalizada
- Subscribers que guardam referencia a producers
- Dataframes em dict global

#### Go
- Goroutines que nao terminam (cada uma segura stack)
- Channels sem consumer (block + hold)
- `sync.Pool` mal usado
- Slice de tamanho gigante mantendo backing array

#### Java / JVM
- Coleções estaticas
- Listeners e observers
- ClassLoader leaks
- ThreadLocal mal limpado

#### Banco/Cache
- Conexoes nao devolvidas ao pool
- Prepared statements nao fechados
- Cursors abertos

Para cada hipotese, marque probabilidade.

### Etapa 3 — Reproduzir em ambiente instrumentavel

Memory leak so da pra pegar com profile de heap. Preciso subir o servico em ambiente com ferramenta:

- **Node**: `node --inspect`, `clinic heapprofiler`, Chrome DevTools, `heapdump`
- **Python**: `tracemalloc`, `guppy`, `memray`, `objgraph`
- **Go**: `pprof heap`
- **Java**: `jmap`, VisualVM, YourKit

Proponha qual ferramenta usar no projeto.

### Etapa 4 — Capturar heap snapshots (pelo menos 2)

1. Capturar snapshot logo apos o start (baseline).
2. Exercitar o servico por N minutos / N requests.
3. Capturar snapshot 2.
4. Capturar snapshot 3 (opcional, para confirmar tendencia).

Comparar snapshots e o principal. O que CRESCEU entre eles? Voce esta procurando tipos de objeto cujo count aumenta constantemente.

### Etapa 5 — Diff / retentores

Com o diff em maos:

1. Identifique os top-5 tipos que mais cresceram em count e em bytes.
2. Para cada, navegue nos "retainers" (quem segura a referencia).
3. A cadeia de retencao aponta para o code path culpado.

Exemplo: "`Buffer` crescendo, retentor e `Map` em linha X do `cache.js`. O cache nao tem eviction."

### Etapa 6 — Mapear para codigo

Com o retentor identificado:

1. Abra o arquivo indicado.
2. Leia o bloco. Entenda como a referencia e criada e quando deveria ser liberada.
3. Verifique: listener adicionado e removido? setInterval limpado? cache limitado?

### Etapa 7 — Fix

Propor fix:

- Remover listener (`off`, `removeEventListener`)
- Adicionar maxSize/TTL em cache
- `clearInterval` / `clearTimeout` ao desligar
- Usar `WeakMap` / `WeakRef` quando aplicavel
- Fechar cursor / conexao / arquivo
- Terminar goroutine com context cancel

Aplique, rode o mesmo experimento da Etapa 4. Confirme que o tipo nao cresce mais entre snapshots.

### Etapa 8 — Prevencao

- Adicionar metrica de memoria no monitoring (alerta de crescimento > X%/hora)
- Teste de long-running se aplicavel
- Documentar a origem no commit message para facilitar busca futura

## Regras

- Nao "resolva" memory leak com restart periodico como cura. Restart e contencao, nao fix.
- Nao desative GC para "testar teorias". Isso quebra mais do que ajuda.
- Se o sintoma desaparecer mas voce nao entende por que, NAO declare resolvido. Entenda ou monitore.
- Nao tente achar leak sem heap dump. Chute nao funciona aqui.

Comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Servico nao-critico:** restart periodico (cron) pode ser aceitavel enquanto voce investiga. Nao como solucao permanente.

**Leak em dependencia externa:** se o diff de snapshot aponta para tipo de lib, confirme com issue tracker da lib. Upgrade pode resolver.

**Frontend (browser):** use Chrome DevTools > Memory. Procure por DOM detached, event listeners, closures.

---

## Dicas de uso

- Memory leaks sao a classe de bug mais dificil sem ferramenta certa. Invista 30 minutos aprendendo o profiler, economize dias de chute.
- WeakMap/WeakRef sao pouco usadas e muito uteis para caches que podem liberar quando o objeto sai.
- Observabilidade de memoria em producao paga por si mesma na primeira vez que previne um incidente.

## Sinal de que deu certo

Memoria estabiliza em carga constante. Snapshots apos o fix mostram o tipo culpado nao crescendo. Sistema roda por semanas sem OOM.

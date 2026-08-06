# Prompt 38 — Reproducao de Bug Intermitente

**Categoria:** Debug Sistematico
**Objetivo:** Estruturar uma caca metodica a um bug que nao reproduz de forma deterministica — o mais dificil de todos os bugs, porque "tentar de novo" nao e debug.
**Quando usar:** Quando um bug acontece "as vezes", sem reproducibility clara. Testes flaky, condicoes de corrida, bugs de cache, bugs dependentes de ordem, bugs de relogio.

---

## PROMPT

```
Tenho um bug intermitente. "As vezes" acontece, "as vezes" nao. Quero investigacao metodica, nao "rode de novo".

## Descricao do bug

- **Sintoma:** [o que voce ve quando o bug acontece]
- **Frequencia estimada:** [1 em 10? 1 em 1000? todo dia? 1 por mes?]
- **Ambiente:** [producao, CI, local, algum especifico]
- **Logs disponiveis:** [sim/nao — quais]
- **Primeira vez observado:** [quando]
- **Ja houve mudanca recente relacionada?** [deploy, dependencia, config]

## Protocolo

### Etapa 1 — Lista de hipoteses candidatas

Bugs intermitentes vem quase sempre de uma destas fontes. Avalie a PROBABILIDADE de cada uma para o bug descrito:

1. **Race condition / concorrencia** — dois caminhos competem por recurso
2. **Ordem de eventos** — depende de qual request chega primeiro
3. **Estado compartilhado mutavel** — singleton, variavel global, cache
4. **Tempo / relogio** — expirou, race contra TTL, horario de verao
5. **Cache stale** — dado desatualizado em cache
6. **Rede** — timeout, retry, falha transitoria
7. **Recursos esgotados** — conexao de DB, memoria, arquivo aberto
8. **Ordem de testes** — um teste contamina outro (flaky test suite)
9. **Random / hash** — depende de valor aleatorio ou hash seed
10. **Ambientes diferentes** — prod tem X, dev nao tem
11. **Encoding / localidade** — unicode, timezone, numero formato
12. **Versao de dependencia** — mudanca silenciosa de lib transitiva

Liste com probabilidade alta/media/baixa + 1 linha de justificativa cada.

### Etapa 2 — Evidencia disponivel

Antes de tentar reproduzir:

1. Ha logs das ocorrencias? Leia-os.
2. Ha mais de uma ocorrencia? Compare-as procurando o que tem em comum.
3. Ha metricas/monitoring que mostram correlacao (pico de CPU, de RAM, de requests)?
4. Ha algum padrao temporal (sempre no comeco do dia, sempre no fim do mes)?

### Etapa 3 — Isolar a(s) hipotese(s) de maior probabilidade

Escolha a hipotese mais provavel. Crie um experimento que prove ou refute.

Exemplos:

**Hipotese: race condition**
- Adicionar log com timestamp preciso nos pontos de interesse
- Rodar em paralelo N vezes
- Tentar reproduzir com stress test

**Hipotese: estado compartilhado**
- Procurar variavel module-level / singleton / classe estatica
- Adicionar log dos valores em pontos-chave
- Tentar resetar entre execucoes

**Hipotese: cache stale**
- Invalidar cache entre execucoes
- Logar cache hits/misses

**Hipotese: teste flaky**
- Rodar o teste 50 vezes (com `--repeat-each 50` ou loop)
- Rodar em ordem aleatoria
- Rodar sozinho vs dentro do suite

### Etapa 4 — Instrumentar

Antes de rodar o experimento, instrumente o codigo com logs temporarios:

- Pontos de entrada/saida das funcoes suspeitas
- Valores de variaveis chave
- Timestamps com precisao em ms
- Identificador unico por execucao

Esses logs serao removidos depois. Me mostre onde vai adicionar antes de aplicar.

### Etapa 5 — Executar experimento

Rode o experimento. Se o bug aparece, capture os logs e analise. Se nao aparece:

- Pode ser que a hipotese esta errada
- Ou o numero de execucoes foi baixo demais
- Ou falta um ingrediente ambiental

Tente 3 vezes antes de mudar hipotese.

### Etapa 6 — Reduzir o caso minimo

Se conseguiu reproduzir, tente reduzir:

- Menos dados de entrada
- Menos threads
- Menos chamadas
- Ambiente mais simples

Ate chegar no menor cenario que ainda reproduz. Isso vira seu "caso de teste" para o fix.

### Etapa 7 — Fix + regressivo

Aplique as regras do Prompt 36 (root cause) + Prompt 26 (teste). O teste regressivo precisa reproduzir o caso minimo.

### Etapa 8 — Limpar instrumentacao

Remova logs temporarios. Deixe apenas os logs permanentes que valem a pena manter.

## Regras rigidas

- NAO conclua "o bug sumiu" sem rodar 50+ vezes em ambiente parecido.
- NAO aceite "nao consigo reproduzir, vamos seguir em frente" como fim. Bugs intermitentes retornam piores.
- NAO adicione try/catch como fix de intermitencia. Isso esconde, nao resolve.
- NAO use sleep() como solucao para race condition. Use locks, filas, ou sincronizacao real.

## Comeca

Rode a Etapa 1 com base na descricao.
```

---

## Variacoes e Ajustes

**Testes flaky em CI:** peca para adicionar `--repeat-each` ou equivalente e rodar o teste alvo 100x localmente.

**Bug so em producao:** se nao reproduz local, foco em instrumentar producao com cuidado e aguardar nova ocorrencia.

**Bug de concorrencia em linguagem com thread (Go, Rust, Java):** use ferramentas especificas (`-race` em Go, thread sanitizer).

---

## Dicas de uso

- Bugs intermitentes sao investimento. Nao subestime o tempo.
- Nao "corrige" com retry. Retry pode mascarar um bug que tem causa raiz grave.
- Se nao consegue reproduzir, invista em observabilidade. Na proxima vez que acontecer, voce tera os logs.

## Sinal de que deu certo

Voce consegue reproduzir deterministicamente o bug antes de corrigir, e o teste regressivo falha sem o fix.

# Prompt 41 — Uso Correto de Subagentes Paralelos

**Categoria:** Workflows Avancados
**Objetivo:** Usar subagentes em paralelo para executar tarefas genuinamente independentes com ganho de tempo total, sem cair nas armadilhas classicas: paralelizar o nao paralelizavel, perder contexto, ou entregar respostas conflitantes.
**Quando usar:** Quando voce tem 2-4 tarefas de investigacao/auditoria/mapeamento independentes entre si, e quer respostas simultaneas em vez de sequenciais.

---

## PROMPT

```
Tenho N tarefas que quero rodar em paralelo usando subagentes. Preciso que voce analise se elas realmente sao paralelizaveis, prepare os prompts, dispare em paralelo, e consolide os resultados.

## Tarefas

[LISTE AS N TAREFAS, UMA POR LINHA. SEJA ESPECIFICO.
1. ...
2. ...
3. ...
4. ...]

## Protocolo

### Etapa 1 — Teste de independencia

Para CADA tarefa, responda:

1. Ela depende do resultado de outra? (Se sim, nao paraleliza)
2. Ela modifica arquivos que outra tambem modificaria? (Se sim, conflito)
3. O resultado dela serve de input para outra? (Se sim, nao paraleliza)
4. E apenas LEITURA/INVESTIGACAO, ou envolve edicao?

Se alguma dependencia existir, reorganize: o que da pra rodar em paralelo vs em sequencia. Me mostre o grafo.

### Etapa 2 — Regra de ouro da paralelizacao

- **Paralelizaveis**: auditorias, mapeamentos, investigacoes independentes, greps em areas diferentes, avaliacao de multiplas alternativas.
- **NAO paralelizaveis**: edicoes que tocam os mesmos arquivos, tarefas sequenciais logicas, tarefas em que uma da contexto para a outra.

Maximo 4 subagentes em paralelo. Nunca mais. Alem disso, o custo cresce e o benefício cai.

### Etapa 3 — Preparar cada prompt de subagente

Para cada tarefa paralelizavel, escreva um prompt completo e AUTO-CONTIDO, que o subagente possa executar sem ver nosso contexto.

Template:

```
Descricao: "<4 a 6 palavras>"
Subagent type: Explore (ou outro conforme o caso)
Prompt:
<briefing completo: objetivo, escopo (o que pode/nao pode tocar), limites (nao abra X, Y), formato do relatorio esperado>
IMPORTANTE: responda em no maximo 200 palavras, em forma de lista.
```

Me mostre os N prompts antes de disparar. Eu reviso.

### Etapa 4 — Disparar em paralelo

Apos eu aprovar, dispare TODOS os subagentes em um unico turno (um unico bloco de chamadas paralelas). Nao dispare em sequencia ou voce perde o ganho.

### Etapa 5 — Consolidar

Apos receber os N resultados:

1. Resuma cada resultado em 3 linhas
2. Identifique convergencias (se aplicavel): 2 subagentes chegaram na mesma conclusao?
3. Identifique divergencias: algum discordou? por que?
4. Entregue um relatorio unificado

Se um dos subagentes falhou ou deu resposta ruim, informe e pergunte se deve rodar de novo com prompt melhor.

### Etapa 6 — Evitar o "telefone sem fio"

Nao use o resultado de um subagente para preencher o prompt de outro dentro do mesmo turno. Essa cadeia quebra paralelismo e introduz erro acumulado. Se ha dependencia, faca SEQUENCIAL.

## Regras rigidas

- Maximo 4 subagentes por turno.
- Cada subagente recebe relatorio de ate 200 palavras. Mais que isso anula o ganho de tokens.
- Nunca paralelize edicoes no mesmo arquivo.
- Nunca rode subagente para tarefa que voce mesmo faria em 1-2 Reads.
- Se o usuario pede "em paralelo" explicitamente, respeite — mas se for obviamente nao paralelizavel, explique e proponha alternativa.

## Comeca

Execute a Etapa 1 e me apresente o grafo de dependencia.
```

---

## Variacoes e Ajustes

**3 investigacoes muito curtas:** as vezes nao vale subagente nenhum, so fazer direto e mais barato. Tenha honestidade ao avaliar.

**Tarefas que precisam de "voto" (comparar opinioes):** rode 2-3 subagentes com a MESMA pergunta, compare respostas. Util para revisao de arquitetura/decisao.

**Tarefas de auditoria em areas diferentes:** ideal para paralelizacao — cada subagente cuida de uma area (ex: 1 auditoria por pacote em monorepo).

---

## Dicas de uso

- Subagente paralelo serve para ganhar TEMPO. Se voce nao tem pressa, faca sequencial e ganhe clareza.
- Subagente bem briefado > subagente rapido. Prompt ruim = resposta ruim, paralelismo ou nao.
- Desconfie de 4 subagentes retornando "esta tudo ok". Se for pattern de resposta, talvez os briefings estavam fracos.

## Sinal de que deu certo

Voce reduz uma tarefa de 10 minutos para 3 minutos, com resultado tao bom quanto teria se fizesse sequencial.

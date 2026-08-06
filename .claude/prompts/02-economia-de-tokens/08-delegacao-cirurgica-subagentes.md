# Prompt 08 — Delegacao Cirurgica para Subagentes

**Categoria:** Economia Inteligente de Tokens
**Objetivo:** Usar subagentes (Agent tool) estrategicamente, nao para "fazer mais coisa", mas para proteger o contexto principal de ruido — delegar buscas, auditorias e exploracoes que gerariam muita leitura, e receber apenas o relatorio final.
**Quando usar:** Sempre que voce fizer uma pergunta que o Claude teria que abrir 5+ arquivos para responder, ou quando voce quer um "segundo par de olhos" sem poluir a sessao principal.

---

## Por que este prompt existe

Subagentes sao mal compreendidos. A maioria dos usuarios ou nao usa ou usa demais. A verdade e que subagentes sao uma ferramenta de **gestao de contexto**: o agente filho le 30 arquivos e volta com 150 palavras de relatorio. Voce, no agente principal, so recebe o relatorio — nao os 30 arquivos.

Isso significa que a decisao de delegar nao e sobre "e uma tarefa grande?". E sobre "quanto contexto essa tarefa geraria se eu fizesse no agente principal?"

Este prompt te da o framework para decidir, mais templates prontos para os casos mais comuns.

---

## PROMPT

```
Quero que voce me ajude a aplicar delegacao cirurgica a subagentes nesta sessao. Eu vou te dar uma tarefa daqui a pouco. Antes disso, quero alinhar o protocolo:

## Regra de decisao

Para CADA tarefa que eu te der, voce primeiro avalia:

1. Quantos arquivos provavelmente precisariam ser lidos para responder?
   - **0-2 arquivos**: faca voce mesmo.
   - **3-5 arquivos pequenos**: faca voce mesmo com Grep e Read seletivo.
   - **5+ arquivos** OU **arquivos grandes** OU **exploracao em 3+ pastas**: delegue.

2. O objetivo e uma resposta sintetica (ex: "quais modulos usam X?", "esse padrao esta consistente?") ou uma transformacao no codigo?
   - **Resposta sintetica**: delegar quase sempre vale.
   - **Transformacao**: delegar raramente (voce precisa do contexto para editar).

3. Essa informacao vai "poluir" o contexto principal com detalhes que eu nao vou reusar?
   - Sim: delegar.
   - Nao: fazer voce mesmo.

## Templates de delegacao

Quando for delegar, use um destes templates conforme o caso:

### Template A — Mapeamento de uso de simbolo

```
Descricao: "Mapear usos de [simbolo]"
Prompt:
Encontre todos os lugares neste projeto onde [simbolo X] e importado ou chamado. Para cada uso, reporte: caminho:linha, 1 linha de contexto descrevendo como e usado. Ignore testes a menos que o uso seja exclusivamente em testes. Responda em ate 150 palavras em forma de lista.
Tipo: Explore, thoroughness=medium
```

### Template B — Verificacao de padrao

```
Descricao: "Verificar consistencia de [padrao]"
Prompt:
O projeto parece usar o padrao [X]. Verifique se e consistente em todos os modulos de [pasta Y]. Reporte apenas divergencias, com caminho:linha e o que difere. Se for consistente, responda "consistente" e pare. Nao sugira correcoes. Maximo 200 palavras.
Tipo: Explore, thoroughness=medium
```

### Template C — Investigacao de impacto

```
Descricao: "Impacto de mudar [alvo]"
Prompt:
Se eu renomear/remover/alterar [alvo X], quais arquivos e simbolos quebram? Liste todos os dependentes diretos e indiretos. Priorize impactos externos (APIs publicas, tipos exportados). Nao sugira correcoes. Ate 200 palavras.
Tipo: Explore, thoroughness=very thorough
```

### Template D — Segundo par de olhos (review independente)

```
Descricao: "Review independente de [area]"
Prompt:
Voce nao viu esta conversa. Olhe o diff atual (git diff) ou os arquivos [A, B, C] e me diga: ha bug, pegada de seguranca, ou viola alguma convencao do projeto? Responda em 150 palavras. Seja direto: ok ou nao ok, e por que.
Tipo: general-purpose
```

### Template E — Auditoria rapida

```
Descricao: "Auditar [aspecto]"
Prompt:
Faca uma auditoria rapida do projeto para [aspecto X — ex: uso de any, console.log esquecidos, TODO antigos, secrets hardcoded]. Reporte so os achados com caminho:linha. Nao abra arquivos alem do necessario. Maximo 200 palavras.
Tipo: Explore, thoroughness=quick
```

## Regras de delegacao

- Sempre pecа relatorio curto (< 200 palavras). Subagente verboso anula o ganho de tokens.
- Nunca delegue decisoes de design. Subagente ajuda voce a ver; voce decide.
- Nunca delegue edicao de codigo que eu vou revisar.
- Nunca rode mais de 3 subagentes em paralelo (custo cresce, benefício cai).
- Nunca delegue sem me avisar antes: "vou delegar X, ok?"

## Confirme

Responda "delegacao cirurgica ativa" e depois aguarde minha tarefa real.
```

---

## Variacoes e Ajustes

**Tarefa urgente que ja consumiu muito contexto:** force delegacao mesmo para tarefas medias, como estrategia de contencao.

**Tarefa paralelizavel (ex: 5 auditorias independentes):** peca para disparar os 3 primeiros subagentes em paralelo e explique o resultado esperado.

**Projeto pequeno (<100 arquivos):** relaxe a regra — raramente vale delegar em projeto pequeno.

---

## Dicas de uso

- Subagente e caro por si so. Vale quando o custo da leitura no principal seria maior que o custo do subagente + relatorio.
- Se voce delegou e recebeu um relatorio ruim, NAO continue. Rode de novo com prompt mais especifico.
- Nunca use subagente como "quer fazer por mim". Use como "quer ver por mim e me contar".

## Sinal de que deu certo

Voce nota que o contexto principal esta mais limpo ao longo das sessoes longas, mesmo fazendo mais investigacao.

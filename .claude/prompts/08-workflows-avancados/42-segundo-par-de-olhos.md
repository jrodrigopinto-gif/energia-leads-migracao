# Prompt 42 — Segundo Par de Olhos (Review Independente)

**Categoria:** Workflows Avancados
**Objetivo:** Obter uma avaliacao independente, por um "outro Claude" que nao participou da sessao, sobre a qualidade e corretude do que foi produzido — um review sem as cegueiras que a propria sessao acumulou.
**Quando usar:** Ao final de uma tarefa nao trivial, antes de commitar ou abrir PR. Especialmente valioso apos tarefas longas onde o Claude foi "colaborando junto" e pode estar com vies confirmatorio.

---

## Por que este prompt existe

Na mesma sessao, o Claude tende a defender o que ele mesmo escreveu. E natural — ele construiu gradualmente e nao ve por que mudar. Um novo subagente, sem historico, olha o resultado como um revisor externo olharia, e as vezes pega coisas que o agente principal nao questiona.

---

## PROMPT

```
Quero um segundo par de olhos sobre o trabalho que acabei de fazer nesta sessao. Dispare UM subagente que NAO viu esta conversa e faca-o revisar do zero.

## Protocolo

### Etapa 1 — Preparar o contexto

Identifique:
- Quais arquivos foram modificados nesta sessao
- Qual era a tarefa original (use a primeira mensagem do usuario como base)
- Qual criterio de aceitacao se aplica (se houver)

### Etapa 2 — Escrever o brief

Brief do subagente deve conter:

- **Tarefa original** (reformulada em 3-5 linhas, sem expor tentativas falhas)
- **Resultado apresentado** (lista de arquivos mudados + descricao de alto nivel)
- **Criterio de aceitacao** (se houver)
- **O que voce quer revisado**:
  - A implementacao resolve o problema?
  - Ha bug, edge case, ou pegada de seguranca?
  - Viola alguma convencao do projeto?
  - Ha over-engineering? Ou under-engineering?
  - Tem teste? O teste testa comportamento real?
  - O diff esta no escopo? Ha mudancas extras desnecessarias?
- **Formato esperado**: resposta em ate 300 palavras, estrutura:
  - **Veredito**: OK / MUDANCAS SUGERIDAS / MUDANCAS REQUERIDAS / REJEITADO
  - **Achados positivos**: 2-3 linhas
  - **Achados criticos**: lista com arquivo:linha
  - **Achados sugeridos**: lista com arquivo:linha

IMPORTANTE no brief: NAO revele o raciocinio que o agente principal seguiu. NAO exponha tentativas falhas. NAO diga "o agente anterior achou que X". O subagente precisa ser INDEPENDENTE.

### Etapa 3 — Disparar subagente

Dispare com subagent_type: general-purpose (ou code-reviewer se disponivel). Aguarde o resultado.

### Etapa 4 — Analisar a resposta

Quando o subagente responder:

1. Se o veredito e OK, voce pode relatar ao usuario.
2. Se ha achados criticos, NAO descarte — avalie cada um.
3. Se voce discordar de algum, explique o porque ao usuario, NAO para o subagente.
4. Apresente os achados como INPUT, nao como ordem. O usuario decide o que aceitar.

### Etapa 5 — Acao

Depois da apresentacao dos achados, pergunte ao usuario:

- Quer que eu aplique os ajustes criticos?
- Quer ignorar algum?
- Quer revisar algum com mais profundidade?

Nao mexa em nada sem o sim do usuario.

## Regras

- NUNCA crie um subagente que "continua" a sessao. Ele precisa ser zero-context.
- NUNCA mande o subagente escrever codigo. So revisar.
- NUNCA fique defensivo sobre suas proprias escolhas da sessao. Se o revisor tem razao, assuma.
- Se o brief ficar longo demais (>400 palavras), resuma antes. Subagente com brief gigante da resposta difusa.

## Comeca

Execute Etapa 1 e me apresente o brief antes de disparar.
```

---

## Variacoes e Ajustes

**Review apenas de seguranca:** brief foca em OWASP e secoes do Prompt 28.

**Review apenas de testes:** brief foca em "o teste testa comportamento real ou so implementacao?".

**Review de design/arquitetura:** brief pede opiniao sobre escolhas estruturais em vez de detalhes de codigo.

---

## Dicas de uso

- Use ANTES de commitar, nao depois. E mais barato corrigir antes.
- Se o review independente reprova, respire. Muitas vezes voce aprende algo novo.
- Nao rode 2 segundo-olhos seguidos. Se o primeiro aprovou, confie. Se reprovou, corrija e rode 1 vez.

## Sinal de que deu certo

O segundo par de olhos pega 1-2 achados por sessao longa que o principal nao tinha visto. Voce evita 1-2 bugs/retrabalhos por mes.

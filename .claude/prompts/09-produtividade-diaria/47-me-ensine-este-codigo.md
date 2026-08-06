# Prompt 47 — Me Ensine Este Codigo (Aprendizado Guiado)

**Categoria:** Produtividade Diaria
**Objetivo:** Usar o Claude como tutor para entender de verdade um trecho de codigo, padrao, abstracao ou tecnica que voce nao domina — em modo didatico, com camadas progressivas de profundidade, perguntas verificadoras e analogias.
**Quando usar:** Quando voce abre um codigo que parece magia, ou quer aprender uma tecnica nova vendo um exemplo real do projeto, ou esta fazendo onboarding pessoal em uma stack que e nova para voce.

---

## PROMPT

```
Quero que voce me ensine algo que esta neste codigo. Voce vai ser meu tutor — modo didatico, com camadas, sem despejar tudo de uma vez.

## O que eu quero entender

[ESCOLHA UM:
A) "Me explique este arquivo: <caminho>"
B) "Me explique esta funcao/classe: <nome em <caminho>>"
C) "Me explique o conceito X usando o jeito que esta neste projeto"
D) "Me explique o padrao usado nesta pasta: <caminho>"]

## Meu nivel atual

[DESCREVA EM 1-2 LINHAS:
- Sua experiencia com a linguagem
- Sua experiencia com o framework/lib em jogo
- O que voce JA entende e o que ainda nao]

## Protocolo

### Etapa 1 — Calibrar

Antes de explicar, faca 1-2 perguntas para calibrar meu nivel real. Ex:

- "Voce ja conhece [pre-requisito X]?"
- "Voce sabe a diferenca entre [conceito A] e [conceito B]?"

Espere minha resposta. Calibre baseado nela.

### Etapa 2 — Camada 1: visao geral

Em 5-8 linhas, me explique:

- O que esse codigo FAZ (em palavras simples, sem jargon)
- Para que serve
- Onde ele se encaixa no projeto

Sem entrar em detalhes ainda. So o "panorama".

Pergunte: "ate aqui ta claro? alguma duvida?"

### Etapa 3 — Camada 2: como funciona em alto nivel

Apos meu OK:

Em 10-15 linhas:
- O fluxo geral do codigo (passo a passo conceitual, nao linha a linha)
- Quais sao as partes que merecem atencao especial
- Que padrao/conceito principal ele usa (e diga o nome do padrao)

Pergunte de novo: "quer ir mais fundo, ou parar aqui?"

### Etapa 4 — Camada 3: detalhes de implementacao

Apos meu OK:

Va por partes. Para cada parte importante:

1. Mostre o trecho (max 15 linhas)
2. Explique linha por linha quando relevante
3. Aponte truques de linguagem ou idiomatismos que eu posso nao conhecer
4. Use analogias para conceitos abstratos
5. Diga o que e especifico DESSE projeto vs padrao geral da linguagem

A cada parte, pergunte: "essa parte ficou clara? continua?"

### Etapa 5 — Verificacao por pergunta inversa

Apos terminar a explicacao, MUDE de papel: vire examinador. Faca 3 perguntas sobre o que voce explicou. Eu respondo. Voce corrige se eu errar.

Exemplos de perguntas:
- "Por que essa funcao retorna Result em vez de jogar excecao?"
- "O que aconteceria se [edge case]?"
- "Como voce mudaria isso para fazer [variacao]?"

### Etapa 6 — Conexao com o que eu ja sei

Faca a ponte. Diga:

- "Isso e parecido com [conceito que voce ja conhece], mas com a diferenca de..."
- "Se voce conhece [linguagem X], isso seria equivalente a..."

### Etapa 7 — Onde aprender mais

Indique:
- 1-2 outros lugares no proprio projeto onde esse padrao aparece
- Conceito teorico para procurar (nome canonico, livro, post)
- Variacoes do padrao

## Regras

- Pacote pequeno, em camadas. Nunca despeje tudo de uma vez.
- Nada de jargon sem definir. Use linguagem simples primeiro, depois introduza o termo tecnico.
- Pergunta verificadora a cada camada. Se eu nao respondo, nao siga.
- Use analogia. "Isso e como X no mundo Y."
- Nao se desculpe por simplificar. Simplificacao e a essencia de ensinar.
- Honestidade: se voce nao tem certeza sobre uma parte, diga.
- Portugues do Brasil claro.

Comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Quero ser desafiado, nao explicado:** mude para "modo socratic" — Claude faz perguntas que me guiam ate eu chegar na resposta sozinho.

**Aprender comparando:** "me mostre 2 formas de fazer isso e os trade-offs". Bom para decidir entre alternativas.

**Quero exemplos para fixar:** apos a explicacao, peca "me de 3 mini-exercicios baseados nesse codigo, eu resolvo, voce corrige".

---

## Dicas de uso

- Este e um dos prompts mais subutilizados. O Claude e excelente tutor quando voce o usa como tal.
- Aprender no contexto do proprio projeto e mais durador do que tutorial generico.
- Anote os padroes que aprender em `docs/claude/glossario.md` para revisar depois.

## Sinal de que deu certo

Voce passa de "nao faz ideia" para "consigo modificar com confianca" naquele trecho. E o aprendizado fica.

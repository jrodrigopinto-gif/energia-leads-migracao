# Prompt 13 — Refatoracao Segura sem Quebrar Nada

**Categoria:** Assertividade e Prevencao de Erros
**Objetivo:** Executar uma refatoracao nao-trivial (renomear simbolo amplamente usado, mover modulo, extrair abstracao, inverter dependencia) com seguranca, passo a passo, com pontos de verificacao intermediarios.
**Quando usar:** Quando voce precisa mudar a forma do codigo sem mudar o comportamento, mas o impacto atravessa varios arquivos.

---

## Por que este prompt existe

Refatoracao e onde Claude mais erra. Nao porque o raciocinio esta errado, mas porque ele pode fazer mudancas grandes sem parar para validar. Em refactor, cada passo deve ser verificavel antes do proximo. O prompt abaixo impoe esse ritmo.

---

## PROMPT

```
Vou pedir uma refatoracao. Siga o protocolo de SEGURANCA abaixo. Nao pule etapas mesmo que voce ache obvio.

## Protocolo de refatoracao segura

### Etapa 1 — Compreensao (voce nao escreve nada ainda)

1. Resuma em 3-5 linhas o que eu quero refatorar e qual o objetivo estrutural.
2. Confirme que o COMPORTAMENTO observavel nao muda.
3. Se ha dois caminhos possiveis de refactor, apresente ambos antes de escolher.

### Etapa 2 — Mapeamento de impacto

1. Identifique TODOS os pontos do codigo afetados pela mudanca. Use Grep extensivamente.
2. Liste: arquivo:linha, descricao do uso, e nivel de acoplamento (forte/fraco).
3. Identifique pontos de RISCO: exports publicos, interfaces, API externa, testes.
4. Me apresente essa lista ANTES de qualquer mudanca.

### Etapa 3 — Baseline de verificacao

1. Verifique que existe suite de testes. Rode-a antes de qualquer mudanca.
2. Se passar, anote: "baseline verde em [data]".
3. Se falhar, PARE. Corrigir baseline vermelha primeiro, em PR separado.
4. Se nao ha testes, me avise e me pergunte se posso prosseguir. Sem testes, refator e risco alto.

### Etapa 4 — Plano de passos pequenos

Divida o refactor em passos INCREMENTAIS onde cada passo mantem o projeto em estado compilavel e com testes passando.

Exemplo de plano correto (renomear `UserService` para `AccountService`):
- Passo 1: criar `AccountService` como classe nova que herda/delega a `UserService`
- Passo 2: atualizar 1/4 dos usos para `AccountService`
- Passo 3: rodar testes + typecheck
- Passo 4: atualizar mais 1/4, testes, typecheck
- ... ate completar
- Passo final: remover `UserService` e seus aliases

Me mostre o plano completo antes de comecar.

### Etapa 5 — Execucao passo a passo

Para cada passo do plano:

1. Anuncie: "executando passo N de M: [descricao]"
2. Aplique as mudancas (Edit)
3. Rode: lint + typecheck + testes relevantes
4. Se tudo verde, prossiga. Se algo vermelho, PARE e relate o erro antes de tentar corrigir.
5. Nao avance para o passo N+1 se o passo N nao esta verde.

### Etapa 6 — Verificacao final

1. Rode suite completa de testes (nao apenas a relevante).
2. Rode typecheck completo.
3. Rode lint completo.
4. Verifique git diff: confira que as unicas mudancas sao estruturais, nada comportamental.
5. Relatorio final: o que mudou, em quantos arquivos, o que ficou igual.

## Regras rigidas

- Nunca faca mudancas fora do escopo do refactor declarado (nada de "ja que estou aqui...").
- Nunca mude nome de campo ou API publica sem deixar alias deprecated quando aplicavel.
- Nunca remova e recrie. Sempre transforme incrementalmente.
- Se um passo quebrar > 10 arquivos de teste, REVERTA e divida mais fino.
- Nunca commit sem me pedir.

## Descricao da refatoracao

[DESCREVA EXATAMENTE:
- O que voce quer refatorar (simbolo, modulo, pasta)
- Qual e o estado final desejado (nome novo, estrutura nova)
- Motivacao (opcional mas ajuda o Claude a nao extrapolar)]

## Confirme

Responda "entendi, comecando pela Etapa 1" e aguarde meu OK em cada etapa antes de prosseguir.
```

---

## Variacoes e Ajustes

**Refatoracao com geracao de tipo ou schema:** adicione: *"Apos cada passo, rode o gerador de tipos. Se mudar, comitar a geracao junto."*

**Refatoracao em biblioteca publicada:** adicione: *"Nao pode haver breaking change. Qualquer API publica precisa de alias deprecated + aviso de deprecation durante 1 release minor."*

**Refatoracao em projeto sem tipos:** substitua typecheck por "teste de smoke manual" e seja mais conservador no tamanho dos passos.

---

## Dicas de uso

- Nunca faca refatoracao grande e bug fix no mesmo PR. Separados.
- Quando o Claude errar em um passo, peca explicitamente para reverter apenas aquele passo, nao o refactor todo.
- Mantenha commits intermediarios durante o refactor. Se der merda, voce reverte passo a passo.

## Sinal de que deu certo

O CI fica verde entre cada passo. O diff final e grande mas mecanico e facil de revisar. Nenhum teste comportamental quebrou.

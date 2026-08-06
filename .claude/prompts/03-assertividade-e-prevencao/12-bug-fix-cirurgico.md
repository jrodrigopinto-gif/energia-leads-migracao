# Prompt 12 — Bug Fix Cirurgico (Zero Scope Creep)

**Categoria:** Assertividade e Prevencao de Erros
**Objetivo:** Pedir ao Claude que corrija um bug especifico SEM tocar em nada mais — sem refatoracao, sem limpeza, sem "melhoria aproveitando a visita". So o fix, minimo, auditavel.
**Quando usar:** Em qualquer correcao de bug onde voce precisa de um diff enxuto, facil de revisar, e que nao carregue riscos laterais.

---

## Por que este prompt existe

O comportamento padrao do Claude e ser prestativo. Pedir "corrija o bug X" costuma gerar um fix junto com 5 refatoracoes, renomeacoes, remoções de imports nao usados, updates de tipos e "melhorias" que ninguem pediu. Isso infla o diff, aumenta o tempo de review, aumenta o risco de regressao e torna o PR um pesadelo.

Este prompt forca disciplina cirurgica: so o que e estritamente necessario para fazer o bug desaparecer.

---

## PROMPT

```
Tenho um bug para corrigir. Quero um fix CIRURGICO. Regras absolutas:

## Regras rigidas do fix

1. **Uma mudanca, um objetivo**: voce so pode mexer no que e estritamente necessario para corrigir o bug descrito. Nada alem disso.

2. **Nada de refatoracao**: nao renomeie variaveis, nao mova funcoes, nao reorganize imports, nao extraia helpers, nao "melhore" nomes, nao mude estilo.

3. **Nada de limpeza**: nao remova imports nao usados, nao remova codigo morto, nao corrija typos em comentarios alheios, nao atualize docstrings que nao sao do trecho afetado.

4. **Nada de upgrade de dependencias**: nao atualize versoes, nao adicione biblioteca nova.

5. **Nada de cascata**: se voce ve OUTROS bugs similares enquanto investiga, NAO corrija. Apenas registre no relatorio final como "observado mas nao corrigido".

6. **Minimo de linhas possiveis**: se da para corrigir mudando 3 linhas, nao mude 10. Se da para corrigir em 1 arquivo, nao mude 2.

## Protocolo obrigatorio

### Passo 1 — Entender o bug

Me confirme de volta:
- O que o codigo faz HOJE (comportamento atual errado)
- O que o codigo DEVERIA fazer
- Onde provavelmente esta o bug (arquivo:linha)

Se voce nao tem certeza do que deveria acontecer, NAO chute. Me pergunte.

### Passo 2 — Localizar a causa raiz

Use Grep para localizar. Abra apenas o arquivo suspeito, e apenas o trecho relevante (offset + limit). Explique em 3-5 linhas qual e a causa.

### Passo 3 — Propor o fix minimo

ANTES de aplicar, me mostre o diff proposto em formato de trecho (old/new), apenas o trecho afetado. Espere eu aprovar.

### Passo 4 — Aplicar

Apos aprovacao, aplique com Edit. Se houver teste existente que cubra o caso, rode o teste. Se nao houver, me pergunte se devo adicionar UM teste minimo (nao uma suite nova).

### Passo 5 — Relatorio

Ao terminar, me de:
- O que foi mudado (arquivo:linhas)
- Por que isso resolve o bug
- O que voce NAO mudou apesar de ter visto (registro de auto-controle)
- Sugestao (opcional): "vale abrir outro PR para X" se voce viu algo relevante

## Descricao do bug

[COLE AQUI A DESCRICAO DO BUG COM O MAXIMO DE CONTEXTO:
- comportamento observado
- comportamento esperado
- passos para reproduzir
- stack trace (se houver)
- arquivo onde voce suspeita]

## Confirme

Antes de comecar, responda apenas: "entendi. posso investigar?" — e aguarde meu OK.
```

---

## Variacoes e Ajustes

**Bug sem reproducao confiavel:** adicione ao prompt: *"Antes de qualquer fix, escreva um teste que demonstre o bug (teste vermelho). So entao aplique o fix (teste verde)."*

**Bug critico em producao:** adicione: *"Prefira o fix mais seguro, mesmo que nao seja o mais elegante. Podemos fazer o refactor depois em PR separado."*

**Bug em codigo legado sem testes:** adicione: *"Nao adicione teste para este codigo (nao sabemos ainda como testa-lo). Apenas aplique o fix minimo e documente no PR que ha debito tecnico de teste."*

---

## Dicas de uso

- Resista a vontade de dizer "ja que voce esta ai, aproveita e arruma X". Cada bug = um PR.
- Se o Claude fizer alem do pedido, peca para reverter as mudancas extras antes de commitar.
- Apos fix, rode lint/typecheck/testes relevantes. Se algo quebrou, e porque o fix extrapolou.

## Sinal de que deu certo

O diff final tem 3-15 linhas mudadas. O PR abre em 10 segundos no review e fecha em 2 minutos. Ninguem pergunta "por que voce mexeu em Y?".

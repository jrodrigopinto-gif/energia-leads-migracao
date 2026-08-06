# Prompt 14 — Anti-Alucinacao: Verificacao Obrigatoria

**Categoria:** Assertividade e Prevencao de Erros
**Objetivo:** Forcar o Claude a verificar a existencia real de simbolos, arquivos, APIs, flags e assinaturas antes de afirmar que algo existe ou propor usar. Eliminar o tipo de erro "inventei a funcao `config.getOrDefault()` que nunca existiu".
**Quando usar:** Em projetos com muito codigo proprio, com APIs internas nao-standard, ou sempre que voce nota o Claude "chutando" nomes de funcoes.

---

## Por que este prompt existe

Alucinacao nao e burrice. E o modelo completando um padrao plausivel. "Provavelmente existe um `config.getOrDefault()`" — existe em muitas libs, entao o modelo assume. Em seu projeto, talvez nao exista. O codigo parece certo, compila ate certo ponto, e entao quebra em runtime.

A unica prevencao confiavel e instruir o Claude a verificar ANTES de afirmar. Este prompt define o que significa "verificar".

---

## PROMPT

```
Nesta sessao, adote a politica anti-alucinacao abaixo. Ela e inegociavel.

## Regra geral

Voce nunca pode afirmar que um simbolo (funcao, classe, metodo, constante, tipo, campo, flag, rota, endpoint, env var) EXISTE sem ter verificado no codigo ou em documentacao real, aqui mesmo na sessao.

Se voce nao verificou, voce deve dizer explicitamente: "nao verifiquei, posso estar errado" ou "preciso confirmar no codigo".

## Checklist por tipo de afirmacao

### Ao usar uma funcao/metodo de biblioteca externa

- Se voce viu um import dela neste projeto e usada com essa mesma assinatura, ok.
- Se voce NAO viu, responda "preciso checar a documentacao" e nao presuma. Pergunte se pode fazer WebFetch / WebSearch.

### Ao usar uma funcao interna do projeto

- Grep pelo nome para confirmar que existe.
- Leia o trecho onde ela e definida para confirmar assinatura e retorno.
- So entao use no codigo que voce vai escrever.

### Ao referenciar um campo de objeto/classe

- Localize a definicao (tipo, interface, classe).
- Confirme que o campo existe com o tipo esperado.
- Nunca presuma que "deve existir um campo X" porque e comum em outros projetos.

### Ao referenciar uma env var

- Grep por `process.env.X`, `os.environ["X"]` ou equivalente em todo o projeto.
- Se nao achar, diga "essa variavel nao parece existir. Quer que eu adicione ao `.env.example`?"

### Ao referenciar um comando de package.json / Makefile

- Leia o arquivo primeiro. Use o nome exato do script.
- Nunca suponha que "provavelmente existe `npm run test:unit`". Confirme.

### Ao referenciar uma rota/endpoint

- Grep pelo path. Confirme metodo HTTP, parametros e body esperado lendo o handler.

### Ao usar uma flag CLI

- Se e ferramenta externa, diga em que versao voce esta baseando a afirmacao. Se nao souber, me pergunte a versao antes de usar.

## Resposta quando voce NAO tem certeza

Use uma destas formas, nunca invente:

1. "Preciso verificar antes de prosseguir. Posso rodar [comando]?"
2. "Isso pode existir em algumas versoes da lib, mas nao confirmei. Voce sabe a versao?"
3. "Nao encontrei essa funcao no codebase. Voce tem certeza que e `X` e nao `Y`?"

## Comportamento quando eu apontar alucinacao

Se eu te disser "voce inventou essa funcao":

1. Assuma que eu estou certo.
2. Rode Grep imediatamente e confirme.
3. Corrija. Nao discuta.
4. Registre no final da resposta: "me enganei sobre X, agora verificado."

## Confirme

Responda apenas "modo anti-alucinacao ativo" e aguarde a tarefa.
```

---

## Variacoes e Ajustes

**Projeto com APIs internas com nomes parecidos a APIs publicas famosas:** coloque no `CLAUDE.md` uma secao "APIs internas e suas assinaturas" para servir de ancora.

**Projeto em linguagem menos conhecida (Elixir, Haskell, Elm):** reforce a regra 2x mais — o modelo tem mais chance de alucinar nesses ecossistemas.

**Usando SDKs que atualizam frequentemente:** exija sempre confirmar versao antes de usar qualquer metodo "novo".

---

## Dicas de uso

- Ao notar alucinacao, corrija imediatamente. O Claude aprende pelo feedback imediato da sessao.
- Sempre que poder, cite a versao da lib na propria pergunta. Isso ancora o modelo.
- Para APIs externas criticas (Stripe, AWS), prefira pedir ao Claude que busque a doc oficial antes de propor codigo.

## Sinal de que deu certo

Voce percebe mais vezes "vou verificar primeiro" antes do Claude propor codigo. Erros de "a funcao X nao existe" caem para quase zero.

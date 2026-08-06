# Prompt 27 — Testes de Integracao sem Mocks Enganosos

**Categoria:** Qualidade, Testes e Seguranca
**Objetivo:** Escrever testes de integracao que efetivamente validem o contato entre camadas/sistemas — usando banco real (ou equivalente realista), sem mocks que "passam a salva" porque foram montados para passar.
**Quando usar:** Ao testar fluxos que atravessam > 1 camada (ex: rota HTTP -> service -> banco). Tambem util para pegar regressoes que teste unit nao pega.

---

## PROMPT

```
Quero testes de integracao de alta fidelidade para o fluxo [DESCREVA O FLUXO, EX: 'criar usuario via POST /users']. Siga este protocolo.

## Principios

### 1. Integracao de verdade

Banco de dados: use um banco REAL (container ou sqlite) com schema identico ao de producao. Jamais mocke o ORM ou o driver do banco para teste de integracao.

APIs externas: aqui sim, use mock/stub — mas com contrato fiel (idealmente contrato gerado/validado).

Tempo: use clock injetavel se o codigo depende de tempo. Nao mocke Date global.

Filesystem: use tmpdir real, nao mock.

### 2. Nada de "passa porque o mock diz sim"

Se um teste tem mock, o mock precisa representar uma resposta que o sistema real PODERIA dar. Nao invente resposta otimista.

Se voce precisa colocar um mock que retorna exatamente o que o teste precisa para passar, o teste nao esta testando nada.

### 3. Setup e teardown honestos

- Setup: recriar schema, popular dados minimos.
- Teardown: limpar DB entre testes OU usar transacao que rollback no final.
- Independencia: qualquer ordem de execucao produz mesmo resultado.

### 4. Teste o caminho, nao uma funcao

O teste invoca o "entry point" do fluxo (ex: funcao de handler HTTP, comando CLI) e verifica o efeito observavel no OUTRO lado (ex: registro no banco, resposta HTTP). NAO teste funcoes intermediarias.

### 5. Assercoes observaveis

Verifique:
- Resposta HTTP (status + body)
- Estado do banco apos
- Efeitos externos (email enviado, webhook chamado, log estruturado)

Nunca verifique metodos internos chamados.

## Protocolo

### Etapa 1 — Contexto do fluxo

Antes de escrever, confirme:
- Qual o entry point do fluxo? (handler, rota, funcao)
- Quais camadas atravessa? (use grep/leitura leve)
- O que e criado/mudado no banco?
- Ha efeitos externos? Se sim, quais deveriam ser mockados e com que contrato?

### Etapa 2 — Infraestrutura de teste

Investigue:
- O projeto tem runner de teste de integracao configurado?
- Usa docker-compose para subir banco?
- Ha fixtures ou factories (factory_bot, fishery, faker)?
- Ha transacao wrapper por teste?

Se algo estiver faltando, proponha com o minimo de atrito. Nao reescreva o setup do projeto.

### Etapa 3 — Cenarios

Proponha lista de cenarios:

1. Happy path
2. Validacao de input (3-5 campos faltando/errados)
3. Conflito de negocio (ex: email ja existe)
4. Erro de dependencia externa (API fora)
5. Erro de banco (timeout, constraint violation)
6. Permissao negada

Me mostre antes de escrever.

### Etapa 4 — Escrever os testes

Apos aprovacao, escreva. Use o framework do projeto.

Regras:
- Cada teste isolado (usar transacao ou truncar tabelas).
- Fixtures minimas.
- Assercoes apenas em efeitos observaveis.
- Sem `sleep` ou timer (use espera explicita se houver async).

### Etapa 5 — Rodar

Rode. Se passar, rode 2x para verificar que nao ha dependencia de ordem. Se falhar, investigue ANTES de ajustar — pode ser bug real.

### Etapa 6 — Tempo de execucao

Meca o tempo total da suite. Se um teste passar de 2 segundos individualmente, veja se da pra reduzir com fixture menor. Teste de integracao lento e teste que ninguem roda.

## Regras rigidas

- Proibido: mock de ORM, mock de driver de banco, mock de funcao interna do projeto.
- Permitido: mock de API externa (com contrato), mock de clock (se injetavel), mock de filesystem (com tmpdir), mock de random.
- Cada teste de integracao deve rodar em < 2 segundos. Se demora mais, otimizar.
- Teste que depende de internet falha. Nunca use rede real.

## Confirme

Responda "investigando infra de teste" e comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Projeto com muitos microservicos:** adicione contract tests (Pact) como complemento de integracao.

**Projeto sem banco (puro HTTP):** entao todo "estado" fica em memoria ou no API externa. Use stubs fieis com contrato.

**Projeto com filas:** trate a fila como efeito observavel — assercao: "mensagem correta foi publicada no topico X".

---

## Dicas de uso

- Separa a suite: `test:unit` (rapido, roda sempre) vs `test:integration` (mais lento, roda no CI e antes de merge).
- Se CI fica mais de 10 minutos so em integracao, reavalie — ou esta testando demais, ou paralelizar.
- Raramente precisa de e2e se os testes de integracao estao bem feitos.

## Sinal de que deu certo

Voce confia nos testes para merge. Quando o teste de integracao passa, voce sabe que o fluxo funciona de ponta a ponta.

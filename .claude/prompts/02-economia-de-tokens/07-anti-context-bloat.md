# Prompt 07 — Estrategias Anti-Context-Bloat

**Categoria:** Economia Inteligente de Tokens
**Objetivo:** Impedir, durante a propria sessao, que o Claude encha o contexto com leituras desnecessarias, explorando o projeto de forma disciplinada e usando as ferramentas certas na ordem certa.
**Quando usar:** Em tarefas longas ou exploratorias, onde voce sente que o Claude esta "lendo demais" — abrindo arquivo apos arquivo sem criterio.

---

## Por que este prompt existe

Context bloat e o inimigo silencioso. Um Claude mal orientado abre 40 arquivos para resolver uma tarefa que exigiria 5. Cada Read traz o arquivo inteiro para o contexto, mesmo que so 10 linhas importem. Este prompt impoe uma disciplina de exploracao que elimina 60-80% das leituras sem perder precisao.

---

## PROMPT

```
Daqui em diante, nesta sessao, eu quero que voce siga uma disciplina estrita anti-context-bloat em toda investigacao de codigo.

## Regras de exploracao

### Regra 1 — Grep antes de Read

Nunca abra um arquivo inteiro para procurar algo. Primeiro faca Grep pelo termo especifico. Use `output_mode: content` com contexto (`-C 5`) apenas para ver o trecho relevante. So abra o arquivo inteiro se o trecho nao for suficiente.

### Regra 2 — Read com offset/limit

Quando abrir um arquivo de mais de 500 linhas, NUNCA leia inteiro de primeira. Leia as primeiras 100 linhas para entender imports/estrutura. Em seguida, use Grep para achar o simbolo que importa e Read com `offset` no numero da linha, `limit: 80`.

### Regra 3 — Glob antes de listar manualmente

Nunca use `ls` recursivo ou Bash para listar arquivos. Use Glob com padrao especifico. Se nao sabe o padrao, pergunte a mim.

### Regra 4 — Delegue exploracao profunda a subagente

Se a pergunta exige abrir 5+ arquivos ou explorar 3+ pastas, delegue ao subagente Explore com instrucao clara e peca relatorio CURTO (<200 palavras). Voce nao le os arquivos — voce le o relatorio.

### Regra 5 — Nao leia node_modules, dist, build, generated

Nunca. Sob hipotese alguma. Se precisa entender uma dependencia, leia a documentacao publica, nao o codigo dela.

### Regra 6 — Nao leia lockfiles

Nunca abra `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `Cargo.lock`, `poetry.lock`. Se precisar de versao, use Grep no manifest (`package.json`, etc).

### Regra 7 — Tests em ultimo caso

Nao leia arquivos de teste para entender comportamento. Leia o codigo de producao. So abra o teste se for a propria tarefa (escrever/corrigir teste) ou se o codigo for ambiguo e o teste for o contrato.

### Regra 8 — Nao reabra

Se voce ja leu um arquivo nesta sessao, NAO leia de novo. Use o que voce ja tem em contexto.

### Regra 9 — Pare e pergunte

Se voce sentir que esta "precisando abrir mais um arquivo" 3 vezes seguidas, pare e me pergunte o que exatamente voce esta tentando descobrir. Provavelmente eu sei onde esta.

## Como me avisar de violacoes

Se voce perceber que esta prestes a violar uma dessas regras porque acha necessario, diga explicitamente: "Vou abrir X inteiro porque Y" e espere eu aprovar.

## Confirme

Responda apenas "disciplina ativa" para confirmar que voce entendeu e pode seguir essas regras pelo resto da sessao. Depois aguarde minha tarefa.
```

---

## Variacoes e Ajustes

**Sessao de exploracao profunda:** relaxe a Regra 8 (reabertura) para permitir releituras com offset diferente.

**Tarefa de teste:** relaxe Regra 7 — voce vai precisar ler testes mesmo.

**Projeto Python com muita magia (decorators, metaclasses):** adicione: *"Em Python, siga tambem os imports — mas so de primeiro nivel. Nao va fundo em cada modulo."*

---

## Dicas de uso

- Cole este prompt no comeco de sessoes longas, antes de pedir a tarefa real.
- Se sentir que o Claude "esqueceu" as regras depois de 20 turnos, recole abreviado: "lembre-se das regras anti-context-bloat".
- Voce pode colocar uma versao curta dessas regras direto no `CLAUDE.md` para aplicar sempre.

## Sinal de que deu certo

Voce percebe menos Reads e mais Greps no historico de ferramentas. Tarefas equivalentes consomem menos tokens e terminam no mesmo tempo ou ate mais rapido.

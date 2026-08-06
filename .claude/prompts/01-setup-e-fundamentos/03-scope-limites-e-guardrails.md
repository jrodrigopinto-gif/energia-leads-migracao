# Prompt 03 — Definir Scope, Limites e Guardrails

**Categoria:** Setup e Fundamentos
**Objetivo:** Comunicar ao Claude, de forma duradoura e versionada, quais pastas/arquivos sao proibidos, quais mudancas exigem confirmacao humana e qual e o "raio de dano" aceitavel em cada area do projeto.
**Quando usar:** Em projetos onde existe codigo legado intocavel, arquivos gerados automaticamente, areas de producao sensiveis, ou contratos com terceiros que nao podem ser modificados sem revisao.

---

## Por que este prompt existe

Claude, por padrao, presume que tudo que esta no repo e editavel. Isso funciona para projetos novos mas e perigoso em projetos reais, onde ha:

- Pastas geradas (ex: `dist/`, `generated/`, `prisma/migrations/`)
- Arquivos de lock (`pnpm-lock.yaml`, `Cargo.lock`, `poetry.lock`)
- Contratos com frontend/backend (schemas compartilhados, tipos publicos)
- Codigo legado que ninguem toca mais porque ninguem entende
- Migracoes de banco ja aplicadas em producao
- Arquivos de seguranca (`auth/`, `crypto/`)

Sem guardrails, o Claude pode refatorar algo "melhorando" e quebrar o mundo. Este prompt define os limites de forma explicita.

---

## PROMPT

```
Quero definir os guardrails deste projeto para o Claude Code. Meu objetivo e criar uma secao no CLAUDE.md chamada "Limites e Guardrails" que deixe explicito o que voce pode, o que voce precisa perguntar antes, e o que voce NUNCA deve tocar.

Antes de escrever, investigue:

1. Liste todas as pastas da raiz do projeto.
2. Identifique e classifique cada pasta/arquivo em uma destas categorias:
   - **Livre**: pode editar a vontade (codigo de feature, componentes, testes)
   - **Com cautela**: pode editar mas precisa avisar antes (configuracao, schemas, migrations)
   - **Proibido sem aprovacao explicita**: nao pode editar sozinho (codigo gerado, lockfiles, infra, secrets, contratos publicos)

Para classificar, use estes sinais:
- Arquivos gerados geralmente tem cabecalho tipo `// DO NOT EDIT` ou estao em pasta como `generated/`, `__generated__/`, `dist/`, `build/`, `prisma/migrations/`, `node_modules/`.
- Lockfiles sao geridos pelo package manager.
- Migracoes de banco ja aplicadas nunca devem ser editadas — apenas novas migracoes podem ser criadas.
- Pastas que contenham `auth`, `crypto`, `security`, `billing`, `payment` geralmente exigem revisao humana.
- `.github/workflows/` e infraestrutura de CI sao sensiveis.
- Schemas publicos (OpenAPI, GraphQL, protobuf) tem impacto em clientes externos.

3. Pergunte se ha alguma pasta que deve ser adicionada aos guardrails por motivo que voce nao consegue inferir do codigo (ex: "a pasta `legacy/` nao se toca por decisao politica").

Apos a investigacao, escreva uma secao de CLAUDE.md neste formato exato:

## Limites e Guardrails

### Areas Livres
Voce pode editar livremente:
- `caminho/x/` — descricao
- `caminho/y/` — descricao

### Areas de Cautela (avise antes de editar)
- `caminho/a/` — motivo
- `caminho/b/` — motivo

### Areas Proibidas (nao edite sem pedir confirmacao explicita)
- `caminho/m/` — motivo
- `caminho/n/` — motivo

### Acoes Proibidas Globalmente
- Nunca editar arquivos de lock manualmente. Use `npm install` (ou equivalente).
- Nunca editar migracoes ja aplicadas. Crie uma nova migracao para mudancas.
- Nunca commitar secrets. Arquivos `.env*` estao fora dos limites de leitura exceto `.env.example`.
- Nunca rodar `git push --force` sem pedir confirmacao.
- Nunca deletar branches sem pedir confirmacao.
- [adicione outras regras que fizerem sentido no projeto]

REGRAS:
- Nao escreva regras genericas de "boas praticas". Escreva apenas regras que valem PARA ESTE projeto.
- Se nao houver areas proibidas, escreva "Nenhuma" em vez de inventar.
- Maximo 60 linhas nesta secao.

Apos escrever, liste em 3 bullets as coisas que voce quase quis editar e se conteve por causa dos guardrails que acabou de escrever.
```

---

## Variacoes e Ajustes

**Projeto pessoal:** simplifique pedindo apenas 2 niveis — "livre" e "proibido". Ignore "cautela".

**Projeto com compliance (LGPD, SOC2, HIPAA):** adicione ao prompt: *"Qualquer codigo que toque PII, logs, ou dados de usuario deve ser classificado como 'proibido sem aprovacao' e documentado."*

**Monorepo com donos diferentes:** peca para o Claude identificar `CODEOWNERS` e usar isso para definir guardrails por pacote.

---

## Dicas de uso

- Rode uma vez no inicio do projeto e revise junto com o time.
- Quando sentir que um guardrail ficou pesado demais (Claude parando para perguntar em algo trivial), edite a secao. Guardrails sao vivos.
- Essa secao deve ir dentro do `CLAUDE.md` principal. Nao crie arquivo separado — se fragmentar, o Claude nao le.

## Sinal de que deu certo

Peca ao Claude para mexer em algo na area proibida. Ele deve parar e pedir confirmacao explicita com o motivo. Se ele editar sem perguntar, o guardrail nao esta no lugar certo ou esta vago demais.

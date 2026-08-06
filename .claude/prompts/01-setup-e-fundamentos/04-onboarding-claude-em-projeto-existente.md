# Prompt 04 — Onboarding do Claude em Projeto Existente

**Categoria:** Setup e Fundamentos
**Objetivo:** Fazer o Claude construir, em uma unica sessao, um entendimento real de um codebase que ele nunca viu — arquitetura, fluxos, pontos de entrada, dependencias chave — e gerar um documento de onboarding que sirva de referencia para sessoes futuras.
**Quando usar:** Quando voce acabou de clonar um repo existente (seja porque entrou num projeto novo, seja porque vai mexer num repo antigo do time), e quer que o Claude "saiba" do projeto antes de pedir tarefas.

---

## Por que este prompt existe

O erro mais comum ao usar Claude Code em projeto existente e pedir uma tarefa direto, sem dar tempo para ele explorar. Resultado: Claude chuta estrutura, inventa caminhos, usa padrao errado, e voce gasta tokens corrigindo.

Fazer um onboarding guiado no comeco custa uns ~15-30k tokens uma unica vez, mas paga de volta em toda sessao seguinte, porque o conhecimento fica versionado em um `ONBOARDING.md` que vira referencia.

---

## PROMPT

```
Voce e um novo desenvolvedor neste projeto. Eu quero que voce faca um onboarding completo de si mesmo, como se fosse seu primeiro dia, e no final produza um documento `docs/ONBOARDING-CLAUDE.md` que servira de referencia para suas sessoes futuras.

Siga este protocolo, nesta ordem:

## Etapa 1 — Orientacao (5 minutos de leitura)

1. Leia `README.md`, `CLAUDE.md` (se existir), `CONTRIBUTING.md`, `package.json` / `pyproject.toml` / equivalente.
2. Liste a arvore ate 2 niveis, ignorando node_modules, .git, dist, build.
3. Me responda em 5 linhas: o que este projeto faz, em termos de produto?

## Etapa 2 — Pontos de Entrada

Identifique e liste:

- **Entry point principal** do runtime (ex: `src/main.ts`, `app/layout.tsx`, `cmd/server/main.go`). Abra e leia.
- **Entry point de testes** (ex: `tests/` ou `__tests__/`). Leia 1 arquivo de teste representativo.
- **Entry point de build/deploy** (ex: `Dockerfile`, `vercel.json`, script de CI em `.github/workflows/`).
- **Configuracao central** (ex: `next.config.js`, `vite.config.ts`, `settings.py`).

Em cada ponto, registre o que voce aprendeu em 2 linhas.

## Etapa 3 — Camadas da Arquitetura

Identifique as camadas logicas do codigo. Exemplos possiveis:

- Apresentacao / UI
- API / Rotas / Controllers
- Servicos / Casos de uso / Business logic
- Modelos / Entidades / Schemas
- Acesso a dados / Repositorios
- Infra / Config / Integracoes externas

Para cada camada que voce identificar, liste:
- Pasta(s) onde ela vive
- 1-2 arquivos representativos que voce leu
- Padrao que voce observou (nao invente: se ha padrao repetitivo, cite; se nao ha, diga "sem padrao consistente")

## Etapa 4 — Dependencias Externas

1. Leia `package.json` (ou equivalente).
2. Liste as 10 dependencias mais "estruturais" (framework, ORM, auth, SDKs de infra) ignorando dev dependencies e utilitarios triviais.
3. Para cada uma, diga em 1 linha onde ela e usada no codigo (faca grep real).

## Etapa 5 — Fluxos Reais

Escolha 2 fluxos de negocio reais que voce consiga rastrear ponta a ponta. Exemplos: "usuario faz login", "cliente cria pedido", "webhook de pagamento". Para cada fluxo:

1. Entry point (rota, handler, funcao)
2. Camadas atravessadas (ordem)
3. Onde ha persistencia
4. Onde ha chamada externa
5. Onde ha tratamento de erro

Escreva o fluxo em forma de lista numerada, com caminho de arquivo em cada passo.

## Etapa 6 — Producao do ONBOARDING-CLAUDE.md

Reuna tudo em `docs/ONBOARDING-CLAUDE.md` com estas secoes:

1. Sumario do Produto (5 linhas)
2. Stack e Ferramentas
3. Pontos de Entrada Principais
4. Camadas da Arquitetura
5. Dependencias Estruturais
6. Fluxos-Exemplo
7. Lacunas e Perguntas Abertas (coisas que voce nao entendeu e precisa perguntar ao humano)

## Regras

- Nao invente. Se nao tem certeza, escreva "nao identificado" ou coloque na secao de lacunas.
- Cite caminhos de arquivo e numeros de linha sempre que possivel.
- Maximo 300 linhas no documento final.
- Escreva em portugues do Brasil.
- Apos gerar, me mostre apenas a secao de "Lacunas e Perguntas Abertas" para eu responder e voce iterar.

Pode comecar pela Etapa 1.
```

---

## Variacoes e Ajustes

**Projeto pequeno (<50 arquivos):** corte as etapas 4 e 5 para 1 fluxo apenas, e peca documento de 100 linhas.

**Monorepo:** peca onboarding por pacote, um de cada vez. Nao tente abracar tudo em uma sessao.

**Codigo legado sem testes:** ignore a parte de "entry point de testes" e substitua por: *"identifique como o codigo e testado hoje — smoke manual, staging, ou nada."*

**Projeto com documentacao existente:** adicione: *"Leia tambem `docs/` inteiro antes de comecar. Se ja existir documentacao de arquitetura, use como base e complemente."*

---

## Dicas de uso

- Reserve uma sessao dedicada para este prompt. Nao misture com tarefas reais.
- No final, revise o `ONBOARDING-CLAUDE.md` humanamente e corrija coisas erradas. Commit ele no repo.
- Referencie esse arquivo em `CLAUDE.md` com uma linha: "Leia `docs/ONBOARDING-CLAUDE.md` antes de tarefas nao triviais."

## Sinal de que deu certo

Em uma proxima sessao, peca ao Claude: "me mostre o fluxo completo de [X]". Ele deve conseguir responder com caminhos reais sem explorar de novo, porque o onboarding esta na memoria do projeto.

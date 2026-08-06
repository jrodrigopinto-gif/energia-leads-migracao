# Prompt 23 — Identificacao de Codigo Morto

**Categoria:** Planejamento e Analise de Codebase
**Objetivo:** Localizar codigo que foi escrito, ainda esta no repo, mas nao e mais usado — funcoes nunca chamadas, componentes importados em zero lugares, rotas nao referenciadas, feature flags desligadas ha anos, testes orfaos.
**Quando usar:** Periodicamente em projetos maduros. Tambem util antes de grandes refactors (remover primeiro, refatorar menos).

---

## PROMPT

```
Quero identificar codigo morto neste projeto — coisas que existem mas nao sao mais usadas. O objetivo e me dar uma lista priorizada para remover com seguranca.

## Categorias que voce vai procurar

### Categoria A — Exports nao importados

Para arquivos do codigo-fonte (nao tests, nao generated):

1. Identifique simbolos exportados (`export function X`, `export class Y`, `export const Z`, etc).
2. Para cada um, faca Grep pelo nome no restante do projeto (excluindo o proprio arquivo).
3. Se nenhum outro arquivo importa/usa, e candidato a codigo morto.

CUIDADOS:
- Nao inclua arquivos que sao entry points (pontos pelos quais o runtime entra).
- Nao inclua funcoes exportadas por biblioteca publica (API externa).
- Ignore re-exports intencionais em arquivos barril (`index.ts`).

### Categoria B — Arquivos sem importacao

Para cada arquivo do codigo-fonte:

1. Pegue o caminho do arquivo (sem extensao, relativo).
2. Grep por esse caminho em imports no resto do projeto.
3. Se nao encontrar nenhuma importacao, e arquivo potencialmente orfao.

CUIDADOS:
- Entry points (main, index, app) nao sao importados mas sao usados.
- Scripts (`scripts/` ou `bin/`) podem ser rodados direto.
- Arquivos de config podem ser carregados dinamicamente.

### Categoria C — Componentes React/Vue/etc nao usados

Se for projeto frontend:

1. Identifique arquivos de componente (padrao do projeto, ex: `*.tsx`, `components/`).
2. Para cada nome de componente, grep por `<NomeDoComponente` ou `import ... NomeDoComponente`.
3. Se nao encontrado, candidato a remocao.

### Categoria D — Rotas nao referenciadas

Se o projeto tem rotas (Express, Fastify, Next, Rails, Django, FastAPI):

1. Liste as rotas definidas.
2. Para cada rota, grep pelo path no resto do projeto (inclusive frontend, se monolito; inclusive docs).
3. Rotas nao referenciadas podem estar mortas — ou podem ser acessadas apenas por clientes externos. Marque como "provavelmente morta, confirmar com usuarios externos".

### Categoria E — Feature flags desligadas ha muito tempo

Procure por padroes comuns de feature flag (`if (flag.X)`, `isEnabled('X')`, `FEATURE_X`). Para cada flag:

1. Onde e definida?
2. Esta ligada em producao atualmente? (voce nao sabe, mas marque como "verificar com ops")
3. Ha quanto tempo nao muda o valor default? (git blame da linha)

Flags desligadas por > 6 meses sao candidatas a remocao.

### Categoria F — Testes orfaos

Testes que:
1. Testam codigo que nao existe mais (importacao quebrada).
2. Usam helpers que nao sao usados em mais nenhum lugar.
3. Comecam com `.skip` ou `xit` ha muito tempo (git blame).

### Categoria G — Comentarios TODO/FIXME antigos

Com `git blame`, encontre comentarios `TODO:`, `FIXME:`, `XXX:` com > 1 ano. Esses raramente serao feitos. Avalie se o codigo relacionado pode ser limpo.

## Output esperado

Entregue `docs/claude/CODIGO-MORTO.md` com:

1. **Sumario** — quantidade por categoria
2. **Remocao segura (alta confianca)** — itens onde voce tem certeza
3. **Remocao provavel (media confianca)** — itens com 1 sinal de duvida
4. **Investigar** — itens com sinais ambiguos (ex: usado via string dinamica?)

Para cada item:
- Caminho (+ linhas se aplicavel)
- Categoria
- Evidencia do desuso (ex: "grep retornou 0 resultados em fora do proprio arquivo")
- Risco de remover (baixo/medio/alto)
- Comando para remover

## Regras rigidas

- Voce NAO remove nada nesta sessao. Apenas identifica.
- Nunca marque algo como "alta confianca" se voce teve qualquer sinal de duvida.
- Nao assuma que algo nao e usado so porque o nome e obscuro.
- Linguagens dinamicas (Python, Ruby, PHP) tem MUITO acesso dinamico. Seja conservador.
- Se houver uma ferramenta especializada disponivel no projeto (ts-prune, knip, deadcode-detector, vulture), sugira rodar antes. Ferramenta dedicada > heuristica manual.

Comece pela Categoria A.
```

---

## Variacoes e Ajustes

**Projeto com i18n dinamico:** strings traducao sao buscadas por chave dinamica. Nao considere o arquivo de traducoes como morto.

**Projeto com plugin system:** plugins podem ser carregados por string. Reforce "investigar" em vez de "remover".

**Monorepo:** rode por pacote, nao no monorepo inteiro. Imports entre pacotes complicam a analise.

---

## Dicas de uso

- Remova em waves. Primeiro "alta confianca", roda testes, commit. Depois "media confianca". Nunca tudo de uma vez.
- Cada wave e 1 PR. Facilita reverter se algo quebrar.
- Use ferramenta dedicada se existir (`knip` para JS/TS, `vulture` para Python). E mais confiavel.

## Sinal de que deu certo

Voce remove dezenas a centenas de linhas sem impacto funcional. O projeto fica mais leve e mais navegavel.

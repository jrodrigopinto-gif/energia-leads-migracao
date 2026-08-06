# Prompt 45 — Standup e Resumo Automatico de Sprint

**Categoria:** Produtividade Diaria
**Objetivo:** Gerar, em segundos, um relatorio de "o que voce fez ontem / o que vai fazer hoje" baseado em git, branches e contexto recente do projeto, para nao gastar 10 minutos toda manha pensando no que dizer no standup.
**Quando usar:** Antes de standup diario, weekly, retrospectiva, ou para preencher registro de timesheet.

---

## PROMPT

```
Quero um resumo do meu trabalho recente para usar em standup/relatorio. Investigue o git e me entregue um resumo enxuto.

## Parametros

- **Periodo:** [ontem / ultimos 3 dias / esta semana / sprint atual — escolha um]
- **Branchs:** [todas as minhas branches / so a atual / lista]
- **Para que serve:** [standup verbal de 1 min / weekly escrito / timesheet]

## Protocolo

### Etapa 1 — Identificar o autor

```
git config user.name
git config user.email
```

Sou eu. Use isso para filtrar.

### Etapa 2 — Coleta de commits

Para cada branch relevante:

```
git log --author="<meu nome ou email>" --since="<periodo>" --pretty=format:'%h %ad %s' --date=short
```

Liste os commits brutos.

### Etapa 3 — Branches ativas

```
git branch --sort=-committerdate | head -10
```

Identifique:
- Branches em que houve atividade no periodo
- Branch atual

### Etapa 4 — PRs (se gh disponivel)

```
gh pr list --author "@me" --state all --limit 20
```

Liste PRs:
- Abertos
- Mergeados no periodo
- Em review

### Etapa 5 — Issues (se gh disponivel)

```
gh issue list --assignee "@me" --state all --limit 10
```

Liste issues atribuidas, com estado.

### Etapa 6 — Sintese

Agrupe por TEMA, nao por commit. Exemplo:

- Em vez de "fix typo, add log, fix lint, add tests, add validation"
- Diga: "Implementacao da validacao de email no checkout (#234), com testes e ajustes de logging"

Cada tema:
- Estado (em progresso / em review / mergeado / bloqueado)
- 1 frase explicativa
- Link/ref do PR/issue se houver

### Etapa 7 — "Hoje vou..."

Baseado em:
- PRs abertos sem review action minha
- Issues atribuidas em "in progress"
- Branches recentes nao mergeadas

Proponha 3 itens de "para hoje". Marque cada um como [continuacao] ou [novo].

### Etapa 8 — Bloqueios

Detecte sinais de bloqueio:
- PR aguardando review ha > 2 dias
- Issue marcada como "blocked"
- Comentario recente em PR meu nao respondido

Liste como "bloqueios potenciais" — voce nao tem como confirmar mas eu posso.

## Formato de saida

```
## Standup [DATA]

### Ontem (ou periodo)
- [tema 1] — estado, 1 linha
- [tema 2] — estado, 1 linha

### Hoje
- [item 1]
- [item 2]
- [item 3]

### Bloqueios
- [bloqueio se houver, ou "nenhum"]
```

Maximo 15 linhas no total. Standup nao e ensaio teatral.

## Regras

- Nao invente progresso. So cite o que tem evidencia em git/PR/issue.
- Nao mencione commits irrelevantes (typo, format, merge automatico).
- Tempo verbal: passado simples para ontem, presente para hoje.
- Portugues do Brasil (a menos que o time seja em ingles).

Comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Standup escrito (Slack):** mantenha o formato. Adicione emojis se o time usa.

**Weekly mais longo:** peca tambem "principais aprendizados" e "destaques tecnicos" alem do basico.

**Retrospectiva:** peca contexto das ultimas 2 semanas, agrupado por "deu certo / deu errado / a melhorar".

---

## Dicas de uso

- Voce pode adicionar contexto manual antes de rodar (ex: "ontem tambem participei de uma reuniao sobre X"), o Claude incorpora.
- Cuidado com over-claim. Standup e nao-competitivo. Diga o que fez sem inflar.
- Bloqueios sao a parte mais importante de standup. Nao omita por vergonha.

## Sinal de que deu certo

Voce entra no standup com 3 frases prontas, sem precisar pensar. E fica mais visivel para o time o que voce esta efetivamente fazendo.

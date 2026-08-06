# 47 Prompts Avancados de Claude Code

Uma colecao de 47 prompts profissionais para voce extrair o maximo do Claude Code. Cada prompt foi desenhado para resolver um problema real: reduzir custo de tokens, aumentar assertividade, evitar erros comuns, aplicar boas praticas e acelerar tarefas de engenharia de software.

Estes nao sao prompts genericos. Sao prompts que assumem que voce usa Claude Code no dia-a-dia e quer resultado de nivel senior, sem retrabalho, sem alucinacao e sem explodir seu consumo de tokens.

---

## Como Usar

### Passo 1: Descompacte o ZIP

Descompacte `47-prompts-avancados-claude-code.zip` em qualquer pasta. Voce tera uma pasta raiz com 9 subpastas (categorias) e os 47 prompts distribuidos dentro delas.

### Passo 2: Escolha o prompt conforme a situacao

Cada prompt e um arquivo Markdown independente. Abra o arquivo, copie o bloco marcado como **PROMPT** e cole no Claude Code.

### Passo 3: Ajuste as variaveis

Todo prompt tem placeholders entre chaves `{assim}`. Substitua antes de enviar. Exemplos comuns: `{caminho-do-arquivo}`, `{nome-do-modulo}`, `{descricao-do-bug}`.

### Passo 4: Leia a secao "Variacoes e Ajustes"

Cada prompt tem uma secao mostrando como adaptar a diferentes contextos (TypeScript vs Python, monorepo vs repo unico, projeto legado vs greenfield, etc).

---

## Estrutura das 9 Categorias

### 01 — Setup e Fundamentos (prompts 01-05)

Como configurar o Claude Code para que ele ja comece com contexto correto do seu projeto. Eh aqui que se ganha ou perde qualidade nos primeiros 5 minutos.

- 01 Criar CLAUDE.md Perfeito para o Projeto
- 02 Estrutura Ideal de `.claude/` e Settings
- 03 Definir Scope, Limites e Guardrails
- 04 Onboarding do Claude em Projeto Existente
- 05 Configuracao de Hooks para Automacao Repetitiva

### 02 — Economia Inteligente de Tokens (prompts 06-11)

Prompts que reduzem 30-70% do consumo de tokens em tarefas tipicas sem perder qualidade. Voce paga menos e roda mais sessoes por dia.

- 06 Auditoria de Consumo de Tokens do Projeto
- 07 Estrategias Anti-Context-Bloat
- 08 Delegacao Cirurgica para Subagentes
- 09 Leitura Seletiva vs Leitura Completa de Arquivos
- 10 Reducao de Ruido em Tool Results
- 11 Caching e Reuso de Contexto Entre Sessoes

### 03 — Assertividade e Prevencao de Erros (prompts 12-18)

Como pedir tarefas ao Claude de um jeito que ele nao invente coisas, nao expande escopo, nao quebra o que nao precisa tocar.

- 12 Bug Fix Cirurgico (Zero Scope Creep)
- 13 Refatoracao Segura sem Quebrar Nada
- 14 Anti-Alucinacao: Verificacao Obrigatoria
- 15 Criterios de Aceitacao Explicitos
- 16 Anti-Over-Engineering
- 17 Prevencao de Acoes Destrutivas Acidentais
- 18 Checklist Pre-Execucao de Tarefa Critica

### 04 — Planejamento e Analise de Codebase (prompts 19-24)

Prompts para quando voce precisa entender um codigo antes de mexer. O antidoto para tacar a mao no codigo sem saber o que vai quebrar.

- 19 Plano de Implementacao Antes de Codar
- 20 Exploracao Sistematica de Codebase Desconhecido
- 21 Auditoria Arquitetural de Projeto Legado
- 22 Mapeamento Completo de Dependencias
- 23 Identificacao de Codigo Morto
- 24 Analise de Acoplamento e Coesao

### 05 — Qualidade, Testes e Seguranca (prompts 25-30)

Prompts para transformar o Claude em revisor de staff engineer, testador rigoroso e auditor de seguranca.

- 25 Code Review Profundo (Nivel Staff Engineer)
- 26 Testes Unitarios que Realmente Testam
- 27 Testes de Integracao sem Mocks Enganosos
- 28 Auditoria de Seguranca (OWASP Top 10)
- 29 Verificacao de Cobertura Real vs Aparente
- 30 Deteccao de Smells e Debito Tecnico

### 06 — Git, Commits e Colaboracao (prompts 31-35)

Prompts para trabalhar com git de forma segura, com mensagens de commit uteis e PRs que sao facilmente revisaveis.

- 31 Commit Messages Semanticamente Corretas
- 32 PR Descriptions que Facilitam Review
- 33 Resolucao Segura de Conflitos de Merge
- 34 Rebase Interativo sem Perder Trabalho
- 35 Investigacao Profunda via git log e git blame

### 07 — Debug Sistematico (prompts 36-40)

Prompts para debug estruturado: root cause ao inves de sintoma, bugs intermitentes, performance, memoria.

- 36 Debug por Root Cause (Nao por Sintoma)
- 37 Analise Profunda de Stack Trace
- 38 Reproducao de Bug Intermitente
- 39 Profiling de Performance
- 40 Caca ao Memory Leak

### 08 — Workflows Avancados (prompts 41-44)

Como usar subagentes, paralelismo, segundo par de olhos e pair programming com Claude.

- 41 Uso Correto de Subagentes Paralelos
- 42 Segundo Par de Olhos (Review Independente)
- 43 Red Team: Quebrar seu Proprio Codigo
- 44 Pair Programming Iterativo

### 09 — Produtividade Diaria (prompts 45-47)

Prompts curtos e praticos para o dia-a-dia. Standup, onboarding relampago e aprendizado guiado de codigo.

- 45 Standup e Resumo Automatico de Sprint
- 46 Onboarding Relampago em Repo Novo
- 47 Me Ensine Este Codigo (Aprendizado Guiado)

---

## Indice Rapido por Problema

| Seu problema | Prompts recomendados |
|---|---|
| Claude alucina ou inventa APIs | 14, 18, 25 |
| Claude muda mais do que eu pedi | 12, 16, 17 |
| Gasto muito token por sessao | 06, 07, 08, 09, 10 |
| Nao conheco o codebase | 19, 20, 22, 46 |
| Bug dificil de achar | 36, 37, 38, 39 |
| Medo de quebrar producao | 13, 17, 21, 43 |
| Pouca cobertura real de testes | 26, 27, 29 |
| Preciso de review rigoroso | 25, 28, 42, 43 |
| Git bagungado | 31, 32, 33, 34, 35 |

---

## Suporte

Duvidas? Entre em contato pelo suporte da area de membros.

Feito com carinho pela **Bravy**.

# LEIA PRIMEIRO — Como tirar o maximo destes 47 prompts

Bem-vindo ao **47 Prompts Avancados de Claude Code**. Antes de sair usando, leia esta pagina. Sao 5 minutos que vao multiplicar o valor que voce extrai do material.

---

## O que voce tem em maos

47 prompts profissionais distribuidos em 9 categorias. Cada prompt e:

- **Auto-contido**: voce nao precisa ler outro para usar.
- **Pronto para copiar e colar**: o bloco marcado como `## PROMPT` esta formatado para ir direto ao Claude Code.
- **Comentado em portugues**: contexto, variacoes, dicas e sinais de que deu certo.

Os prompts NAO sao truques magicos. Eles sao prompts ENGENHEIRADOS — instrucoes pensadas para ativar comportamentos do Claude que reduzem erro, economizam tokens e aumentam previsibilidade.

---

## Como cada prompt esta organizado

Todo arquivo segue a mesma estrutura:

1. **Titulo + Categoria + Objetivo + Quando usar** — voce decide em 10 segundos se e o prompt certo.
2. **Por que este prompt existe** — explica o problema que ele resolve. Pule se ja entendeu.
3. **PROMPT** — o bloco copiavel. Substitua os placeholders entre `{chaves}` ou `[colchetes]` pelos seus dados antes de enviar.
4. **Variacoes e Ajustes** — como adaptar a contextos diferentes (TS vs Python, monorepo, projeto legado, etc).
5. **Dicas de uso** — boas praticas para extrair mais valor.
6. **Sinal de que deu certo** — como saber, depois de usar, se funcionou.

---

## Como usar bem (3 regras)

### Regra 1 — Nao use prompt errado para problema certo

Cada prompt foi feito para um tipo de situacao especifica. Forcar o prompt 12 (Bug Fix Cirurgico) para fazer um refactor nao funciona — use o 13. Forcar o prompt 19 (Plano antes de codar) para um typo e overkill — use o 12 ou 46.

Use o **indice por problema** no `README.md` para escolher o prompt certo.

### Regra 2 — Sempre adapte os placeholders

Os prompts tem placeholders entre `{chaves}` ou `[colchetes]` ou marcacoes tipo `[COLE AQUI ...]`. Voce TEM que substituir antes de enviar. Mandar o prompt cru, com placeholder, anula o valor.

### Regra 3 — Combine prompts

Os melhores resultados vem de combinar 2-3 prompts em sequencia. Exemplos:

- **Bug critico em producao**: Prompt 18 (Checklist pre-execucao) → Prompt 36 (Root cause) → Prompt 12 (Fix cirurgico) → Prompt 25 (Code review profundo).
- **Refactor grande**: Prompt 21 (Auditoria arquitetural) → Prompt 19 (Plano) → Prompt 13 (Refactor seguro) → Prompt 42 (Segundo par de olhos).
- **Novo projeto, primeiro dia**: Prompt 04 (Onboarding) → Prompt 01 (CLAUDE.md) → Prompt 02 (.claude/) → Prompt 03 (Guardrails).
- **Reduzir custo de tokens cronico**: Prompt 06 (Auditoria de tokens) → Prompt 09 (Leitura seletiva) → Prompt 11 (Cache de contexto).

---

## A ordem que recomendamos para comecar

Se voce nunca usou nenhum destes prompts, comece pelos 5 que dao maior retorno imediato:

1. **Prompt 01 — Criar CLAUDE.md Perfeito** → resolve a base de tudo.
2. **Prompt 17 — Prevencao de Acoes Destrutivas** → instala seguranca para o resto.
3. **Prompt 12 — Bug Fix Cirurgico** → vai usar todo dia.
4. **Prompt 19 — Plano Antes de Codar** → vai mudar como voce pede features.
5. **Prompt 14 — Anti-Alucinacao** → reduz o tipo de erro mais frustrante.

Esses 5 ja transformam significativamente sua experiencia. Com eles na mao, va explorando os outros conforme as necessidades aparecerem.

---

## Versionamento e atualizacao

Esses prompts foram testados em campo, mas o Claude Code evolui. Se voce notar algo que nao funciona como descrito, ou se descobrir uma melhoria, registre — boas observacoes viram a proxima versao do material.

---

## Erros comuns ao usar

1. **Mandar prompt sem substituir placeholders** — leia antes de enviar.
2. **Usar prompt longo em sessao ja com contexto pesado** — comece sessao limpa para os prompts maiores.
3. **Nao seguir as variacoes** — projeto Python recebe prompt feito para JS sem ajuste = resultado fraco.
4. **Pular o passo de aprovacao** — varios prompts pedem para o Claude pausar e aguardar voce. Esses passos existem por um motivo. Nao force "vai logo".
5. **Ignorar o "Sinal de que deu certo"** — esse e o seu termometro. Se o sinal nao apareceu, o prompt nao cumpriu o papel — investigue.

---

## Suporte

Duvidas? Entre em contato pelo suporte da area de membros.

Bom proveito.

— **Bravy**

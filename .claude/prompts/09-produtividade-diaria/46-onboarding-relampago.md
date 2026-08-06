# Prompt 46 — Onboarding Relampago em Repo Novo

**Categoria:** Produtividade Diaria
**Objetivo:** Conseguir, em 10 minutos, o suficiente para comecar a trabalhar em um repo que voce nunca viu — sem fazer onboarding completo (Prompt 04). Foco em "rodar o projeto e fazer a primeira mudanca".
**Quando usar:** Voce acabou de clonar um repo e precisa fazer 1 pequena mudanca rapidamente — sem tempo de fazer um onboarding profundo.

---

## PROMPT

```
Acabei de clonar este repo. Nao tenho contexto. Preciso conseguir 3 coisas em 10 minutos:

1. Saber o que e o projeto (1 paragrafo)
2. Saber como rodar localmente
3. Saber onde fazer a mudanca que vou pedir

## Tarefa que vou pedir

[DESCREVA EM 1-2 LINHAS A MUDANCA QUE VOCE QUER FAZER]

## Protocolo

### Etapa 1 — Identidade do projeto (max 3 reads)

Leia, em paralelo:
- `README.md`
- `package.json` / `pyproject.toml` / equivalente
- `Makefile` ou `scripts/` se houver

Me diga em 5 linhas:
- O que e o projeto
- Linguagem/framework
- Como rodar (comando exato)
- Como rodar testes (comando exato)
- Algum gotcha visivel ja na primeira leitura

### Etapa 2 — Onde mexer

Para a mudanca que eu pedi, faca Grep para localizar o ponto provavel:
- Se for mudanca em rota, grep pelo path
- Se for mudanca em mensagem de erro, grep pela string
- Se for mudanca de feature, grep por palavras-chave do dominio
- Se for mudanca de schema, grep pelo nome do campo

Liste os 3-5 arquivos mais provaveis. Para cada um, 1 linha de descricao.

### Etapa 3 — Confirmar com o usuario

NAO comece a editar. Pergunte:

"Achei estes arquivos relevantes: [lista]. O lugar de mudanca e [seu palpite]?"

E aguarde minha confirmacao. Eu posso saber algo que voce nao sabe.

### Etapa 4 — Aplicar a mudanca minima

Com confirmacao, aplique a mudanca seguindo as regras do Prompt 12 (bug fix cirurgico):
- So o necessario
- Nada de refactor lateral
- Sem extrapolar escopo

### Etapa 5 — Verificar

Rode:
- Lint do arquivo
- Typecheck (se houver)
- Teste relacionado (se houver e for rapido)

Se algo quebra, mostre o erro. Nao tente "corrigir corrigindo de novo" sem entender.

### Etapa 6 — Resumir

Ao terminar, em 5 linhas:
- O que mudou (arquivo:linha)
- Por que
- O que voce NAO sabe sobre o projeto (e que talvez devesse saber em uma proxima sessao)

## Regras

- Maximo 10 reads na sessao inteira.
- Nao explore alem do necessario para a tarefa.
- Nao tente entender a arquitetura completa. Voce so precisa do bastante para esta mudanca.
- Se a tarefa parece exigir mais contexto do que voce tem, AVISE: "essa mudanca exige entender X, Y, Z. Vale fazer um onboarding mais completo (Prompt 04) antes."
- Portugues do Brasil.

Comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Mudanca trivial (typo, mensagem, constante):** corte tudo, va direto ao Grep + Edit. Nao precisa de Etapa 1.

**Mudanca media (adicionar campo, adicionar validacao):** mantenha o protocolo completo.

**Mudanca grande:** NAO use este prompt. Use Prompt 04 (onboarding completo) + Prompt 19 (planejamento) primeiro.

---

## Dicas de uso

- Este prompt e o oposto do Prompt 04 — propositalmente raso. Nao confunda os dois.
- Resista a tentacao de explorar tudo. Disciplina aqui economiza tempo.
- Se voce precisa fazer 5 mudancas no mesmo repo, faca o onboarding completo de uma vez, vale mais.

## Sinal de que deu certo

Em < 15 minutos voce abriu, mudou e validou um repo desconhecido. Sem ter explorado 50 arquivos.

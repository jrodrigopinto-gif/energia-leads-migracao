# Prompt 17 — Prevencao de Acoes Destrutivas Acidentais

**Categoria:** Assertividade e Prevencao de Erros
**Objetivo:** Estabelecer um protocolo explicito para toda acao irreversivel (remover arquivos, dropar tabelas, force push, deletar branches, rodar comandos de producao, chamar APIs pagas) — nada acontece sem dupla confirmacao e explicacao de impacto.
**Quando usar:** Em qualquer projeto real. Sempre. Deveria estar no `CLAUDE.md` de todos os projetos serios.

---

## Por que este prompt existe

A maioria dos acidentes catastroficos com IA em desenvolvimento tem o mesmo padrao: o modelo executou um comando destrutivo "porque parecia fazer sentido no fluxo". `rm -rf`, `git reset --hard`, `DROP TABLE`, `git push --force` em `main`. O humano estava fazendo outra coisa e aprovou rapido.

Este prompt cria atrito deliberado em acoes destrutivas. Atrito intencional. Voce vai sentir. E e exatamente isso que voce quer.

---

## PROMPT

```
Nesta sessao, voce vai adotar um protocolo de SEGURANCA para acoes destrutivas. Inegociavel.

## Categorias de acao

### Categoria VERDE — pode fazer livremente

- Ler arquivos
- Editar arquivos (reversivel via git)
- Criar arquivos novos
- Rodar testes, lint, typecheck, build
- Git status, diff, log, branch (leitura)

### Categoria AMARELA — precisa avisar antes

- `git add` / `git commit` (avise o que vai commitar)
- Criar branch nova
- Instalar dependencia (`npm install X`)
- Rodar migracao de banco em DEV local
- Criar arquivo em pasta fora do escopo obvio (fora de src/, tests/, docs/)

Protocolo: voce diz "vou fazer X (acao amarela), ok?" e espera minha resposta.

### Categoria VERMELHA — dupla confirmacao + explicacao de impacto

- `rm` de arquivos ou pastas (qualquer quantidade)
- `git push` (qualquer push, mesmo sem force)
- `git reset --hard`, `git clean -fd`, `git checkout --`
- `git rebase -i` (nunca rode; rebase interativo precisa de TTY)
- Qualquer `git ... --force`
- `git branch -D`
- Drop/truncate de tabela em qualquer banco
- Migracao de banco em STAGING ou PROD
- Chamadas a APIs pagas (OpenAI, Anthropic, Stripe, SendGrid, etc)
- Envio de email, SMS, notificacao
- Mudanca em `.github/workflows/`
- Edicao de `package.json` na sessao `dependencies`
- Remocao de imports de grande volume
- Qualquer comando que toque `/etc/`, `/usr/`, fora do projeto

Protocolo rigido para cada acao vermelha:

1. **Anuncie**: "vou executar acao VERMELHA: [comando exato]"
2. **Explique o impacto**: "isso vai [consequencia em 1 linha]. E reversivel? Sim/Nao. Como reverter: [como]."
3. **Peca confirmacao explicita**: "confirma? (responda 'sim, pode') "
4. **Aguarde** minha resposta textual. NAO interprete silencio ou frases neutras como consentimento.
5. **Se eu disser 'pode'**, execute. Se eu disser qualquer outra coisa, NAO execute.

### Categoria PRETA — voce nao executa, jamais, nem com permissao

- Force push em `main`, `master`, `production`, `release/*`
- Rodar comandos contra banco de producao (qualquer `DROP`, `DELETE`, `UPDATE` sem `WHERE` claro)
- Envio de email em massa
- Desabilitar hooks (`--no-verify`)
- Commit de secrets (`.env`, chaves privadas, tokens)
- Sobrescrever trabalho nao commitado do usuario
- Deletar branches que contem trabalho nao mergeado
- Comandos que usem `curl` ou `wget` para rodar scripts de internet (`curl X | sh`)

Se eu pedir acao PRETA, voce responde: "isso esta na categoria PRETA. Nao vou executar. Se voce tem certeza, faca voce mesmo em um terminal separado."

## Comportamento em duvida

Se voce nao sabe em qual categoria uma acao esta, considere AMARELA por padrao. Nunca presuma VERDE.

## Resposta a "pode ir matando"

Se eu disser algo tipo "pode ir matando", "pode fazer tudo", "confio em voce, vai", isso autoriza acoes VERDES e AMARELAS, mas NAO autoriza acoes VERMELHAS em bloco. Cada vermelha ainda precisa de confirmacao individual.

## Confirme

Responda "protocolo de seguranca ativo" e aguarde a tarefa.
```

---

## Variacoes e Ajustes

**Projeto solo, arquivos pessoais:** pode relaxar a categoria amarela, mas nunca a vermelha.

**Projeto com CI que faz deploys automaticos a partir de push:** tudo que leva a push vira vermelho, porque push = deploy.

**Acesso a APIs pagas frequentes:** defina um limite (ex: "ate 100 requests por sessao em dev"); acima disso, viram vermelho.

---

## Dicas de uso

- Coloque uma versao compacta desta tabela no `CLAUDE.md` de todo projeto que for alem de hobby.
- Quando o Claude perguntar "confirma?", NAO aprove no automatico. Leia o comando. Se parece errado, reprove.
- Se voce se pegou aprovando tudo sem ler, considere configurar `.claude/settings.json` com `permissions.deny` para reforcar.

## Sinal de que deu certo

Voce nunca mais tem aquele momento "pera, por que ele fez isso?!" em que o Claude apagou um arquivo ou forcou um push. A sessao pode ficar um pouco mais lenta. E exatamente o que deve.

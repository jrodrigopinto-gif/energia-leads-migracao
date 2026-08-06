# Prompt 28 — Auditoria de Seguranca (OWASP Top 10)

**Categoria:** Qualidade, Testes e Seguranca
**Objetivo:** Rodar uma auditoria pragmatica orientada ao OWASP Top 10 (web) sobre o projeto ou um diff, identificando achados concretos com arquivo:linha, nao alertas genericos de livro.
**Quando usar:** Antes de lancar em producao, antes de abrir acesso publico, periodicamente em projetos criticos, ou apos mudancas em areas sensiveis (auth, billing, upload, acesso a dados).

---

## PROMPT

```
Voce vai fazer uma auditoria de seguranca orientada pelo OWASP Top 10 neste projeto (ou no diff indicado). Seja pragmatico: quero achados reais com caminho:linha, nao uma lista generica.

## Escopo

[Especifique: "todo o projeto", "diff HEAD~5..HEAD", "apenas src/auth/", etc.]

## Categorias a investigar (OWASP Top 10 focadas no que tipicamente aparece em code review)

### A01 — Broken Access Control

Investigue:
- Endpoints sem verificacao de autenticacao explicita
- Endpoints que verificam auth mas nao autorizacao (usuario pode acessar recursos de outro)
- IDOR (Insecure Direct Object Reference) — aceita id no path/body sem checar ownership
- Escalacao horizontal/vertical de privilegio
- Rotas admin sem proteger

Procure por: handlers, middlewares, decorators de auth, uso de ids vindos do usuario.

### A02 — Cryptographic Failures

- Secrets hardcoded no codigo (grep por "password", "secret", "api_key", "private_key")
- Uso de MD5/SHA1 para hash de senha
- Randomico nao criptografico para tokens (`Math.random()` para gerar token)
- TLS desativado
- Cookies sem Secure/HttpOnly/SameSite quando deveriam

### A03 — Injection

- SQL concatenada ou template string sem prepared statement
- Mongoose/Prisma com `$where` ou similares
- Shell injection (`exec`, `spawn` com input do usuario)
- XSS (HTML renderizado com dados do usuario sem escape)
- LDAP/NoSQL/XPath injection
- Template injection (render template com dados do usuario)

### A04 — Insecure Design

- Flows que permitem bypass logico (ex: confirmar email sem provar posse)
- Reset de senha com token previsivel
- Funcionalidades de conveniencia que abrem brecha (ex: "lembrar tudo")

### A05 — Security Misconfiguration

- CORS com `*` onde nao deveria
- Express com `x-powered-by` habilitado
- Debug mode ativo em producao
- Portas expostas sem necessidade
- Headers de seguranca ausentes (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)

### A06 — Vulnerable Components

- Dependencias com CVE conhecido (se ha `npm audit` / `pip-audit`, sugira rodar)
- Dependencias abandonadas (ver Prompt 22)
- Versao congelada antiga de framework sensivel

### A07 — Identification and Authentication Failures

- Politica de senha fraca (aceita "123")
- Nao limita tentativas (brute force)
- Tokens sem expiracao
- Session fixation
- Remember me inseguro

### A08 — Software and Data Integrity Failures

- `eval` ou equivalente em input do usuario
- Deserializacao insegura (unpickle, yaml.load sem safe)
- Update automatic de pacotes sem verificacao
- Carga de scripts de terceiros sem integrity check

### A09 — Logging and Monitoring

- Senhas/tokens em log
- PII em log sem mascaramento
- Erros silenciados
- Falta de log em eventos criticos (login, mudanca de permissao, acesso negado)

### A10 — SSRF

- Requests HTTP em que URL vem do usuario (direto ou indireto)
- Webhooks e callbacks sem validacao de host

## Protocolo

### Etapa 1 — Mapear superficie

Antes de investigar, identifique:
- Onde entra dado do usuario (rotas, webhooks, forms, uploads)
- Onde ha acesso a banco (services, repositorios)
- Onde ha chamadas externas (integracao, webhook out)
- Onde ha auth/authz (middlewares, decorators)

### Etapa 2 — Investigar por categoria

Para cada categoria OWASP, faca grep focado. Ex:
- SQL injection: `grep -rE '\\$\\{.*\\}' src/ | grep -i 'query\\|execute'`
- Secrets hardcoded: `grep -rE 'password\\s*=|api_?key\\s*=|secret\\s*='`
- CORS *: `grep -rE 'Access-Control-Allow-Origin.*\\*'`

### Etapa 3 — Achados

Para CADA achado, produza:

- **Categoria** (A01-A10)
- **Arquivo:linha**
- **Trecho** (1-5 linhas)
- **O que esta errado**
- **Cenario de ataque** (como seria explorado)
- **Severidade** (critica/alta/media/baixa)
- **Correcao sugerida** (1-3 linhas)

### Etapa 4 — Falsos positivos

Se voce tem DUVIDA se um achado e real ou falso positivo, marque como "a confirmar" e explique a duvida. Nao invente achado.

### Etapa 5 — Relatorio

Entregue `docs/claude/SEGURANCA.md` com:

1. **Sumario executivo** — criticos/altos/medios/baixos em numeros
2. **Criticos** (bloqueiam producao ate corrigir)
3. **Altos** (corrigir nesta semana)
4. **Medios** (entrar no backlog)
5. **Baixos** (opcional)
6. **A confirmar** (voce nao teve certeza, pede verificacao humana)

## Regras

- Nao copie a lista do OWASP sem mapear para o codigo real. Categorias sem achado sao declaradas como "sem achados nesta categoria".
- Nao marque como "critico" sem demonstrar cenario de ataque.
- Priorize achados em codigo DE PRODUCAO. Ignore `tests/` e `scripts/` dev.
- Nao rode nenhum exploit. So identifica.

Comece pela Etapa 1.
```

---

## Variacoes e Ajustes

**Projeto nao web (CLI, data pipeline):** ajuste — ignore A03 (XSS), A10 (SSRF) se nao ha rede externa, mas reforce A02 (cripto), A08 (integridade) e A09 (logging).

**Projeto mobile:** adicione "vazamento de chave em bundle", "pinning de certificado", "storage seguro".

**Projeto com muitas integracoes:** reforce A10 (SSRF) e validacao de webhooks entrantes.

---

## Dicas de uso

- Rode esta auditoria antes de ir para producao pela primeira vez. E tambem a cada 6 meses.
- Ferramentas automatizadas (Semgrep, Snyk Code, CodeQL) sao complementares. Use ambos.
- Se o Claude sugerir correcao, NAO aplique direto — entenda primeiro. Seguranca e armadilha.

## Sinal de que deu certo

Voce acha pelo menos 1 achado real em 80% das auditorias. Se sempre vem zero, reveja se a auditoria foi superficial.

# Energia Leads Migração

Aplicativo para encontrar grandes e médios consumidores de energia (Grupo A)
que **ainda estão no mercado cativo**, para uso como lista de leads de
migração para o mercado livre de energia.

## Como funciona (e por que não é um cruzamento direto CCEE x ANEEL)

A ideia inicial era cruzar dois cadastros públicos:

- **CCEE** (migrados para o mercado livre) — dataset `VAREJISTA_CONSUMIDOR`
  em [dadosabertos.ccee.org.br](https://dadosabertos.ccee.org.br/dataset/varejista_consumidor).
  Público **e identificado** (razão social/CNPJ), porque virar agente da CCEE
  é um cadastro público.
- **ANEEL** (consumidores cativos) — base **BDGD** em
  [dadosabertos.aneel.gov.br](https://dadosabertos.aneel.gov.br/dataset/base-de-dados-geografica-da-distribuidora-bdgd),
  arquivo `UCAT_PJ.csv` (unidades consumidoras de alta tensão, pessoa jurídica).

O problema: por LGPD e sigilo comercial, a **BDGD não identifica o
consumidor** (nome/CNPJ) — só traz um código interno da unidade consumidora,
subgrupo tarifário, demanda contratada etc. Não existe, hoje, uma lista
pública com nome de "quem é cativo".

**Solução adotada:** em vez de "cruzar 2 bases com nome", o app **constrói um
universo de candidatos** a grande/médio consumidor (empresas de setores
intensivos em energia — indústria de base, shoppings, hospitais, data
centers, supermercados etc., filtrando a base pública de CNPJ da Receita
Federal por CNAE + porte) e depois **exclui quem já aparece como migrado**
na base da CCEE. Quem sobra é o lead: uma empresa com perfil de grande/médio
consumidor que não aparece como tendo migrado — **provavelmente ainda
cativa**.

> ⚠️ **Isso é uma aproximação, não uma confirmação técnica.** O app não
> acessa o subgrupo tarifário real (A1-A4) de cada empresa nem confirma
> demanda contratada — é um proxy por atividade econômica (CNAE) e porte.
> Use como lista de prospecção, não como certeza de elegibilidade.

## Fontes de dados

| Fonte | Dataset | Conteúdo | Identificado? |
|---|---|---|---|
| CCEE | `VAREJISTA_CONSUMIDOR` (CKAN API) | Consumidores já migrados para o mercado livre | Sim (razão social/CNPJ) |
| Receita Federal | Dados Abertos do CNPJ (`Estabelecimentos*.zip` + `Empresas*.zip`) | Universo de empresas ativas por CNAE/UF/porte, com telefone/e-mail/endereço completo | Sim |
| ANEEL — SIGA Geração Distribuída | CKAN API | Consumidores PJ com geração própria (mini/microgeração, autoprodução) | Sim (CNPJ do titular) |
| ANEEL (BDGD) | — | Não usada para identificação (dados anonimizados) — ver ressalva acima | Não |
| BrasilAPI | `GET /api/cep/v2/{cep}` | Latitude/longitude a partir do CEP (não todo CEP tem coordenadas) | N/A (geocodificação, não identificação) |

A lista de CNAEs usada para montar o universo de candidatos fica em
[`src/config/cnae.ts`](./src/config/cnae.ts) — edite/expanda conforme o
perfil de cliente que você quer prospectar. A lista atual cobre ~90 CNAEs de
setores intensivos em energia (mineração, siderurgia, química, papel e
celulose, agroindústria, cerâmica/vidro, shopping centers, hospitais, data
centers, aeroportos etc.) — deliberadamente mais ampla que a lista original,
para reduzir o número de empresas Grupo A que ficam de fora do universo.

### Correções desta atualização (dados de contato/localização e cobertura)

- **Telefone, e-mail e endereço completo agora vêm direto da RFB** (campos
  oficiais `ddd1`/`telefone1`, `correioEletronico`, `logradouro`/`numero`/
  `complemento`/`bairro`/`cep` do cadastro de Estabelecimentos), em vez de uma
  fonte de enriquecimento de terceiros — isso é o que corrige inconsistências
  de telefone/localidade vistas em listas geradas por planilhas
  manuais/enriquecidas externamente.
- O CNPJ completo do candidato agora usa a ordem/DV reais do estabelecimento
  **matriz** (antes usava um sufixo fixo `000100`, que podia gerar CNPJ
  inválido/incorreto quando a matriz não era a filial `0001`).
- A lista de CNAEs foi ampliada de 24 para ~90 códigos, cobrindo mais setores
  de perfil Grupo A (antes faltavam mineração, siderurgia completa, química
  pesada, têxtil/couro, hotelaria de grande porte, universidades, aeroportos
  etc.), o que deve trazer bem mais empresas para o universo de candidatos.
- Nova fonte **ANEEL SIGA-GD** identifica geração própria por CNPJ (diferente
  da BDGD, que é anonimizada). Cada lead agora traz `status`
  (`cativo` / `geracao_propria`) e o dashboard mostra um card e um selo por
  linha — assim você não confunde "ainda não migrou" com "já tem geração
  própria reduzindo consumo da rede".

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Prisma + SQLite (dev). Para produção, troque o `DATABASE_URL` para Postgres
  e ajuste o `datasource` em `prisma/schema.prisma`.

## Rodando localmente

```bash
npm install
npx prisma migrate dev
npm run db:seed   # popula com dados de EXEMPLO (fictícios) para ver o dashboard
npm run dev
```

Abra http://localhost:3000.

## Sincronizando com dados reais

### CCEE (migrados) — rápido, dataset pequeno

```bash
npm run sync:ccee
```

Ou pelo botão "Sincronizar" no dashboard (chama `POST /api/sync/ccee`).

### ANEEL SIGA-GD (geração própria) — rápido

```bash
npm run sync:siga
```

Ou pelo botão "Sincronizar" no dashboard (chama `POST /api/sync/siga`).
⚠️ Confirme o slug do dataset em
[dadosabertos.aneel.gov.br/dataset](https://dadosabertos.aneel.gov.br/dataset)
antes do primeiro sync — o nome exato (`ANEEL_GD_DATASET`) já mudou entre
publicações do portal.

### Geocodificação (CEP → latitude/longitude) — via BrasilAPI, sem chave

```bash
npm run geocode
```

Ou pelo botão "Geocodificar" no dashboard (chama `POST /api/geocode`, lote de
200 por vez para não estourar timeout). Roda **depois** do `sync:rfb`, já que
usa o CEP persistido nos candidatos. Resultados de CEP ficam em cache
(`CepGeocode`) — candidatos que compartilham CEP (comum em distritos
industriais/shoppings) não repetem a consulta. Nem todo CEP tem coordenadas
na BrasilAPI; nesse caso o candidato fica marcado como já processado
(`geocodedAt` preenchido) mas sem lat/lng, e não é reconsultado à toa.

Variável de ambiente opcional: `BRASILAPI_BASE_URL` (default:
`https://brasilapi.com.br/api`).

### Receita Federal (universo de candidatos) — pesado

```bash
npm run sync:rfb
```

⚠️ **Importante:** este sync baixa e processa em streaming dezenas de GB de
dados (todos os `Estabelecimentos*.zip` + `Empresas*.zip` do país, filtrando
por CNAE). Pode levar **horas** dependendo da banda disponível. Rode como job
de background/cron em um servidor com boa conexão e disco — **não** dispare
pelo botão do dashboard em produção (o endpoint HTTP existe por
conveniência/dev, mas serverless functions têm timeout curto demais para o
volume completo). Ajuste a lista de CNAEs em `src/config/cnae.ts` para
reduzir o volume se quiser rodar mais rápido.

Variáveis de ambiente opcionais:

- `RFB_BASE_URL` — base do portal de dados abertos (default:
  `https://dadosabertos.rfb.gov.br/CNPJ/dados_abertos_cnpj`)
- `RFB_MONTH` — força uma pasta específica (ex: `2026-06`) em vez de
  descobrir automaticamente a mais recente
- `CCEE_BASE_URL` — base do portal CKAN da CCEE (default:
  `https://dadosabertos.ccee.org.br`)
- `ANEEL_BASE_URL` — base do portal CKAN da ANEEL (default:
  `https://dadosabertos.aneel.gov.br`)
- `ANEEL_GD_DATASET` — slug do dataset SIGA-GD (default:
  `siga-geracao-distribuida` — confirme antes de usar, ver acima)

### Nota sobre este ambiente de desenvolvimento

Os syncs reais (CCEE/RFB/ANEEL) **não foram executados durante o
desenvolvimento** deste app porque o sandbox onde ele foi construído
(Claude Code on the web) usa uma política de rede de *allowlist*: só libera
saída para um conjunto fixo de domínios (registry npm, GitHub API, API da
Anthropic etc.) e bloqueia todo o resto — não é específico de `.gov.br`,
foi testado até contra `example.com` e `receitaws.com.br` e ambos foram
recusados pelo proxy do ambiente (HTTP 403 no `CONNECT`). Ou seja: **não é
um problema de autenticação/chave de API** — nenhuma chave resolve um
domínio bloqueado na política de rede.

Testado também nos dois ambientes "Default" disponíveis nesta conta — ambos
com o mesmo bloqueio, então não é peculiaridade de uma sessão específica.

O código de ingestão segue os formatos oficiais documentados dessas bases e
está pronto para rodar assim que a rede for liberada. Três formas de
resolver:

1. **GitHub Actions** (recomendado, não precisa de máquina própria) — ver
   seção "Rodando via GitHub Actions" abaixo.
2. **Rodar fora deste ambiente** — sua máquina, um servidor, ou uma sessão
   local do Claude Code sem essa restrição de rede.
3. **Liberar os domínios na política de rede do ambiente** (em
   claude.ai/code, ao criar/editar o ambiente — ver
   [docs](https://code.claude.com/docs/en/claude-code-on-the-web)). Domínios
   usados por este app:

   | Domínio | Usado por |
   |---|---|
   | `dadosabertos.ccee.org.br` | `sync:ccee` |
   | `dadosabertos.rfb.gov.br` | `sync:rfb` |
   | `dadosabertos.aneel.gov.br` | `sync:siga` |
   | `brasilapi.com.br` | `geocode` (CEP → lat/lng) |
   | `receitaws.com.br` (opcional) | fallback de consulta CNPJ sem chave, ver abaixo |
   | `viacep.com.br` (opcional) | fallback/validação de CEP sem chave, ver abaixo |

Vale rodar `npm run sync:ccee` uma vez em um ambiente com acesso antes de
confiar 100% no parser (o layout do CSV da CCEE já mudou de formato entre
publicações, e o código tenta reconhecer colunas por nome parcial para ser
resiliente a isso, mas confirme com uma execução real).

### Outras fontes sem chave (mapeadas, não usadas ainda)

Não substituem a RFB para montar o universo completo (são consulta unitária
por CNPJ/CEP, não bulk download), mas servem para validar/enriquecer
pontualmente um lead específico sem precisar de chave de API paga:

- [BrasilAPI](https://brasilapi.com.br) — `GET /api/cnpj/v1/{cnpj}` (dados
  cadastrais + endereço, útil para checar se um lead mudou de endereço desde
  o último `sync:rfb`); `GET /api/cep/v2/{cep}` já é usado pelo `geocode`.
- [ReceitaWS](https://receitaws.com.br) — `GET /v1/cnpj/{cnpj}`, alternativa
  à BrasilAPI para dados cadastrais por CNPJ (limite de requisições no plano
  gratuito).
- [ViaCEP](https://viacep.com.br) — `GET /ws/{cep}/json/`, endereço a partir
  do CEP (sem latitude/longitude).

## Rodando via GitHub Actions (sem precisar de máquina própria)

Runners do GitHub têm acesso irrestrito à internet — não têm a restrição de
rede de ambientes Claude Code on the web citada acima. O workflow
[`.github/workflows/sync-energia.yml`](.github/workflows/sync-energia.yml)
roda os 4 syncs lá.

**Configuração (uma vez só):**

1. Suba um Postgres acessível pela internet. Qualquer um destes tem tier
   gratuito suficiente para este app: [Supabase](https://supabase.com),
   [Neon](https://neon.tech), [Railway](https://railway.app). Copie a
   connection string (formato `postgresql://usuario:senha@host:porta/banco`).
2. No repositório no GitHub: **Settings → Secrets and variables → Actions →
   New repository secret**, nome `DATABASE_URL`, valor a connection string
   do passo 1.
3. (Opcional) Em **Variables** na mesma tela, adicione `RFB_MONTH` ou
   `ANEEL_GD_DATASET` se precisar sobrescrever os defaults (ver variáveis de
   ambiente acima).

**Uso:**

- **Manual**: aba **Actions** → workflow "Sincronizar dados de energia" →
  **Run workflow** → escolha `ccee`, `siga`, `geocode`, `rfb` ou `todos`.
  Rode `rfb` primeiro isoladamente na primeira vez (pode levar horas — o
  workflow tem timeout de 6h) antes de rodar `geocode`.
- **Automático**: todo dia 1 do mês às 06:00 UTC, o workflow roda `ccee` +
  `siga` + `geocode` sozinho (o `rfb` fica de fora do agendamento por ser
  pesado — dispare manualmente quando quiser atualizar o universo completo,
  ex: trimestralmente).
- Acompanhe o resultado na aba **Actions**; os logs de cada step mostram
  quantos registros foram processados (o mesmo que apareceria no
  `SyncLog`/dashboard).

Depois de rodar, veja os dados com `npm run dev` local apontando o
`DATABASE_URL` para o mesmo Postgres, ou exportando CSV direto do banco.

## Estrutura

```
.github/workflows/
  sync-energia.yml     # roda os syncs num runner do GitHub (sem restrição de rede)
src/
  app/                 # páginas e rotas de API (App Router)
    api/sync/ccee       # POST — dispara sync CCEE
    api/sync/rfb        # POST — dispara sync RFB
    api/sync/siga       # POST — dispara sync ANEEL SIGA-GD (geração própria)
    api/geocode         # POST — geocodifica candidatos pendentes (CEP → lat/lng)
    api/leads           # GET — lista/filtra/exporta leads (?format=csv)
    api/stats           # GET — estatísticas do dashboard
  config/cnae.ts        # lista de CNAEs "grande/médio consumidor" (~90 códigos)
  lib/
    ccee.ts             # ingestão CCEE (CKAN API)
    rfb.ts              # ingestão RFB (streaming zip/csv) — inclui telefone/e-mail/endereço
    rfbLayout.ts         # parsing dos layouts de Estabelecimentos/Empresas
    siga.ts             # ingestão ANEEL SIGA-GD (CKAN API) — geração própria identificada
    geocode.ts          # geocodificação de CEP via BrasilAPI, com cache em CepGeocode
    leads.ts            # lógica de cruzamento (candidatos - migrados, + status de geração própria)
    cnpj.ts             # normalização de CNPJ / CNPJ raiz
prisma/
  schema.prisma         # CandidateCompany, MigratedConsumer, SelfGenerationConsumer, CepGeocode, SyncLog
  seed.ts               # dados de exemplo fictícios
scripts/
  sync-ccee.ts          # CLI para rodar o sync CCEE (cron)
  sync-rfb.ts           # CLI para rodar o sync RFB (cron/background)
  sync-siga.ts          # CLI para rodar o sync ANEEL SIGA-GD (cron)
  geocode-leads.ts      # CLI para geocodificar todos os candidatos pendentes (cron)
```

## Próximos passos sugeridos

- Persistir em Postgres em produção (SQLite é só para dev local).
- Agendar `sync:ccee` (ex: mensal), `sync:rfb` (ex: trimestral), `sync:siga`
  (ex: mensal, a ANEEL publica o SIGA-GD periodicamente) e `geocode` (logo
  após cada `sync:rfb`) via cron.
- Autenticação, caso o dashboard vá para além de uso pessoal/interno.
- Exibir os leads em mapa (a latitude/longitude já são persistidas pelo
  `geocode`; falta só o componente de mapa no dashboard — hoje cada linha só
  linka para o OpenStreetMap).
- Contato de decisor (nome, cargo) via ferramentas de prospecção B2B, sob
  demanda e com custo por lead — fora do escopo automatizado deste app;
  telefone/e-mail institucional já vêm da RFB.

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
| Receita Federal | Dados Abertos do CNPJ (`Estabelecimentos*.zip` + `Empresas*.zip`) | Universo de empresas ativas por CNAE/UF/porte | Sim |
| ANEEL (BDGD) | — | Não usada para identificação (dados anonimizados) — ver ressalva acima | Não |

A lista de CNAEs usada para montar o universo de candidatos fica em
[`src/config/cnae.ts`](./src/config/cnae.ts) — edite/expanda conforme o
perfil de cliente que você quer prospectar.

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

### Nota sobre este ambiente de desenvolvimento

Os syncs reais (CCEE/RFB) **não foram executados durante o desenvolvimento**
deste app porque o sandbox onde ele foi construído bloqueia acesso de saída
a domínios `.gov.br` (política de rede do ambiente). O código de ingestão
segue os formatos oficiais documentados dessas bases e está pronto para
rodar em um ambiente com acesso à internet liberado — mas vale rodar
`npm run sync:ccee` uma vez em um ambiente com acesso antes de confiar 100%
no parser (o layout do CSV da CCEE já mudou de formato entre publicações,
e o código tenta reconhecer colunas por nome parcial para ser resiliente a
isso, mas confirme com uma execução real).

## Estrutura

```
src/
  app/                 # páginas e rotas de API (App Router)
    api/sync/ccee       # POST — dispara sync CCEE
    api/sync/rfb        # POST — dispara sync RFB
    api/leads           # GET — lista/filtra/exporta leads (?format=csv)
    api/stats           # GET — estatísticas do dashboard
  config/cnae.ts        # lista de CNAEs "grande/médio consumidor"
  lib/
    ccee.ts             # ingestão CCEE (CKAN API)
    rfb.ts              # ingestão RFB (streaming zip/csv)
    rfbLayout.ts         # parsing dos layouts de Estabelecimentos/Empresas
    leads.ts            # lógica de cruzamento (candidatos - migrados = leads)
    cnpj.ts             # normalização de CNPJ / CNPJ raiz
prisma/
  schema.prisma         # CandidateCompany, MigratedConsumer, SyncLog
  seed.ts               # dados de exemplo fictícios
scripts/
  sync-ccee.ts          # CLI para rodar o sync CCEE (cron)
  sync-rfb.ts           # CLI para rodar o sync RFB (cron/background)
```

## Próximos passos sugeridos

- Persistir em Postgres em produção (SQLite é só para dev local).
- Agendar `sync:ccee` (ex: mensal, quando a CCEE publica atualização) e
  `sync:rfb` (ex: trimestral) via cron.
- Autenticação, caso o dashboard vá para além de uso pessoal/interno.
- Enriquecimento de contatos dos leads (decisor, e-mail, telefone) via
  ferramentas de prospecção B2B, sob demanda e com custo por lead — fora do
  escopo automatizado deste app.

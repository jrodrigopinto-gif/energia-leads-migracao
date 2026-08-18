# LeadVolt

SaaS de prospecção de leads de energia para consultores da **iGreen Energy**:
encontra grandes e médios consumidores (Grupo A) que **ainda estão no
mercado cativo**, com login por consultor, licenças pagas (Mercado Pago) e
dashboard de busca/exportação da base de leads.

## Produto

- **Cadastro/login** por e-mail e senha (`/registrar`, `/login`).
- **Licenças mensais** (`/planos`) cobradas via Mercado Pago — 3 planos
  seed: Consultor 1 UF, Consultor Nacional, Equipe iGreen (ver
  `prisma/seed.ts`). Sem assinatura ativa, o consultor é redirecionado para
  `/planos` ao tentar abrir o dashboard.
- **Dashboard de leads** (`/dashboard`) — tabela filtrável (UF, grupo
  tarifário, demanda mínima, busca por razão social/CNPJ) com exportação
  CSV, sobre a tabela `Prospect` (ver "Base de leads" abaixo).
- **Admin** (`/admin/sync`, role `ADMIN`) — painel interno com o pipeline
  legado RFB/CCEE (ver seção técnica abaixo), não visível a consultores.

### Base de leads (`Prospect`)

A tabela `Prospect` é alimentada a partir de uma planilha já pronta
(`prospects_FINAL_organizado.xlsx`, uma aba por UF) que cruza unidades
consumidoras de alta tensão (Grupo A, base ANEEL/distribuidoras) com a
CCEE, e chega pronta para importar:

```bash
npm run import:prospects -- /caminho/para/prospects_FINAL_organizado.xlsx
```

Crie o primeiro usuário administrador com:

```bash
npm run create:admin -- admin@igreen.energy "senha-forte-aqui" "Nome do Admin"
```

### Cobrança (Mercado Pago)

Defina `MERCADOPAGO_ACCESS_TOKEN` no `.env` para ativar o checkout em
`/planos` (cria uma *Preference* e redireciona ao Checkout Pro). O webhook
`POST /api/billing/webhook` recebe as notificações de pagamento e ativa a
`Subscription` correspondente. Sem o token configurado, os botões de
assinatura ficam desabilitados e a página mostra um aviso.

### Autenticação

Sessão via cookie httpOnly assinado (JWT, `jose`) — ver `src/lib/session.ts`
e `src/lib/dal.ts`. Proteção de rotas em `proxy.ts` (⚠️ nesta versão do
Next.js o arquivo é `proxy.ts`, não `middleware.ts` — ver
`node_modules/next/dist/docs`). Defina `SESSION_SECRET` no `.env` (string
aleatória, ex: `openssl rand -base64 32`).

---

## Pipeline técnico de origem (RFB × CCEE)

A base "prospects" acima foi construída a partir do mesmo princípio deste
pipeline interno (mantido em `/admin/sync` para reprocessamento futuro):

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
- Prisma + PostgreSQL
- Autenticação própria (cookie JWT via `jose` + `bcryptjs`)
- Mercado Pago SDK (checkout de licenças)

## Rodando localmente

```bash
cp .env.example .env   # preencha DATABASE_URL, SESSION_SECRET, MERCADOPAGO_ACCESS_TOKEN
npm install
npx prisma migrate dev
npm run db:seed                       # planos de licença + dados de EXEMPLO (fictícios)
npm run import:prospects -- /caminho/para/prospects_FINAL_organizado.xlsx
npm run create:admin -- admin@igreen.energy "senha-forte" "Nome"
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
proxy.ts                # proteção de rotas (login/licença/admin) — substitui middleware.ts
src/
  app/
    page.tsx             # landing pública (marketing + planos)
    login/, registrar/   # autenticação
    dashboard/           # tabela de leads (Prospect), protegida por licença ativa
    planos/               # escolha de plano + checkout Mercado Pago
    admin/sync/           # painel do pipeline legado RFB/CCEE (role ADMIN)
    actions/auth.ts       # server actions: login, signup, logout
    api/
      prospects           # GET — lista/filtra/exporta leads pagos (?format=csv)
      billing/checkout    # POST — cria Preference no Mercado Pago
      billing/webhook     # POST — recebe notificações de pagamento
      sync/ccee, sync/rfb # POST — pipeline legado (admin only)
      leads, stats        # pipeline legado (admin only)
  components/            # Logo, AppShell, ProspectsTable, CheckoutButton, AdminSyncPanel
  config/cnae.ts          # lista de CNAEs "grande/médio consumidor" (pipeline legado)
  lib/
    session.ts, dal.ts    # sessão (cookie JWT) e data access layer de auth
    mercadopago.ts        # cliente do SDK Mercado Pago
    prospects.ts          # queries da base de leads paga (Prospect)
    ccee.ts, rfb.ts, rfbLayout.ts, leads.ts  # pipeline legado RFB/CCEE
    cnpj.ts               # normalização de CNPJ / CNPJ raiz
prisma/
  schema.prisma          # User, Plan, Subscription, Payment, Prospect + pipeline legado
  seed.ts                # planos de licença + dados de exemplo fictícios (pipeline legado)
scripts/
  import-prospects.ts    # importa prospects_FINAL_organizado.xlsx para Prospect
  create-admin.ts        # cria/atualiza usuário ADMIN
  sync-ccee.ts, sync-rfb.ts  # CLI do pipeline legado (cron)
```

## Próximos passos sugeridos

- Configurar `MERCADOPAGO_ACCESS_TOKEN` de produção e testar o fluxo de
  checkout/webhook de ponta a ponta (hoje só validado com o token ausente,
  modo "cobrança desativada").
- Ligar `maxExports`/`ufAccess` do `Plan` a uma checagem real de uso em
  `/api/prospects` (hoje os campos existem no schema mas não são aplicados).
- Reimportar `Prospect` periodicamente conforme a iGreen Energy atualizar a
  planilha `prospects_FINAL_organizado.xlsx` (ou reativar o pipeline
  RFB/CCEE legado em `/admin/sync` para gerar a base do zero).
- E-mail transacional (boas-vindas, confirmação de pagamento, aviso de
  assinatura vencida) — hoje não há envio de e-mail implementado.
- Enriquecimento de contatos dos leads (decisor, e-mail, telefone) via
  ferramentas de prospecção B2B, sob demanda e com custo por lead — fora do
  escopo automatizado deste app.
- Base de conhecimento da iGreen Energy (o usuário mencionou que vai
  enviá-la) — provavelmente vira conteúdo de apoio/treinamento dentro do
  dashboard do consultor.

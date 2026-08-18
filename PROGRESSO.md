# Progresso do LeadVolt — retomar aqui

> Este arquivo existe só para retomar o trabalho numa próxima sessão sem
> perder contexto. Pode ser apagado quando o deploy em produção estiver
> concluído e estável.

**Última atualização:** 18/08/2026 (sessão com jrodrigopinto)

## O que já está pronto e commitado (branch `claude/new-session-h7fc0r`)

- App **LeadVolt** completo: landing pública, cadastro/login, licenças
  (planos + checkout Mercado Pago, ainda sem token real), dashboard de
  leads com filtros/exportação CSV, ficha de lead com **mapa (Google
  Maps), WhatsApp, Ligar, E-mail** e edição manual de contato.
- **PWA**: instalável no celular (manifest + service worker + ícones).
- Banco: Postgres via Prisma. Modelos `User`, `Plan`, `Subscription`,
  `Payment`, `Prospect` (leads) + pipeline legado `CandidateCompany` /
  `MigratedConsumer` / `SyncLog` (RFB/CCEE, usado só no painel
  `/admin/sync`, role ADMIN).
- **Build de produção já roda as migrations sozinho**
  (`prisma migrate deploy && next build`, ver `package.json`).
- Scripts prontos:
  - `npm run import:prospects -- <xlsx>` — importa a planilha
    `prospects_FINAL_organizado.xlsx` (uma aba por UF) para `Prospect`.
  - `npm run create:admin -- <email> <senha> <nome>` — cria/atualiza um
    usuário ADMIN.
  - `npm run export:cnpjs -- <saida.csv>` — exporta os CNPJs distintos
    da base para enriquecimento de contato.
  - `python3 scripts/enrich_contacts_rfb_local.py <cnpjs.csv> <pasta com
    Estabelecimentos*.zip>` — cruza com arquivos da RFB já baixados no
    disco do usuário (sem precisar de internet no momento do cruzamento).
  - `npm run apply:contacts -- <contacts_found.csv>` — grava telefone/
    e-mail em `Prospect` (roda em lotes, limpa placeholders tipo
    `0000`/`00000000`).

## O que já foi feito NESTA sessão (só localmente, não persiste)

- Importados os **96.009 leads** da planilha `prospects_FINAL_organizado.xlsx`
  que o usuário enviou.
- Rodado o enriquecimento de contato: o usuário já tinha os arquivos
  `Estabelecimentos0-9.zip` da RFB baixados localmente (pasta
  `C:\Users\RODRIGO\Desktop\ENERGIA`) — usamos
  `enrich_contacts_rfb_local.py` neles (o portal `dadosabertos.rfb.gov.br`
  estava com timeout na rede do usuário).
- Resultado: **68.470 leads enriquecidos** com telefone e/ou e-mail
  (88.606 UCs com telefone, 75.746 UCs com e-mail, de 96.009 no total —
  contando repetição por CNPJ com várias unidades consumidoras).
- O arquivo `contacts_found.csv` com esse resultado está no
  **Desktop do usuário** (`C:\Users\RODRIGO\Desktop\contacts_found.csv`)
  e também foi enviado pra mim no chat (mas não foi commitado no repo —
  contém telefone/e-mail pessoal, não deve ir pro git).
- Testado de ponta a ponta no navegador local (login, dashboard, filtro,
  ficha de lead com contato real, planos, mobile) — sem erros de console.

⚠️ **Esse banco local (com os 96k leads + 68k contatos já aplicados) só
existe nesta sessão.** Quando a sessão fechar, ele some. Não é um
problema grave: os dois arquivos-fonte (`prospects_FINAL_organizado.xlsx`
e `contacts_found.csv`) continuam com o usuário, e reimportar tudo leva
poucos minutos (`import:prospects` + `apply:contacts`).

## Onde paramos: deploy em produção (Vercel + Postgres)

Ambiente de rede desta sessão não tem acesso à internet externa (só
domínios liberados por política: npm, pypi, GitHub, etc. — não Vercel,
não sites de terceiros). Por isso o deploy real precisa ser feito pelo
usuário, e eu guio passo a passo.

**Link de deploy pré-preenchido (Vercel):**
```
https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjrodrigopinto-gif%2Fenergia-leads-migracao%2Ftree%2Fclaude%2Fnew-session-h7fc0r&project-name=leadvolt&repository-name=leadvolt&env=DATABASE_URL%2CSESSION_SECRET%2CMERCADOPAGO_ACCESS_TOKEN%2CNEXT_PUBLIC_APP_URL
```

**Status no momento em que paramos:** usuário ainda não tinha clicado
no link / criado a conta Vercel / criado o banco Postgres (aba Storage
da Vercel). Nenhuma das duas contas (Vercel, banco) foi criada ainda.

### Próximos passos, na ordem, para amanhã

1. Usuário abre o link de deploy acima, loga com GitHub, autoriza acesso
   ao repositório.
2. Antes de clicar "Deploy": ir em outra aba na Vercel → **Storage** →
   **Create Database** → **Postgres** → copiar a connection string →
   colar no campo `DATABASE_URL` da tela de import.
3. Preencher `SESSION_SECRET` com qualquer string aleatória longa.
   `MERCADOPAGO_ACCESS_TOKEN` fica vazio por enquanto.
   `NEXT_PUBLIC_APP_URL` pode ficar vazio e ajustar depois do primeiro
   deploy (com a URL que a Vercel gerar, tipo `leadvolt.vercel.app`).
4. Clicar **Deploy** e aguardar (2-3 min).
5. **Popular o banco de produção** (ainda não decidido *quem* roda):
   - Opção A: usuário manda o `DATABASE_URL` de produção aqui no chat,
     eu rodo `import:prospects` + `create:admin` + `apply:contacts`
     direto desta sessão (rápido, mas envolve colar credencial no chat).
   - Opção B: usuário instala Node.js no PC dele e roda os mesmos
     comandos localmente, apontando pro `DATABASE_URL` de produção no
     `.env` dele.
   - **Essa escolha ficou pendente** — perguntei antes e o usuário não
     respondeu ainda.
6. Depois de popular: testar login (criar usuário ADMIN com
   `create:admin`), conferir dashboard com os leads reais, e então voltar
   pra decidir o Mercado Pago (token de produção) quando o usuário
   quiser habilitar cobrança de verdade.

## Coisas para não esquecer

- `MERCADOPAGO_ACCESS_TOKEN` ainda não configurado — checkout fica
  desabilitado até isso.
- CNAE / regras de negócio do pipeline legado (`/admin/sync`) não foram
  mexidas nesta sessão — só a base `Prospect` (planilha pronta).
- O usuário mencionou que vai mandar a **base de conhecimento da iGreen
  Energy** em algum momento — ainda não chegou.

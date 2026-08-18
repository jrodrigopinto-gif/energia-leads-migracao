import Link from "next/link";
import { Logo } from "@/components/Logo";
import { prisma } from "@/lib/prisma";

const FEATURES = [
  {
    title: "Base pronta, sem cruzamento manual",
    desc: "96 mil+ unidades consumidoras do Grupo A já cruzadas contra a base de migrados da CCEE — você recebe quem provavelmente ainda está no mercado cativo.",
  },
  {
    title: "Filtros por UF, CNAE e demanda",
    desc: "Refine por estado, setor de atividade e faixa de demanda contratada (kW) para priorizar as contas com maior potencial de economia.",
  },
  {
    title: "Exportação em 1 clique",
    desc: "Exporte sua carteira de leads filtrada em CSV, pronta para importar no seu CRM ou planilha de prospecção.",
  },
  {
    title: "Feito para consultores iGreen Energy",
    desc: "Interface enxuta, pensada para quem prospecta grandes e médios consumidores todos os dias — sem ruído, sem planilha bagunçada.",
  },
];

export default async function LandingPage() {
  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { priceCents: "asc" } });
  const totalProspects = await prisma.prospect.count().catch(() => 0);

  return (
    <div className="lv-grid-bg flex-1">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo className="text-lg" />
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-muted hover:text-foreground">Entrar</Link>
          <Link href="/registrar" className="lv-btn-primary rounded-full px-4 py-2 text-sm">
            Começar agora
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6">
        <section className="py-16 sm:py-24">
          <p className="mb-4 inline-block rounded-full border border-border px-3 py-1 text-xs uppercase tracking-widest text-brand">
            Feito para consultores iGreen Energy
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            Encontre quem ainda está{" "}
            <span className="text-brand lv-glow-text">no mercado cativo</span> antes da concorrência.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            LeadVolt cruza a base pública de grandes e médios consumidores de energia (Grupo A) com
            quem já migrou para o mercado livre — e entrega só os leads que sobraram: prováveis
            candidatos à migração, prontos para prospecção.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/registrar" className="lv-btn-primary rounded-lg px-6 py-3 text-base">
              Criar minha conta
            </Link>
            <Link href="/login" className="rounded-lg border border-border px-6 py-3 text-base text-foreground hover:border-brand">
              Já tenho licença
            </Link>
          </div>
          {totalProspects > 0 && (
            <p className="mt-6 text-sm text-muted">
              <span className="font-semibold text-brand">{totalProspects.toLocaleString("pt-BR")}</span>{" "}
              leads de energia (Grupo A) disponíveis na base agora.
            </p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="lv-panel p-5">
              <h3 className="font-medium text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </section>

        <section id="planos" className="py-16">
          <h2 className="text-2xl font-semibold">Licenças para consultores</h2>
          <p className="mt-2 text-muted">Assinatura mensal, cancele quando quiser.</p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className="lv-panel flex flex-col p-6">
                <h3 className="font-medium">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted">{plan.description}</p>
                <p className="mt-6 text-3xl font-semibold">
                  R$ {(plan.priceCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  <span className="text-base font-normal text-muted">/mês</span>
                </p>
                <Link
                  href="/registrar"
                  className="lv-btn-primary mt-6 rounded-lg px-4 py-2 text-center text-sm"
                >
                  Assinar
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-xs text-muted">
        <p>
          LeadVolt constrói o universo de candidatos a grande/médio consumidor por CNAE/porte e
          demanda contratada e exclui quem já aparece como migrado na base pública da CCEE. Isso é
          uma aproximação de prospecção, não uma confirmação técnica de status cativo.
        </p>
      </footer>
    </div>
  );
}

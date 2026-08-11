"use client";

import { useCallback, useEffect, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Stats {
  totalProducts: number;
  activeConversations: number;
  ordersToday: number;
  revenueToday: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  deliveryType: string;
  paymentMethod: string;
  total: number;
  cashierSentAt: string;
  conversation: { customerName: string | null; waId: string };
  items: { productName: string; quantity: number; subtotal: number }[];
}

interface Conversation {
  id: string;
  waId: string;
  customerName: string | null;
  status: string;
  updatedAt: string;
  _count: { messages: number; orders: number };
  orders: { total: number; status: string }[];
}

interface Product {
  id: string;
  code: string;
  name: string;
  category: string | null;
  price: number;
  discountPct: number;
  finalPrice: number;
  stock: number;
  unit: string;
  requiresPrescription: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const DELIVERY_LABEL: Record<string, string> = { pickup: "Retirada", delivery: "Entrega" };
const PAYMENT_LABEL: Record<string, string> = { cash: "Dinheiro", pix: "PIX", credit_card: "Cartão" };
const STATUS_CLASS: Record<string, string> = {
  sent_to_cashier: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};
const STATUS_LABEL: Record<string, string> = {
  sent_to_cashier: "No caixa",
  completed: "Concluído",
  cancelled: "Cancelado",
};

// ─── Componentes ──────────────────────────────────────────────────────────────

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active ? "border-emerald-600 text-emerald-700" : "border-transparent text-neutral-500 hover:text-neutral-700"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Painel de Pedidos ────────────────────────────────────────────────────────

function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacy/orders?date=${today}&pageSize=50`);
      const data = await res.json();
      setOrders(data.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/pharmacy/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
    setSelectedOrder(null);
  }

  if (loading) return <p className="py-8 text-center text-neutral-400">Carregando pedidos...</p>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{orders.length} pedido(s) hoje</p>
        <button onClick={load} className="text-xs text-emerald-600 hover:underline">Atualizar</button>
      </div>

      {orders.length === 0 && (
        <p className="py-12 text-center text-neutral-400">Nenhum pedido hoje ainda.</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-neutral-500">
              <th className="pb-2 pr-4">Nº Pedido</th>
              <th className="pb-2 pr-4">Cliente</th>
              <th className="pb-2 pr-4">Tipo</th>
              <th className="pb-2 pr-4">Pagamento</th>
              <th className="pb-2 pr-4">Total</th>
              <th className="pb-2 pr-4">Horário</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="cursor-pointer border-b hover:bg-neutral-50"
                onClick={() => setSelectedOrder(o)}
              >
                <td className="py-2 pr-4 font-mono text-xs">{o.orderNumber}</td>
                <td className="py-2 pr-4">{o.conversation.customerName ?? o.conversation.waId}</td>
                <td className="py-2 pr-4">{DELIVERY_LABEL[o.deliveryType] ?? o.deliveryType}</td>
                <td className="py-2 pr-4">{PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}</td>
                <td className="py-2 pr-4 font-semibold">{fmt(o.total)}</td>
                <td className="py-2 pr-4 text-neutral-500">{fmtDate(o.cashierSentAt)}</td>
                <td className="py-2">
                  <Badge
                    label={STATUS_LABEL[o.status] ?? o.status}
                    cls={STATUS_CLASS[o.status] ?? "bg-neutral-100 text-neutral-700"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-semibold">Pedido {selectedOrder.orderNumber}</h3>
            <p className="mb-1 text-sm">
              <span className="text-neutral-500">Cliente: </span>
              {selectedOrder.conversation.customerName ?? selectedOrder.conversation.waId}
            </p>
            <p className="mb-1 text-sm">
              <span className="text-neutral-500">Tipo: </span>
              {DELIVERY_LABEL[selectedOrder.deliveryType]}
              {selectedOrder.deliveryType === "delivery" && " (verificar endereço na conversa)"}
            </p>
            <p className="mb-3 text-sm">
              <span className="text-neutral-500">Pagamento: </span>
              {PAYMENT_LABEL[selectedOrder.paymentMethod]}
            </p>
            <table className="mb-4 w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-neutral-500">
                  <th className="pb-1 text-left">Produto</th>
                  <th className="pb-1 text-right">Qtd</th>
                  <th className="pb-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-1">{item.productName}</td>
                    <td className="py-1 text-right">{item.quantity}</td>
                    <td className="py-1 text-right">{fmt(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="pt-2 font-semibold">Total</td>
                  <td className="pt-2 text-right font-bold">{fmt(selectedOrder.total)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="flex gap-2">
              {selectedOrder.status !== "completed" && (
                <button
                  onClick={() => updateStatus(selectedOrder.id, "completed")}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Marcar como concluído
                </button>
              )}
              {selectedOrder.status !== "cancelled" && (
                <button
                  onClick={() => updateStatus(selectedOrder.id, "cancelled")}
                  className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Painel de Conversas ──────────────────────────────────────────────────────

function ConversationsPanel() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    readableMessages: { role: string; text: string; at: string }[];
    customerName: string | null;
    waId: string;
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch("/api/pharmacy/conversations?pageSize=30")
      .then((r) => r.json())
      .then((d) => setConvs(d.rows ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function openDetail(id: string) {
    setSelected(id);
    setLoadingDetail(true);
    const res = await fetch(`/api/pharmacy/conversations?id=${id}`);
    const data = await res.json();
    setDetail(data);
    setLoadingDetail(false);
  }

  if (loading) return <p className="py-8 text-center text-neutral-400">Carregando conversas...</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        {convs.length === 0 && (
          <p className="py-12 text-center text-neutral-400">Nenhuma conversa ainda.</p>
        )}
        {convs.map((c) => (
          <button
            key={c.id}
            onClick={() => openDetail(c.id)}
            className={`mb-2 w-full rounded-lg border p-3 text-left hover:bg-neutral-50 transition-colors ${
              selected === c.id ? "border-emerald-400 bg-emerald-50" : "border-neutral-200"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{c.customerName ?? c.waId}</p>
                <p className="text-xs text-neutral-500">{c.waId}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400">{fmtDate(c.updatedAt)}</p>
                <p className="text-xs text-neutral-500">
                  {c._count.messages} msg · {c._count.orders} pedido(s)
                </p>
              </div>
            </div>
            {c.orders[0] && (
              <div className="mt-1">
                <Badge
                  label={`Último pedido: ${fmt(c.orders[0].total)}`}
                  cls={STATUS_CLASS[c.orders[0].status] ?? "bg-neutral-100 text-neutral-600"}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        {!selected && (
          <p className="py-12 text-center text-neutral-400">Selecione uma conversa para ver o histórico</p>
        )}
        {selected && loadingDetail && (
          <p className="py-8 text-center text-neutral-400">Carregando...</p>
        )}
        {selected && !loadingDetail && detail && (
          <>
            <p className="mb-3 font-semibold">{detail.customerName ?? detail.waId}</p>
            <div className="flex max-h-[480px] flex-col gap-2 overflow-y-auto">
              {detail.readableMessages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "self-start bg-neutral-100 text-neutral-800"
                      : "self-end bg-emerald-600 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <p
                    className={`mt-1 text-xs ${m.role === "user" ? "text-neutral-400" : "text-emerald-100"}`}
                  >
                    {fmtDate(m.at)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Painel de Produtos ───────────────────────────────────────────────────────

function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    category: "",
    price: "",
    discountPct: "0",
    stock: "",
    unit: "un",
    requiresPrescription: false,
  });

  const load = useCallback(
    async (query = q) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/pharmacy/products?q=${encodeURIComponent(query)}&pageSize=30`);
        const data = await res.json();
        setProducts(data.rows ?? []);
        setTotal(data.total ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [q],
  );

  useEffect(() => { load(); }, [load]);

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/pharmacy/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        discountPct: Number(form.discountPct),
        stock: Number(form.stock),
      }),
    });
    setShowForm(false);
    setForm({ code: "", name: "", category: "", price: "", discountPct: "0", stock: "", unit: "un", requiresPrescription: false });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)}
          placeholder="Buscar produto..."
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button
          onClick={() => load(q)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Buscar
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          + Adicionar
        </button>
        <p className="text-xs text-neutral-400">{total} produto(s)</p>
      </div>

      {loading ? (
        <p className="py-8 text-center text-neutral-400">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-neutral-500">
                <th className="pb-2 pr-4">Código</th>
                <th className="pb-2 pr-4">Nome</th>
                <th className="pb-2 pr-4">Categoria</th>
                <th className="pb-2 pr-4">Preço</th>
                <th className="pb-2 pr-4">Desconto</th>
                <th className="pb-2 pr-4">P. Final</th>
                <th className="pb-2 pr-4">Estoque</th>
                <th className="pb-2">Receita</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b hover:bg-neutral-50">
                  <td className="py-2 pr-4 font-mono text-xs">{p.code}</td>
                  <td className="py-2 pr-4 font-medium">{p.name}</td>
                  <td className="py-2 pr-4 text-neutral-500">{p.category ?? "—"}</td>
                  <td className="py-2 pr-4">{fmt(p.price)}</td>
                  <td className="py-2 pr-4">
                    {p.discountPct > 0 ? (
                      <Badge label={`${p.discountPct}%`} cls="bg-orange-100 text-orange-700" />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 pr-4 font-semibold text-emerald-700">{fmt(p.finalPrice)}</td>
                  <td className="py-2 pr-4">
                    <span className={p.stock < 5 ? "font-bold text-red-600" : ""}>{p.stock} {p.unit}</span>
                  </td>
                  <td className="py-2">
                    {p.requiresPrescription && <Badge label="Receita" cls="bg-red-100 text-red-700" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={saveProduct}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h3 className="mb-4 font-semibold">Novo Produto</h3>
            <div className="grid gap-3">
              {[
                { label: "Código", key: "code", required: true },
                { label: "Nome", key: "name", required: true },
                { label: "Categoria", key: "category" },
                { label: "Preço (R$)", key: "price", type: "number", required: true },
                { label: "Desconto (%)", key: "discountPct", type: "number" },
                { label: "Estoque", key: "stock", type: "number" },
                { label: "Unidade", key: "unit" },
              ].map(({ label, key, type, required }) => (
                <label key={key} className="flex flex-col gap-1 text-sm">
                  <span className="text-neutral-600">{label}</span>
                  <input
                    type={type ?? "text"}
                    required={required}
                    value={(form as Record<string, string | boolean>)[key] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.requiresPrescription}
                  onChange={(e) => setForm((f) => ({ ...f, requiresPrescription: e.target.checked }))}
                />
                Requer receita médica
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function FarmaciaPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<"pedidos" | "conversas" | "produtos">("pedidos");

  useEffect(() => {
    fetch("/api/pharmacy/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-bold text-emerald-700">Agente WhatsApp — Painel da Farmácia</h1>
          <p className="text-sm text-neutral-500">Pedidos, conversas e estoque em tempo real</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card
            label="Pedidos Hoje"
            value={stats ? stats.ordersToday.toString() : "—"}
            sub="Enviados ao caixa"
          />
          <Card
            label="Faturamento Hoje"
            value={stats ? fmt(stats.revenueToday) : "—"}
          />
          <Card
            label="Conversas Ativas"
            value={stats ? stats.activeConversations.toString() : "—"}
            sub="No WhatsApp"
          />
          <Card
            label="Produtos no Estoque"
            value={stats ? stats.totalProducts.toString() : "—"}
            sub="Com estoque disponível"
          />
        </div>

        {/* Tabs */}
        <div className="mb-4 flex border-b">
          <Tab label="Pedidos de Hoje" active={tab === "pedidos"} onClick={() => setTab("pedidos")} />
          <Tab label="Conversas" active={tab === "conversas"} onClick={() => setTab("conversas")} />
          <Tab label="Produtos" active={tab === "produtos"} onClick={() => setTab("produtos")} />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          {tab === "pedidos" && <OrdersPanel />}
          {tab === "conversas" && <ConversationsPanel />}
          {tab === "produtos" && <ProductsPanel />}
        </div>

        {/* Setup guide */}
        <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
          <h2 className="mb-3 font-semibold text-emerald-800">Configuração do Agente</h2>
          <div className="grid gap-2 text-sm text-emerald-700 lg:grid-cols-2">
            <div>
              <p className="font-medium">Variáveis de ambiente (.env):</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 font-mono text-xs">
                <li>ANTHROPIC_API_KEY=sk-ant-...</li>
                <li>WHATSAPP_TOKEN=EAA...</li>
                <li>WHATSAPP_PHONE_NUMBER_ID=1234...</li>
                <li>WHATSAPP_VERIFY_TOKEN=minha-chave-secreta</li>
                <li>PHARMACY_NAME=Farmácia Saúde e Vida</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">URL do webhook (Meta):</p>
              <p className="mt-1 font-mono text-xs">
                POST https://seudominio.com/api/whatsapp/webhook
              </p>
              <p className="mt-2 font-medium">Rodar migration:</p>
              <p className="font-mono text-xs">prisma migrate deploy</p>
              <p className="mt-2 font-medium">Seed de produtos exemplo:</p>
              <p className="font-mono text-xs">npx tsx prisma/seed-farmacia.ts</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

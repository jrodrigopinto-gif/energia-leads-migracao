import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import { createOrder, getProduct, searchProducts } from "./pharmacy";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PHARMACY_NAME = process.env.PHARMACY_NAME ?? "Farmácia";

// ─── Ferramentas disponíveis para o agente ────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "buscar_produtos",
    description:
      "Busca produtos no estoque da farmácia por nome, princípio ativo ou categoria. Use sempre que o cliente pedir um produto antes de informar preço ou disponibilidade.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Nome, princípio ativo ou palavra-chave do produto (ex: 'paracetamol', 'vitamina C')",
        },
        categoria: {
          type: "string",
          description:
            "Categoria opcional para refinar a busca (ex: analgésico, antibiótico, vitamina, higiene, beleza)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "consultar_produto",
    description: "Consulta detalhes completos de um produto específico: preço, desconto, estoque e se requer receita.",
    input_schema: {
      type: "object" as const,
      properties: {
        produto_id: { type: "string", description: "ID do produto retornado por buscar_produtos" },
      },
      required: ["produto_id"],
    },
  },
  {
    name: "finalizar_pedido",
    description:
      "Finaliza o pedido e envia ao caixa. Use somente após o cliente confirmar todos os itens, forma de pagamento e (se entrega) o endereço completo.",
    input_schema: {
      type: "object" as const,
      properties: {
        itens: {
          type: "array",
          description: "Lista de itens do pedido",
          items: {
            type: "object",
            properties: {
              produto_id: { type: "string", description: "ID do produto" },
              quantidade: { type: "number", description: "Quantidade desejada" },
            },
            required: ["produto_id", "quantidade"],
          },
        },
        tipo_entrega: {
          type: "string",
          enum: ["retirada", "entrega"],
          description: "Retirada na farmácia ou entrega no endereço",
        },
        forma_pagamento: {
          type: "string",
          enum: ["dinheiro", "pix", "cartao_credito"],
          description: "Forma de pagamento escolhida pelo cliente",
        },
        endereco: {
          type: "string",
          description: "Endereço completo (rua, número, complemento, bairro, cidade, CEP) — obrigatório para entrega",
        },
        observacoes: {
          type: "string",
          description: "Observações adicionais do pedido (opcional)",
        },
      },
      required: ["itens", "tipo_entrega", "forma_pagamento"],
    },
  },
];

// ─── System prompt do agente ──────────────────────────────────────────────────

function buildSystemPrompt(customerName?: string | null): string {
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return `Você é um atendente virtual da ${PHARMACY_NAME}, especialista em atendimento humanizado pelo WhatsApp.

Data/hora: ${now}${customerName ? `\nCliente: ${customerName}` : ""}

## Missão
Atender com simpatia, entender a necessidade do cliente, apresentar produtos com preços e descontos, e fechar a venda enviando o pedido ao caixa.

## Fluxo de atendimento
1. Cumprimente cordialmente (use o nome do cliente se souber)
2. Entenda o que o cliente precisa (faça perguntas se necessário)
3. Busque produtos com \`buscar_produtos\` — nunca invente preços ou disponibilidade
4. Apresente até 3 opções com preço original, desconto e preço final
5. Quando o cliente escolher, confirme a quantidade
6. Pergunte: retirada na farmácia ou entrega em domicílio?
7. Se **entrega**: colete endereço completo (rua, número, complemento, bairro, cidade e CEP)
8. Pergunte a forma de pagamento: 💵 Dinheiro · 📱 PIX · 💳 Cartão de crédito
9. Apresente o resumo completo e peça confirmação
10. Use \`finalizar_pedido\` para enviar ao caixa
11. Informe o número do pedido e o próximo passo ao cliente

## Regras
- Nunca informe preço sem consultar o sistema primeiro
- Se produto não tiver estoque, ofereça alternativa
- Se produto requer receita, informe e oriente o cliente
- Para entrega, endereço é obrigatório antes de finalizar
- Seja transparente: mostre preço cheio e desconto separadamente

## Tom de voz
Amigável, próximo e eficiente. Use emojis com moderação. Evite formalidade excessiva. Seja direto mas simpático.`;
}

// ─── Execução das ferramentas ─────────────────────────────────────────────────

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  conversationId: string,
): Promise<string> {
  switch (name) {
    case "buscar_produtos": {
      const produtos = await searchProducts(input.query as string, input.categoria as string | undefined);
      if (produtos.length === 0) {
        return JSON.stringify({ resultado: "Nenhum produto encontrado no estoque" });
      }
      return JSON.stringify({
        produtos: produtos.map((p) => ({
          id: p.id,
          codigo: p.code,
          nome: p.name,
          categoria: p.category,
          preco_original: p.price.toFixed(2),
          desconto_pct: p.discountPct,
          preco_final: p.finalPrice.toFixed(2),
          estoque: p.stock,
          unidade: p.unit,
          requer_receita: p.requiresPrescription,
        })),
      });
    }

    case "consultar_produto": {
      const p = await getProduct(input.produto_id as string);
      if (!p) return JSON.stringify({ erro: "Produto não encontrado" });
      return JSON.stringify({
        id: p.id,
        codigo: p.code,
        nome: p.name,
        categoria: p.category,
        preco_original: p.price.toFixed(2),
        desconto_pct: p.discountPct,
        preco_final: p.finalPrice.toFixed(2),
        estoque: p.stock,
        unidade: p.unit,
        requer_receita: p.requiresPrescription,
      });
    }

    case "finalizar_pedido": {
      const itens = input.itens as { produto_id: string; quantidade: number }[];
      const tipoEntrega = input.tipo_entrega as string;
      const formaPagamento = input.forma_pagamento as string;

      if (tipoEntrega === "entrega" && !input.endereco) {
        return JSON.stringify({ erro: "Endereço obrigatório para entrega" });
      }
      if (!itens || itens.length === 0) {
        return JSON.stringify({ erro: "Nenhum item informado no pedido" });
      }

      const paymentMap: Record<string, "cash" | "pix" | "credit_card"> = {
        dinheiro: "cash",
        pix: "pix",
        cartao_credito: "credit_card",
      };

      const order = await createOrder({
        conversationId,
        items: itens.map((i) => ({ productId: i.produto_id, quantity: i.quantidade })),
        deliveryType: tipoEntrega === "entrega" ? "delivery" : "pickup",
        paymentMethod: paymentMap[formaPagamento] ?? "cash",
        address: input.endereco as string | undefined,
        notes: input.observacoes as string | undefined,
      });

      return JSON.stringify({
        sucesso: true,
        numero_pedido: order.orderNumber,
        total: `R$ ${order.total.toFixed(2).replace(".", ",")}`,
        itens: order.items.length,
        status: "Enviado ao caixa com sucesso",
      });
    }

    default:
      return JSON.stringify({ erro: `Ferramenta desconhecida: ${name}` });
  }
}

// ─── Função principal ─────────────────────────────────────────────────────────

function tryParseJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export async function processWhatsAppMessage(
  waId: string,
  customerName: string,
  messageText: string,
): Promise<string> {
  // Busca ou cria a conversa
  let conversation = await prisma.pharmacyConversation.findUnique({
    where: { waId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 40 },
    },
  });

  if (!conversation) {
    conversation = await prisma.pharmacyConversation.create({
      data: { waId, customerName },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  } else if (customerName && customerName !== waId && !conversation.customerName) {
    await prisma.pharmacyConversation.update({
      where: { id: conversation.id },
      data: { customerName, updatedAt: new Date() },
    });
  }

  const conversationId = conversation.id;

  // Reconstrói o array de mensagens para o Claude (preserva tool_use blocks)
  const messages: Anthropic.MessageParam[] = conversation.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: tryParseJson(m.contentJson) as Anthropic.MessageParam["content"],
  }));

  // Salva e adiciona a nova mensagem do usuário
  await prisma.pharmacyMessage.create({
    data: { conversationId, role: "user", contentJson: JSON.stringify(messageText) },
  });
  messages.push({ role: "user", content: messageText });

  // Loop de tool_use
  let response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: buildSystemPrompt(customerName ?? conversation.customerName),
    messages,
    tools: TOOLS,
  });

  while (response.stop_reason === "tool_use") {
    // Salva a resposta do assistente com os tool_use blocks
    await prisma.pharmacyMessage.create({
      data: { conversationId, role: "assistant", contentJson: JSON.stringify(response.content) },
    });
    messages.push({ role: "assistant", content: response.content });

    // Executa as ferramentas
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      let result: string;
      try {
        result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          conversationId,
        );
      } catch (e) {
        result = JSON.stringify({ erro: e instanceof Error ? e.message : "Erro ao executar ferramenta" });
      }
      toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: result });
    }

    // Salva os resultados das ferramentas como mensagem "user"
    await prisma.pharmacyMessage.create({
      data: { conversationId, role: "user", contentJson: JSON.stringify(toolResults) },
    });
    messages.push({ role: "user", content: toolResults });

    // Próxima iteração
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: buildSystemPrompt(customerName ?? conversation.customerName),
      messages,
      tools: TOOLS,
    });
  }

  // Extrai o texto final
  const finalText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  // Salva resposta final do assistente
  await prisma.pharmacyMessage.create({
    data: { conversationId, role: "assistant", contentJson: JSON.stringify(response.content) },
  });

  // Atualiza timestamp da conversa
  await prisma.pharmacyConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return finalText;
}

import { NextRequest, NextResponse } from "next/server";
import { markAsRead, parseWebhookPayload, sendTextMessage } from "@/lib/whatsapp";
import { processWhatsAppMessage } from "@/lib/ai-agent";

// Aumenta o tempo máximo para a execução do agente de IA
export const maxDuration = 60;

// GET — verificação do webhook pelo Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return NextResponse.json({ error: "Verificação inválida" }, { status: 403 });
}

// POST — mensagens recebidas do WhatsApp
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // Retorna 200 imediatamente para o Meta não reenviar o evento
  const messages = parseWebhookPayload(body);

  // Processa em background (sem bloquear a resposta)
  for (const msg of messages) {
    if (!msg.text.trim()) continue;

    // Marca como lida (fire-and-forget)
    markAsRead(msg.messageId).catch(() => {});

    // Processa com o agente de IA e responde
    processWhatsAppMessage(msg.from, msg.customerName, msg.text)
      .then((reply) => {
        if (reply) return sendTextMessage(msg.from, reply);
      })
      .catch((err) => {
        console.error("[Agente] Erro ao processar mensagem:", err);
        // Envia mensagem de erro amigável para não deixar o cliente sem resposta
        sendTextMessage(
          msg.from,
          "Ops! Tive um problema temporário. Por favor, tente novamente em instantes. 🙏",
        ).catch(() => {});
      });
  }

  return NextResponse.json({ status: "ok" });
}

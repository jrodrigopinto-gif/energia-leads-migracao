const GRAPH_API = "https://graph.facebook.com/v21.0";

export type IncomingMessage = {
  from: string;
  customerName: string;
  text: string;
  messageId: string;
  timestamp: number;
};

export function parseWebhookPayload(body: unknown): IncomingMessage[] {
  const result: IncomingMessage[] = [];

  const entry = (body as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entry)) return result;

  for (const e of entry) {
    const changes = (e as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value = (change as { value?: unknown })?.value as Record<string, unknown> | undefined;
      if (!value) continue;

      const messages = value.messages as unknown[] | undefined;
      if (!Array.isArray(messages)) continue;

      const contacts = (value.contacts as unknown[] | undefined) ?? [];

      for (const msg of messages) {
        const m = msg as Record<string, unknown>;
        if (m.type !== "text") continue;

        const from = m.from as string;
        const contact = contacts.find((c) => (c as Record<string, unknown>).wa_id === from) as
          | Record<string, unknown>
          | undefined;
        const customerName =
          ((contact?.profile as Record<string, unknown> | undefined)?.name as string) ?? from;

        result.push({
          from,
          customerName,
          text: ((m.text as Record<string, unknown>)?.body as string) ?? "",
          messageId: m.id as string,
          timestamp: Number(m.timestamp ?? 0),
        });
      }
    }
  }

  return result;
}

export async function sendTextMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    console.warn("[WhatsApp] WHATSAPP_PHONE_NUMBER_ID ou WHATSAPP_TOKEN não configurados — mensagem não enviada.");
    return;
  }

  const url = `${GRAPH_API}/${phoneNumberId}/messages`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`WhatsApp API ${resp.status}: ${err}`);
  }
}

export async function markAsRead(messageId: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneNumberId || !token) return;

  const url = `${GRAPH_API}/${phoneNumberId}/messages`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  }).catch(() => {});
}

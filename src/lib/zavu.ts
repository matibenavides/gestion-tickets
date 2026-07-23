// Envío de mensajes vía Zavu (WhatsApp / SMS / Email con una sola API REST).
// Doc: https://docs.zavu.dev — endpoint: POST https://api.zavu.dev/v1/messages
// Server-only: usa ZAVU_API_KEY, que NUNCA debe llegar al navegador.
const ZAVU_URL = "https://api.zavu.dev/v1/messages";

export type ZavuChannel = "whatsapp" | "sms" | "email";

/** Deja el número en formato E.164 (+56912345678) que espera Zavu. */
export function toE164(raw: string): string {
  return "+" + (raw || "").replace(/\D/g, "");
}

/** POST autenticado a Zavu. Lanza si falta la API key o si responde error. */
async function zavuPost(body: Record<string, unknown>) {
  const apiKey = process.env.ZAVU_API_KEY;
  if (!apiKey) throw new Error("Falta ZAVU_API_KEY en el archivo .env");

  const res = await fetch(ZAVU_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Zavu ${res.status}: ${detail || res.statusText}`);
  }
  return res.json() as Promise<{ message?: { id?: string } }>;
}

/** Texto libre. En sandbox entrega a los números verificados; en prod, dentro de la ventana de 24h. */
export function sendZavuMessage(to: string, text: string, channel: ZavuChannel = "whatsapp") {
  return zavuPost({ to: toE164(to), channel, text });
}

/** Plantilla aprobada por Meta. Necesaria para iniciar conversación fuera de la ventana de 24h. */
export function sendZavuTemplate(
  to: string,
  templateId: string,
  variables: Record<string, string>,
) {
  return zavuPost({
    to: toE164(to),
    channel: "whatsapp",
    messageType: "template",
    content: { templateId, templateVariables: variables },
  });
}

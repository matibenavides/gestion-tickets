// Cliente mínimo (sin SDK) para la API de mensajería unificada de Zavu.
// Solo debe usarse en el servidor: nunca exponer ZAVU_API_KEY al navegador.
// Docs: https://docs.zavu.dev

const ZAVU_API_URL = "https://api.zavu.dev/v1/messages";

export interface ZavuSendResult {
  id: string;
  status: string;
}

/** Envía un WhatsApp a través de Zavu. Lanza error si la API responde con fallo. */
export async function sendZavuWhatsApp(to: string, text: string): Promise<ZavuSendResult> {
  const apiKey = process.env.ZAVU_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar ZAVU_API_KEY en el .env.");
  }

  const res = await fetch(ZAVU_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      text,
      channel: "whatsapp",
    }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    // En modo sandbox, Zavu solo permite enviar a números verificados en el
    // dashboard (Sandbox → Verificar número). Ese caso suele llegar como 4xx.
    const detail = body?.error?.message || body?.message || `HTTP ${res.status}`;
    throw new Error(`Zavu: no se pudo enviar el mensaje (${detail}).`);
  }

  const message = body?.message ?? body;
  return { id: message?.id, status: message?.status };
}

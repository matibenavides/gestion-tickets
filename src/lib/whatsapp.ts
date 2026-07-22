export interface TicketMessageData {
  folio?: number; // Folio correlativo del ticket (autoincremental)
  callerName: string;
  location: string;
  problem: string;
  time?: string; // HH:mm; si se omite se usa la hora actual
}

function hhmm(): string {
  return new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Folio legible: #0001, #0042, ... */
export function formatFolio(n?: number): string {
  return n ? `#${String(n).padStart(4, "0")}` : "#—";
}

/** Mensaje con la nomenclatura estandarizada para el supervisor/técnico. */
export function formatWhatsAppMessage(t: TicketMessageData): string {
  const lines = [
    "*NUEVO TICKET DE SOPORTE*",
    t.folio ? `*Folio:* ${formatFolio(t.folio)}` : null,
    `*Solicitante:* ${t.callerName?.trim() || "-"}`,
    `*Ubicación:* ${t.location?.trim() || "-"}`,
    `*Requerimiento:* ${t.problem?.trim() || "-"}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** Forma compacta: "Nombre | Lugar | Problema". */
export function compactLine(t: TicketMessageData): string {
  return [t.callerName, t.location, t.problem]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join(" | ");
}

/** Enlace directo wa.me (abre WhatsApp Web en el navegador). */
export function buildWhatsAppUrl(whatsappNumber: string, message: string): string {
  const number = (whatsappNumber || "").replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Enlace de protocolo que abre la app de escritorio/móvil instalada (sin pasar por el navegador). */
export function buildWhatsAppAppUrl(whatsappNumber: string, message: string): string {
  const number = (whatsappNumber || "").replace(/\D/g, "");
  return `whatsapp://send?phone=${number}&text=${encodeURIComponent(message)}`;
}

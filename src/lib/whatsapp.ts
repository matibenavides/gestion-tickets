export interface TicketMessageData {
  folio?: number | null; // Folio correlativo del ticket (autoincremental)
  createdAt?: Date | string | null; // Emisión del ticket
  callerName: string;
  location: string;
  problem: string;
}

/** Emisión legible en hora local: 05/09/2026 15:04. */
export function formatDateTime(value?: Date | string | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Folio legible: #0001, #0042, ... */
export function formatFolio(n?: number | null): string {
  return n ? `#${String(n).padStart(4, "0")}` : "#—";
}

/** Mensaje con la nomenclatura estandarizada para el supervisor/técnico. */
export function formatWhatsAppMessage(t: TicketMessageData): string {
  const emitted = formatDateTime(t.createdAt);
  const lines = [
    "*NUEVO TICKET DE SOPORTE*",
    t.folio ? `*Folio:* ${formatFolio(t.folio)}` : null,
    emitted ? `*Emisión:* ${emitted}` : null,
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

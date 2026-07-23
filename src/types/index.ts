// Tipos compartidos entre servidor y cliente. Sin dependencias de servidor
// (no importa la DB) para que sea seguro importarlos en Client Components.

export type TicketStatus =
  | "DRAFT"
  | "SENT"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CANCELLED";

export type TicketCategory =
  | "EQUIPOS"
  | "IMPRESORAS"
  | "CUENTAS"
  | "TRASLADOS"
  | "OTRO";

export interface Contact {
  id: string;
  name: string;
  role: string;
  zone: string;
  whatsappNumber: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  ticketNumber: number;
  callerName: string;
  location: string;
  problem: string;
  rawNote: string;
  category: TicketCategory;
  status: TicketStatus;
  assignedContactId: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado / Pendiente",
  IN_PROGRESS: "En Proceso",
  RESOLVED: "Resuelto",
  CANCELLED: "Cancelado",
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  DRAFT: "default",
  SENT: "blue",
  IN_PROGRESS: "gold",
  RESOLVED: "green",
  CANCELLED: "red",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  EQUIPOS: "Equipos",
  IMPRESORAS: "Impresoras",
  CUENTAS: "Cuentas",
  TRASLADOS: "Traslados",
  OTRO: "Otro",
};

export const CATEGORY_COLORS: Record<TicketCategory, string> = {
  EQUIPOS: "geekblue",
  IMPRESORAS: "volcano",
  CUENTAS: "purple",
  TRASLADOS: "cyan",
  OTRO: "default",
};

export const STATUS_ORDER: TicketStatus[] = [
  "DRAFT",
  "SENT",
  "IN_PROGRESS",
  "RESOLVED",
  "CANCELLED",
];

export const CATEGORY_ORDER: TicketCategory[] = [
  "EQUIPOS",
  "IMPRESORAS",
  "CUENTAS",
  "TRASLADOS",
  "OTRO",
];

/** Borrador crudo: guardado antes de clasificar/formatear, sin campos aún completados. */
export function isRawDraft(t: Pick<Ticket, "callerName" | "location" | "problem" | "rawNote">) {
  return !t.callerName.trim() && !t.location.trim() && !t.problem.trim() && !!t.rawNote.trim();
}

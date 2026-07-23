"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { contacts, tickets } from "@/db/schema";
import { formatFolio, formatWhatsAppMessage } from "@/lib/whatsapp";
import { sendZavuMessage, sendZavuTemplate } from "@/lib/zavu";
import type { TicketCategory, TicketStatus } from "@/types";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/tickets");
  revalidatePath("/analytics");
}

export interface TicketInput {
  callerName: string;
  location: string;
  problem: string;
  rawNote?: string;
  category: TicketCategory;
  assignedContactId?: string | null;
}

function clean(input: TicketInput) {
  return {
    callerName: input.callerName?.trim() ?? "",
    location: input.location?.trim() ?? "",
    problem: input.problem?.trim() ?? "",
    category: input.category ?? "OTRO",
    assignedContactId: input.assignedContactId || null,
  };
}

export async function listTickets() {
  return db.select().from(tickets).orderBy(desc(tickets.createdAt));
}

export async function createTicket(input: TicketInput, status: TicketStatus = "DRAFT") {
  if (!input.callerName?.trim() && !input.location?.trim() && !input.problem?.trim()) {
    throw new Error("El ticket está vacío: completa al menos un campo.");
  }
  const [row] = await db
    .insert(tickets)
    .values({
      ...clean(input),
      rawNote: input.rawNote?.trim() ?? "",
      status,
      sentAt: status === "SENT" ? new Date() : null,
    })
    .returning();
  revalidateAll();
  return row;
}

export async function updateTicket(id: string, input: TicketInput) {
  const [row] = await db
    .update(tickets)
    .set({ ...clean(input), updatedAt: new Date() })
    .where(eq(tickets.id, id))
    .returning();
  revalidateAll();
  return row;
}

export async function setTicketStatus(id: string, status: TicketStatus) {
  const [row] = await db
    .update(tickets)
    .set({ status, updatedAt: new Date(), ...(status === "SENT" ? { sentAt: new Date() } : {}) })
    .where(eq(tickets.id, id))
    .returning();
  revalidateAll();
  return row;
}

export async function setTicketContact(id: string, contactId: string | null) {
  const [row] = await db
    .update(tickets)
    .set({ assignedContactId: contactId, updatedAt: new Date() })
    .where(eq(tickets.id, id))
    .returning();
  revalidateAll();
  return row;
}

/** Al enviar por WhatsApp: registra la hora y, si estaba en borrador, pasa a "Enviado". */
export async function markTicketSent(id: string) {
  const [current] = await db.select().from(tickets).where(eq(tickets.id, id));
  const keep = current && ["IN_PROGRESS", "RESOLVED", "CANCELLED"].includes(current.status);
  const nextStatus: TicketStatus = keep ? current.status : "SENT";
  const [row] = await db
    .update(tickets)
    .set({ status: nextStatus, sentAt: new Date(), updatedAt: new Date() })
    .where(eq(tickets.id, id))
    .returning();
  revalidateAll();
  return row;
}

export async function deleteTicket(id: string) {
  await db.delete(tickets).where(eq(tickets.id, id));
  revalidateAll();
}

/** Envía el ticket por WhatsApp usando la API de Zavu y lo marca como enviado. */
export async function sendTicketWhatsApp(id: string) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
  if (!ticket) throw new Error("Ticket no encontrado.");
  if (!ticket.assignedContactId) throw new Error("El ticket no tiene contacto asignado.");
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, ticket.assignedContactId));
  if (!contact) throw new Error("El contacto asignado ya no existe.");

  const templateId = process.env.ZAVU_WHATSAPP_TEMPLATE_ID;
  if (templateId) {
    // ponytail: la plantilla en Zavu debe tener 4 variables en ESTE orden:
    // {{1}} folio · {{2}} solicitante · {{3}} ubicación · {{4}} requerimiento.
    await sendZavuTemplate(contact.whatsappNumber, templateId, {
      "1": formatFolio(ticket.ticketNumber),
      "2": ticket.callerName || "-",
      "3": ticket.location || "-",
      "4": ticket.problem || "-",
    });
  } else {
    const text = formatWhatsAppMessage({
      folio: ticket.ticketNumber,
      callerName: ticket.callerName,
      location: ticket.location,
      problem: ticket.problem,
    });
    await sendZavuMessage(contact.whatsappNumber, text, "whatsapp");
  }
  return markTicketSent(id);
}

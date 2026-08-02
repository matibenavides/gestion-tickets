"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { rawTags, tickets } from "@/db/schema";
import { isRawDraft, type TicketCategory, type TicketStatus } from "@/types";

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
  rawTag?: string;
  category: TicketCategory;
  assignedContactId?: string | null;
}

function clean(input: TicketInput) {
  return {
    callerName: input.callerName?.trim() ?? "",
    location: input.location?.trim() ?? "",
    problem: input.problem?.trim() ?? "",
    rawTag: input.rawTag?.trim() ?? "",
    category: input.category ?? "OTRO",
    assignedContactId: input.assignedContactId || null,
  };
}

export async function listTickets() {
  return db.select().from(tickets).orderBy(desc(tickets.createdAt));
}

export async function createTicket(input: TicketInput, status: TicketStatus = "DRAFT") {
  if (!input.callerName?.trim() && !input.location?.trim() && !input.problem?.trim() && !input.rawNote?.trim()) {
    throw new Error("El ticket está vacío: completa al menos un campo.");
  }

  const cleaned = clean(input);
  const rawNote = input.rawNote?.trim() ?? "";
  const rawDraft = isRawDraft({ ...cleaned, rawNote });

  const [row] = await db
    .insert(tickets)
    .values({
      ...cleaned,
      rawNote,
      ticketNumber: rawDraft ? null : sql`nextval('tickets_ticket_number_seq')::integer`,
      status,
      sentAt: status === "SENT" ? new Date() : null,
    })
    .returning();
  revalidateAll();
  return row;
}

export async function updateTicket(id: string, input: TicketInput) {
  const [current] = await db.select().from(tickets).where(eq(tickets.id, id));
  const cleaned = clean(input);
  const rawNote = input.rawNote ?? current?.rawNote ?? "";
  const rawDraft = isRawDraft({ ...cleaned, rawNote });

  const assignFolio = current && current.ticketNumber === null && !rawDraft;

  const [row] = await db
    .update(tickets)
    .set({
      ...cleaned,
      ...(assignFolio ? { ticketNumber: sql`nextval('tickets_ticket_number_seq')::integer` } : {}),
      updatedAt: new Date(),
    })
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
  const needsFolio = current && current.ticketNumber === null;

  const [row] = await db
    .update(tickets)
    .set({
      status: nextStatus,
      sentAt: new Date(),
      updatedAt: new Date(),
      ...(needsFolio ? { ticketNumber: sql`nextval('tickets_ticket_number_seq')::integer` } : {}),
    })
    .where(eq(tickets.id, id))
    .returning();
  revalidateAll();
  return row;
}

export async function deleteTicket(id: string) {
  await db.delete(tickets).where(eq(tickets.id, id));
  revalidateAll();
}

/** La etiqueta manda: al asignarla el ticket hereda la categoría padre del catálogo. */
export async function setTicketRawTag(id: string, rawTag: string) {
  const trimmed = rawTag.trim();
  const [parent] = trimmed
    ? await db.select().from(rawTags).where(eq(rawTags.name, trimmed))
    : [];

  const [row] = await db
    .update(tickets)
    .set({
      rawTag: trimmed,
      ...(parent ? { category: parent.category } : {}),
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, id))
    .returning();
  revalidateAll();
  return row;
}

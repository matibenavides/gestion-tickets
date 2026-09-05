"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
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

/** Siguiente valor de la secuencia de folios. */
const NEXT_FOLIO = sql`nextval('tickets_ticket_number_seq')::integer`;

/**
 * Reserva el folio recién cuando el ticket sale: los borradores no consumen
 * numeración, así borrar uno no deja huecos en la serie. Si ya tenía folio lo
 * respeta (reenviar no lo renumera).
 */
async function ensureFolio(id: string, current: number | null): Promise<number | null> {
  if (current !== null) return current;
  const [row] = await db
    .update(tickets)
    .set({ ticketNumber: NEXT_FOLIO })
    .where(and(eq(tickets.id, id), isNull(tickets.ticketNumber)))
    .returning({ ticketNumber: tickets.ticketNumber });
  return row?.ticketNumber ?? null;
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
      ticketNumber: status === "SENT" && !rawDraft ? NEXT_FOLIO : null,
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

  // Un ticket ya enviado al que le falta el folio (dato antiguo) lo recibe aquí;
  // un borrador no, porque su folio se reserva al enviarlo.
  if (current && current.status !== "DRAFT" && !rawDraft) await ensureFolio(id, current.ticketNumber);

  const [row] = await db
    .update(tickets)
    .set({
      ...cleaned,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, id))
    .returning();
  revalidateAll();
  return row;
}

export async function setTicketStatus(id: string, status: TicketStatus) {
  // Al salir de borrador el ticket pasa a existir para el resto: ahí toma folio.
  if (status !== "DRAFT") {
    const [current] = await db.select().from(tickets).where(eq(tickets.id, id));
    await ensureFolio(id, current?.ticketNumber ?? null);
  }

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
  await ensureFolio(id, current?.ticketNumber ?? null);

  const [row] = await db
    .update(tickets)
    .set({
      status: nextStatus,
      sentAt: new Date(),
      updatedAt: new Date(),
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

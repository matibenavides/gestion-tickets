"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tickets } from "@/db/schema";
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
  if (!input.callerName?.trim() && !input.location?.trim() && !input.problem?.trim() && !input.rawNote?.trim()) {
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

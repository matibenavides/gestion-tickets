"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { cacheDel, cacheGet, cacheSet } from "@/lib/redis";
import type { Contact } from "@/types";

const ACTIVE_KEY = "contacts:active";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/tickets");
  revalidatePath("/contacts");
  revalidatePath("/analytics");
}

export interface ContactInput {
  name: string;
  role: string;
  zone: string;
  whatsappNumber: string;
  isActive: boolean;
}

function validate(input: ContactInput) {
  if (!input.name?.trim()) throw new Error("El nombre es obligatorio.");
  const digits = (input.whatsappNumber || "").replace(/\D/g, "");
  if (digits.length < 8) throw new Error("Número de WhatsApp inválido (usa formato +56912345678).");
}

function clean(input: ContactInput) {
  return {
    name: input.name.trim(),
    role: input.role?.trim() ?? "",
    zone: input.zone?.trim() ?? "",
    whatsappNumber: input.whatsappNumber.trim(),
    isActive: input.isActive ?? true,
  };
}

/** Contactos activos, con caché en Redis (best-effort). */
export async function getActiveContacts(): Promise<Contact[]> {
  const cached = await cacheGet<Contact[]>(ACTIVE_KEY);
  if (cached) return cached.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }));
  const rows = await db
    .select()
    .from(contacts)
    .where(eq(contacts.isActive, true))
    .orderBy(asc(contacts.name));
  await cacheSet(ACTIVE_KEY, rows, 120);
  return rows;
}

export async function listContacts(): Promise<Contact[]> {
  return db.select().from(contacts).orderBy(asc(contacts.name));
}

export async function createContact(input: ContactInput) {
  validate(input);
  const [row] = await db.insert(contacts).values(clean(input)).returning();
  await cacheDel(ACTIVE_KEY);
  revalidateAll();
  return row;
}

export async function updateContact(id: string, input: ContactInput) {
  validate(input);
  const [row] = await db.update(contacts).set(clean(input)).where(eq(contacts.id, id)).returning();
  await cacheDel(ACTIVE_KEY);
  revalidateAll();
  return row;
}

export async function deleteContact(id: string) {
  await db.delete(contacts).where(eq(contacts.id, id));
  await cacheDel(ACTIVE_KEY);
  revalidateAll();
}

export async function toggleContact(id: string, isActive: boolean) {
  await db.update(contacts).set({ isActive }).where(eq(contacts.id, id));
  await cacheDel(ACTIVE_KEY);
  revalidateAll();
}

"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { rawTags, tickets } from "@/db/schema";
import { DEFAULT_RAW_TAGS, type RawTag, type TicketCategory } from "@/types";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/tickets");
  revalidatePath("/analytics");
}

export async function listRawTags(): Promise<RawTag[]> {
  const rows = await db.select().from(rawTags).orderBy(asc(rawTags.name));

  if (rows.length === 0) {
    try {
      await db.insert(rawTags).values(DEFAULT_RAW_TAGS).onConflictDoNothing();
      const seeded = await db.select().from(rawTags).orderBy(asc(rawTags.name));
      return seeded.map((r) => ({ name: r.name, category: r.category }));
    } catch {
      return DEFAULT_RAW_TAGS;
    }
  }

  return rows.map((r) => ({ name: r.name, category: r.category }));
}

export async function createRawTag(name: string, category: TicketCategory = "OTRO"): Promise<RawTag[]> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("El nombre de la etiqueta no puede estar vacío.");

  await db.insert(rawTags).values({ name: trimmed, category }).onConflictDoNothing();
  revalidateAll();
  return listRawTags();
}

/** Cambia la categoría padre de una etiqueta y arrastra a sus tickets. */
export async function setRawTagCategory(name: string, category: TicketCategory): Promise<RawTag[]> {
  const trimmed = name.trim();
  if (!trimmed) return listRawTags();

  await db.update(rawTags).set({ category }).where(eq(rawTags.name, trimmed));
  await db.update(tickets).set({ category }).where(eq(tickets.rawTag, trimmed));

  revalidateAll();
  return listRawTags();
}

export async function deleteRawTag(name: string): Promise<RawTag[]> {
  const trimmed = name.trim();
  if (!trimmed) return listRawTags();

  await db.delete(rawTags).where(eq(rawTags.name, trimmed));
  await db.update(tickets).set({ rawTag: "" }).where(eq(tickets.rawTag, trimmed));

  revalidateAll();
  return listRawTags();
}

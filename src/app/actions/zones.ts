"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { zones } from "@/db/schema";
import { DEFAULT_ZONES, type Zone } from "@/types";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/tickets");
  revalidatePath("/analytics");
}

export async function listZones(): Promise<Zone[]> {
  const rows = await db.select().from(zones).orderBy(asc(zones.name));

  if (rows.length === 0) {
    try {
      const defaultObjects = DEFAULT_ZONES.map((name) => ({ name }));
      await db.insert(zones).values(defaultObjects).onConflictDoNothing();
      const seeded = await db.select().from(zones).orderBy(asc(zones.name));
      return seeded.map((r) => ({ id: r.id, name: r.name }));
    } catch {
      return DEFAULT_ZONES.map((name, index) => ({ id: `default-${index}`, name }));
    }
  }

  return rows.map((r) => ({ id: r.id, name: r.name }));
}

export async function createZone(name: string): Promise<Zone[]> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("El nombre de la zona no puede estar vacío.");

  await db.insert(zones).values({ name: trimmed }).onConflictDoNothing();
  revalidateAll();
  return listZones();
}

export async function deleteZone(id: string): Promise<Zone[]> {
  if (!id) return listZones();

  await db.delete(zones).where(eq(zones.id, id));
  revalidateAll();
  return listZones();
}

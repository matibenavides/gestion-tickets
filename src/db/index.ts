import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL no está definido (revisa el archivo .env)");

// Reutiliza el cliente entre recargas de HMR en desarrollo.
const g = globalThis as unknown as { _pgClient?: ReturnType<typeof postgres> };
const client = g._pgClient ?? postgres(url, { max: 10 });
if (process.env.NODE_ENV !== "production") g._pgClient = client;

export const db = drizzle(client, { schema });
export { schema };

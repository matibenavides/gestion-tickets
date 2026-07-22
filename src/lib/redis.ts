import Redis from "ioredis";

// Caché best-effort. Si Redis no está corriendo, la app sigue funcionando
// contra PostgreSQL: todas las operaciones fallan en silencio y devuelven null.
// ponytail: cache opcional; si el throughput lo pide, sube TTLs o añade más claves.
const g = globalThis as unknown as { _redis?: Redis };

function createClient(): Redis {
  const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: (times) => (times > 3 ? null : 200),
    lazyConnect: true,
  });
  client.on("error", () => {
    /* silenciado: la caché es opcional */
  });
  client.connect().catch(() => {});
  return client;
}

export const redis = g._redis ?? createClient();
if (process.env.NODE_ENV !== "production") g._redis = redis;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignora si Redis no está disponible */
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length) await redis.del(...keys);
  } catch {
    /* ignora */
  }
}

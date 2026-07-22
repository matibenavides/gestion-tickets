# Despacho de Tickets de Soporte + WhatsApp

App local para capturar llamadas de soporte, clasificarlas (Nombre · Lugar ·
Problema) y despacharlas al supervisor/técnico por WhatsApp en 1 clic. Los datos
viven en PostgreSQL, así que **no se pierden al reiniciar o apagar el computador**.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL + Drizzle ORM ·
Redis (ioredis, caché opcional) · Ant Design v6 · Tailwind CSS v4 · Recharts ·
react-icons.

## Requisitos

- **Node 24** (ya instalado).
- **Docker Desktop** para PostgreSQL y Redis. Si no lo tienes:
  https://www.docker.com/products/docker-desktop/ · Alternativa sin Docker más abajo.

## Puesta en marcha (4 comandos)

```bash
# 1. Dependencias (ya instaladas si clonaste con node_modules)
npm install

# 2. Levantar PostgreSQL + Redis
docker compose up -d

# 3. Crear las tablas y cargar contactos de prueba
npm run db:setup

# 4. Arrancar la app
npm run dev
```

Abre **http://localhost:3000**.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilar / servir en producción |
| `npm run db:setup` | `drizzle-kit push` + seed (crea tablas y contactos de prueba) |
| `npm run db:push` | Sincroniza el schema con la DB (sin archivos de migración) |
| `npm run db:generate` / `db:migrate` | Genera y aplica migraciones versionadas |
| `npm run db:seed` | Inserta contactos de prueba (si no hay ninguno) |
| `npm run db:studio` | Drizzle Studio (explorador visual de la DB) |
| `npm test` | Self-checks del parser y de las estadísticas |

## Variables de entorno (`.env`)

```
DATABASE_URL=postgres://tickets:tickets@localhost:5432/tickets
REDIS_URL=redis://localhost:6379
```

## Cómo funciona

- **Inicio**: escribe la llamada en el bloc de notas → **Clasificar / Formatear**
  desglosa Nombre, Ubicación, Problema y Categoría (heurística por palabras clave,
  todo editable). Elige destinatario → **Enviar por WhatsApp** abre
  `https://wa.me/<número>?text=...` y marca el ticket como *Enviado*.
- **Tickets**: historial con filtros (estado, categoría, zona, fecha), buscador,
  cambio de estado en línea, editar, reenviar y eliminar.
- **Contactos**: CRUD de supervisores/técnicos con su WhatsApp y zona.
- **Métricas**: tickets por día, top zonas, distribución por tipo y por estado.

## Estructura

```
src/
├── app/
│   ├── page.tsx            Dashboard + entrada rápida
│   ├── tickets/            Historial y gestión
│   ├── contacts/           Mantenedor de contactos
│   ├── analytics/          Métricas (Recharts)
│   └── actions/            Server Actions (CRUD tickets y contactos)
├── components/             UI (antd v6): QuickTicketForm, TicketTable, etc.
├── db/                     schema.ts · index.ts (postgres+drizzle) · seed · migrate
├── lib/                    parser · whatsapp · redis · stats (+ self-checks)
└── types/                  Tipos y etiquetas compartidas
```

## Sin Docker (alternativa)

Instala PostgreSQL localmente, crea la base `tickets` y ajusta `DATABASE_URL`
en `.env`. Redis es **opcional**: si no está corriendo, la app funciona igual
contra PostgreSQL (la caché degrada en silencio).

## Notas

- El parser es heurístico (sin IA). El módulo `src/lib/parser.ts` está aislado
  para conectar OpenAI/Claude en el futuro sin tocar el resto.
- Las páginas con datos usan `export const dynamic = "force-dynamic"` para leer
  siempre el estado real de la DB.

# Despacho de Tickets de Soporte con Envío por WhatsApp

Aplicación web para el registro y despacho de tickets de soporte técnico. Permite
capturar el detalle de una llamada, clasificarlo automáticamente en Solicitante,
Ubicación y Requerimiento, y enviarlo al supervisor o técnico correspondiente por
WhatsApp. La información se almacena en PostgreSQL, lo que garantiza su
persistencia frente a reinicios o apagados del equipo.

## Contenido

- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Uso posterior](#uso-posterior)
- [Persistencia y portabilidad de los datos](#persistencia-y-portabilidad-de-los-datos)
- [Scripts disponibles](#scripts-disponibles)
- [Variables de entorno](#variables-de-entorno)
- [Funcionalidades](#funcionalidades)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)
- [Instalación sin Docker](#instalación-sin-docker-alternativa)
- [Notas técnicas](#notas-técnicas)

## Stack tecnológico

Next.js 16 (App Router), React 19 y TypeScript en la interfaz y la capa de
servidor. PostgreSQL con Drizzle ORM para la persistencia y Redis (ioredis) como
caché opcional. Interfaz construida con Ant Design 6 y Tailwind CSS 4; gráficos
con Recharts.

## Requisitos previos

- **Node.js 20 o superior** — https://nodejs.org/
- **Git** — https://git-scm.com/
- **Docker Desktop** — https://www.docker.com/products/docker-desktop/

En Windows, Docker Desktop requiere WSL2. Si el motor de Docker no inicia
("Docker Desktop is unable to start"), ejecutar en una terminal de **PowerShell con
privilegios de administrador**:

```powershell
wsl --install
```

y reiniciar el equipo. La virtualización debe estar habilitada en la BIOS/UEFI
(habitualmente lo está de forma predeterminada).

## Instalación

Requiere Docker Desktop instalado y en ejecución. Ejecutar los siguientes
comandos:

```bash
# 1. Clonar el repositorio
git clone <URL-del-repositorio>
cd <carpeta-del-proyecto>

# 2. Crear el archivo de variables de entorno
cp .env.example .env          # En PowerShell: Copy-Item .env.example .env

# 3. Iniciar PostgreSQL y Redis (crea la base de datos automáticamente)
docker compose up -d

# 4. Instalar las dependencias
npm install

# 5. Crear las tablas y cargar los datos de ejemplo
npm run db:setup

# 6. Iniciar la aplicación
npm run dev
```

La aplicación queda disponible en **http://localhost:3000**.

Si el comando `docker` no es reconocido, abrir una nueva terminal (o reiniciar el
equipo) para que se actualicen las variables de entorno del sistema.

## Uso posterior

Con la aplicación ya instalada, para iniciarla nuevamente:

```bash
docker compose up -d    # Solo si los contenedores no están en ejecución
npm run dev
```

Los contenedores utilizan la política `restart: unless-stopped`, por lo que Docker
Desktop los reinicia automáticamente al encender el equipo.

Para inspeccionar la base de datos con un cliente como DBeaver, utilizar los
siguientes datos de conexión: host `localhost`, puerto `5432`, base de datos
`tickets`, usuario `tickets`, contraseña `tickets`.

## Persistencia y portabilidad de los datos

El código se versiona en el repositorio, pero los datos (tickets y contactos)
residen en un volumen de Docker local a cada equipo. Una instalación nueva parte
con la base de datos vacía, con la excepción de los contactos de ejemplo cargados
por el proceso de `seed`. Los registros no se transfieren junto con el código.

Para migrar los datos de un equipo a otro:

**Generar el respaldo** en el equipo de origen (con los contenedores en
ejecución):

```bash
docker exec tickets_postgres pg_dump -U tickets -d tickets -f /tmp/backup.sql
docker cp tickets_postgres:/tmp/backup.sql ./backup.sql
```

**Restaurar** en el equipo de destino (tras ejecutar `docker compose up -d` y
`npm run db:setup`):

```bash
docker cp ./backup.sql tickets_postgres:/tmp/backup.sql
docker exec tickets_postgres psql -U tickets -d tickets -f /tmp/backup.sql
```

Para que varios equipos compartan los mismos datos en tiempo real se requiere una
instancia de PostgreSQL centralizada (servidor propio o servicio en la nube) a la
que todos apunten mediante la variable `DATABASE_URL`.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación / ejecución en producción |
| `npm run db:setup` | Crea las tablas (`drizzle-kit push`) y carga los contactos de ejemplo |
| `npm run db:push` | Sincroniza el esquema con la base de datos (sin archivos de migración) |
| `npm run db:generate` / `db:migrate` | Genera y aplica migraciones versionadas |
| `npm run db:seed` | Inserta contactos de ejemplo (si la tabla está vacía) |
| `npm run db:studio` | Abre Drizzle Studio (explorador visual de la base de datos) |
| `npm test` | Ejecuta las verificaciones del parser, las estadísticas y los enlaces de WhatsApp |

## Variables de entorno

El archivo `.env` en la raíz define la conexión a los servicios. Su contenido
(disponible en `.env.example`) es:

```
DATABASE_URL=postgres://tickets:tickets@localhost:5432/tickets
REDIS_URL=redis://localhost:6379
```

## Funcionalidades

- **Captura rápida.** Registro de la llamada en un área de texto libre. La acción
  *Clasificar / Formatear* separa el contenido en Solicitante, Ubicación,
  Requerimiento y Categoría mediante reglas por palabras clave. Todos los campos
  son editables antes de guardar.
- **Envío por WhatsApp.** La ventana de envío ofrece *Abrir WhatsApp Web*
  (navegador) y *Abrir app de escritorio* (protocolo `whatsapp://`, útil cuando el
  navegador está restringido pero la aplicación de escritorio está permitida),
  además de la opción de copiar el mensaje. Al enviar, el ticket cambia al estado
  *Enviado*.
- **Gestión de tickets.** Historial con filtros por estado, categoría, zona y
  fecha, búsqueda por texto, cambio de estado, edición, reenvío y eliminación.
- **Contactos.** Administración de supervisores y técnicos con su número de
  WhatsApp y zona asignada.
- **Métricas.** Tickets por día, zonas con más incidencias y distribución por tipo
  y por estado.

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx            Panel principal y captura rápida
│   ├── tickets/            Historial y gestión
│   ├── contacts/           Administración de contactos
│   ├── analytics/          Métricas (Recharts)
│   └── actions/            Server Actions (CRUD de tickets y contactos)
├── components/             Interfaz (Ant Design): QuickTicketForm, TicketTable, etc.
├── db/                     schema.ts, index.ts (postgres + drizzle), seed, migrate
├── lib/                    parser, whatsapp, redis, stats (con verificaciones)
└── types/                  Tipos y etiquetas compartidas
```

## Solución de problemas

- **El comando `docker` no es reconocido.** Abrir una nueva terminal (o reiniciar
  el equipo) para actualizar el PATH, y verificar que Docker Desktop esté en
  ejecución.
- **"Docker Desktop is unable to start" en Windows.** Falta WSL2: ejecutar
  `wsl --install` en PowerShell como administrador y reiniciar el equipo.
- **El puerto 5432 está en uso.** Existe otra instancia de PostgreSQL en
  ejecución. Modificar el mapeo de puertos en `docker-compose.yml` (por ejemplo,
  `"5433:5432"`) y actualizar el puerto en `DATABASE_URL`.
- **La aplicación carga pero no muestra datos.** Verificar que se haya ejecutado
  `npm run db:setup` y que los contenedores estén activos (`docker compose up -d`).

## Instalación sin Docker (alternativa)

Como alternativa a Docker, instalar PostgreSQL de forma nativa, crear la base de
datos `tickets` y ajustar `DATABASE_URL` en `.env`. Redis es opcional: si no está
disponible, la aplicación funciona igualmente contra PostgreSQL y la caché se
omite de forma transparente.

## Notas técnicas

- La clasificación automática se basa en reglas heurísticas (sin IA). El módulo
  `src/lib/parser.ts` está aislado para permitir la integración de un servicio de
  IA en el futuro sin afectar al resto de la aplicación.
- Las páginas que consultan datos utilizan `export const dynamic = "force-dynamic"`
  para reflejar siempre el estado actual de la base de datos.

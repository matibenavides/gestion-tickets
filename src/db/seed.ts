import "dotenv/config";
import { db } from "./index";
import { contacts, tickets, zones } from "./schema";
import { DEFAULT_ZONES } from "../types";
import { eq } from "drizzle-orm";

/** Helper: returns a Date N days ago from today at the given hour. */
function daysAgo(n: number, hour = 9): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  // ── Zonas ───────────────────────────────────────────────────────────
  const existingZones = await db.select().from(zones).limit(1);
  if (existingZones.length === 0) {
    await db.insert(zones).values(DEFAULT_ZONES.map((name) => ({ name }))).onConflictDoNothing();
    console.log("Seed OK: zonas iniciales insertadas.");
  }

  // ── Contactos ───────────────────────────────────────────────────────
  const existingContacts = await db.select().from(contacts).limit(1);
  if (existingContacts.length === 0) {
    await db.insert(contacts).values([
      { name: "Carlos Muñoz", role: "Supervisor de Infraestructura", zone: "Pabellón", whatsappNumber: "+56911111111" },
      { name: "María Torres", role: "Soporte Impresoras", zone: "Administración", whatsappNumber: "+56922222222" },
      { name: "Jorge Rivas", role: "Soporte de Cuentas y Accesos", zone: "Oncología", whatsappNumber: "+56933333333" },
      { name: "Paola Díaz", role: "Técnico de Telefonía / Anexos", zone: "Urgencias", whatsappNumber: "+56944444444" },
    ]);
    console.log("Seed OK: 4 contactos de prueba insertados.");
  }

  // ── Tickets ficticios (10 registros para métricas) ──────────────────
  const existingTickets = await db.select().from(tickets).limit(1);
  if (existingTickets.length === 0) {
    // Lookup de zonas y contactos para asignar FK válidas
    const allZones = await db.select().from(zones);
    const allContacts = await db.select().from(contacts);

    const zoneByName = (name: string) => allZones.find((z) => z.name === name)?.id ?? null;
    const contactByName = (name: string) => allContacts.find((c) => c.name === name)?.id ?? null;

    const seedTickets = [
      {
        ticketNumber: 1,
        callerName: "Ana López",
        location: "Oficina 201",
        zoneId: zoneByName("Administración"),
        problem: "No enciende el computador del mesón de atención",
        rawNote: "",
        rawTag: "Soporte Rápido",
        category: "EQUIPOS" as const,
        status: "RESOLVED" as const,
        assignedContactId: contactByName("Carlos Muñoz"),
        sentAt: daysAgo(12, 10),
        createdAt: daysAgo(13, 8),
        updatedAt: daysAgo(12, 10),
      },
      {
        ticketNumber: 2,
        callerName: "Roberto Fuentes",
        location: "Sala de reuniones B",
        zoneId: zoneByName("Desarrollo"),
        problem: "Impresora HP no imprime, atasco de papel recurrente",
        rawNote: "",
        rawTag: "General",
        category: "IMPRESORAS" as const,
        status: "IN_PROGRESS" as const,
        assignedContactId: contactByName("María Torres"),
        sentAt: daysAgo(10, 11),
        createdAt: daysAgo(11, 9),
        updatedAt: daysAgo(8, 14),
      },
      {
        ticketNumber: 3,
        callerName: "Claudia Reyes",
        location: "Box 5",
        zoneId: zoneByName("Oncología"),
        problem: "Necesita reseteo de contraseña del sistema clínico",
        rawNote: "",
        rawTag: "Desbloqueo Cuenta",
        category: "CUENTAS" as const,
        status: "RESOLVED" as const,
        assignedContactId: contactByName("Jorge Rivas"),
        sentAt: daysAgo(9, 9),
        createdAt: daysAgo(10, 8),
        updatedAt: daysAgo(9, 9),
      },
      {
        ticketNumber: 4,
        callerName: "Pedro Soto",
        location: "Piso 3, ala norte",
        zoneId: zoneByName("Pabellón"),
        problem: "Traslado de 2 estaciones de trabajo al nuevo box",
        rawNote: "",
        rawTag: "General",
        category: "TRASLADOS" as const,
        status: "SENT" as const,
        assignedContactId: contactByName("Carlos Muñoz"),
        sentAt: daysAgo(7, 15),
        createdAt: daysAgo(8, 10),
        updatedAt: daysAgo(7, 15),
      },
      {
        ticketNumber: 5,
        callerName: "Valentina Herrera",
        location: "Recepción urgencias",
        zoneId: zoneByName("Urgencias"),
        problem: "Monitor parpadea y se apaga intermitentemente",
        rawNote: "",
        rawTag: "Soporte Rápido",
        category: "EQUIPOS" as const,
        status: "RESOLVED" as const,
        assignedContactId: contactByName("Paola Díaz"),
        sentAt: daysAgo(6, 11),
        createdAt: daysAgo(7, 8),
        updatedAt: daysAgo(5, 16),
      },
      {
        ticketNumber: 6,
        callerName: "Luis Martínez",
        location: "Laboratorio central",
        zoneId: zoneByName("Administración"),
        problem: "Solicitud de acceso a carpeta compartida del área",
        rawNote: "",
        rawTag: "Acceso / Clave",
        category: "CUENTAS" as const,
        status: "CANCELLED" as const,
        assignedContactId: contactByName("Jorge Rivas"),
        sentAt: daysAgo(5, 10),
        createdAt: daysAgo(6, 9),
        updatedAt: daysAgo(5, 10),
      },
      {
        ticketNumber: 7,
        callerName: "Francisca Campos",
        location: "Pasillo sector C",
        zoneId: zoneByName("Oncología"),
        problem: "Impresora de etiquetas no reconoce el rollo nuevo",
        rawNote: "",
        rawTag: "General",
        category: "IMPRESORAS" as const,
        status: "SENT" as const,
        assignedContactId: contactByName("María Torres"),
        sentAt: daysAgo(4, 14),
        createdAt: daysAgo(4, 10),
        updatedAt: daysAgo(4, 14),
      },
      {
        ticketNumber: 8,
        callerName: "Diego Paredes",
        location: "Oficina jefatura",
        zoneId: zoneByName("Pabellón"),
        problem: "Notebook lento, se congela al abrir varias pestañas",
        rawNote: "",
        rawTag: "Soporte Rápido",
        category: "EQUIPOS" as const,
        status: "IN_PROGRESS" as const,
        assignedContactId: contactByName("Carlos Muñoz"),
        sentAt: daysAgo(2, 9),
        createdAt: daysAgo(3, 8),
        updatedAt: daysAgo(1, 11),
      },
      {
        ticketNumber: 9,
        callerName: "Camila Espinoza",
        location: "Farmacia",
        zoneId: zoneByName("Urgencias"),
        problem: "Consulta sobre procedimiento para solicitar cuenta SAP",
        rawNote: "",
        rawTag: "Consulta Sistema",
        category: "OTRO" as const,
        status: "SENT" as const,
        assignedContactId: null,
        sentAt: daysAgo(1, 10),
        createdAt: daysAgo(1, 8),
        updatedAt: daysAgo(1, 10),
      },
      {
        ticketNumber: null,
        callerName: "Tomás Vergara",
        location: "Box 12",
        zoneId: zoneByName("Desarrollo"),
        problem: "Traslado de impresora multifuncional al segundo piso",
        rawNote: "",
        rawTag: "General",
        category: "TRASLADOS" as const,
        status: "DRAFT" as const,
        assignedContactId: null,
        sentAt: null,
        createdAt: daysAgo(0, 9),
        updatedAt: daysAgo(0, 9),
      },
    ];

    await db.insert(tickets).values(seedTickets);
    console.log("Seed OK: 10 tickets ficticios insertados para métricas.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

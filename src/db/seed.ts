import "dotenv/config";
import { db } from "./index";
import { contacts, zones } from "./schema";
import { DEFAULT_ZONES } from "../types";

async function main() {
  const existingZones = await db.select().from(zones).limit(1);
  if (existingZones.length === 0) {
    await db.insert(zones).values(DEFAULT_ZONES.map((name) => ({ name }))).onConflictDoNothing();
    console.log("Seed OK: zonas iniciales insertadas.");
  }

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
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


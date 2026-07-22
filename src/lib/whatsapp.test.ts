// Self-check de los enlaces de WhatsApp. Correr: npm run test:whatsapp
import assert from "node:assert";
import { buildWhatsAppAppUrl, buildWhatsAppUrl, compactLine, formatWhatsAppMessage } from "./whatsapp";

// El número queda solo con dígitos (sin +, espacios ni guiones) y el texto va URL-encoded.
const web = buildWhatsAppUrl("+56 9 1234 5678", "hola mundo & más");
assert.equal(web, "https://wa.me/56912345678?text=hola%20mundo%20%26%20m%C3%A1s");

const app = buildWhatsAppAppUrl("+56-9-1234-5678", "hola");
assert.equal(app, "whatsapp://send?phone=56912345678&text=hola");

// Nomenclatura estándar con hora fija.
const msg = formatWhatsAppMessage({ callerName: "Paola", location: "Oncología box 10", problem: "cambio de teléfono", time: "09:30" });
assert.ok(msg.includes("👤 *Solicitante:* Paola"));
assert.ok(msg.includes("🕒 *Hora:* 09:30"));

// Forma compacta ignora campos vacíos.
assert.equal(compactLine({ callerName: "Ana", location: "", problem: "sin acceso" }), "Ana | sin acceso");

console.log("OK whatsapp");

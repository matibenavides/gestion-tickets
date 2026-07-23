// Self-check de los enlaces de WhatsApp. Correr: npm run test:whatsapp
import assert from "node:assert";
import { buildWhatsAppAppUrl, buildWhatsAppUrl, compactLine, formatFolio, formatWhatsAppMessage } from "./whatsapp";
import { toE164 } from "./zavu";

// Zavu exige E.164: solo dígitos precedidos de "+", sin espacios ni guiones.
assert.equal(toE164("+56 9 1234 5678"), "+56912345678");
assert.equal(toE164("569-1234-5678"), "+56912345678");

// El número queda solo con dígitos (sin +, espacios ni guiones) y el texto va URL-encoded.
const web = buildWhatsAppUrl("+56 9 1234 5678", "hola mundo & más");
assert.equal(web, "https://wa.me/56912345678?text=hola%20mundo%20%26%20m%C3%A1s");

const app = buildWhatsAppAppUrl("+56-9-1234-5678", "hola");
assert.equal(app, "whatsapp://send?phone=56912345678&text=hola");

// Folio correlativo: se formatea con padding y solo aparece si viene informado.
assert.equal(formatFolio(42), "#0042");
assert.equal(formatFolio(), "#—");

// Nomenclatura estándar, con el folio del ticket incluido.
const msg = formatWhatsAppMessage({ folio: 42, callerName: "Paola", location: "Oncología box 10", problem: "cambio de teléfono" });
assert.ok(msg.includes("*Folio:* #0042"));
assert.ok(msg.includes("*Solicitante:* Paola"));

// Sin folio: la línea de folio se omite.
assert.ok(!formatWhatsAppMessage({ callerName: "Ana", location: "", problem: "x" }).includes("Folio"));

// Forma compacta ignora campos vacíos.
assert.equal(compactLine({ callerName: "Ana", location: "", problem: "sin acceso" }), "Ana | sin acceso");

console.log("OK whatsapp");

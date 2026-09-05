// Self-check de los enlaces de WhatsApp. Correr: npm run test:whatsapp
import assert from "node:assert";
import { buildWhatsAppAppUrl, buildWhatsAppUrl, compactLine, formatDateTime, formatFolio, formatWhatsAppMessage } from "./whatsapp";

// El número queda solo con dígitos (sin +, espacios ni guiones) y el texto va URL-encoded.
const web = buildWhatsAppUrl("+56 9 1234 5678", "hola mundo & más");
assert.equal(web, "https://wa.me/56912345678?text=hola%20mundo%20%26%20m%C3%A1s");

const app = buildWhatsAppAppUrl("+56-9-1234-5678", "hola");
assert.equal(app, "whatsapp://send?phone=56912345678&text=hola");

// Folio correlativo: se formatea con padding y solo aparece si viene informado.
assert.equal(formatFolio(42), "#0042");
assert.equal(formatFolio(), "#—");

// Nomenclatura estándar, con el folio y la emisión del ticket incluidos.
const msg = formatWhatsAppMessage({ folio: 42, createdAt: new Date(2026, 8, 5, 15, 4), callerName: "Paola", location: "Oncología box 10", problem: "cambio de teléfono" });
assert.ok(msg.includes("*Folio:* #0042"));
// Se compara el valor, no la etiqueta: el rótulo de la línea se ajusta a gusto.
assert.ok(msg.includes("05/09/2026 15:04"));
assert.ok(msg.includes("*Solicitante:* Paola"));

// La emisión acepta el string que llega serializado desde el servidor.
assert.equal(formatDateTime("2026-09-05T15:04:00"), "05/09/2026 15:04");
assert.equal(formatDateTime(null), "");

// Sin fecha: la línea se omite.
assert.ok(!/\d{2}\/\d{2}\/\d{4}/.test(formatWhatsAppMessage({ callerName: "Ana", location: "", problem: "x" })));

// Sin folio: la línea de folio se omite.
assert.ok(!formatWhatsAppMessage({ callerName: "Ana", location: "", problem: "x" }).includes("Folio"));

// Forma compacta ignora campos vacíos.
assert.equal(compactLine({ callerName: "Ana", location: "", problem: "sin acceso" }), "Ana | sin acceso");

console.log("OK whatsapp");

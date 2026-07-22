// Self-check del parser. Correr: npm run test:parser
import assert from "node:assert";
import { parseCall, detectCategory } from "./parser";

// 1) Texto libre estilo llamada real.
const a = parseCall("Paola de oncología sala de quimio box 10 solicita cambio de teléfono");
assert.ok(a.callerName.toLowerCase().includes("paola"), `nombre: ${a.callerName}`);
assert.ok(a.location.toLowerCase().includes("oncolog"), `lugar: ${a.location}`);
assert.ok(a.problem.toLowerCase().includes("cambio"), `problema: ${a.problem}`);
assert.equal(a.category, "TRASLADOS");

// 2) Estructurado con pipes.
const b = parseCall("Juan | Pabellón box 12 piso 1 | la impresora no imprime");
assert.equal(b.callerName, "Juan");
assert.ok(b.location.includes("Pabellón"), `lugar: ${b.location}`);
assert.ok(b.problem.includes("impresora"), `problema: ${b.problem}`);
assert.equal(b.category, "IMPRESORAS");

// 3) Etiquetado.
const c = parseCall("Nombre: Ana Lugar: Urgencias Problema: crear cuenta de correo");
assert.equal(c.callerName, "Ana");
assert.ok(c.location.toLowerCase().includes("urgencias"), `lugar: ${c.location}`);
assert.ok(c.problem.toLowerCase().includes("cuenta"), `problema: ${c.problem}`);
assert.equal(c.category, "CUENTAS");

// 4) Categorías directas.
assert.equal(detectCategory("el computador no enciende"), "EQUIPOS");
assert.equal(detectCategory("necesita reponer toner de la impresora"), "IMPRESORAS");
assert.equal(detectCategory("solicita desbloqueo de usuario"), "CUENTAS");

// 5) Vacío no revienta.
const e = parseCall("");
assert.deepEqual(e, { callerName: "", location: "", problem: "", category: "OTRO" });

console.log("OK parser: 5 casos");

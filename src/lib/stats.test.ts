// Self-check de estadísticas. Correr: npm run test:stats
import assert from "node:assert";
import { computeStats } from "./stats";

const today = new Date();
const yst = new Date();
yst.setDate(today.getDate() - 1);

const s = computeStats([
  { category: "IMPRESORAS", status: "SENT", location: "Oncología", createdAt: today },
  { category: "IMPRESORAS", status: "RESOLVED", location: "Oncología", createdAt: today },
  { category: "EQUIPOS", status: "DRAFT", location: "Urgencias", createdAt: yst },
  { category: "CUENTAS", status: "SENT", location: "", createdAt: today },
]);

assert.equal(s.total, 4);
assert.equal(s.byCategory.find((c) => c.category === "IMPRESORAS")!.count, 2);
assert.equal(s.byStatus.find((x) => x.status === "SENT")!.count, 2);
assert.equal(s.topZones[0].zone, "Oncología");
assert.equal(s.topZones[0].count, 2);
assert.ok(s.topZones.some((z) => z.zone === "Sin ubicación"));
assert.equal(s.perDay.length, 14);
assert.equal(s.perDay[s.perDay.length - 1].count, 3); // hoy
console.log("OK stats");

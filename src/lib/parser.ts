import type { TicketCategory } from "../types";

export interface ParsedTicket {
  callerName: string;
  location: string;
  problem: string;
  category: TicketCategory;
}

// Palabras que suelen marcar el inicio de la ubicación.
const LOCATION_WORDS = [
  "pabellon", "pabellón", "box", "piso", "sala", "ala", "anexo", "edificio",
  "unidad", "servicio", "laboratorio", "urgencia", "urgencias", "oncologia",
  "oncología", "quimio", "quimioterapia", "pediatria", "pediatría", "maternidad",
  "neonatologia", "neonatología", "pensionado", "consultorio", "policlinico",
  "policlínico", "admision", "admisión", "farmacia", "bodega", "recepcion",
  "recepción", "ascensor", "torre", "sector", "area", "área", "zona", "uci",
  "uti", "esterilizacion", "esterilización", "imagenologia", "imagenología",
  "kinesiologia", "kinesiología",
];

// Raíces/frases que marcan el inicio del requerimiento (se usa startsWith por raíz).
const PROBLEM_TRIGGERS = [
  "solicit", "necesit", "requier", "pide", "pido", "problema", "falla",
  "fallando", "no funciona", "no anda", "no enciende", "no imprime", "no prende",
  "dañ", "roto", "rota", "revis", "instal", "cambi", "trasl", "mover", "config",
  "repar", "arregl", "reinici", "format", "conect", "habilit", "crear", "reset",
  "restablec", "bloque", "desbloqu", "lento", "lenta", "sin señal", "sin acceso",
  "sin internet", "error", "repon", "reempl",
];

// El primer grupo que haga match gana. Orden = prioridad.
const CATEGORY_RULES: [TicketCategory, string[]][] = [
  ["IMPRESORAS", ["impresora", "imprimir", "imprime", "impresion", "impresión", "toner", "tóner", "cartucho", "plotter", "fotocopiadora"]],
  ["TRASLADOS", ["traslado", "trasladar", "mover", "cambio de lugar", "cambiar de lugar", "reubicar", "anexo", "telefono", "teléfono", "fono", "citofono", "citófono"]],
  ["CUENTAS", ["cuenta", "acceso", "clave", "contraseña", "usuario", "correo", "email", "login", "sesion", "sesión", "permiso", "permisos", "licencia", "active directory", "password", "desbloqueo", "desbloquear"]],
  ["EQUIPOS", ["computador", "computadora", "pc", "notebook", "equipo", "monitor", "pantalla", "teclado", "mouse", "cpu", "escaner", "escáner", "scanner", "disco", "ram", "hardware", "cable", "ups", "router", "wifi", "internet"]],
];

const PREPOSITIONS = new Set(["de", "del", "en", "la", "el", "los", "las", "a", "al", "y"]);

function stripEdges(s: string): string {
  return s.replace(/^[\s,.;:|-]+|[\s,.;:|-]+$/g, "").trim();
}

function stripTrailingPreps(words: string[]): string[] {
  const out = [...words];
  while (out.length > 1 && PREPOSITIONS.has(out[out.length - 1].toLowerCase())) out.pop();
  return out;
}

export function detectCategory(text: string): TicketCategory {
  const t = text.toLowerCase();
  for (const [cat, words] of CATEGORY_RULES) {
    if (words.some((w) => t.includes(w))) return cat;
  }
  return "OTRO";
}

function parseLabeled(text: string): Omit<ParsedTicket, "category"> | null {
  const grab = (labels: string[]): string | null => {
    for (const l of labels) {
      const re = new RegExp(
        `${l}\\s*[:\\-]\\s*(.+?)(?=\\s+(?:nombre|solicitante|lugar|ubicaci[oó]n|zona|problema|requerimiento|descripci[oó]n)\\s*[:\\-]|$)`,
        "i",
      );
      const m = text.match(re);
      if (m) return stripEdges(m[1]);
    }
    return null;
  };
  const name = grab(["nombre", "solicitante"]);
  const location = grab(["lugar", "ubicacion", "ubicación", "zona"]);
  const problem = grab(["problema", "requerimiento", "descripcion", "descripción"]);
  if (name || location || problem) {
    return { callerName: name || "", location: location || "", problem: problem || "" };
  }
  return null;
}

/**
 * Asistente heurístico: convierte texto libre en {nombre, lugar, problema, categoría}.
 * No es NLP real; el operador siempre puede corregir los campos antes de guardar.
 * ponytail: heurística por palabras clave; techo conocido, subir a IA (OpenAI/Claude)
 * en este mismo módulo si se necesita entender notas muy desordenadas.
 */
export function parseCall(raw: string): ParsedTicket {
  const text = stripEdges((raw || "").replace(/\s+/g, " "));
  if (!text) return { callerName: "", location: "", problem: "", category: "OTRO" };

  const category = detectCategory(text);

  // 1) Estructurado: "Nombre | Lugar | Problema".
  if (text.includes("|")) {
    const p = text.split("|").map(stripEdges);
    return {
      callerName: p[0] || "",
      location: p[1] || "",
      problem: p.slice(2).join(" | "),
      category,
    };
  }

  // 2) Etiquetado: "Nombre: ... Lugar: ... Problema: ...".
  const labeled = parseLabeled(text);
  if (labeled) return { ...labeled, category };

  // 3) Texto libre.
  const words = text.split(" ");
  const lower = words.map((w) => w.toLowerCase());

  let problemStart = -1;
  for (let i = 0; i < lower.length; i++) {
    const rest = lower.slice(i).join(" ");
    const hit = PROBLEM_TRIGGERS.some((tr) =>
      tr.includes(" ") ? rest.startsWith(tr) : lower[i].startsWith(tr),
    );
    if (hit) {
      problemStart = i;
      break;
    }
  }

  let before = words;
  let problem = "";
  if (problemStart >= 0) {
    before = words.slice(0, problemStart);
    problem = words.slice(problemStart).join(" ");
  }

  let locStart = -1;
  for (let i = 0; i < before.length; i++) {
    if (LOCATION_WORDS.includes(before[i].toLowerCase())) {
      locStart = i;
      break;
    }
  }

  let name = "";
  let location = "";
  if (locStart >= 0) {
    name = stripTrailingPreps(before.slice(0, locStart)).join(" ");
    location = before.slice(locStart).join(" ");
  } else if (before.length > 0) {
    name = before.slice(0, 1).join(" ");
    location = before.slice(1).join(" ");
  }

  return {
    callerName: stripEdges(name),
    location: stripEdges(location),
    problem: stripEdges(problem),
    category,
  };
}

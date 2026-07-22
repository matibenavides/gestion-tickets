import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
  type TicketCategory,
  type TicketStatus,
} from "../types";

export interface StatTicket {
  category: TicketCategory;
  status: TicketStatus;
  location: string;
  createdAt: Date;
}

export interface Stats {
  total: number;
  byStatus: { status: TicketStatus; label: string; count: number }[];
  byCategory: { category: TicketCategory; label: string; count: number }[];
  topZones: { zone: string; count: number }[];
  perDay: { date: string; label: string; count: number }[];
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Agrega tickets en memoria. ponytail: O(n) en memoria, suficiente a escala local;
 *  mover a GROUP BY en SQL si el volumen crece mucho. */
export function computeStats(tickets: StatTicket[], days = 14): Stats {
  const byStatus = new Map<TicketStatus, number>();
  const byCategory = new Map<TicketCategory, number>();
  const byZone = new Map<string, number>();
  const perDayMap = new Map<string, number>();

  for (const t of tickets) {
    byStatus.set(t.status, (byStatus.get(t.status) ?? 0) + 1);
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + 1);
    const zone = (t.location || "").trim() || "Sin ubicación";
    byZone.set(zone, (byZone.get(zone) ?? 0) + 1);
    const k = dayKey(new Date(t.createdAt));
    perDayMap.set(k, (perDayMap.get(k) ?? 0) + 1);
  }

  const perDay: Stats["perDay"] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = dayKey(d);
    perDay.push({
      date: k,
      label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      count: perDayMap.get(k) ?? 0,
    });
  }

  return {
    total: tickets.length,
    byStatus: STATUS_ORDER.map((s) => ({ status: s, label: STATUS_LABELS[s], count: byStatus.get(s) ?? 0 })),
    byCategory: CATEGORY_ORDER.map((c) => ({ category: c, label: CATEGORY_LABELS[c], count: byCategory.get(c) ?? 0 })),
    topZones: [...byZone.entries()]
      .map(([zone, count]) => ({ zone, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    perDay,
  };
}

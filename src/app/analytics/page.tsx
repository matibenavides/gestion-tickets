export const dynamic = "force-dynamic";

import { desc } from "drizzle-orm";
import { db } from "@/db";
import { tickets as ticketsTable } from "@/db/schema";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import StatCards from "@/components/StatCards";
import { computeStats } from "@/lib/stats";

export default async function AnalyticsPage() {
  const allTickets = await db.select().from(ticketsTable).orderBy(desc(ticketsTable.createdAt));
  const stats = computeStats(allTickets);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1280, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Métricas e indicadores</h1>
      <StatCards stats={stats} />
      <AnalyticsCharts stats={stats} />
    </div>
  );
}

export const dynamic = "force-dynamic";

import { listTickets } from "@/app/actions/tickets";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import StatCards from "@/components/StatCards";
import { computeStats } from "@/lib/stats";

export default async function AnalyticsPage() {
  const allTickets = await listTickets();
  const stats = computeStats(allTickets);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1280, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Métricas e indicadores</h1>
      <StatCards stats={stats} />
      <AnalyticsCharts stats={stats} />
    </div>
  );
}

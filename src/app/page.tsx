export const dynamic = "force-dynamic";

import { desc } from "drizzle-orm";
import { db } from "@/db";
import { tickets as ticketsTable } from "@/db/schema";
import { listContacts } from "@/app/actions/contacts";
import QuickTicketForm from "@/components/QuickTicketForm";
import StatCards from "@/components/StatCards";
import TicketTable from "@/components/TicketTable";
import { computeStats } from "@/lib/stats";

export default async function DashboardPage() {
  const allContacts = await listContacts();
  const activeContacts = allContacts.filter((c) => c.isActive);
  const allTickets = await db.select().from(ticketsTable).orderBy(desc(ticketsTable.createdAt));
  const stats = computeStats(allTickets);
  const recent = allTickets.slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280, margin: "0 auto" }}>
      <QuickTicketForm contacts={activeContacts} />
      <StatCards stats={stats} />
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 12px" }}>Últimos tickets</h2>
        <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <TicketTable tickets={recent} contacts={allContacts} showFilters={false} />
        </div>
      </section>
    </div>
  );
}

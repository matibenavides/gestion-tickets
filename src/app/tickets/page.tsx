export const dynamic = "force-dynamic";

import { listContacts } from "@/app/actions/contacts";
import { listTickets } from "@/app/actions/tickets";
import TicketTable from "@/components/TicketTable";

export default async function TicketsPage() {
  const [tickets, contacts] = await Promise.all([listTickets(), listContacts()]);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>Historial y gestión de tickets</h1>
      <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
        <TicketTable tickets={tickets} contacts={contacts} />
      </div>
    </div>
  );
}

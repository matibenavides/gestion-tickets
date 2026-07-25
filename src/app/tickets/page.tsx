export const dynamic = "force-dynamic";

import { listContacts } from "@/app/actions/contacts";
import { listTickets } from "@/app/actions/tickets";
import TicketTable from "@/components/TicketTable";
import { isRawDraft } from "@/types";

export default async function TicketsPage() {
  const [allTickets, contacts] = await Promise.all([listTickets(), listContacts()]);
  const tickets = allTickets.filter((t) => !isRawDraft(t));

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>Historial y gestión de tickets</h1>
      <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
        <TicketTable tickets={tickets} contacts={contacts} />
      </div>
    </div>
  );
}

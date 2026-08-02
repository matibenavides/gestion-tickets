export const dynamic = "force-dynamic";

import { listContacts } from "@/app/actions/contacts";
import ContactsManager from "@/components/ContactsManager";

export default async function ContactsPage() {
  const contacts = await listContacts();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 16px" }}>Contactos</h1>
      <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
        <ContactsManager contacts={contacts} />
      </div>
    </div>
  );
}

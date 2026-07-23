"use server";

import { sendZavuWhatsApp } from "@/lib/zavu";
import { markTicketSent } from "@/app/actions/tickets";

/** Envía el mensaje del ticket por WhatsApp vía la API sandbox de Zavu y lo marca como enviado. */
export async function sendTicketViaZavu(ticketId: string | undefined, to: string, text: string) {
  const result = await sendZavuWhatsApp(to, text);
  if (ticketId) await markTicketSent(ticketId);
  return result;
}

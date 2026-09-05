"use client";

import { App, Button, Modal, Typography } from "antd";
import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { MdBolt, MdComputer } from "react-icons/md";
import { markTicketSent, sendTicketWhatsApp } from "@/app/actions/tickets";
import {
  buildWhatsAppAppUrl,
  buildWhatsAppUrl,
  compactLine,
  formatWhatsAppMessage,
  type TicketMessageData,
} from "@/lib/whatsapp";
import type { Contact } from "@/types";

const { Paragraph, Text } = Typography;

export default function WhatsAppModal({
  open,
  ticketId,
  data,
  contact,
  onClose,
  onSent,
}: {
  open: boolean;
  ticketId?: string;
  data: TicketMessageData;
  contact: Contact | null;
  onClose: () => void;
  onSent?: () => void;
}) {
  const { message } = App.useApp();
  const [sending, setSending] = useState(false);
  const [sendingZavu, setSendingZavu] = useState(false);
  const msg = formatWhatsAppMessage(data);

  function openChannel(kind: "web" | "app", text: string, tab: Window | null) {
    if (kind === "app") {
      // Protocolo whatsapp:// → abre la app instalada sin salir de la página actual.
      const a = document.createElement("a");
      a.href = buildWhatsAppAppUrl(contact!.whatsappNumber, text);
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    const url = buildWhatsAppUrl(contact!.whatsappNumber, text);
    if (tab) {
      tab.opener = null;
      tab.location.replace(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  /** Envío automático (sin abrir WhatsApp) vía la API sandbox de Zavu. */
  async function sendViaZavu() {
    if (!ticketId) {
      message.warning("Guarda el ticket antes de enviarlo.");
      return;
    }
    if (!contact) {
      message.warning("No hay contacto asignado.");
      return;
    }
    setSendingZavu(true);
    try {
      await sendTicketWhatsApp(ticketId);
      message.success(`Enviado por WhatsApp a ${contact.name}.`);
      onSent?.();
      onClose();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "No se pudo enviar por Zavu.");
    } finally {
      setSendingZavu(false);
    }
  }

  async function send(kind: "web" | "app") {
    if (!contact) {
      message.warning("No hay contacto asignado.");
      return;
    }
    // La pestaña se abre dentro del clic (si se espera al await, el bloqueador de
    // ventanas emergentes la descarta) y recibe la URL cuando ya hay folio.
    const tab = kind === "web" ? window.open("", "_blank") : null;
    setSending(true);
    try {
      const row = ticketId ? await markTicketSent(ticketId) : null;
      openChannel(kind, formatWhatsAppMessage({ ...data, folio: row?.ticketNumber ?? data.folio }), tab);
      message.success("Ticket marcado como enviado.");
      onSent?.();
    } catch {
      // Aunque falle el registro, el mensaje se abre igual para no perder el envío.
      openChannel(kind, msg, tab);
      message.error("Se abrió WhatsApp, pero no se pudo marcar como enviado.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open={open} onCancel={onClose} title="Enviar por WhatsApp" footer={null} destroyOnHidden>
      <Text type="secondary">
        Para: {contact ? `${contact.name} · ${contact.whatsappNumber}` : "— sin contacto asignado —"}
      </Text>
      <Paragraph
        style={{
          whiteSpace: "pre-wrap",
          background: "#f5f5f5",
          padding: 12,
          borderRadius: 8,
          marginTop: 12,
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 13,
        }}
      >
        {msg}
      </Paragraph>
      {!data.folio && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          El folio se asigna al enviar: los borradores no consumen numeración.
        </Text>
      )}
      <Text type="secondary" style={{ fontSize: 12 }}>Forma compacta:</Text>
      <br />
      <Text code copyable={{ text: compactLine(data) }}>
        {compactLine(data) || "—"}
      </Text>
      <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <Button onClick={onClose}>Cerrar</Button>
        <Button
          icon={<MdBolt />}
          loading={sendingZavu}
          onClick={sendViaZavu}
          disabled={!contact || sending}
          title="Envía el mensaje automáticamente vía la API sandbox de Zavu, sin abrir WhatsApp."
        >
          Enviar automático (Zavu)
        </Button>
        <Button icon={<MdComputer />} loading={sending} onClick={() => send("app")} disabled={!contact || sendingZavu}>
          Abrir app de escritorio
        </Button>
        <Button type="primary" icon={<FaWhatsapp />} loading={sending} onClick={() => send("web")} disabled={!contact || sendingZavu}>
          Abrir WhatsApp Web
        </Button>
      </div>
    </Modal>
  );
}

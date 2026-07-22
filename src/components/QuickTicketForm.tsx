"use client";

import { App, Button, Card, Col, Divider, Input, Row, Select, Space, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaMagic, FaWhatsapp } from "react-icons/fa";
import { MdSave } from "react-icons/md";
import { createTicket } from "@/app/actions/tickets";
import { parseCall } from "@/lib/parser";
import { compactLine } from "@/lib/whatsapp";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Contact,
  type TicketCategory,
} from "@/types";
import WhatsAppModal from "./WhatsAppModal";

const { TextArea } = Input;
const { Text } = Typography;

export default function QuickTicketForm({ contacts }: { contacts: Contact[] }) {
  const { message } = App.useApp();
  const router = useRouter();

  const [raw, setRaw] = useState("");
  const [callerName, setCallerName] = useState("");
  const [location, setLocation] = useState("");
  const [problem, setProblem] = useState("");
  const [category, setCategory] = useState<TicketCategory>("OTRO");
  const [contactId, setContactId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ ticketId: string; contact: Contact } | null>(null);

  function handleParse() {
    if (!raw.trim()) {
      message.info("Escribe la nota de la llamada primero.");
      return;
    }
    const p = parseCall(raw);
    setCallerName(p.callerName);
    setLocation(p.location);
    setProblem(p.problem);
    setCategory(p.category);
    message.success("Nota clasificada. Revisa y corrige si hace falta.");
  }

  function reset() {
    setRaw("");
    setCallerName("");
    setLocation("");
    setProblem("");
    setCategory("OTRO");
    setContactId(undefined);
  }

  const contactOptions = contacts.map((c) => ({
    value: c.id,
    label: `${c.name} — ${c.role || c.zone || "sin rol"}`,
  }));

  async function saveDraft() {
    if (!callerName.trim() && !location.trim() && !problem.trim()) {
      message.warning("Completa al menos un campo.");
      return;
    }
    setSaving(true);
    try {
      await createTicket({ callerName, location, problem, rawNote: raw, category, assignedContactId: contactId ?? null }, "DRAFT");
      message.success("Borrador guardado.");
      reset();
      router.refresh();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function sendWhatsApp() {
    if (!callerName.trim() && !location.trim() && !problem.trim()) {
      message.warning("Completa al menos un campo.");
      return;
    }
    if (!contactId) {
      message.warning("Selecciona a quién enviar el ticket.");
      return;
    }
    setSaving(true);
    try {
      const row = await createTicket({ callerName, location, problem, rawNote: raw, category, assignedContactId: contactId }, "DRAFT");
      const contact = contacts.find((c) => c.id === contactId)!;
      setModal({ ticketId: row.id, contact });
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      title={
        <Space>
          <span>📝</span>
          <span>Bloc de Notas Inteligente</span>
        </Space>
      }
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
    >
      <Row gutter={[24, 16]}>
        <Col xs={24} md={11}>
          <Text type="secondary">Anota la llamada mientras hablas:</Text>
          <TextArea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={'Ej: "Paola de oncología sala de quimio box 10 solicita cambio de teléfono"'}
            autoSize={{ minRows: 8, maxRows: 16 }}
            style={{ marginTop: 8, fontSize: 15 }}
          />
          <Button
            type="primary"
            icon={<FaMagic />}
            onClick={handleParse}
            block
            style={{ marginTop: 12 }}
          >
            Clasificar / Formatear
          </Button>
        </Col>

        <Col xs={24} md={13}>
          <Text type="secondary">Campos (edítalos si es necesario):</Text>
          <Space orientation="vertical" size="small" style={{ width: "100%", marginTop: 8 }}>
            <div>
              <Text strong>Solicitante</Text>
              <Input value={callerName} onChange={(e) => setCallerName(e.target.value)} placeholder="Nombre de quien llama" />
            </div>
            <div>
              <Text strong>Ubicación / Zona / Piso / Box</Text>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Oncología, sala de quimio, box 10" />
            </div>
            <div>
              <Text strong>Requerimiento / Problema</Text>
              <TextArea value={problem} onChange={(e) => setProblem(e.target.value)} autoSize={{ minRows: 2, maxRows: 5 }} placeholder="Descripción del problema" />
            </div>
            <Row gutter={12}>
              <Col span={12}>
                <Text strong>Categoría</Text>
                <Select
                  value={category}
                  onChange={setCategory}
                  style={{ width: "100%" }}
                  options={CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
                />
              </Col>
              <Col span={12}>
                <Text strong>Enviar a</Text>
                <Select
                  value={contactId}
                  onChange={setContactId}
                  style={{ width: "100%" }}
                  placeholder="Supervisor / Técnico"
                  options={contactOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  notFoundContent="Crea contactos en la sección Contactos"
                />
              </Col>
            </Row>
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: "16px 0" }} />

      <Row align="middle" justify="space-between" gutter={[12, 12]}>
        <Col flex="auto">
          <Tag color={CATEGORY_COLORS[category]}>{CATEGORY_LABELS[category]}</Tag>
          <Text type="secondary" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            {compactLine({ callerName, location, problem }) || "Vista previa: Nombre | Lugar | Problema"}
          </Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<MdSave />} loading={saving} onClick={saveDraft}>
              Guardar borrador
            </Button>
            <Button type="primary" icon={<FaWhatsapp />} loading={saving} onClick={sendWhatsApp}>
              Enviar por WhatsApp
            </Button>
          </Space>
        </Col>
      </Row>

      <WhatsAppModal
        open={!!modal}
        ticketId={modal?.ticketId}
        data={{ callerName, location, problem }}
        contact={modal?.contact ?? null}
        onClose={() => setModal(null)}
        onSent={() => {
          setModal(null);
          reset();
          router.refresh();
        }}
      />
    </Card>
  );
}

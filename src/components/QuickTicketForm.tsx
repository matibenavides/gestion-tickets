"use client";

import { HappyProvider } from "@ant-design/happy-work-theme";
import { App, Badge, BorderBeam, Button, Card, Col, Divider, Flex, Input, Row, Select, Space, Tag, Typography } from "antd";
import type { BorderBeamGradient } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { MdSave, MdStickyNote2 } from "react-icons/md";
import { createTicket } from "@/app/actions/tickets";
import { createRawTag, listRawTags } from "@/app/actions/tags";
import { compactLine } from "@/lib/whatsapp";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DEFAULT_RAW_TAGS,
  type Contact,
  type RawTag,
  type Ticket,
  type TicketCategory,
} from "@/types";
import { useThemeMode } from "./AntdRegistry";
import RawDraftsList from "./RawDraftsList";
import WhatsAppModal from "./WhatsAppModal";

const { TextArea } = Input;
const { Text } = Typography;

// Gradiente "Nebula" del catálogo de Ant Design. En modo oscuro se usa el tono
// inmediatamente más claro de cada color: los originales se apagan sobre fondo negro.
const NEBULA: Record<"light" | "dark", BorderBeamGradient> = {
  light: [
    { color: "#2f54eb", percent: 0 },
    { color: "#722ed1", percent: 44 },
    { color: "#ff85c0", percent: 100 },
  ],
  dark: [
    { color: "#597ef7", percent: 0 },
    { color: "#9254de", percent: 44 },
    { color: "#ffadd2", percent: 100 },
  ],
};

export default function QuickTicketForm({ contacts, rawDrafts }: { contacts: Contact[]; rawDrafts: Ticket[] }) {
  const { message } = App.useApp();
  const router = useRouter();
  const { mode } = useThemeMode();

  const [raw, setRaw] = useState("");
  const [rawTag, setRawTag] = useState<string>("");
  const [callerName, setCallerName] = useState("");
  const [location, setLocation] = useState("");
  const [problem, setProblem] = useState("");
  const [category, setCategory] = useState<TicketCategory>("OTRO");
  const [contactId, setContactId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ ticketId: string; folio: number | null; createdAt: Date; contact: Contact } | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const [availableTags, setAvailableTags] = useState<RawTag[]>(DEFAULT_RAW_TAGS);

  useEffect(() => {
    listRawTags()
      .then((tags) => setAvailableTags(tags))
      .catch(() => {});
  }, []);

  /** Elegir etiqueta arrastra su categoría padre: no se clasifica dos veces. */
  function onTagPick(name?: string) {
    const picked = name ?? "";
    setRawTag(picked);
    const parent = availableTags.find((t) => t.name === picked);
    if (parent) setCategory(parent.category);
  }

  /** Registra la etiqueta en el catálogo si es nueva y devuelve el valor limpio. */
  async function ensureTag(): Promise<string> {
    const tagToSave = rawTag.trim();
    if (tagToSave && !availableTags.some((t) => t.name === tagToSave)) {
      const updated = await createRawTag(tagToSave, category);
      setAvailableTags(updated);
    }
    return tagToSave;
  }

  async function saveRawDraft() {
    if (!raw.trim()) {
      message.warning("Escribe la nota antes de guardar.");
      return;
    }
    setSaving(true);
    try {
      const tagToSave = await ensureTag();
      await createTicket({ callerName: "", location: "", problem: "", rawNote: raw, rawTag: tagToSave, category: "OTRO", assignedContactId: null }, "DRAFT");
      message.success("Nota guardada sin formatear.");
      reset();
      router.refresh();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setRaw("");
    setRawTag("");
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
      const tagToSave = await ensureTag();
      await createTicket({ callerName, location, problem, rawNote: raw, rawTag: tagToSave, category, assignedContactId: contactId ?? null }, "DRAFT");
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
      const tagToSave = await ensureTag();
      const row = await createTicket({ callerName, location, problem, rawNote: raw, rawTag: tagToSave, category, assignedContactId: contactId }, "DRAFT");
      const contact = contacts.find((c) => c.id === contactId)!;
      setModal({ ticketId: row.id, folio: row.ticketNumber, createdAt: row.createdAt, contact });
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
          <span>Bloc de Notas Inteligente</span>
        </Space>
      }
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
    >
      <Row gutter={[24, 16]}>
        <Col xs={24} md={11}>
          <Text type="secondary">Anota la llamada mientras hablas:</Text>
          {/* El haz se monta dentro del elemento que envuelve, y un <textarea> no
              admite hijos: va sobre un contenedor posicionado del mismo tamaño. */}
          <BorderBeam color={NEBULA[mode]}>
            <div style={{ position: "relative", marginTop: 8, borderRadius: 8 }}>
              <TextArea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="Escribe la nota de la llamada..."
                autoSize={{ minRows: 8, maxRows: 16 }}
                spellCheck={true}
                autoCorrect="on"
                autoCapitalize="sentences"
                style={{ fontSize: 15 }}
              />
            </div>
          </BorderBeam>
          <Flex gap={8} style={{ marginTop: 8 }} align="center">
            <Select
              placeholder="🏷️ Etiqueta (opcional)"
              value={rawTag || undefined}
              onChange={onTagPick}
              allowClear
              showSearch
              optionFilterProp="value"
              style={{ width: "100%" }}
              options={availableTags.map((t) => ({
                value: t.name,
                label: (
                  <Space size={4}>
                    <Tag color={CATEGORY_COLORS[t.category]} style={{ marginInlineEnd: 0 }}>
                      {CATEGORY_LABELS[t.category]}
                    </Tag>
                    <span>{t.name}</span>
                  </Space>
                ),
              }))}
            />
          </Flex>
          <Flex gap={8} style={{ marginTop: 8 }}>
            <Button icon={<MdSave />} loading={saving} onClick={saveRawDraft} style={{ flex: 1 }}>
              Almacenar Nota
            </Button>
            <Badge count={rawDrafts.length} size="small">
              <HappyProvider>
                <Button icon={<MdStickyNote2 />} onClick={() => setNotesOpen(true)}>
                  Notas
                </Button>
              </HappyProvider>
            </Badge>
          </Flex>
        </Col>

        <Col xs={24} md={13}>
          <Space orientation="vertical" size="small" style={{ width: "100%" }}>
            <div>
              <Text strong>Solicitante</Text>
              <Input
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="Nombre de quien llama"
                spellCheck={true}
                autoCorrect="on"
                autoCapitalize="words"
              />
            </div>
            <div>
              <Text strong>Ubicación / Zona / Piso / Box</Text>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Oncología, sala de quimio, box 10"
                spellCheck={true}
                autoCorrect="on"
                autoCapitalize="sentences"
              />
            </div>
            <div>
              <Text strong>Requerimiento / Problema</Text>
              <TextArea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 5 }}
                placeholder="Descripción del problema"
                spellCheck={true}
                autoCorrect="on"
                autoCapitalize="sentences"
              />
            </div>
            <Row gutter={12}>
              <Col span={12}>
                <Text strong>Categoría</Text>{" "}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (según etiqueta)
                </Text>
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
            <HappyProvider>
              <Button type="primary" icon={<FaWhatsapp />} loading={saving} onClick={sendWhatsApp}>
                Enviar por WhatsApp
              </Button>
            </HappyProvider>
          </Space>
        </Col>
      </Row>

      <RawDraftsList
        drafts={rawDrafts}
        open={notesOpen}
        serverTags={availableTags}
        onClose={() => setNotesOpen(false)}
        onSelectDraft={(noteText) => {
          setRaw(noteText);
          setNotesOpen(false);
          message.info("Nota cargada en el bloc.");
        }}
      />

      <WhatsAppModal
        open={!!modal}
        ticketId={modal?.ticketId}
        data={{ folio: modal?.folio, createdAt: modal?.createdAt, callerName, location, problem }}
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

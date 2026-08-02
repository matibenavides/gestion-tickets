"use client";

import {
  App,
  Button,
  DatePicker,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { MdDelete, MdEdit, MdSearch } from "react-icons/md";
import { deleteTicket, setTicketStatus, setTicketContact, setTicketRawTag, updateTicket } from "@/app/actions/tickets";
import { listRawTags } from "@/app/actions/tags";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DEFAULT_RAW_TAGS,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_ORDER,
  type Contact,
  type RawTag,
  type Ticket,
  type TicketCategory,
  type TicketStatus,
} from "@/types";
import { formatFolio } from "@/lib/whatsapp";
import WhatsAppModal from "./WhatsAppModal";

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface EditForm {
  callerName: string;
  location: string;
  problem: string;
  category: TicketCategory;
  rawTag?: string;
  assignedContactId?: string | null;
}

export default function TicketTable({
  tickets,
  contacts,
  showFilters = true,
}: {
  tickets: Ticket[];
  contacts: Contact[];
  showFilters?: boolean;
}) {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<EditForm>();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus>();
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory>();
  const [tagFilter, setTagFilter] = useState<string>();
  const [zoneFilter, setZoneFilter] = useState<string>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);

  const [editing, setEditing] = useState<Ticket | null>(null);
  const [resend, setResend] = useState<{ ticket: Ticket; contact: Contact | null } | null>(null);

  const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);

  const [catalog, setCatalog] = useState<RawTag[]>(DEFAULT_RAW_TAGS);

  useEffect(() => {
    listRawTags()
      .then(setCatalog)
      .catch(() => {});
  }, []);

  // Catálogo + etiquetas huérfanas que ya viven en tickets (heredan la categoría del ticket).
  const allAvailableTags = useMemo(() => {
    const byName = new Map(catalog.map((t) => [t.name, t]));
    for (const t of tickets) {
      if (t.rawTag && !byName.has(t.rawTag)) byName.set(t.rawTag, { name: t.rawTag, category: t.category });
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, tickets]);

  const zoneOptions = useMemo(() => {
    const set = new Set(tickets.map((t) => t.location.trim()).filter(Boolean));
    return [...set].sort().map((z) => ({ value: z, label: z }));
  }, [tickets]);

  const editContactOptions = useMemo(() => {
    const currentId = editing?.assignedContactId;
    return contacts
      .filter((c) => c.isActive || c.id === currentId)
      .map((c) => ({
        value: c.id,
        label: `${c.name} — ${c.role || c.zone || "sin rol"}${!c.isActive ? " (Inactivo)" : ""}`,
      }));
  }, [contacts, editing]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (tagFilter && t.rawTag !== tagFilter) return false;
      if (zoneFilter && t.location.trim() !== zoneFilter) return false;
      if (range) {
        const d = dayjs(t.createdAt);
        if (d.isBefore(range[0].startOf("day")) || d.isAfter(range[1].endOf("day"))) return false;
      }
      if (q) {
        const hay = `${t.callerName} ${t.location} ${t.problem} ${t.rawTag}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter, categoryFilter, tagFilter, zoneFilter, range]);

  async function onStatusChange(id: string, status: TicketStatus) {
    try {
      await setTicketStatus(id, status);
      message.success("Estado actualizado.");
      router.refresh();
    } catch {
      message.error("No se pudo cambiar el estado.");
    }
  }

  async function onContactChange(id: string, contactId: string | null) {
    try {
      await setTicketContact(id, contactId);
      message.success("Contacto asignado actualizado.");
      router.refresh();
    } catch {
      message.error("No se pudo cambiar el contacto asignado.");
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteTicket(id);
      message.success("Ticket eliminado.");
      router.refresh();
    } catch {
      message.error("No se pudo eliminar.");
    }
  }

  async function onTagChange(id: string, rawTag: string | null) {
    try {
      await setTicketRawTag(id, rawTag ?? "");
      message.success("Etiqueta actualizada.");
      router.refresh();
    } catch {
      message.error("No se pudo actualizar la etiqueta.");
    }
  }

  function openEdit(t: Ticket) {
    setEditing(t);
    form.setFieldsValue({
      callerName: t.callerName,
      location: t.location,
      problem: t.problem,
      category: t.category,
      rawTag: t.rawTag || undefined,
      assignedContactId: t.assignedContactId ?? undefined,
    });
  }

  async function saveEdit() {
    if (!editing) return;
    const v = await form.validateFields();
    try {
      await updateTicket(editing.id, { ...v, rawTag: v.rawTag ?? "", assignedContactId: v.assignedContactId ?? null });
      message.success("Ticket actualizado.");
      setEditing(null);
      router.refresh();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "No se pudo actualizar.");
    }
  }

  const columns: ColumnsType<Ticket> = [
    {
      title: "Folio",
      dataIndex: "ticketNumber",
      width: 55,
      render: (n: number | null) => <Text strong style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{formatFolio(n)}</Text>,
      sorter: (a, b) => (a.ticketNumber ?? 0) - (b.ticketNumber ?? 0),
    },
    {
      title: "Fecha",
      dataIndex: "createdAt",
      width: 75,
      render: (d: Date) => <Text style={{ fontSize: 12 }}>{dayjs(d).format("DD/MM HH:mm")}</Text>,
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      defaultSortOrder: "descend",
    },
    { title: "Solicitante", dataIndex: "callerName", width: 90, ellipsis: true, render: (v: string) => v || <Text type="secondary">—</Text> },
    { title: "Ubicación", dataIndex: "location", width: 90, ellipsis: true, render: (v: string) => v || <Text type="secondary">—</Text> },
    {
      // Una sola línea truncada; el texto completo va en el Tooltip para que una
      // descripción larga no ensanche la columna.
      title: "Requerimiento",
      dataIndex: "problem",
      width: 150,
      ellipsis: { showTitle: false },
      render: (v: string) =>
        v ? (
          <Tooltip title={v} placement="topLeft" styles={{ root: { maxWidth: 380 } }}>
            <span>{v}</span>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      // Etiqueta (específica) y categoría (agrupación) en una sola celda: el chip
      // lleva el nombre de la etiqueta y el color de su categoría padre.
      title: "Clasificación",
      dataIndex: "rawTag",
      width: 150,
      render: (tag: string, row) => (
        <Select
          size="small"
          variant="filled"
          value={tag || undefined}
          placeholder={CATEGORY_LABELS[row.category]}
          allowClear
          showSearch
          optionFilterProp="value"
          style={{ width: "100%" }}
          onChange={(val) => onTagChange(row.id, val ?? null)}
          options={allAvailableTags.map((t) => ({
            value: t.name,
            label: (
              <Tag color={CATEGORY_COLORS[t.category]} style={{ marginInlineEnd: 0 }}>
                {t.name}
              </Tag>
            ),
          }))}
        />
      ),
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 100,
      render: (s: TicketStatus, row) => (
        <Select
          size="small"
          value={s}
          style={{ width: "100%" }}
          onChange={(val) => onStatusChange(row.id, val)}
          options={STATUS_ORDER.map((st) => ({
            value: st,
            label: <Tag color={STATUS_COLORS[st]} style={{ marginInlineEnd: 0 }}>{STATUS_LABELS[st]}</Tag>,
          }))}
        />
      ),
    },
    {
      title: "Asignado",
      dataIndex: "assignedContactId",
      width: 100,
      render: (id: string | null, row) => {
        const rowContactOptions = contacts
          .filter((c) => c.isActive || c.id === id)
          .map((c) => ({
            value: c.id,
            label: `${c.name}`,
          }));
        return (
          <Select
            size="small"
            value={id ?? undefined}
            style={{ width: "100%" }}
            placeholder="Sin asignar"
            allowClear
            showSearch
            optionFilterProp="label"
            onChange={(val) => onContactChange(row.id, val ?? null)}
            options={rowContactOptions}
          />
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      width: 70,
      render: (_, row) => {
        const contact = row.assignedContactId ? contactById.get(row.assignedContactId) ?? null : null;
        return (
          <Space size={0}>
            <Tooltip title="Reenviar por WhatsApp">
              <Button
                type="text"
                size="small"
                icon={<FaWhatsapp color="#25D366" />}
                onClick={() => setResend({ ticket: row, contact })}
              />
            </Tooltip>
            <Tooltip title="Editar">
              <Button type="text" size="small" icon={<MdEdit />} onClick={() => openEdit(row)} />
            </Tooltip>
            <Popconfirm title="¿Eliminar ticket?" okText="Sí" cancelText="No" onConfirm={() => onDelete(row.id)}>
              <Button type="text" size="small" danger icon={<MdDelete />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {showFilters && (
        // Anchos flexibles: en pantallas angostas los filtros encogen y bajan de
        // línea en vez de empujar la página a lo ancho.
        <Flex wrap gap={8} style={{ marginBottom: 16 }}>
          <Input
            prefix={<MdSearch />}
            placeholder="Buscar nombre, lugar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            spellCheck={true}
            style={{ flex: "1 1 200px", minWidth: 150, maxWidth: 220 }}
          />
          <Select
            placeholder="Estado"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ flex: "1 1 130px", minWidth: 110, maxWidth: 140 }}
            options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          />
          <Select
            placeholder="Categoría"
            value={categoryFilter}
            onChange={setCategoryFilter}
            allowClear
            style={{ flex: "1 1 125px", minWidth: 110, maxWidth: 130 }}
            options={CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
          />
          <Select
            placeholder="🏷️ Etiqueta"
            value={tagFilter}
            onChange={setTagFilter}
            allowClear
            showSearch
            style={{ flex: "1 1 140px", minWidth: 120, maxWidth: 150 }}
            options={allAvailableTags.map((t) => ({ value: t.name, label: `🏷️ ${t.name}` }))}
          />
          <Select
            placeholder="Zona"
            value={zoneFilter}
            onChange={setZoneFilter}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ flex: "1 1 130px", minWidth: 110, maxWidth: 140 }}
            options={zoneOptions}
          />
          <RangePicker
            format="DD/MM/YYYY"
            value={range}
            onChange={(v) => setRange(v as [Dayjs, Dayjs] | null)}
            style={{ flex: "1 1 230px", minWidth: 170, maxWidth: 230 }}
          />
        </Flex>
      )}

      {/* El scroll vive en este contenedor, no en la Table: en escritorio las
          columnas caben y no aparece barra; en pantallas angostas scrollea la
          tabla y no la página completa. */}
      <div style={{ overflowX: "auto" }}>
        <Table<Ticket>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          size="small"
          tableLayout="fixed"
          style={{ minWidth: 880 }}
          pagination={{ pageSize: showFilters ? 10 : 5, hideOnSinglePage: !showFilters, showSizeChanger: false }}
        />
      </div>

      <Modal
        open={!!editing}
        title="Editar ticket"
        onCancel={() => setEditing(null)}
        onOk={saveEdit}
        okText="Guardar"
        cancelText="Cancelar"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="callerName" label="Solicitante">
            <Input spellCheck={true} autoCorrect="on" autoCapitalize="words" />
          </Form.Item>
          <Form.Item name="location" label="Ubicación">
            <Input spellCheck={true} autoCorrect="on" autoCapitalize="sentences" />
          </Form.Item>
          <Form.Item name="problem" label="Requerimiento">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} spellCheck={true} autoCorrect="on" autoCapitalize="sentences" />
          </Form.Item>
          <Form.Item name="rawTag" label="Etiqueta">
            <Select
              allowClear
              showSearch
              optionFilterProp="value"
              placeholder="Sin etiqueta"
              onChange={(name?: string) => {
                const parent = allAvailableTags.find((t) => t.name === name);
                if (parent) form.setFieldValue("category", parent.category);
              }}
              options={allAvailableTags.map((t) => ({
                value: t.name,
                label: (
                  <Tag color={CATEGORY_COLORS[t.category]} style={{ marginInlineEnd: 0 }}>
                    {t.name}
                  </Tag>
                ),
              }))}
            />
          </Form.Item>
          <Form.Item name="category" label="Categoría" extra="Se completa sola al elegir la etiqueta.">
            <Select options={CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))} />
          </Form.Item>
          <Form.Item name="assignedContactId" label="Asignado a">
            <Select allowClear showSearch optionFilterProp="label" options={editContactOptions} placeholder="Sin asignar" />
          </Form.Item>
        </Form>
      </Modal>

      <WhatsAppModal
        open={!!resend}
        ticketId={resend?.ticket.id}
        data={{
          folio: resend?.ticket.ticketNumber,
          callerName: resend?.ticket.callerName ?? "",
          location: resend?.ticket.location ?? "",
          problem: resend?.ticket.problem ?? "",
        }}
        contact={resend?.contact ?? null}
        onClose={() => setResend(null)}
        onSent={() => {
          setResend(null);
          router.refresh();
        }}
      />
    </>
  );
}

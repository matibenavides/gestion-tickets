"use client";

import {
  App,
  Button,
  DatePicker,
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
import { useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { MdDelete, MdEdit, MdSearch } from "react-icons/md";
import { deleteTicket, setTicketStatus, setTicketContact, updateTicket } from "@/app/actions/tickets";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_ORDER,
  type Contact,
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
  const [zoneFilter, setZoneFilter] = useState<string>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);

  const [editing, setEditing] = useState<Ticket | null>(null);
  const [resend, setResend] = useState<{ ticket: Ticket; contact: Contact | null } | null>(null);

  const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);

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
      if (zoneFilter && t.location.trim() !== zoneFilter) return false;
      if (range) {
        const d = dayjs(t.createdAt);
        if (d.isBefore(range[0].startOf("day")) || d.isAfter(range[1].endOf("day"))) return false;
      }
      if (q) {
        const hay = `${t.callerName} ${t.location} ${t.problem}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter, categoryFilter, zoneFilter, range]);

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

  function openEdit(t: Ticket) {
    setEditing(t);
    form.setFieldsValue({
      callerName: t.callerName,
      location: t.location,
      problem: t.problem,
      category: t.category,
      assignedContactId: t.assignedContactId ?? undefined,
    });
  }

  async function saveEdit() {
    if (!editing) return;
    const v = await form.validateFields();
    try {
      await updateTicket(editing.id, { ...v, assignedContactId: v.assignedContactId ?? null });
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
      width: 90,
      render: (n: number) => <Text strong style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{formatFolio(n)}</Text>,
      sorter: (a, b) => a.ticketNumber - b.ticketNumber,
    },
    {
      title: "Fecha",
      dataIndex: "createdAt",
      width: 120,
      render: (d: Date) => <Text style={{ fontSize: 12 }}>{dayjs(d).format("DD/MM HH:mm")}</Text>,
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      defaultSortOrder: "descend",
    },
    { title: "Solicitante", dataIndex: "callerName", width: 140, render: (v: string) => v || <Text type="secondary">—</Text> },
    { title: "Ubicación", dataIndex: "location", width: 200, render: (v: string) => v || <Text type="secondary">—</Text> },
    { title: "Requerimiento", dataIndex: "problem", ellipsis: true, render: (v: string) => v || <Text type="secondary">—</Text> },
    {
      title: "Categoría",
      dataIndex: "category",
      width: 120,
      render: (c: TicketCategory) => <Tag color={CATEGORY_COLORS[c]}>{CATEGORY_LABELS[c]}</Tag>,
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 170,
      render: (s: TicketStatus, row) => (
        <Select
          size="small"
          value={s}
          style={{ width: 155 }}
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
      width: 180,
      render: (id: string | null, row) => {
        const rowContactOptions = contacts
          .filter((c) => c.isActive || c.id === id)
          .map((c) => ({
            value: c.id,
            label: `${c.name} — ${c.role || c.zone || "sin rol"}${!c.isActive ? " (Inactivo)" : ""}`,
          }));
        return (
          <Select
            size="small"
            value={id ?? undefined}
            style={{ width: 165 }}
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
      width: 130,
      fixed: "right",
      render: (_, row) => {
        const contact = row.assignedContactId ? contactById.get(row.assignedContactId) ?? null : null;
        return (
          <Space size={2}>
            <Tooltip title="Reenviar por WhatsApp">
              <Button
                type="text"
                icon={<FaWhatsapp color="#25D366" />}
                onClick={() => setResend({ ticket: row, contact })}
              />
            </Tooltip>
            <Tooltip title="Editar">
              <Button type="text" icon={<MdEdit />} onClick={() => openEdit(row)} />
            </Tooltip>
            <Popconfirm title="¿Eliminar ticket?" okText="Sí" cancelText="No" onConfirm={() => onDelete(row.id)}>
              <Button type="text" danger icon={<MdDelete />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {showFilters && (
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            prefix={<MdSearch />}
            placeholder="Buscar nombre, lugar o problema"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
          <Select
            placeholder="Estado"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 170 }}
            options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          />
          <Select
            placeholder="Categoría"
            value={categoryFilter}
            onChange={setCategoryFilter}
            allowClear
            style={{ width: 150 }}
            options={CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
          />
          <Select
            placeholder="Zona"
            value={zoneFilter}
            onChange={setZoneFilter}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: 180 }}
            options={zoneOptions}
          />
          <RangePicker
            format="DD/MM/YYYY"
            value={range}
            onChange={(v) => setRange(v as [Dayjs, Dayjs] | null)}
          />
        </Space>
      )}

      <Table<Ticket>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        size="middle"
        scroll={{ x: 1150 }}
        pagination={{ pageSize: showFilters ? 10 : 5, hideOnSinglePage: !showFilters, showSizeChanger: false }}
      />

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
            <Input />
          </Form.Item>
          <Form.Item name="location" label="Ubicación">
            <Input />
          </Form.Item>
          <Form.Item name="problem" label="Requerimiento">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} />
          </Form.Item>
          <Form.Item name="category" label="Categoría">
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

"use client";

import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import { FaWhatsapp, FaPlus } from "react-icons/fa";
import {
  createContact,
  deleteContact,
  toggleContact,
  updateContact,
  type ContactInput,
} from "@/app/actions/contacts";
import type { Contact } from "@/types";

const { Text } = Typography;

export default function ContactsManager({ contacts }: { contacts: Contact[] }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<ContactInput>();
  const [editing, setEditing] = useState<Contact | null>(null);
  const [open, setOpen] = useState(false);

  function openNew() {
    setEditing(null);
    form.setFieldsValue({ name: "", role: "", zone: "", whatsappNumber: "+56", isActive: true });
    setOpen(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    form.setFieldsValue({ name: c.name, role: c.role, zone: c.zone, whatsappNumber: c.whatsappNumber, isActive: c.isActive });
    setOpen(true);
  }

  async function save() {
    const v = await form.validateFields();
    try {
      if (editing) await updateContact(editing.id, v);
      else await createContact(v);
      message.success(editing ? "Contacto actualizado." : "Contacto creado.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  }

  async function onToggle(c: Contact, isActive: boolean) {
    try {
      await toggleContact(c.id, isActive);
      router.refresh();
    } catch {
      message.error("No se pudo cambiar el estado.");
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteContact(id);
      message.success("Contacto eliminado.");
      router.refresh();
    } catch {
      message.error("No se pudo eliminar.");
    }
  }

  const columns: ColumnsType<Contact> = [
    { title: "Nombre", dataIndex: "name" },
    { title: "Rol", dataIndex: "role", render: (v: string) => v || <Text type="secondary">—</Text> },
    { title: "Zona / Área", dataIndex: "zone", render: (v: string) => (v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>) },
    {
      title: "WhatsApp",
      dataIndex: "whatsappNumber",
      render: (v: string) => (
        <Space size={4}>
          <FaWhatsapp color="#25D366" />
          <Text>{v}</Text>
        </Space>
      ),
    },
    {
      title: "Activo",
      dataIndex: "isActive",
      width: 90,
      render: (active: boolean, row) => <Switch checked={active} onChange={(val) => onToggle(row, val)} />,
    },
    {
      title: "Acciones",
      key: "actions",
      width: 110,
      render: (_, row) => (
        <Space size={2}>
          <Button type="text" icon={<MdEdit />} onClick={() => openEdit(row)} />
          <Popconfirm title="¿Eliminar contacto?" okText="Sí" cancelText="No" onConfirm={() => onDelete(row.id)}>
            <Button type="text" danger icon={<MdDelete />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <Button type="primary" icon={<FaPlus />} onClick={openNew}>
          Nuevo contacto
        </Button>
      </div>

      <Table<Contact> rowKey="id" columns={columns} dataSource={contacts} pagination={{ pageSize: 10, hideOnSinglePage: true }} />

      <Modal
        open={open}
        title={editing ? "Editar contacto" : "Nuevo contacto"}
        onCancel={() => setOpen(false)}
        onOk={save}
        okText="Guardar"
        cancelText="Cancelar"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nombre" rules={[{ required: true, message: "El nombre es obligatorio" }]}>
            <Input placeholder="Ej: Carlos Muñoz" spellCheck={true} autoCorrect="on" autoCapitalize="words" />
          </Form.Item>
          <Form.Item name="role" label="Rol">
            <Input placeholder="Ej: Supervisor de Infraestructura" spellCheck={true} autoCorrect="on" autoCapitalize="words" />
          </Form.Item>
          <Form.Item name="zone" label="Zona / Área asignada">
            <Input placeholder="Ej: Pabellón, Oncología, Administración" spellCheck={true} autoCorrect="on" autoCapitalize="words" />
          </Form.Item>
          <Form.Item
            name="whatsappNumber"
            label="WhatsApp (con código de país)"
            rules={[
              { required: true, message: "El número es obligatorio" },
              {
                validator: (_, value) =>
                  (value || "").replace(/\D/g, "").length >= 8
                    ? Promise.resolve()
                    : Promise.reject(new Error("Número inválido (ej: +56912345678)")),
              },
            ]}
          >
            <Input placeholder="+56912345678" />
          </Form.Item>
          <Form.Item name="isActive" label="Activo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

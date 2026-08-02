"use client";

import { App, Button, Divider, Empty, Flex, Input, Modal, Popconfirm, Select, Space, Tag, Typography } from "antd";
import { useState } from "react";
import { MdAdd, MdDelete, MdLabel } from "react-icons/md";
import { createRawTag, deleteRawTag, setRawTagCategory } from "@/app/actions/tags";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type RawTag,
  type TicketCategory,
} from "@/types";

const { Text } = Typography;

export default function TagManagerModal({
  open,
  tags,
  onClose,
  onTagsUpdated,
}: {
  open: boolean;
  tags: RawTag[];
  onClose: () => void;
  onTagsUpdated?: (newTags: RawTag[]) => void;
}) {
  const { message } = App.useApp();
  const [newTag, setNewTag] = useState("");
  const [newCategory, setNewCategory] = useState<TicketCategory>("OTRO");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    const trimmed = newTag.trim();
    if (!trimmed) {
      message.warning("Escribe el nombre de la etiqueta.");
      return;
    }
    if (tags.some((t) => t.name === trimmed)) {
      message.info("Esa etiqueta ya existe.");
      return;
    }

    setLoading(true);
    try {
      const updated = await createRawTag(trimmed, newCategory);
      message.success(`Etiqueta "${trimmed}" creada.`);
      setNewTag("");
      setNewCategory("OTRO");
      onTagsUpdated?.(updated);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Error al crear etiqueta.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCategoryChange(name: string, category: TicketCategory) {
    setLoading(true);
    try {
      const updated = await setRawTagCategory(name, category);
      message.success(`"${name}" ahora es ${CATEGORY_LABELS[category]}.`);
      onTagsUpdated?.(updated);
    } catch {
      message.error("No se pudo cambiar la categoría.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(tagName: string) {
    setLoading(true);
    try {
      const updated = await deleteRawTag(tagName);
      message.success(`Etiqueta "${tagName}" eliminada.`);
      onTagsUpdated?.(updated);
    } catch {
      message.error("No se pudo eliminar la etiqueta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <MdLabel color="#1677ff" size={20} />
          <span>Gestionar Etiquetas</span>
        </Space>
      }
      footer={null}
      destroyOnHidden
      width={520}
    >
      <Space vertical style={{ width: "100%" }} size="middle">
        <Text type="secondary" style={{ fontSize: 13 }}>
          Cada etiqueta pertenece a una categoría. Al usarla en un ticket, éste hereda esa categoría
          automáticamente y alimenta las métricas.
        </Text>

        <Space.Compact block>
          <Input
            placeholder="Nueva etiqueta"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onPressEnter={handleAdd}
          />
          <Select
            value={newCategory}
            onChange={setNewCategory}
            style={{ width: 140 }}
            options={CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
          />
          <Button type="primary" icon={<MdAdd />} loading={loading} onClick={handleAdd}>
            Agregar
          </Button>
        </Space.Compact>

        <Divider style={{ margin: "8px 0" }} />

        {tags.length === 0 ? (
          <Empty description="No hay etiquetas registradas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            <Flex vertical gap={6}>
              {tags.map((tag) => (
                <Flex
                  key={tag.name}
                  justify="space-between"
                  align="center"
                  gap={8}
                  style={{ padding: "6px 10px", background: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" }}
                >
                  <Tag color={CATEGORY_COLORS[tag.category]} style={{ fontSize: 13, padding: "2px 8px", marginInlineEnd: 0 }}>
                    {tag.name}
                  </Tag>
                  <Space size={4}>
                    <Select
                      size="small"
                      variant="filled"
                      value={tag.category}
                      style={{ width: 120 }}
                      onChange={(c) => handleCategoryChange(tag.name, c)}
                      options={CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
                    />
                    <Popconfirm
                      title={`¿Eliminar la etiqueta "${tag.name}"?`}
                      description="Las notas con esta etiqueta pasarán a estar Sin etiqueta."
                      okText="Eliminar"
                      cancelText="Cancelar"
                      onConfirm={() => handleDelete(tag.name)}
                    >
                      <Button type="text" danger size="small" icon={<MdDelete />} title="Eliminar etiqueta" />
                    </Popconfirm>
                  </Space>
                </Flex>
              ))}
            </Flex>
          </div>
        )}
      </Space>
    </Modal>
  );
}

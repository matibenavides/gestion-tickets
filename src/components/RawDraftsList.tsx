"use client";

import {
  App,
  Button,
  DatePicker,
  Divider,
  Empty,
  Flex,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MdContentCopy, MdDelete, MdInput, MdSearch, MdSettings } from "react-icons/md";
import { createRawTag, listRawTags } from "@/app/actions/tags";
import { deleteTicket, setTicketRawTag } from "@/app/actions/tickets";
import { CATEGORY_COLORS, DEFAULT_RAW_TAGS, type RawTag, type Ticket } from "@/types";
import TagManagerModal from "./TagManagerModal";

const { RangePicker } = DatePicker;
const { Text, Paragraph } = Typography;

export default function RawDraftsList({
  drafts,
  open,
  onClose,
  onSelectDraft,
  serverTags,
}: {
  drafts: Ticket[];
  open: boolean;
  onClose: () => void;
  onSelectDraft?: (rawNote: string) => void;
  serverTags?: RawTag[];
}) {
  const { message } = App.useApp();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [managedTags, setManagedTags] = useState<RawTag[]>(serverTags ?? DEFAULT_RAW_TAGS);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      listRawTags()
        .then((tags) => setManagedTags(tags))
        .catch(() => {});
    }
  }, [open]);

  async function onDelete(id: string) {
    try {
      await deleteTicket(id);
      message.success("Nota eliminada.");
      router.refresh();
    } catch {
      message.error("No se pudo eliminar.");
    }
  }

  async function onCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      message.success("Texto copiado.");
    } catch {
      message.error("No se pudo copiar.");
    }
  }

  async function onTagChange(id: string, newTag: string) {
    const trimmed = (newTag ?? "").trim();
    try {
      if (trimmed && !managedTags.some((t) => t.name === trimmed)) {
        const updated = await createRawTag(trimmed);
        setManagedTags(updated);
      }
      await setTicketRawTag(id, trimmed);
      message.success(trimmed ? `Etiqueta "${trimmed}" asignada.` : "Etiqueta removida.");
      router.refresh();
    } catch {
      message.error("No se pudo actualizar la etiqueta.");
    }
  }

  const allAvailableTags = useMemo(() => {
    const byName = new Map(managedTags.map((t) => [t.name, t]));
    for (const d of drafts) {
      if (d.rawTag && !byName.has(d.rawTag)) byName.set(d.rawTag, { name: d.rawTag, category: d.category });
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [managedTags, drafts]);

  const filteredDrafts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = drafts.filter((t) => {
      // Filtro de texto
      if (q && !t.rawNote.toLowerCase().includes(q)) return false;

      // Filtro de etiqueta
      if (tagFilter === "NO_TAG" && t.rawTag) return false;
      if (tagFilter !== "ALL" && tagFilter !== "NO_TAG" && t.rawTag !== tagFilter) return false;

      // Filtro de fecha
      if (dateRange) {
        const d = dayjs(t.createdAt);
        if (d.isBefore(dateRange[0].startOf("day")) || d.isAfter(dateRange[1].endOf("day"))) {
          return false;
        }
      }

      return true;
    });

    return result.sort((a, b) => {
      const timeA = dayjs(a.createdAt).valueOf();
      const timeB = dayjs(b.createdAt).valueOf();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [drafts, search, tagFilter, dateRange, sortOrder]);

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        title={
          <Flex justify="space-between" align="center" style={{ paddingRight: 24 }}>
            <Space>
              <span>Notas sin formatear</span>
              <Tag color="blue">{drafts.length}</Tag>
            </Space>
            <Button
              type="text"
              size="small"
              icon={<MdSettings color="#1677ff" />}
              onClick={() => setTagManagerOpen(true)}
            >
              Gestionar etiquetas
            </Button>
          </Flex>
        }
        footer={null}
        destroyOnHidden
        width={680}
      >
        <Space vertical style={{ width: "100%" }} size="middle">
          {/* Fila 1 de Filtros: Buscador y Ordenamiento */}
          <Flex gap={8} wrap>
            <Input
              prefix={<MdSearch size={18} color="#8c8c8c" />}
              placeholder="Buscar en el contenido de las notas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ flex: 1, minWidth: 200 }}
            />
            <Select
              value={sortOrder}
              onChange={setSortOrder}
              options={[
                { value: "desc", label: "Más recientes" },
                { value: "asc", label: "Más antiguas" },
              ]}
              style={{ width: 140 }}
            />
          </Flex>

          {/* Fila 2 de Filtros: Etiqueta y Rango de Fechas */}
          <Flex gap={8} wrap align="center">
            <Select
              value={tagFilter}
              onChange={setTagFilter}
              style={{ width: 210 }}
              options={[
                { value: "ALL", label: "🏷️ Todas las etiquetas" },
                { value: "NO_TAG", label: "⚪ Sin etiqueta" },
                ...allAvailableTags.map((tag) => ({
                  value: tag.name,
                  label: `🏷️ ${tag.name}`,
                })),
              ]}
            />
            <RangePicker
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={(v) => setDateRange(v as [Dayjs, Dayjs] | null)}
              placeholder={["Fecha inicio", "Fecha fin"]}
              style={{ flex: 1, minWidth: 220 }}
            />
            {(search || tagFilter !== "ALL" || dateRange) && (
              <Button
                type="link"
                onClick={() => {
                  setSearch("");
                  setTagFilter("ALL");
                  setDateRange(null);
                }}
                style={{ padding: 0 }}
              >
                Limpiar filtros
              </Button>
            )}
          </Flex>

          {drafts.length === 0 ? (
            <Empty description="Sin notas pendientes de formatear" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : filteredDrafts.length === 0 ? (
            <Empty description="No hay notas que coincidan con los filtros aplicados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ maxHeight: 440, overflowY: "auto", paddingRight: 4 }}>
              <Flex vertical>
                {filteredDrafts.map((t, i) => (
                  <div key={t.id}>
                    {i > 0 && <Divider style={{ margin: "12px 0" }} />}
                    <Flex justify="space-between" align="flex-start" gap={12}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(t.createdAt).format("DD/MM/YYYY HH:mm")}
                          </Text>
                          <Select
                            size="small"
                            variant="filled"
                            value={t.rawTag || undefined}
                            placeholder="+ Etiqueta"
                            onChange={(val) => onTagChange(t.id, val ?? "")}
                            allowClear
                            showSearch
                            optionFilterProp="value"
                            style={{ minWidth: 150 }}
                            options={allAvailableTags.map((tag) => ({
                              value: tag.name,
                              label: (
                                <Tag color={CATEGORY_COLORS[tag.category]} style={{ marginInlineEnd: 0 }}>
                                  {tag.name}
                                </Tag>
                              ),
                            }))}
                          />
                        </Flex>
                        <Paragraph
                          ellipsis={{ rows: 3, expandable: true, symbol: "ver más" }}
                          style={{ marginBottom: 0, fontFamily: "var(--font-geist-mono), monospace", fontSize: 13 }}
                        >
                          {t.rawNote}
                        </Paragraph>
                      </div>
                      <Space size={2}>
                        {onSelectDraft && (
                          <Button
                            type="primary"
                            ghost
                            size="small"
                            icon={<MdInput />}
                            onClick={() => onSelectDraft(t.rawNote)}
                            title="Cargar nota en el bloc principal"
                          >
                            Usar
                          </Button>
                        )}
                        <Button type="text" icon={<MdContentCopy />} onClick={() => onCopy(t.rawNote)} title="Copiar texto" />
                        <Popconfirm title="¿Eliminar nota?" okText="Sí" cancelText="No" onConfirm={() => onDelete(t.id)}>
                          <Button type="text" danger icon={<MdDelete />} title="Eliminar" />
                        </Popconfirm>
                      </Space>
                    </Flex>
                  </div>
                ))}
              </Flex>
            </div>
          )}
        </Space>
      </Modal>

      <TagManagerModal
        open={tagManagerOpen}
        tags={managedTags}
        onClose={() => setTagManagerOpen(false)}
        onTagsUpdated={(updated) => {
          setManagedTags(updated);
          router.refresh();
        }}
      />
    </>
  );
}

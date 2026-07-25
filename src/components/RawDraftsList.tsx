"use client";

import { App, Button, Divider, Empty, Flex, Modal, Popconfirm, Space, Typography } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { MdContentCopy, MdDelete } from "react-icons/md";
import { deleteTicket } from "@/app/actions/tickets";
import type { Ticket } from "@/types";

const { Text, Paragraph } = Typography;

export default function RawDraftsList({
  drafts,
  open,
  onClose,
}: {
  drafts: Ticket[];
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const router = useRouter();

  async function onDelete(id: string) {
    try {
      await deleteTicket(id);
      message.success("Borrador eliminado.");
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

  return (
    <Modal open={open} onCancel={onClose} title="Notas sin formatear" footer={null} destroyOnHidden>
      {drafts.length === 0 ? (
        <Empty description="Sin notas pendientes de formatear" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Flex vertical>
          {drafts.map((t, i) => (
            <div key={t.id}>
              {i > 0 && <Divider style={{ margin: "8px 0" }} />}
              <Flex justify="space-between" align="flex-start" gap={8}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(t.createdAt).format("DD/MM HH:mm")}
                  </Text>
                  <Paragraph
                    ellipsis={{ rows: 2, expandable: true, symbol: "ver más" }}
                    style={{ marginBottom: 0, fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {t.rawNote}
                  </Paragraph>
                </div>
                <Space size={0}>
                  <Button type="text" icon={<MdContentCopy />} onClick={() => onCopy(t.rawNote)} title="Copiar texto" />
                  <Popconfirm title="¿Eliminar borrador?" okText="Sí" cancelText="No" onConfirm={() => onDelete(t.id)}>
                    <Button type="text" danger icon={<MdDelete />} title="Eliminar" />
                  </Popconfirm>
                </Space>
              </Flex>
            </div>
          ))}
        </Flex>
      )}
    </Modal>
  );
}

"use client";

import { Card, Col, Row, Statistic } from "antd";
import { HiTicket } from "react-icons/hi2";
import { MdCheckCircle, MdHourglassTop, MdOutlineCancel, MdPendingActions, MdStickyNote2 } from "react-icons/md";
import type { Stats } from "@/lib/stats";
import { STATUS_COLORS } from "@/types";

const statusIcons: Record<string, React.ReactNode> = {
  "Total tickets": <HiTicket size={20} color="#2563eb" />,
  Borrador: <MdStickyNote2 size={20} color="#64748b" />,
  "Enviado / Pendiente": <MdPendingActions size={20} color="#0284c7" />,
  "En Proceso": <MdHourglassTop size={20} color="#d97706" />,
  Resuelto: <MdCheckCircle size={20} color="#16a34a" />,
  Cancelado: <MdOutlineCancel size={20} color="#dc2626" />,
};

const statusColorsHex: Record<string, string> = {
  default: "#64748b",
  blue: "#0284c7",
  gold: "#d97706",
  green: "#16a34a",
  red: "#dc2626",
};

export default function StatCards({ stats }: { stats: Stats }) {
  const cards = [
    { title: "Total tickets", value: stats.total, color: "#2563eb" },
    ...stats.byStatus.map((s) => ({
      title: s.label,
      value: s.count,
      color: statusColorsHex[STATUS_COLORS[s.status]] ?? "#64748b",
    })),
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((c) => (
        <Col key={c.title} xs={12} sm={8} md={8} lg={4} xl={4}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              background: "#ffffff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{c.title}</span>
              <div style={{ marginLeft: "auto" }}>{statusIcons[c.title]}</div>
            </div>
            <Statistic
              value={c.value}
              styles={{
                content: { color: c.color, fontWeight: 700, fontSize: 22, lineHeight: 1.2 },
              }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

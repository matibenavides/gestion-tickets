"use client";

import { Card, Col, Row, Statistic } from "antd";
import type { Stats } from "@/lib/stats";
import { STATUS_COLORS } from "@/types";

const antdColorHex: Record<string, string> = {
  default: "#8c8c8c",
  blue: "#2563eb",
  gold: "#d48806",
  green: "#389e0d",
  red: "#cf1322",
};

export default function StatCards({ stats }: { stats: Stats }) {
  const cards = [
    { title: "Total tickets", value: stats.total, color: "#2563eb" },
    ...stats.byStatus.map((s) => ({
      title: s.label,
      value: s.count,
      color: antdColorHex[STATUS_COLORS[s.status]] ?? "#8c8c8c",
    })),
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((c) => (
        <Col key={c.title} xs={12} sm={8} md={8} lg={4} xl={4}>
          <Card size="small" variant="borderless" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <Statistic title={c.title} value={c.value} styles={{ content: { color: c.color, fontWeight: 700 } }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

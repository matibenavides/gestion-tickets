"use client";

import { Card, Col, Empty, Row } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Stats } from "@/lib/stats";

const CATEGORY_HEX: Record<string, string> = {
  Equipos: "#2563eb",
  Impresoras: "#f5222d",
  Cuentas: "#722ed1",
  Traslados: "#13c2c2",
  Otro: "#8c8c8c",
};

const ZONE_COLOR = "#2563eb";

export default function AnalyticsCharts({ stats }: { stats: Stats }) {
  const categoryData = stats.byCategory.filter((c) => c.count > 0);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card title="Tickets creados por día (últimos 14 días)" variant="borderless">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.perDay} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Tickets" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card title="Distribución por tipo de problema" variant="borderless">
          {categoryData.length === 0 ? (
            <Empty description="Sin datos" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(props) => `${props.name}: ${props.value}`}
                >
                  {categoryData.map((c) => (
                    <Cell key={c.label} fill={CATEGORY_HEX[c.label] ?? "#8c8c8c"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="Zonas con más fallas reportadas" variant="borderless">
          {stats.topZones.length === 0 ? (
            <Empty description="Sin datos" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topZones} layout="vertical" margin={{ left: 24, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" allowDecimals={false} fontSize={12} />
                <YAxis type="category" dataKey="zone" width={120} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" name="Tickets" fill={ZONE_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="Tickets por estado" variant="borderless">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.byStatus} margin={{ top: 8, right: 16, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" name="Tickets" fill="#13c2c2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
}

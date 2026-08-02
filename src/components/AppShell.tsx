"use client";

import { Layout, Menu, Typography } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MdBarChart, MdContacts, MdDashboard } from "react-icons/md";
import { HiTicket } from "react-icons/hi2";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const items = [
  { key: "/", icon: <MdDashboard size={18} />, label: <Link href="/">Inicio</Link> },
  { key: "/tickets", icon: <HiTicket size={18} />, label: <Link href="/tickets">Tickets</Link> },
  { key: "/contacts", icon: <MdContacts size={18} />, label: <Link href="/contacts">Contactos</Link> },
  { key: "/analytics", icon: <MdBarChart size={18} />, label: <Link href="/analytics">Métricas</Link> },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey =
    items
      .map((i) => i.key)
      .filter((k) => (k === "/" ? pathname === "/" : pathname.startsWith(k)))
      .sort((a, b) => b.length - a.length)[0] ?? "/";

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth={0}
        theme="light"
        style={{
          borderRight: "1px solid #e2e8f0",
          boxShadow: "2px 0 10px rgba(0,0,0,0.015)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 56,
            padding: "0 16px",
            fontWeight: 700,
            color: "#2563eb",
            fontSize: 16,
          }}
        >
          <HiTicket size={22} />
          {!collapsed && <span>Soporte</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          style={{
            borderInlineEnd: "none",
            fontWeight: 500,
            fontSize: 14,
          }}
        />
      </Sider>
      <Layout style={{ background: "#f8fafc" }}>
        <Header
          style={{
            background: "#ffffff",
            padding: "0 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            height: 56,
          }}
        >
          <Title level={4} style={{ margin: 0, color: "#0f172a", fontWeight: 600, fontSize: 17 }}>
            Tickets de Soporte
          </Title>
        </Header>
        <Content style={{ padding: "24px 28px", maxWidth: 1480, margin: "0 auto", width: "100%" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

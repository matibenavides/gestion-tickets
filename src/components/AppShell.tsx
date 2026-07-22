"use client";

import { Layout, Menu, Typography } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MdBarChart, MdContacts, MdDashboard } from "react-icons/md";
import { HiTicket } from "react-icons/hi2";

const { Header, Sider, Content } = Layout;

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
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth={0}
        theme="light"
        style={{ borderRight: "1px solid #f0f0f0" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 56, padding: "0 16px", fontWeight: 700, color: "#2563eb" }}>
          <HiTicket size={22} />
          {!collapsed && <span>Soporte</span>}
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={items} style={{ borderInlineEnd: "none" }} />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center" }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Gestión y Despacho de Tickets
          </Typography.Title>
        </Header>
        <Content style={{ padding: 24, background: "#f5f6f8" }}>{children}</Content>
      </Layout>
    </Layout>
  );
}

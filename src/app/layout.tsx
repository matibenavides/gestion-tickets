import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AntdProvider from "@/components/AntdRegistry";
import AppShell from "@/components/AppShell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Despacho de Tickets de Soporte",
  description: "Gestión y despacho rápido de tickets de soporte con envío por WhatsApp.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // El tema llega en cookie para que el HTML del servidor ya venga en el modo
  // elegido y no haya parpadeo claro → oscuro al hidratar.
  const mode = (await cookies()).get("tickets-theme")?.value === "dark" ? "dark" : "light";

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`} style={{ colorScheme: mode }}>
      <body>
        <AntdProvider initialMode={mode}>
          <AppShell>{children}</AppShell>
        </AntdProvider>
      </body>
    </html>
  );
}

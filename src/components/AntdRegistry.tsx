"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp, ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";
import "dayjs/locale/es";

const themeConfig = {
  token: {
    colorPrimary: "#2563eb",
    borderRadius: 8,
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
};

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={themeConfig} locale={esES}>
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}

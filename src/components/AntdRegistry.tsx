"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import esES from "antd/locale/es_ES";
import "dayjs/locale/es";
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

const themeConfig = {
  token: {
    colorPrimary: "#2563eb",
    borderRadius: 8,
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
};

export type ThemeMode = "light" | "dark";

const COOKIE_NAME = "tickets-theme";
const ONE_YEAR = 60 * 60 * 24 * 365;

const ThemeModeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({
  mode: "light",
  toggle: () => {},
});

/** Modo claro/oscuro; lo cambia el botón de la cabecera. */
export function useThemeMode() {
  return useContext(ThemeModeContext);
}

// La preferencia viaja en una cookie para que el servidor ya pinte el tema
// correcto: si viviera solo en el navegador, la primera pintura sería clara y
// el cambio a oscuro se vería como un parpadeo.
const listeners = new Set<() => void>();
let currentMode: ThemeMode | null = null;

function readCookie(): ThemeMode | null {
  const match = document.cookie.match(/(?:^|;\s*)tickets-theme=(light|dark)/);
  return match ? (match[1] as ThemeMode) : null;
}

function readMode(): ThemeMode {
  return readCookie() ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getMode(): ThemeMode {
  if (currentMode === null) currentMode = readMode();
  return currentMode;
}

function setMode(next: ThemeMode) {
  currentMode = next;
  document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  listeners.forEach((notify) => notify());
}

export default function AntdProvider({
  children,
  initialMode = "light",
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}) {
  const mode = useSyncExternalStore(subscribe, getMode, () => initialMode);

  // Para que las barras de scroll y los controles nativos acompañen al tema.
  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const themeMode = useMemo(
    () => ({ mode, toggle: () => setMode(mode === "dark" ? "light" : "dark") }),
    [mode],
  );

  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          ...themeConfig,
          algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
        locale={esES}
      >
        <ThemeModeContext.Provider value={themeMode}>
          <AntdApp>{children}</AntdApp>
        </ThemeModeContext.Provider>
      </ConfigProvider>
    </AntdRegistry>
  );
}

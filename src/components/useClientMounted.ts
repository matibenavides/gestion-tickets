"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * `false` durante el render del servidor y la hidratación; `true` después.
 *
 * Sirve para montar solo en el cliente lo que no existe en el HTML del servidor
 * —por ejemplo un modal con `forceRender`, cuyo portal React no puede hidratar—.
 */
export default function useClientMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

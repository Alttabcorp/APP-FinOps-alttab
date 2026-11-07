"use client";

import { useEffect } from "react";

/** Registra o service worker só em produção, para o app poder ser instalado. */
export function RegistrarSw() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);
  return null;
}

"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Registro falhou (ex.: HTTP em origem não confiável); silencioso em dev
      }
    };

    void register();
  }, []);

  return null;
}

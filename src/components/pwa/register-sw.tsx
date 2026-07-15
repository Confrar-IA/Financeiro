"use client";

import { useEffect } from "react";

function isVercelPreviewHost(hostname: string) {
  if (!hostname.endsWith(".vercel.app")) return false;
  // Preview: projeto-hash-escopo.vercel.app (≥ 3 segmentos no subdomain)
  // Produção típica: projeto-escopo.vercel.app (2 segmentos)
  const subdomain = hostname.replace(/\.vercel\.app$/i, "");
  return subdomain.split("-").length >= 3;
}

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (isVercelPreviewHost(window.location.hostname)) {
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((reg) => reg.unregister())));
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Registro falhou (ex.: HTTP em origem não confiável)
      }
    };

    void register();
  }, []);

  return null;
}

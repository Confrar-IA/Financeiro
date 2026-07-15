import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

function getLanHosts() {
  const hosts = new Set<string>(["127.0.0.1", "localhost"]);

  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        hosts.add(entry.address);
      }
    }
  }

  const fromEnv =
    process.env.ALLOWED_DEV_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  for (const host of fromEnv) {
    hosts.add(host);
  }

  return Array.from(hosts);
}

const nextConfig: NextConfig = {
  // Necessário para o app carregar JS/CSS no mobile via IP da rede (modo dev)
  allowedDevOrigins: getLanHosts(),
  async headers() {
    return [
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;

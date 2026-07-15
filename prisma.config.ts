import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL || "file:./data/finan.db";
  const withoutScheme = raw.replace(/^file:/i, "");
  const absolutePath = path.isAbsolute(withoutScheme)
    ? withoutScheme
    : path.join(process.cwd(), withoutScheme.replace(/^\.\//, ""));

  return `file:${absolutePath.replace(/\\/g, "/")}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});

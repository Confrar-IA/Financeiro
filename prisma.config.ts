import "dotenv/config";
import { defineConfig } from "prisma/config";

import { getSqliteUrl } from "./src/lib/db";

/**
 * Prisma Migrate continua usando SQLite local.
 * O runtime do app usa Turso quando TURSO_DATABASE_URL estiver definido.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getSqliteUrl(),
  },
});

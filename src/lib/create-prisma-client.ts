import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

import { getDatabaseConnection } from "./db";

/** Factory compartilhada entre runtime Next e scripts (seed/migração). */
export function createPrismaClientFromEnv() {
  const connection = getDatabaseConnection();

  const adapter =
    connection.kind === "turso"
      ? new PrismaLibSql({
          url: connection.url,
          authToken: connection.authToken,
        })
      : new PrismaBetterSqlite3({
          url: connection.url,
        });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

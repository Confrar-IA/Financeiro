import { mkdirSync } from "node:fs";
import path from "node:path";

export type DatabaseConnection =
  | { kind: "turso"; url: string; authToken: string }
  | { kind: "sqlite"; url: string };

function resolveLocalSqliteUrl(raw: string) {
  const withoutScheme = raw.replace(/^file:/i, "");
  const normalized = withoutScheme.replace(/^\.\//, "");

  const absolutePath = path.isAbsolute(withoutScheme)
    ? withoutScheme
    : path.join(process.cwd(), normalized);

  mkdirSync(path.dirname(absolutePath), { recursive: true });
  return `file:${absolutePath.replace(/\\/g, "/")}`;
}

/**
 * Conexão usada pelo app em runtime.
 * Preferência: TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) ou DATABASE_URL libsql://...
 * Fallback: SQLite local em arquivo.
 */
export function getDatabaseConnection(): DatabaseConnection {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL?.trim() ||
    (process.env.DATABASE_URL?.startsWith("libsql://")
      ? process.env.DATABASE_URL.trim()
      : undefined);

  if (tursoUrl) {
    const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
    if (!authToken) {
      throw new Error(
        "TURSO_AUTH_TOKEN é obrigatório para conectar ao banco Turso/libSQL.",
      );
    }

    return {
      kind: "turso",
      url: tursoUrl,
      authToken,
    };
  }

  return {
    kind: "sqlite",
    url: resolveLocalSqliteUrl(process.env.DATABASE_URL || "file:./data/finan.db"),
  };
}

/** Caminho absoluto do SQLite local (usado por migrate/shadow DB). */
export function getSqliteFilePath() {
  const raw =
    process.env.PRISMA_MIGRATE_DATABASE_URL ||
    (!process.env.DATABASE_URL?.startsWith("libsql://")
      ? process.env.DATABASE_URL
      : undefined) ||
    "file:./data/finan.db";

  return resolveLocalSqliteUrl(raw).replace(/^file:/i, "");
}

/** URL file: local para Prisma Migrate / CLI. */
export function getSqliteUrl() {
  return `file:${getSqliteFilePath().replace(/\\/g, "/")}`;
}

export function describeDatabaseTarget(connection = getDatabaseConnection()) {
  if (connection.kind === "turso") {
    return connection.url;
  }
  return connection.url;
}

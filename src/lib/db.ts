import { mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Resolve o caminho absoluto do arquivo SQLite.
 * Garante que local e rede interna usem o mesmo banco em disco.
 */
export function getSqliteFilePath() {
  const raw = process.env.DATABASE_URL || "file:./data/finan.db";
  const withoutScheme = raw.replace(/^file:/i, "");
  const normalized = withoutScheme.replace(/^\.\//, "");

  const absolutePath = path.isAbsolute(withoutScheme)
    ? withoutScheme
    : path.join(process.cwd(), normalized);

  mkdirSync(path.dirname(absolutePath), { recursive: true });

  return absolutePath;
}

/** URL no formato esperado pelo Prisma / better-sqlite3 */
export function getSqliteUrl() {
  const absolutePath = getSqliteFilePath().replace(/\\/g, "/");
  return `file:${absolutePath}`;
}

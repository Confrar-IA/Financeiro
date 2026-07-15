import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";

function splitSqlStatements(sql: string) {
  // Remove comentários de linha inteira antes de quebrar por `;`
  // (comentários podem conter `;` e gerar SQL inválido).
  const withoutLineComments = sql
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith("--");
    })
    .join("\n");

  return withoutLineComments
    .split(";")
    .map((part) => part.trim())
    .filter((statement) => statement.length > 0);
}

async function ensureMigrationsTable(client: Client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);
}

async function resetDatabase(client: Client) {
  const tables = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
  );

  await client.execute("PRAGMA foreign_keys = OFF");
  for (const row of tables.rows) {
    const name = String(row.name);
    await client.execute(`DROP TABLE IF EXISTS "${name}"`);
    console.log(`drop ${name}`);
  }
  await client.execute("PRAGMA foreign_keys = ON");
}

/**
 * Aplica as migrations SQL locais no banco Turso remoto.
 * Uso:
 *   npx tsx scripts/apply-turso-migrations.ts
 *   npx tsx scripts/apply-turso-migrations.ts --reset
 */
async function main() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  const reset = process.argv.includes("--reset");

  if (!url?.startsWith("libsql://")) {
    throw new Error("Defina TURSO_DATABASE_URL com a URL libsql:// do Turso.");
  }
  if (!authToken) {
    throw new Error("Defina TURSO_AUTH_TOKEN com o token do Turso.");
  }

  const client = createClient({ url, authToken });

  if (reset) {
    console.log("reset remoto...");
    await resetDatabase(client);
  }

  await ensureMigrationsTable(client);

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const folders = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const applied = await client.execute(
    `SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL`,
  );
  const appliedNames = new Set(
    applied.rows.map((row) => String(row.migration_name)),
  );

  for (const folder of folders) {
    if (appliedNames.has(folder)) {
      console.log(`skip ${folder}`);
      continue;
    }

    const sqlPath = path.join(migrationsDir, folder, "migration.sql");
    const statements = splitSqlStatements(readFileSync(sqlPath, "utf8"));

    console.log(`apply ${folder} (${statements.length} statements)`);

    for (const statement of statements) {
      await client.execute(statement);
    }

    await client.execute({
      sql: `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
            VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)`,
      args: [
        crypto.randomUUID(),
        "applied-via-script",
        folder,
        statements.length,
      ],
    });
  }

  const tables = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`,
  );
  console.log(
    "Turso OK:",
    url,
    "tables=",
    tables.rows.map((row) => String(row.name)).join(", "),
  );
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

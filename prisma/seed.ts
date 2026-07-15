import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { getSqliteUrl } from "../src/lib/db";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Limpa o banco. Categorias são criadas por usuário no registro.
 */
const adapter = new PrismaBetterSqlite3({
  url: getSqliteUrl(),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("SQLite limpo. Crie uma conta em /register.", {
    database: getSqliteUrl(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

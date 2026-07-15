import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import { createPrismaClientFromEnv } from "../src/lib/create-prisma-client";
import { describeDatabaseTarget } from "../src/lib/db";

/**
 * Limpa o banco. Categorias são criadas por usuário no registro.
 */
const prisma: PrismaClient = createPrismaClientFromEnv();

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("Banco limpo. Crie uma conta em /register.", {
    database: describeDatabaseTarget(),
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

import "dotenv/config";
import { createPrismaClientFromEnv } from "../src/lib/create-prisma-client";
import { describeDatabaseTarget } from "../src/lib/db";

async function main() {
  const prisma = createPrismaClientFromEnv();
  const [users, categories, transactions] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.transaction.count(),
  ]);

  console.log({
    database: describeDatabaseTarget(),
    users,
    categories,
    transactions,
  });

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});

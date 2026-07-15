import { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClientFromEnv } from "@/lib/create-prisma-client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Em desenvolvimento, recria o client a cada reload do módulo para evitar
// schema antigo em memória após migrações.
export const prisma =
  process.env.NODE_ENV === "production"
    ? (globalForPrisma.prisma ?? createPrismaClientFromEnv())
    : createPrismaClientFromEnv();

if (process.env.NODE_ENV === "production") {
  globalForPrisma.prisma = prisma;
}

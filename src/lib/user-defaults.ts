import { prisma } from "@/lib/prisma";

const DEFAULT_CATEGORIES = [
  {
    name: "Alimentação",
    color: "#ef4444",
    icon: "Utensils",
    type: "expense" as const,
  },
  {
    name: "Transporte",
    color: "#3b82f6",
    icon: "Car",
    type: "expense" as const,
  },
  {
    name: "Lazer",
    color: "#a855f7",
    icon: "Gamepad2",
    type: "expense" as const,
  },
  {
    name: "Moradia",
    color: "#f59e0b",
    icon: "Home",
    type: "expense" as const,
  },
  {
    name: "Saúde",
    color: "#14b8a6",
    icon: "HeartPulse",
    type: "expense" as const,
  },
  {
    name: "Salário",
    color: "#22c55e",
    icon: "Wallet",
    type: "income" as const,
  },
  {
    name: "Freelance",
    color: "#84cc16",
    icon: "Briefcase",
    type: "income" as const,
  },
] as const;

/** Cria categorias iniciais exclusivas do usuário */
export async function createUserDefaults(userId: string) {
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({
      ...category,
      userId,
    })),
  });
}

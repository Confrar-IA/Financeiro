import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(50),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Cor deve estar no formato #RRGGBB"),
  icon: z.string().trim().min(1, "Ícone é obrigatório").max(50),
  type: z.enum(["income", "expense"]),
});

export const categoryUpdateSchema = categorySchema.partial();

export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

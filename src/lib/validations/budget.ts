import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  limitAmount: z
    .number({ error: "Valor inválido" })
    .positive("Limite deve ser maior que zero"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const budgetUpdateSchema = budgetSchema.partial();

export const budgetFormSchema = z.object({
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  limitAmount: z
    .number({ error: "Valor inválido" })
    .positive("Limite deve ser maior que zero"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

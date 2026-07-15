import { z } from "zod";

import {
  EXPENSE_PAYMENT_METHODS,
  INCOME_PAYMENT_METHODS,
  PAYMENT_METHODS,
} from "@/lib/payment-methods";

export const transactionSchema = z
  .object({
    description: z.string().trim().min(1, "Descrição é obrigatória").max(120),
    amount: z.coerce.number().positive("Valor deve ser maior que zero"),
    type: z.enum(["income", "expense"]),
    date: z.coerce.date({ error: "Data inválida" }),
    categoryId: z.string().min(1, "Categoria é obrigatória"),
    paymentMethod: z.enum(PAYMENT_METHODS, {
      error: "Método de pagamento inválido",
    }),
    scheduleType: z.enum(["none", "recurring", "installment"]).default("none"),
    recurrenceMonths: z.coerce.number().int().min(2).max(60).optional(),
    installments: z.coerce.number().int().min(2).max(48).optional(),
  })
  .superRefine((value, ctx) => {
    const allowed =
      value.type === "income"
        ? INCOME_PAYMENT_METHODS
        : EXPENSE_PAYMENT_METHODS;

    if (!allowed.includes(value.paymentMethod)) {
      ctx.addIssue({
        code: "custom",
        message:
          value.type === "income"
            ? "Receita deve ser Dinheiro ou Conta"
            : "Despesa deve ser Débito, Crédito, PIX ou Dinheiro",
        path: ["paymentMethod"],
      });
    }

    if (value.type === "income" && value.scheduleType !== "none") {
      ctx.addIssue({
        code: "custom",
        message: "Receitas devem ser lançamentos únicos",
        path: ["scheduleType"],
      });
    }

    if (value.scheduleType === "recurring" && !value.recurrenceMonths) {
      ctx.addIssue({
        code: "custom",
        message: "Informe por quantos meses a recorrência vale",
        path: ["recurrenceMonths"],
      });
    }

    if (value.scheduleType === "installment" && !value.installments) {
      ctx.addIssue({
        code: "custom",
        message: "Informe em quantas parcelas dividir",
        path: ["installments"],
      });
    }
  });

export const transactionUpdateSchema = z
  .object({
    description: z.string().trim().min(1).max(120).optional(),
    amount: z.coerce.number().positive().optional(),
    type: z.enum(["income", "expense"]).optional(),
    date: z.coerce.date().optional(),
    categoryId: z.string().min(1).optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.type || !value.paymentMethod) return;

    const allowed =
      value.type === "income"
        ? INCOME_PAYMENT_METHODS
        : EXPENSE_PAYMENT_METHODS;

    if (!allowed.includes(value.paymentMethod)) {
      ctx.addIssue({
        code: "custom",
        message: "Método de pagamento inválido para o tipo informado",
        path: ["paymentMethod"],
      });
    }
  });

export const transactionQuerySchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  categoryId: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;

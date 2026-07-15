import { z } from "zod";

import {
  EXPENSE_PAYMENT_METHODS,
  INCOME_PAYMENT_METHODS,
  PAYMENT_METHODS,
} from "@/lib/payment-methods";

export const transactionFormSchema = z
  .object({
    description: z.string().trim().min(1, "Descrição é obrigatória").max(120),
    amount: z
      .number({ error: "Valor inválido" })
      .positive("Valor deve ser maior que zero"),
    type: z.enum(["income", "expense"]),
    date: z.string().min(1, "Data é obrigatória"),
    categoryId: z.string().min(1, "Categoria é obrigatória"),
    paymentMethod: z.enum(PAYMENT_METHODS, {
      error: "Método de pagamento é obrigatório",
    }),
    scheduleType: z.enum(["none", "recurring", "installment"]),
    recurrenceMonths: z.number().int().min(2).max(60).optional(),
    installments: z.number().int().min(2).max(48).optional(),
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

    if (
      value.type === "expense" &&
      value.scheduleType === "recurring" &&
      (!value.recurrenceMonths || value.recurrenceMonths < 2)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Informe de 2 a 60 meses",
        path: ["recurrenceMonths"],
      });
    }

    if (
      value.type === "expense" &&
      value.scheduleType === "installment" &&
      (!value.installments || value.installments < 2)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Informe de 2 a 48 parcelas",
        path: ["installments"],
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

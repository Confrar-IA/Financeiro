import { randomUUID } from "node:crypto";
import { addMonths } from "date-fns";

import type { PaymentMethod } from "@/lib/payment-methods";

export type ScheduleType = "none" | "recurring" | "installment";

type BuildSeriesInput = {
  description: string;
  amount: number;
  type: "income" | "expense";
  date: Date;
  categoryId: string;
  paymentMethod: PaymentMethod;
  userId: string;
  scheduleType: ScheduleType;
  recurrenceMonths?: number;
  installments?: number;
};

export type TransactionCreatePayload = {
  description: string;
  amount: number;
  type: "income" | "expense";
  date: Date;
  categoryId: string;
  paymentMethod: PaymentMethod;
  userId: string;
  isRecurring: boolean;
  recurrenceMonths: number | null;
  installments: number | null;
  installmentIndex: number | null;
  seriesId: string | null;
};

/** Divide valor total em parcelas (com ajuste de centavos) */
export function splitInstallmentAmounts(total: number, count: number) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const amounts = Array.from({ length: count }, () => base);
  let remainder = cents - base * count;

  for (let i = 0; i < remainder; i += 1) {
    amounts[i] += 1;
  }

  return amounts.map((value) => value / 100);
}

export function buildTransactionSeries(
  input: BuildSeriesInput,
): TransactionCreatePayload[] {
  // Receitas são sempre únicas
  const scheduleType =
    input.type === "income" ? "none" : input.scheduleType;

  const seriesId = randomUUID();

  if (scheduleType === "recurring") {
    const months = input.recurrenceMonths ?? 1;
    return Array.from({ length: months }, (_, index) => ({
      description: input.description,
      amount: input.amount,
      type: input.type,
      date: addMonths(input.date, index),
      categoryId: input.categoryId,
      paymentMethod: input.paymentMethod,
      userId: input.userId,
      isRecurring: true,
      recurrenceMonths: months,
      installments: null,
      installmentIndex: index + 1,
      seriesId,
    }));
  }

  if (scheduleType === "installment") {
    const count = input.installments ?? 1;
    const amounts = splitInstallmentAmounts(input.amount, count);

    return amounts.map((amount, index) => ({
      description: `${input.description} (${index + 1}/${count})`,
      amount,
      type: input.type,
      date: addMonths(input.date, index),
      categoryId: input.categoryId,
      paymentMethod: input.paymentMethod,
      userId: input.userId,
      isRecurring: false,
      recurrenceMonths: null,
      installments: count,
      installmentIndex: index + 1,
      seriesId,
    }));
  }

  return [
    {
      description: input.description,
      amount: input.amount,
      type: input.type,
      date: input.date,
      categoryId: input.categoryId,
      paymentMethod: input.paymentMethod,
      userId: input.userId,
      isRecurring: false,
      recurrenceMonths: null,
      installments: null,
      installmentIndex: null,
      seriesId: null,
    },
  ];
}

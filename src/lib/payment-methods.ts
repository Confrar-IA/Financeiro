export const PAYMENT_METHODS = [
  "debit",
  "credit",
  "pix",
  "cash",
  "account",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const LABELS: Record<PaymentMethod, string> = {
  debit: "Débito",
  credit: "Crédito",
  pix: "PIX",
  cash: "Dinheiro",
  account: "Conta",
};

export const EXPENSE_PAYMENT_METHODS: PaymentMethod[] = [
  "debit",
  "credit",
  "pix",
  "cash",
];

export const INCOME_PAYMENT_METHODS: PaymentMethod[] = ["cash", "account"];

export function paymentMethodLabel(method: PaymentMethod | string) {
  return LABELS[method as PaymentMethod] ?? method;
}

export function paymentMethodsForType(type: "income" | "expense") {
  return type === "income"
    ? INCOME_PAYMENT_METHODS
    : EXPENSE_PAYMENT_METHODS;
}

export function isPaymentMethodAllowed(
  type: "income" | "expense",
  method: string,
): method is PaymentMethod {
  return paymentMethodsForType(type).includes(method as PaymentMethod);
}

export function defaultPaymentMethod(type: "income" | "expense"): PaymentMethod {
  return type === "income" ? "cash" : "pix";
}

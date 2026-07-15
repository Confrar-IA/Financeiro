export type TransactionType = "income" | "expense";

export type PaymentMethod = "debit" | "credit" | "pix" | "cash" | "account";

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: TransactionType;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  recurrenceMonths: number | null;
  installments: number | null;
  installmentIndex: number | null;
  seriesId: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
};

export type TransactionFilters = {
  type?: TransactionType | "all";
  categoryId?: string;
  paymentMethod?: PaymentMethod | "all";
  search?: string;
};

export type DashboardPeriod = "month" | "year" | "custom" | "all";

export type DashboardSummary = {
  balance: number;
  income: number;
  expense: number;
  periodLabel: string;
};

export type ExpenseByCategory = {
  name: string;
  color: string;
  value: number;
};

export type MonthlyComparison = {
  label: string;
  income: number;
  expense: number;
};

export type DashboardData = {
  period: DashboardPeriod;
  periodLabel: string;
  from: string | null;
  to: string | null;
  summary: DashboardSummary;
  expensesByCategory: ExpenseByCategory[];
  monthlyComparison: MonthlyComparison[];
  recentTransactions: Transaction[];
};

export type BudgetStatus = "ok" | "warning" | "over";

export type BudgetWithProgress = {
  id: string;
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
};

export type BudgetsResponse = {
  month: number;
  year: number;
  monthLabel: string;
  totals: {
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
  };
  budgets: BudgetWithProgress[];
};

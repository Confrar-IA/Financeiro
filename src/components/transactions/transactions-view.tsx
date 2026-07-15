"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { TransactionsFilters } from "@/components/transactions/transactions-filters";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import type {
  Category,
  Transaction,
  TransactionFilters,
} from "@/types/finance";

function buildTransactionsUrl(filters: TransactionFilters) {
  const params = new URLSearchParams();
  params.set("limit", "100");

  if (filters.type && filters.type !== "all") {
    params.set("type", filters.type);
  }
  if (filters.categoryId) {
    params.set("categoryId", filters.categoryId);
  }
  if (filters.paymentMethod && filters.paymentMethod !== "all") {
    params.set("paymentMethod", filters.paymentMethod);
  }

  return `/api/transactions?${params.toString()}`;
}

export function TransactionsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({ type: "all" });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const loadLookups = useCallback(async () => {
    const categoriesData = await apiGet<Category[]>("/api/categories");
    setCategories(categoriesData);
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Transaction[]>(buildTransactionsUrl(filters));
      setTransactions(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as transações",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadLookups().catch((error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar categorias",
      );
    });
  }, [loadLookups]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const filteredTransactions = useMemo(() => {
    const search = filters.search?.trim().toLowerCase();
    if (!search) return transactions;
    return transactions.filter((transaction) =>
      transaction.description.toLowerCase().includes(search),
    );
  }, [filters.search, transactions]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "income") {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [filteredTransactions]);

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Gerencie receitas e despesas com filtros rápidos.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm sm:gap-3">
            <span className="max-w-full break-words rounded-lg bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-300">
              Receitas: {formatCurrency(totals.income)}
            </span>
            <span className="max-w-full break-words rounded-lg bg-rose-500/10 px-2.5 py-1 font-medium text-rose-700 dark:text-rose-300">
              Despesas: {formatCurrency(totals.expense)}
            </span>
          </div>
        </div>

        <Button
          className="w-full shrink-0 sm:w-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nova transação
        </Button>
      </div>

      <TransactionsFilters
        filters={filters}
        categories={categories}
        onChange={setFilters}
      />

      <TransactionsTable
        transactions={filteredTransactions}
        loading={loading}
        onEdit={(transaction) => {
          setEditing(transaction);
          setFormOpen(true);
        }}
        onDelete={setDeleting}
      />

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        transaction={editing}
        onSuccess={() => {
          void loadTransactions();
        }}
      />

      <DeleteTransactionDialog
        open={Boolean(deleting)}
        transaction={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onSuccess={() => {
          void loadTransactions();
        }}
      />
    </div>
  );
}

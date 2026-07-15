"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPENSE_PAYMENT_METHODS,
  INCOME_PAYMENT_METHODS,
  PAYMENT_METHODS,
  paymentMethodLabel,
} from "@/lib/payment-methods";
import type { Category, TransactionFilters } from "@/types/finance";

type TransactionsFiltersProps = {
  filters: TransactionFilters;
  categories: Category[];
  onChange: (filters: TransactionFilters) => void;
};

export function TransactionsFilters({
  filters,
  categories,
  onChange,
}: TransactionsFiltersProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.type && filters.type !== "all") ||
    Boolean(filters.categoryId) ||
    (filters.paymentMethod && filters.paymentMethod !== "all");

  return (
    <div className="grid min-w-0 gap-3 rounded-2xl border border-border/70 bg-card/70 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-5">
      <div className="relative min-w-0 sm:col-span-2 lg:col-span-2">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search ?? ""}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Buscar por descrição..."
          className="h-11 pl-8 text-base md:h-8 md:text-sm"
        />
      </div>

      <Select
        value={filters.type ?? "all"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            type: value as TransactionFilters["type"],
            categoryId: undefined,
            paymentMethod: undefined,
          })
        }
      >
        <SelectTrigger className="h-11 w-full min-w-0 text-base md:h-8 md:text-sm">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="income">Receitas</SelectItem>
          <SelectItem value="expense">Despesas</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryId ?? "all"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            categoryId: value === "all" ? undefined : value,
          })
        }
      >
        <SelectTrigger className="h-11 w-full min-w-0 text-base md:h-8 md:text-sm">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas categorias</SelectItem>
          {categories
            .filter(
              (category) =>
                !filters.type ||
                filters.type === "all" ||
                category.type === filters.type,
            )
            .map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <div className="flex min-w-0 gap-2">
        <Select
          value={filters.paymentMethod ?? "all"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              paymentMethod:
                value === "all"
                  ? undefined
                  : (value as NonNullable<TransactionFilters["paymentMethod"]>),
            })
          }
        >
          <SelectTrigger className="h-11 w-full min-w-0 text-base md:h-8 md:text-sm">
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os métodos</SelectItem>
            {(filters.type === "income"
              ? INCOME_PAYMENT_METHODS
              : filters.type === "expense"
                ? EXPENSE_PAYMENT_METHODS
                : PAYMENT_METHODS
            ).map((method) => (
              <SelectItem key={method} value={method}>
                {paymentMethodLabel(method)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0 md:size-8"
            aria-label="Limpar filtros"
            onClick={() => onChange({ type: "all" })}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

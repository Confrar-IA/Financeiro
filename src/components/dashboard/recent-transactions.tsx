"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/payment-methods";
import type { Transaction } from "@/types/finance";

type RecentTransactionsProps = {
  transactions: Transaction[];
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <CardTitle>Transações recentes</CardTitle>
          <CardDescription>
            Últimas 5 movimentações do período
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" asChild>
          <Link href="/transactions">Ver todas</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma transação ainda. Comece em{" "}
            <Link href="/transactions" className="font-medium text-foreground underline-offset-4 hover:underline">
              Transações
            </Link>
            .
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";

              return (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">
                        {transaction.description}
                      </p>
                      <Badge variant={isIncome ? "secondary" : "outline"}>
                        {isIncome ? "Receita" : "Despesa"}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {transaction.category.name} ·{" "}
                      {paymentMethodLabel(transaction.paymentMethod)} ·{" "}
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <p
                    className={
                      isIncome
                        ? "shrink-0 font-semibold text-emerald-600 dark:text-emerald-400"
                        : "shrink-0 font-semibold text-rose-600 dark:text-rose-400"
                    }
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

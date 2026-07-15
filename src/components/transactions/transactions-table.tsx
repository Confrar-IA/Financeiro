"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/payment-methods";
import type { Transaction } from "@/types/finance";

type TransactionsTableProps = {
  transactions: Transaction[];
  loading?: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

function TransactionActions({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir ações">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(transaction)}>
          <Pencil className="size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(transaction)}
        >
          <Trash2 className="size-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ScheduleBadges({ transaction }: { transaction: Transaction }) {
  return (
    <div className="flex max-w-full flex-wrap gap-1.5">
      <Badge variant={transaction.type === "income" ? "secondary" : "outline"}>
        {transaction.type === "income" ? "Receita" : "Despesa"}
      </Badge>
      {transaction.isRecurring ? (
        <Badge variant="outline">
          Recorrente
          {transaction.installmentIndex && transaction.recurrenceMonths
            ? ` ${transaction.installmentIndex}/${transaction.recurrenceMonths}`
            : ""}
        </Badge>
      ) : null}
      {transaction.installments && transaction.installments > 1 ? (
        <Badge variant="outline">
          Parcela {transaction.installmentIndex}/{transaction.installments}
        </Badge>
      ) : null}
    </div>
  );
}

export function TransactionsTable({
  transactions,
  loading = false,
  onEdit,
  onDelete,
}: TransactionsTableProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/70 p-8 text-center text-sm text-muted-foreground">
        Carregando transações...
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-10 text-center">
        <p className="font-medium text-foreground">Nenhuma transação encontrada</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajuste os filtros ou adicione uma nova transação.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {transactions.map((transaction) => {
          const isIncome = transaction.type === "income";

          return (
            <li
              key={transaction.id}
              className="min-w-0 rounded-2xl border border-border/70 bg-card/80 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <p className="break-words font-medium">
                    {transaction.description}
                  </p>
                  <ScheduleBadges transaction={transaction} />
                  <p className="break-words text-xs text-muted-foreground">
                    <span
                      className="mr-1.5 inline-block size-2 rounded-full align-middle"
                      style={{ backgroundColor: transaction.category.color }}
                    />
                    {transaction.category.name} ·{" "}
                    {paymentMethodLabel(transaction.paymentMethod)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.date)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p
                    className={
                      isIncome
                        ? "font-semibold text-emerald-600 dark:text-emerald-400"
                        : "font-semibold text-rose-600 dark:text-rose-400"
                    }
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <TransactionActions
                    transaction={transaction}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-border/70 bg-card/70 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="max-w-72">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">
                        {transaction.description}
                      </p>
                      <ScheduleBadges transaction={transaction} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: transaction.category.color }}
                      />
                      <span className="truncate">
                        {transaction.category.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="truncate">
                    {paymentMethodLabel(transaction.paymentMethod)}
                  </TableCell>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell
                    className={
                      isIncome
                        ? "text-right font-semibold text-emerald-600 dark:text-emerald-400"
                        : "text-right font-semibold text-rose-600 dark:text-rose-400"
                    }
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <TransactionActions
                      transaction={transaction}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

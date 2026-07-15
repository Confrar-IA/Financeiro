"use client";

import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiSend } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import type { BudgetWithProgress } from "@/types/finance";

type DeleteBudgetDialogProps = {
  budget: BudgetWithProgress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function DeleteBudgetDialog({
  budget,
  open,
  onOpenChange,
  onSuccess,
}: DeleteBudgetDialogProps) {
  async function handleDelete() {
    if (!budget) return;

    try {
      await apiSend(`/api/budgets/${budget.id}`, "DELETE");
      toast.success("Orçamento excluído");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível excluir",
      );
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
          <AlertDialogDescription>
            {budget
              ? `Remove o limite de ${formatCurrency(budget.limitAmount)} para "${budget.category.name}".`
              : "Esta ação não pode ser desfeita."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

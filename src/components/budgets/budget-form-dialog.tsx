"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiSend } from "@/lib/api-client";
import {
  budgetFormSchema,
  type BudgetFormValues,
} from "@/lib/validations/budget";
import type { BudgetWithProgress, Category } from "@/types/finance";

type BudgetFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  usedCategoryIds: string[];
  budget?: BudgetWithProgress | null;
  month: number;
  year: number;
  onSuccess: () => void;
};

export function BudgetFormDialog({
  open,
  onOpenChange,
  categories,
  usedCategoryIds,
  budget,
  month,
  year,
  onSuccess,
}: BudgetFormDialogProps) {
  const isEditing = Boolean(budget);
  const expenseCategories = categories.filter(
    (category) => category.type === "expense",
  );

  const availableCategories = expenseCategories.filter(
    (category) =>
      !usedCategoryIds.includes(category.id) ||
      category.id === budget?.categoryId,
  );

  const firstAvailableCategoryId = availableCategories[0]?.id ?? "";

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: "",
      limitAmount: 0,
    },
  });

  useEffect(() => {
    if (!open) return;

    if (budget) {
      form.reset({
        categoryId: budget.categoryId,
        limitAmount: budget.limitAmount,
      });
      return;
    }

    form.reset({
      categoryId: firstAvailableCategoryId,
      limitAmount: 500,
    });
  }, [open, budget, firstAvailableCategoryId, form]);

  async function onSubmit(values: BudgetFormValues) {
    try {
      if (isEditing && budget) {
        await apiSend(`/api/budgets/${budget.id}`, "PUT", {
          categoryId: values.categoryId,
          limitAmount: values.limitAmount,
        });
        toast.success("Orçamento atualizado");
      } else {
        await apiSend("/api/budgets", "POST", {
          ...values,
          month,
          year,
        });
        toast.success("Orçamento criado");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full min-w-0 sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle className="break-words">
            {isEditing ? "Editar orçamento" : "Novo orçamento"}
          </DialogTitle>
          <DialogDescription className="break-words">
            Defina um limite de gastos por categoria para o mês selecionado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 space-y-5">
          <FieldGroup>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Categoria</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={availableCategories.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="limitAmount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="limitAmount">Limite mensal (R$)</FieldLabel>
                  <Input
                    id="limitAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="500"
                    aria-invalid={fieldState.invalid}
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(event) => {
                      const next = event.target.value;
                      field.onChange(
                        next === "" ? Number.NaN : Number(next),
                      );
                    }}
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting || availableCategories.length === 0
              }
            >
              {form.formState.isSubmitting
                ? "Salvando..."
                : isEditing
                  ? "Salvar"
                  : "Criar orçamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

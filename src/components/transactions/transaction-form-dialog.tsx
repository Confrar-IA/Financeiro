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
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import {
  defaultPaymentMethod,
  paymentMethodLabel,
  paymentMethodsForType,
} from "@/lib/payment-methods";
import { splitInstallmentAmounts } from "@/lib/transaction-series";
import {
  transactionFormSchema,
  type TransactionFormValues,
} from "@/lib/validations/transaction-form";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/types/finance";

type TransactionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  transaction?: Transaction | null;
  onSuccess: () => void;
};

const defaultValues: TransactionFormValues = {
  description: "",
  amount: 0,
  type: "expense",
  date: toDateInputValue(new Date()),
  categoryId: "",
  paymentMethod: "pix",
  scheduleType: "none",
  recurrenceMonths: 12,
  installments: 3,
};

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  transaction,
  onSuccess,
}: TransactionFormDialogProps) {
  const isEditing = Boolean(transaction);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues,
  });

  const selectedType = form.watch("type");
  const scheduleType = form.watch("scheduleType");
  const amount = form.watch("amount");
  const installments = form.watch("installments");
  const recurrenceMonths = form.watch("recurrenceMonths");
  const paymentOptions = paymentMethodsForType(selectedType);

  const filteredCategories = categories.filter(
    (category) => category.type === selectedType,
  );

  useEffect(() => {
    if (!open) return;

    if (transaction) {
      form.reset({
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        date: toDateInputValue(transaction.date),
        categoryId: transaction.categoryId,
        paymentMethod: transaction.paymentMethod,
        scheduleType: "none",
        recurrenceMonths: 12,
        installments: 3,
      });
      return;
    }

    form.reset({
      ...defaultValues,
      date: toDateInputValue(new Date()),
      paymentMethod: defaultPaymentMethod("expense"),
      categoryId:
        categories.find((category) => category.type === "expense")?.id ?? "",
    });
  }, [open, transaction, categories, form]);

  useEffect(() => {
    const currentCategoryId = form.getValues("categoryId");
    const stillValid = filteredCategories.some(
      (category) => category.id === currentCategoryId,
    );

    if (!stillValid) {
      form.setValue("categoryId", filteredCategories[0]?.id ?? "");
    }
  }, [filteredCategories, form, selectedType]);

  useEffect(() => {
    const currentMethod = form.getValues("paymentMethod");
    if (!paymentOptions.includes(currentMethod)) {
      form.setValue("paymentMethod", defaultPaymentMethod(selectedType));
    }

    if (selectedType === "income") {
      form.setValue("scheduleType", "none");
    }
  }, [form, paymentOptions, selectedType]);

  async function onSubmit(values: TransactionFormValues) {
    try {
      const scheduleType =
        values.type === "income" || isEditing ? "none" : values.scheduleType;

      const payload = {
        description: values.description,
        amount: values.amount,
        type: values.type,
        date: fromDateInputValue(values.date).toISOString(),
        categoryId: values.categoryId,
        paymentMethod: values.paymentMethod,
        scheduleType,
        recurrenceMonths:
          scheduleType === "recurring" ? values.recurrenceMonths : undefined,
        installments:
          scheduleType === "installment" ? values.installments : undefined,
      };

      if (isEditing && transaction) {
        await apiSend(`/api/transactions/${transaction.id}`, "PUT", {
          description: payload.description,
          amount: payload.amount,
          type: payload.type,
          date: payload.date,
          categoryId: payload.categoryId,
          paymentMethod: payload.paymentMethod,
        });
        toast.success("Transação atualizada");
      } else {
        const result = await apiSend<{ count: number }>(
          "/api/transactions",
          "POST",
          payload,
        );
        toast.success(
          result.count > 1
            ? `${result.count} lançamentos criados`
            : "Transação criada",
        );
      }

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar",
      );
    }
  }

  const installmentPreview =
    scheduleType === "installment" &&
    Number.isFinite(amount) &&
    amount > 0 &&
    installments &&
    installments >= 2
      ? splitInstallmentAmounts(amount, installments)[0]
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full min-w-0 sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle className="break-words">
            {isEditing ? "Editar transação" : "Nova transação"}
          </DialogTitle>
          <DialogDescription className="break-words">
            Receitas são sempre únicas. Despesas podem ser recorrentes ou
            parceladas.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="min-w-0 space-y-5"
        >
          <FieldGroup className="min-w-0 gap-4">
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="min-w-0">
                  <FieldLabel>Tipo</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full min-w-0 text-base md:h-8 md:text-sm">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
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
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="min-w-0">
                  <FieldLabel htmlFor="description">Descrição</FieldLabel>
                  <Input
                    id="description"
                    placeholder="Ex: Mercado, Salário..."
                    className="h-11 min-w-0 text-base md:h-8 md:text-sm"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="min-w-0">
                    <FieldLabel htmlFor="amount">
                      {scheduleType === "installment" &&
                      selectedType === "expense"
                        ? "Valor total"
                        : "Valor"}
                    </FieldLabel>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="0,00"
                      className="h-11 min-w-0 text-base md:h-8 md:text-sm"
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

              <Controller
                control={form.control}
                name="date"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="min-w-0">
                    <FieldLabel htmlFor="date">
                      {selectedType === "expense" && scheduleType !== "none"
                        ? "Data inicial"
                        : "Data"}
                    </FieldLabel>
                    <Input
                      id="date"
                      type="date"
                      className="h-11 min-w-0 text-base md:h-8 md:text-sm"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    {fieldState.error ? (
                      <FieldError>{fieldState.error.message}</FieldError>
                    ) : null}
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="min-w-0">
                  <FieldLabel>Categoria</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={filteredCategories.length === 0}
                  >
                    <SelectTrigger className="h-11 w-full min-w-0 text-base md:h-8 md:text-sm">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
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
              name="paymentMethod"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="min-w-0">
                  <FieldLabel>Método de Pagamento</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full min-w-0 text-base md:h-8 md:text-sm">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentOptions.map((method) => (
                        <SelectItem key={method} value={method}>
                          {paymentMethodLabel(method)}
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

            {!isEditing && selectedType === "expense" ? (
              <>
                <Controller
                  control={form.control}
                  name="scheduleType"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="min-w-0">
                      <FieldLabel>Agendamento</FieldLabel>
                      <div className="grid min-w-0 gap-2">
                        {(
                          [
                            {
                              value: "none",
                              title: "Única",
                              hint: "Lança só nesta data",
                            },
                            {
                              value: "recurring",
                              title: "Recorrente",
                              hint: "Repete o mesmo valor por vários meses",
                            },
                            {
                              value: "installment",
                              title: "Parcelada",
                              hint: "Divide o total em parcelas mensais",
                            },
                          ] as const
                        ).map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              "min-w-0 rounded-xl border px-3 py-2.5 text-left transition-colors",
                              field.value === option.value
                                ? "border-primary bg-primary/10"
                                : "border-border bg-background",
                            )}
                          >
                            <p className="truncate text-sm font-medium">
                              {option.title}
                            </p>
                            <p className="break-words text-xs text-muted-foreground">
                              {option.hint}
                            </p>
                          </button>
                        ))}
                      </div>
                      {fieldState.error ? (
                        <FieldError>{fieldState.error.message}</FieldError>
                      ) : null}
                    </Field>
                  )}
                />

                {scheduleType === "recurring" ? (
                  <Controller
                    control={form.control}
                    name="recurrenceMonths"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="min-w-0"
                      >
                        <FieldLabel htmlFor="recurrenceMonths">
                          Quantidade de meses
                        </FieldLabel>
                        <Input
                          id="recurrenceMonths"
                          type="number"
                          min={2}
                          max={60}
                          inputMode="numeric"
                          className="h-11 min-w-0 text-base md:h-8 md:text-sm"
                          value={field.value ?? ""}
                          onChange={(event) => {
                            const next = event.target.value;
                            field.onChange(
                              next === "" ? undefined : Number(next),
                            );
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Será listada em {recurrenceMonths || "—"} meses a
                          partir da data inicial.
                        </p>
                        {fieldState.error ? (
                          <FieldError>{fieldState.error.message}</FieldError>
                        ) : null}
                      </Field>
                    )}
                  />
                ) : null}

                {scheduleType === "installment" ? (
                  <Controller
                    control={form.control}
                    name="installments"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="min-w-0"
                      >
                        <FieldLabel htmlFor="installments">
                          Número de parcelas
                        </FieldLabel>
                        <Input
                          id="installments"
                          type="number"
                          min={2}
                          max={48}
                          inputMode="numeric"
                          className="h-11 min-w-0 text-base md:h-8 md:text-sm"
                          value={field.value ?? ""}
                          onChange={(event) => {
                            const next = event.target.value;
                            field.onChange(
                              next === "" ? undefined : Number(next),
                            );
                          }}
                        />
                        <p className="break-words text-xs text-muted-foreground">
                          {installmentPreview
                            ? `Cada parcela ≈ R$ ${installmentPreview.toFixed(2).replace(".", ",")} por ${installments} meses.`
                            : "Informe o total e a quantidade de parcelas."}
                        </p>
                        {fieldState.error ? (
                          <FieldError>{fieldState.error.message}</FieldError>
                        ) : null}
                      </Field>
                    )}
                  />
                ) : null}
              </>
            ) : null}

            {!isEditing && selectedType === "income" ? (
              <p className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Receitas são cadastradas como lançamento único.
              </p>
            ) : null}
          </FieldGroup>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full min-w-0 sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full min-w-0 sm:w-auto"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

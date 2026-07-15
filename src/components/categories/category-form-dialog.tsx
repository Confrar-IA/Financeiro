"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as LucideIcons from "lucide-react";
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
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/category-options";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/finance";

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSuccess: () => void;
};

function CategoryIcon({ name }: { name: string }) {
  const Icon =
    (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name] ??
    LucideIcons.Tag;
  return <Icon className="size-4" />;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormDialogProps) {
  const isEditing = Boolean(category);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      color: CATEGORY_COLORS[0],
      icon: CATEGORY_ICONS[0],
      type: "expense",
    },
  });

  useEffect(() => {
    if (!open) return;

    if (category) {
      form.reset({
        name: category.name,
        color: category.color,
        icon: category.icon,
        type: category.type,
      });
      return;
    }

    form.reset({
      name: "",
      color: CATEGORY_COLORS[0],
      icon: CATEGORY_ICONS[0],
      type: "expense",
    });
  }, [open, category, form]);

  async function onSubmit(values: CategoryInput) {
    try {
      if (isEditing && category) {
        await apiSend(`/api/categories/${category.id}`, "PUT", values);
        toast.success("Categoria atualizada");
      } else {
        await apiSend("/api/categories", "POST", values);
        toast.success("Categoria criada");
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
            {isEditing ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
          <DialogDescription className="break-words">
            Categorias ficam salvas no SQLite e são usadas em transações e
            orçamentos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 space-y-5">
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category-name">Nome</FieldLabel>
                  <Input
                    id="category-name"
                    placeholder="Ex: Alimentação"
                    className="h-11 text-base md:h-8 md:text-sm"
                    {...field}
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Tipo</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full text-base md:h-8 md:text-sm">
                      <SelectValue placeholder="Tipo" />
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
              name="icon"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Ícone</FieldLabel>
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                    {CATEGORY_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => field.onChange(icon)}
                        className={cn(
                          "flex size-11 items-center justify-center rounded-xl border transition-colors",
                          field.value === icon
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground",
                        )}
                        aria-label={icon}
                      >
                        <CategoryIcon name={icon} />
                      </button>
                    ))}
                  </div>
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="color"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Cor</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => field.onChange(color)}
                        className={cn(
                          "size-8 rounded-full border-2 transition-transform",
                          field.value === color
                            ? "scale-110 border-foreground"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={color}
                      />
                    ))}
                  </div>
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
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Salvando..."
                : isEditing
                  ? "Salvar"
                  : "Criar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

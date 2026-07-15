"use client";

import * as LucideIcons from "lucide-react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { DeleteCategoryDialog } from "@/components/categories/delete-category-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiGet } from "@/lib/api-client";
import type { Category } from "@/types/finance";

function CategoryIcon({ name, color }: { name: string; color: string }) {
  const Icon =
    (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name] ??
    LucideIcons.Tag;

  return (
    <span
      className="flex size-10 items-center justify-center rounded-xl"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <Icon className="size-4" />
    </span>
  );
}

export function CategoriesView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Category[]>("/api/categories");
      setCategories(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as categorias",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return categories;
    return categories.filter((category) => category.type === typeFilter);
  }, [categories, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cadastre e edite categorias salvas no SQLite.
          </p>
          <Select
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter(value as "all" | "income" | "expense")
            }
          >
            <SelectTrigger className="h-11 w-full max-w-xs text-base md:h-8 md:text-sm">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full shrink-0 sm:w-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nova categoria
        </Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border/70 bg-card/70 p-8 text-center text-sm text-muted-foreground">
          Carregando categorias...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-10 text-center">
          <p className="font-medium">Nenhuma categoria encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie a primeira categoria para começar a registrar transações.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <CategoryIcon name={category.icon} color={category.color} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{category.name}</p>
                  <Badge
                    variant={
                      category.type === "income" ? "secondary" : "outline"
                    }
                    className="mt-1"
                  >
                    {category.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Ações">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleting(category)}
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSuccess={() => {
          void loadCategories();
        }}
      />

      <DeleteCategoryDialog
        open={Boolean(deleting)}
        category={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onSuccess={() => {
          void loadCategories();
        }}
      />
    </div>
  );
}

import {
  ArrowLeftRight,
  LayoutDashboard,
  PiggyBank,
  Tags,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const mainNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Visão geral das suas finanças",
  },
  {
    title: "Transações",
    href: "/transactions",
    icon: ArrowLeftRight,
    description: "Receitas e despesas",
  },
  {
    title: "Categorias",
    href: "/categories",
    icon: Tags,
    description: "Organize seus gastos",
  },
  {
    title: "Orçamentos",
    href: "/budgets",
    icon: PiggyBank,
    description: "Metas mensais por categoria",
  },
];

export function getPageMeta(pathname: string) {
  const match =
    mainNav.find((item) =>
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href),
    ) ?? mainNav[0];

  return {
    title: match.title,
    description: match.description,
  };
}

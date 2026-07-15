import { Wallet } from "lucide-react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  return (
    <aside className="hidden h-full w-72 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Wallet className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="font-heading text-lg font-semibold tracking-tight">
            Finan
          </p>
          <p className="text-xs text-muted-foreground">Gestão financeira</p>
        </div>
      </div>

      <Separator className="opacity-60" />

      <div className="flex flex-1 flex-col py-4">
        <p className="mb-2 px-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Menu
        </p>
        <SidebarNav />
      </div>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl bg-muted/70 px-3 py-3">
          <p className="text-xs font-medium text-foreground">App instalável</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Instale o Finan como PWA no celular ou desktop para abrir em tela
            cheia.
          </p>
        </div>
      </div>
    </aside>
  );
}

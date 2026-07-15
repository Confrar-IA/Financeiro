"use client";

import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { apiSend } from "@/lib/api-client";
import { getPageMeta } from "@/lib/navigation";

type AppHeaderProps = {
  userName: string;
};

export function AppHeader({ userName }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { title, description } = getPageMeta(pathname);

  async function handleLogout() {
    try {
      await apiSend("/api/auth/logout", "POST");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível sair",
      );
    }
  }

  return (
    <header className="z-30 shrink-0 border-b border-border/70 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </h1>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <span className="hidden max-w-32 truncate text-sm text-muted-foreground sm:inline">
            {userName}
          </span>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

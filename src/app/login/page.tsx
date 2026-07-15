import { Wallet } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div className="h-dvh overflow-y-auto overscroll-y-contain bg-background">
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm sm:p-8">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Wallet className="size-5" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Entrar no Finan
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesse sua conta para ver só os seus dados no SQLite.
              </p>
            </div>
          </div>
          <Suspense
            fallback={
              <p className="text-center text-sm text-muted-foreground">
                Carregando...
              </p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="aurix-atmosphere relative flex h-dvh max-h-dvh min-h-0 overflow-hidden">
      <div className="aurix-grain absolute inset-0 overflow-hidden" aria-hidden />
      <AppSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-border/60 px-4 py-3 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <p className="font-display text-lg font-semibold text-charcoal">
            Aurix<span className="text-teal">.</span> Retail
          </p>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl animate-aurix-fade">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

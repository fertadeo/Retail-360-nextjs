"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { isApiMode } from "@/lib/api-config";
import { ComercioProvider, useComercio } from "@/lib/comercio-context";
import { presenceActorFromSession } from "@/lib/presence";

function ShellInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { comercios, comercioId, setComercioId, comercio } = useComercio();
  const pathname = usePathname();

  useEffect(() => {
    if (!isApiMode()) return;
    let cancelled = false;

    async function beat() {
      if (document.visibilityState === "hidden") return;
      try {
        const actor = presenceActorFromSession();
        await api.presencePing({
          ...actor,
          path: pathname || "/",
        });
      } catch {
        /* best-effort */
      }
    }

    void beat();
    const t = window.setInterval(() => {
      if (!cancelled) void beat();
    }, 45_000);
    function onVis() {
      if (document.visibilityState === "visible") void beat();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pathname]);

  return (
    <div className="aurix-atmosphere relative flex h-dvh max-h-dvh min-h-0 overflow-hidden">
      <div className="aurix-grain absolute inset-0 overflow-hidden" aria-hidden />
      <AppSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-border/60 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <p className="font-display text-lg font-semibold text-charcoal lg:hidden">
            Aurix<span className="text-teal">.</span> Retail 360
          </p>
          <div className="ml-auto flex items-center gap-2">
            <label className="hidden text-xs text-muted-foreground sm:inline">
              Comercio
            </label>
            <select
              className="h-9 max-w-[14rem] rounded-lg border border-border bg-card px-2 text-sm"
              value={comercioId ?? ""}
              onChange={(e) => setComercioId(e.target.value)}
              title={comercio?.rubro || "Comercio activo"}
            >
              {comercios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.rubro ? ` · ${c.rubro}` : ""}
                </option>
              ))}
            </select>
          </div>
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

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ComercioProvider>
      <ShellInner>{children}</ShellInner>
    </ComercioProvider>
  );
}

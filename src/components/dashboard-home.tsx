"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { dashboardStats, listOrders } from "@/lib/store";
import { ORDER_STATUS_LABELS, orderTotal } from "@/lib/types";
import { cn, formatMxn } from "@/lib/utils";

export function DashboardHome() {
  const [today, setToday] = useState("2026-10-27");
  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);
  const stats = useMemo(() => dashboardStats(today), [today]);
  const recent = useMemo(() => listOrders().slice(0, 5), []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Aurix Retail
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            Mostrador
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Catálogo, carga de productos, clientes, pedidos y caja POS — listo
            para conectar con la API del gold.
          </p>
        </div>
        <Link
          href="/pos"
          className={cn(buttonVariants({ size: "lg" }), "h-10 rounded-lg")}
        >
          Abrir POS
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Ventas hoy" value={formatMxn(stats.ventasHoy)} />
        <Kpi label="Productos activos" value={String(stats.productos)} />
        <Kpi label="Pedidos abiertos" value={String(stats.pedidosAbiertos)} />
        <Kpi label="Stock bajo" value={String(stats.stockBajo)} />
      </div>

      <section className="overflow-hidden rounded-xl bg-card/90 ring-1 ring-border/70">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <h2 className="font-display text-lg font-medium text-charcoal">
            Movimientos recientes
          </h2>
          <Link href="/pedidos" className="text-sm font-medium text-teal">
            Ver pedidos →
          </Link>
        </div>
        <ul className="divide-y divide-border/60">
          {recent.map((o) => (
            <li
              key={o.id}
              className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">
                  {o.folio} · {o.clienteNombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ORDER_STATUS_LABELS[o.status]} · {o.canal.toUpperCase()}
                </p>
              </div>
              <p className="text-sm font-medium tabular-nums">
                {formatMxn(orderTotal(o))}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card/90 px-4 py-4 ring-1 ring-border/70">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-charcoal">
        {value}
      </p>
    </div>
  );
}

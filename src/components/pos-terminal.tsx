"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addPosSale,
  listClients,
  listProducts,
} from "@/lib/store";
import type { OrderLine } from "@/lib/types";
import { formatMxn } from "@/lib/utils";

export function PosTerminal() {
  const products = useMemo(
    () => listProducts().filter((p) => p.activo && p.stock > 0),
    []
  );
  const clients = useMemo(() => listClients(), []);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [clientId, setClientId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    if (!q.trim()) return true;
    const n = q.trim().toLowerCase();
    return (
      p.nombre.toLowerCase().includes(n) || p.sku.toLowerCase().includes(n)
    );
  });

  const total = cart.reduce(
    (a, l) => a + l.cantidad * l.precioUnitario,
    0
  );

  function addToCart(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          nombre: p.nombre,
          cantidad: 1,
          precioUnitario: p.precio,
        },
      ];
    });
    setMessage(null);
    setError(null);
  }

  function bump(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, cantidad: l.cantidad + delta }
            : l
        )
        .filter((l) => l.cantidad > 0)
    );
  }

  function checkout() {
    setError(null);
    setMessage(null);
    try {
      const sale = addPosSale(cart, clientId || null);
      setCart([]);
      setMessage(`Venta ${sale.folio} registrada · ${formatMxn(total)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cobrar.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Caja
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
          POS
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tocá productos para armar el ticket y cobrá en mostrador.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto o SKU…"
            autoFocus
          />
          <div className="grid max-h-[28rem] gap-2 overflow-y-auto sm:grid-cols-2">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p.id)}
                className="rounded-xl bg-card/90 p-3 text-left ring-1 ring-border/70 transition hover:ring-teal/40"
              >
                <p className="font-medium text-foreground">{p.nombre}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.sku} · stock {p.stock}
                </p>
                <p className="mt-2 font-display text-lg font-semibold tabular-nums text-teal">
                  {formatMxn(p.precio)}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col rounded-xl bg-[#2a2622] p-4 text-sand ring-1 ring-white/10">
          <h2 className="font-display text-lg font-medium text-[#f2eee6]">
            Ticket
          </h2>
          <div className="mt-3 space-y-1.5">
            <label className="text-xs text-sand/55" htmlFor="pos-cli">
              Cliente (opcional)
            </label>
            <select
              id="pos-cli"
              className="h-9 w-full rounded-lg border border-white/15 bg-white/5 px-2 text-sm text-[#f2eee6]"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Mostrador</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <ul className="mt-4 flex-1 space-y-2 overflow-y-auto">
            {cart.map((l) => (
              <li
                key={l.productId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-[#f2eee6]">{l.nombre}</p>
                  <p className="text-xs text-sand/50">
                    {formatMxn(l.precioUnitario)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="size-7 text-sand hover:bg-white/10"
                    onClick={() => bump(l.productId, -1)}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center tabular-nums">
                    {l.cantidad}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="size-7 text-sand hover:bg-white/10"
                    onClick={() => bump(l.productId, 1)}
                  >
                    +
                  </Button>
                </div>
              </li>
            ))}
            {cart.length === 0 ? (
              <li className="py-8 text-center text-sm text-sand/45">
                Ticket vacío
              </li>
            ) : null}
          </ul>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="flex justify-between font-display text-xl font-semibold text-[#f2eee6]">
              <span>Total</span>
              <span className="tabular-nums">{formatMxn(total)}</span>
            </p>
            {error ? (
              <p className="mt-2 text-sm text-red-300">{error}</p>
            ) : null}
            {message ? (
              <p className="mt-2 text-sm text-[#5eead4]">{message}</p>
            ) : null}
            <Button
              type="button"
              className="mt-3 h-11 w-full"
              disabled={!cart.length}
              onClick={checkout}
            >
              Cobrar
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

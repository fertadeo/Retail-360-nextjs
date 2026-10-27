"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addPedido,
  listClients,
  listOrders,
  listProducts,
} from "@/lib/store";
import {
  ORDER_STATUS_LABELS,
  orderTotal,
  type OrderLine,
} from "@/lib/types";
import { formatMxn } from "@/lib/utils";

export function OrdersPanel() {
  const [tick, setTick] = useState(0);
  const orders = useMemo(() => {
    void tick;
    return listOrders();
  }, [tick]);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Operaciones
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedidos a cliente y tickets de POS en un solo listado.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="h-10"
          onClick={() => setOpen(true)}
        >
          Nuevo pedido
        </Button>
      </div>

      {open ? (
        <NewOrderForm
          onCancel={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            setTick((t) => t + 1);
          }}
        />
      ) : null}

      <div className="overflow-hidden rounded-xl bg-card/90 ring-1 ring-border/70">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Folio</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-mono text-xs">{o.folio}</td>
                <td className="px-4 py-3 font-medium">{o.clienteNombre}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {ORDER_STATUS_LABELS[o.status]}
                </td>
                <td className="px-4 py-3 uppercase text-muted-foreground">
                  {o.canal}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {formatMxn(orderTotal(o))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewOrderForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const clients = listClients();
  const products = listProducts().filter((p) => p.activo);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [error, setError] = useState<string | null>(null);

  function addLine() {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const cantidad = Math.max(1, Number(qty) || 1);
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === p.id
            ? { ...l, cantidad: l.cantidad + cantidad }
            : l
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          nombre: p.nombre,
          cantidad,
          precioUnitario: p.precio,
        },
      ];
    });
  }

  function save() {
    setError(null);
    try {
      addPedido(clientId, lines);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear.");
    }
  }

  const total = lines.reduce(
    (a, l) => a + l.cantidad * l.precioUnitario,
    0
  );

  return (
    <div className="space-y-4 rounded-xl bg-card/90 p-5 ring-1 ring-border/70">
      <h2 className="font-display text-lg font-medium">Nuevo pedido</h2>
      <div className="space-y-1.5">
        <Label htmlFor="cli">Cliente</Label>
        <select
          id="cli"
          className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="prod">Producto</Label>
          <select
            id="prod"
            className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} · {formatMxn(p.precio)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-24 space-y-1.5">
          <Label htmlFor="qty">Cant.</Label>
          <Input
            id="qty"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={addLine}>
          Agregar
        </Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-lg bg-muted/40">
        {lines.map((l) => (
          <li
            key={l.productId}
            className="flex justify-between px-3 py-2 text-sm"
          >
            <span>
              {l.cantidad}× {l.nombre}
            </span>
            <span className="tabular-nums">
              {formatMxn(l.cantidad * l.precioUnitario)}
            </span>
          </li>
        ))}
        {lines.length === 0 ? (
          <li className="px-3 py-4 text-sm text-muted-foreground">
            Sin líneas todavía.
          </li>
        ) : null}
      </ul>
      <p className="text-right font-display text-lg font-semibold tabular-nums">
        Total {formatMxn(total)}
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" onClick={save}>
          Confirmar pedido
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

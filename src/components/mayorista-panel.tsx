"use client";

import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBoletaPdf } from "@/lib/boleta-pdf";
import {
  PRICE_LIST_MAYORISTA,
  addMayoristaPedido,
  getOrder,
  getPriceList,
  listClients,
  listMayoristaOrders,
  listProducts,
} from "@/lib/store";
import {
  ORDER_STATUS_LABELS,
  orderTotal,
  productPrice,
  type Order,
  type OrderLine,
} from "@/lib/types";
import { formatMxn } from "@/lib/utils";

export function MayoristaPanel() {
  const [tick, setTick] = useState(0);
  const clients = useMemo(() => {
    void tick;
    return listClients();
  }, [tick]);
  const products = useMemo(() => {
    void tick;
    return listProducts().filter((p) => p.activo);
  }, [tick]);
  const history = useMemo(() => {
    void tick;
    return listMayoristaOrders();
  }, [tick]);

  const listOk = Boolean(getPriceList(PRICE_LIST_MAYORISTA)?.activa);

  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const total = lines.reduce(
    (a, l) => a + l.cantidad * l.precioUnitario,
    0
  );

  function addLine() {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const cantidad = Math.max(1, Number(qty) || 1);
    const unit = productPrice(p, PRICE_LIST_MAYORISTA);
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
          precioUnitario: unit,
        },
      ];
    });
    setError(null);
  }

  function confirm() {
    setError(null);
    try {
      const order = addMayoristaPedido(clientId, lines);
      setLastOrder(order);
      setLines([]);
      setTick((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el pedido.");
    }
  }

  function emitPdf(order: Order) {
    const client = clients.find((c) => c.id === order.clientId) ?? null;
    downloadBoletaPdf({ order, client });
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Canal B2B
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
          Mayorista
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Pedidos con lista de precios <strong>Mayorista</strong> y boleta PDF
          con marca Aurix (plantilla; cada negocio usará su identidad).
        </p>
      </div>

      {!listOk ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          La lista Mayorista no está activa. Activala en Configuración.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-4 rounded-xl bg-card/90 p-5 ring-1 ring-border/70">
          <h2 className="font-display text-lg font-medium text-charcoal">
            Nuevo pedido mayorista
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="m-cli">Cliente</Label>
            <select
              id="m-cli"
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setLines([]);
              }}
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
              <Label htmlFor="m-prod">Producto</Label>
              <select
                id="m-prod"
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ·{" "}
                    {formatMxn(productPrice(p, PRICE_LIST_MAYORISTA))}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24 space-y-1.5">
              <Label htmlFor="m-qty">Cant.</Label>
              <Input
                id="m-qty"
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

          <ul className="divide-y divide-border/60 overflow-hidden rounded-lg ring-1 ring-border/50">
            {lines.map((l) => (
              <li
                key={l.productId}
                className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.cantidad} × {formatMxn(l.precioUnitario)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums font-medium">
                    {formatMxn(l.cantidad * l.precioUnitario)}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setLines((prev) =>
                        prev.filter((x) => x.productId !== l.productId)
                      )
                    }
                  >
                    Quitar
                  </Button>
                </div>
              </li>
            ))}
            {lines.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                Agregá productos al pedido.
              </li>
            ) : null}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-xl font-semibold tabular-nums text-teal">
              Total {formatMxn(total)}
            </p>
            <Button
              type="button"
              disabled={!listOk || !lines.length || !clientId}
              onClick={confirm}
            >
              Confirmar pedido
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          {lastOrder ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-teal-soft/60 px-3 py-2.5 text-sm">
              <span>
                Pedido <strong>{lastOrder.folio}</strong> creado.
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => emitPdf(lastOrder)}
              >
                <FileDown className="size-3.5" />
                Descargar boleta PDF
              </Button>
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-xl bg-card/90 p-5 ring-1 ring-border/70">
          <h2 className="font-display text-lg font-medium text-charcoal">
            Historial mayorista
          </h2>
          <ul className="divide-y divide-border/60">
            {history.map((o) => (
              <li
                key={o.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {o.folio} · {o.clienteNombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ORDER_STATUS_LABELS[o.status]} ·{" "}
                    {formatMxn(orderTotal(o))}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    const fresh = getOrder(o.id) ?? o;
                    emitPdf(fresh);
                  }}
                >
                  <FileDown className="size-3.5" />
                  Boleta
                </Button>
              </li>
            ))}
            {history.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted-foreground">
                Todavía no hay pedidos mayoristas.
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}

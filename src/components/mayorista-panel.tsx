"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileDown,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn, formatMxn } from "@/lib/utils";
import { useRetailQuery } from "@/lib/use-retail-query";

function fmtWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

export function MayoristaPanel() {
  const {
    data,
    loading,
    error: loadError,
    reload,
  } = useRetailQuery(
    () =>
      Promise.all([
        listClients(),
        listProducts(),
        listMayoristaOrders(),
        getPriceList(PRICE_LIST_MAYORISTA),
      ]),
    []
  );
  const clients = data?.[0] ?? [];
  const products = (data?.[1] ?? []).filter((p) => p.activo);
  const history = data?.[2] ?? [];
  const wholesaleList = data?.[3];
  const listOk = Boolean(wholesaleList?.activa);
  const listLabel = wholesaleList?.nombre ?? "Mayorista";

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const aM = a.priceListId === PRICE_LIST_MAYORISTA ? 0 : 1;
      const bM = b.priceListId === PRICE_LIST_MAYORISTA ? 0 : 1;
      if (aM !== bM) return aM - bM;
      return a.nombre.localeCompare(b.nombre, "es");
    });
  }, [clients]);

  const preferred =
    sortedClients.find((c) => c.priceListId === PRICE_LIST_MAYORISTA) ??
    sortedClients[0];

  const [clientId, setClientId] = useState(preferred?.id ?? "");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState("12");
  const [q, setQ] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [phase, setPhase] = useState<"editing" | "done">("editing");
  useEffect(() => {
    if (!clientId && preferred) setClientId(preferred.id);
    if (!productId && products[0]) setProductId(products[0].id);
  }, [clientId, preferred, productId, products]);

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;
  const selectedProduct = products.find((p) => p.id === productId) ?? null;
  const unitPrice = selectedProduct
    ? productPrice(selectedProduct, PRICE_LIST_MAYORISTA)
    : 0;

  const filteredProducts = products.filter((p) => {
    if (!q.trim()) return true;
    const n = q.trim().toLowerCase();
    return (
      p.nombre.toLowerCase().includes(n) || p.sku.toLowerCase().includes(n)
    );
  });

  const total = lines.reduce(
    (a, l) => a + l.cantidad * l.precioUnitario,
    0
  );
  const itemCount = lines.reduce((a, l) => a + l.cantidad, 0);

  function addLine(explicitProductId?: string, explicitQty?: number) {
    const id = explicitProductId ?? productId;
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const cantidad = Math.max(1, explicitQty ?? (Number(qty) || 1));
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
    setLastOrder(null);
    if (phase === "done") setPhase("editing");
  }

  function bumpLine(productIdLine: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) =>
          l.productId === productIdLine
            ? { ...l, cantidad: l.cantidad + delta }
            : l
        )
        .filter((l) => l.cantidad > 0)
    );
  }

  async function confirm() {
    setError(null);
    try {
      const order = await addMayoristaPedido(clientId, lines);
      setLastOrder(order);
      setLines([]);
      setPhase("done");
      reload();
      try {
        emitPdf(order);
      } catch {
        /* PDF opcional al confirmar; el botón reintenta */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el pedido.");
    }
  }

  function startNew() {
    setPhase("editing");
    setLastOrder(null);
    setError(null);
    setLines([]);
  }

  function emitPdf(order: Order) {
    const client = clients.find((c) => c.id === order.clientId) ?? null;
    downloadBoletaPdf({ order, client });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Canal B2B
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            Mayorista
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Pedidos con precios mayoristas y boleta PDF Aurix (plantilla de
            marca).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              listOk
                ? "bg-teal-soft text-teal"
                : "bg-destructive/10 text-destructive"
            )}
          >
            <Building2 className="size-3.5" />
            Lista {listLabel}
            {listOk ? " · activa" : " · inactiva"}
          </span>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando datos mayoristas…</p>
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {!listOk ? (
        <div className="flex gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          La lista Mayorista no está activa. Activala en Configuración.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.25fr_minmax(18rem,22rem)]">
        <section className="overflow-hidden rounded-2xl bg-card/95 shadow-[0_10px_40px_-24px_rgba(31,28,25,0.45)] ring-1 ring-border/70">
          {phase === "done" && lastOrder ? (
            <div className="flex flex-col gap-5 p-6">
              <div className="rounded-2xl border border-teal/25 bg-gradient-to-br from-teal-soft/80 to-card px-5 py-8 text-center">
                <CheckCircle2 className="mx-auto size-9 text-teal" />
                <p className="mt-3 font-display text-2xl font-semibold text-charcoal">
                  {lastOrder.folio}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lastOrder.clienteNombre}
                </p>
                <p className="mt-4 font-display text-3xl font-semibold tabular-nums text-teal">
                  {formatMxn(orderTotal(lastOrder))}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {lastOrder.lines.length} línea
                  {lastOrder.lines.length === 1 ? "" : "s"} ·{" "}
                  {ORDER_STATUS_LABELS[lastOrder.status]}
                </p>
              </div>

              <Button
                type="button"
                className="h-11 w-full gap-2"
                onClick={() => emitPdf(lastOrder)}
              >
                <FileDown className="size-4" />
                Descargar boleta PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={startNew}
              >
                Nuevo pedido
              </Button>
            </div>
          ) : (
            <>
              <header className="border-b border-border/60 bg-charcoal/[0.03] px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-medium text-charcoal">
                    Nuevo pedido
                  </h2>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {itemCount
                      ? `${itemCount} u. · ${lines.length} SKU`
                      : "Sin líneas"}
                  </span>
                </div>
              </header>

              <div className="space-y-5 p-5">
                <div className="space-y-2">
                  <label
                    className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                    htmlFor="m-cli"
                  >
                    Cliente
                  </label>
                  <select
                    id="m-cli"
                    className="flex h-11 w-full rounded-xl border border-border bg-background/70 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal/30"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  >
                    {sortedClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                        {c.priceListId === PRICE_LIST_MAYORISTA
                          ? " · mayorista"
                          : ""}
                      </option>
                    ))}
                  </select>
                  {selectedClient ? (
                    <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {selectedClient.nombre}
                      </p>
                      <p className="mt-0.5">
                        {[
                          selectedClient.telefono,
                          selectedClient.email,
                          selectedClient.rfc ? `RFC ${selectedClient.rfc}` : "",
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Sin datos de contacto"}
                      </p>
                      {selectedClient.direccion ? (
                        <p className="mt-0.5">{selectedClient.direccion}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Catálogo mayorista
                    </span>
                    <span className="text-xs tabular-nums text-teal">
                      {selectedProduct
                        ? formatMxn(unitPrice)
                        : null}
                    </span>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar producto o SKU…"
                      className="h-10 pl-9"
                    />
                  </div>
                  <div className="grid max-h-40 gap-1.5 overflow-y-auto sm:grid-cols-2">
                    {filteredProducts.map((p) => {
                      const price = productPrice(p, PRICE_LIST_MAYORISTA);
                      const active = p.id === productId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProductId(p.id)}
                          onDoubleClick={() => addLine(p.id, Number(qty) || 1)}
                          className={cn(
                            "rounded-xl px-3 py-2.5 text-left text-sm ring-1 transition",
                            active
                              ? "bg-teal-soft/70 ring-teal/40"
                              : "bg-background/60 ring-border/60 hover:ring-teal/30"
                          )}
                        >
                          <p className="truncate font-medium text-foreground">
                            {p.nombre}
                          </p>
                          <p className="mt-0.5 flex justify-between gap-2 text-xs text-muted-foreground">
                            <span>{p.sku}</span>
                            <span className="tabular-nums font-medium text-teal">
                              {formatMxn(price)}
                            </span>
                          </p>
                        </button>
                      );
                    })}
                    {filteredProducts.length === 0 ? (
                      <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                        Sin coincidencias.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="w-24 space-y-1">
                      <label
                        className="text-[11px] text-muted-foreground"
                        htmlFor="m-qty"
                      >
                        Cantidad
                      </label>
                      <Input
                        id="m-qty"
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="h-10 tabular-nums"
                      />
                    </div>
                    <Button
                      type="button"
                      className="h-10 flex-1 gap-1.5"
                      disabled={!listOk || !productId}
                      onClick={() => addLine()}
                    >
                      <Plus className="size-4" />
                      Agregar al pedido
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-dashed border-border/80 bg-muted/20">
                  {lines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center">
                      <Package className="size-6 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Pedido vacío
                      </p>
                      <p className="text-[11px] text-muted-foreground/80">
                        Elegí productos y cantidad, o doble clic en una tarjeta
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/50">
                      {lines.map((l) => (
                        <li
                          key={l.productId}
                          className="flex items-center gap-3 px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {l.nombre}
                            </p>
                            <p className="text-xs tabular-nums text-muted-foreground">
                              {formatMxn(l.precioUnitario)} c/u
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 rounded-lg bg-background/80 p-0.5 ring-1 ring-border/50">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="size-7"
                              onClick={() => bumpLine(l.productId, -1)}
                            >
                              −
                            </Button>
                            <span className="w-8 text-center text-sm tabular-nums">
                              {l.cantidad}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="size-7"
                              onClick={() => bumpLine(l.productId, 1)}
                            >
                              +
                            </Button>
                          </div>
                          <span className="w-20 text-right text-sm font-medium tabular-nums">
                            {formatMxn(l.cantidad * l.precioUnitario)}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setLines((prev) =>
                                prev.filter((x) => x.productId !== l.productId)
                              )
                            }
                            aria-label="Quitar"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {error ? (
                  <div className="flex gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                ) : null}
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-charcoal/[0.03] px-5 py-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Total
                  </p>
                  <p className="font-display text-2xl font-semibold tabular-nums text-teal">
                    {formatMxn(total)}
                  </p>
                </div>
                <Button
                  type="button"
                  className="h-11 min-w-[10rem] gap-1.5"
                  disabled={!listOk || !lines.length || !clientId}
                  onClick={() => void confirm()}
                >
                  <FileDown className="size-4" />
                  Confirmar y PDF
                </Button>
              </footer>
            </>
          )}
        </section>

        <section className="flex flex-col overflow-hidden rounded-2xl bg-card/95 shadow-[0_10px_40px_-24px_rgba(31,28,25,0.45)] ring-1 ring-border/70">
          <header className="border-b border-border/60 px-5 py-4">
            <h2 className="font-display text-lg font-medium text-charcoal">
              Historial
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {history.length
                ? `${history.length} pedido${history.length === 1 ? "" : "s"}`
                : "Sin pedidos aún"}
            </p>
          </header>

          {history.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <Building2 className="size-7 text-muted-foreground/35" />
              <p className="text-sm text-muted-foreground">
                Todavía no hay pedidos mayoristas
              </p>
            </div>
          ) : (
            <ul className="max-h-[32rem] divide-y divide-border/50 overflow-y-auto">
              {history.map((o) => (
                <li key={o.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-teal">{o.folio}</p>
                      <p className="mt-0.5 truncate font-medium text-foreground">
                        {o.clienteNombre}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ORDER_STATUS_LABELS[o.status]} · {fmtWhen(o.createdAt)}
                      </p>
                      <p className="mt-1 font-display text-base font-semibold tabular-nums text-charcoal">
                        {formatMxn(orderTotal(o))}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      onClick={async () => {
                        const fresh = (await getOrder(o.id)) ?? o;
                        emitPdf(fresh);
                      }}
                    >
                      <FileDown className="size-3.5" />
                      PDF
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

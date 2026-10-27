"use client";

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addPosSale,
  getPriceList,
  listClients,
  listProducts,
  resolveClientPriceListId,
} from "@/lib/store";
import { printThermalTicket } from "@/lib/thermal-ticket";
import {
  orderTotal,
  productPrice,
  type Order,
  type OrderLine,
  type PaymentMethod,
} from "@/lib/types";
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
  const [conEnvio, setConEnvio] = useState(false);
  const [envioCosto, setEnvioCosto] = useState("45");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>("efectivo");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<Order | null>(null);

  const priceListId = resolveClientPriceListId(clientId || null);
  const listLabel = getPriceList(priceListId)?.nombre ?? "Default";

  const filtered = products.filter((p) => {
    if (!q.trim()) return true;
    const n = q.trim().toLowerCase();
    return (
      p.nombre.toLowerCase().includes(n) || p.sku.toLowerCase().includes(n)
    );
  });

  const subtotal = cart.reduce(
    (a, l) => a + l.cantidad * l.precioUnitario,
    0
  );
  const envioNum = conEnvio ? Math.max(0, Number(envioCosto) || 0) : 0;
  const total = subtotal + envioNum;

  function applyClientDefaults(nextClientId: string) {
    const c = clients.find((x) => x.id === nextClientId);
    if (c) {
      setDireccion(c.direccion || "");
      setTelefono(c.telefono || "");
    } else {
      setDireccion("");
      setTelefono("");
    }
  }

  function rebuildCartForList(nextClientId: string) {
    const listId = resolveClientPriceListId(nextClientId || null);
    setCart((prev) =>
      prev.map((l) => {
        const p = products.find((x) => x.id === l.productId);
        if (!p) return l;
        return { ...l, precioUnitario: productPrice(p, listId) };
      })
    );
  }

  function addToCart(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const unit = productPrice(p, priceListId);
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
          precioUnitario: unit,
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
      const sale = addPosSale(cart, {
        clientId: clientId || null,
        priceListId,
        conEnvio,
        envioCosto: envioNum,
        direccionEnvio: direccion,
        telefonoContacto: telefono,
        metodoPago,
      });
      setLastSale(sale);
      setCart([]);
      setMessage(
        `Venta ${sale.folio} · ${listLabel} · ${formatMxn(orderTotal(sale))}`
      );
      if (sale.conEnvio) {
        try {
          printThermalTicket(sale);
        } catch (printErr) {
          setError(
            printErr instanceof Error
              ? printErr.message
              : "Venta OK; no se pudo abrir el ticket."
          );
        }
      }
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
          Lista activa:{" "}
          <span className="font-medium text-teal">{listLabel}</span>. Con
          envío se imprime ticket térmico (80 mm).
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
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
                  {formatMxn(productPrice(p, priceListId))}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col rounded-xl bg-[#2a2622] p-4 text-sand ring-1 ring-white/10">
          <h2 className="font-display text-lg font-medium text-[#f2eee6]">
            Ticket
          </h2>

          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-sand/55" htmlFor="pos-cli">
                Cliente {conEnvio ? "(recomendado)" : "(opcional)"}
              </label>
              <select
                id="pos-cli"
                className="h-9 w-full rounded-lg border border-white/15 bg-white/5 px-2 text-sm text-[#f2eee6]"
                value={clientId}
                onChange={(e) => {
                  const next = e.target.value;
                  setClientId(next);
                  rebuildCartForList(next);
                  applyClientDefaults(next);
                }}
              >
                <option value="">Mostrador</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-sand/55">Método de pago</span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["efectivo", "Efectivo"],
                    ["transferencia", "Transferencia"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMetodoPago(value)}
                    className={`h-9 rounded-lg text-sm transition ${
                      metodoPago === value
                        ? "bg-teal text-[#f2eee6]"
                        : "border border-white/15 bg-white/5 text-sand/80 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#f2eee6]">
              <input
                type="checkbox"
                className="size-4 accent-teal"
                checked={conEnvio}
                onChange={(e) => {
                  const on = e.target.checked;
                  setConEnvio(on);
                  if (on && clientId) applyClientDefaults(clientId);
                }}
              />
              Pedido con envío
            </label>

            {conEnvio ? (
              <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="space-y-1">
                  <label className="text-xs text-sand/55" htmlFor="pos-tel">
                    Teléfono
                  </label>
                  <Input
                    id="pos-tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="h-9 border-white/15 bg-white/5 text-[#f2eee6] placeholder:text-sand/35"
                    placeholder="55 …"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-sand/55" htmlFor="pos-dir">
                    Dirección de entrega
                  </label>
                  <Input
                    id="pos-dir"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="h-9 border-white/15 bg-white/5 text-[#f2eee6] placeholder:text-sand/35"
                    placeholder="Calle, colonia, ciudad…"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-sand/55" htmlFor="pos-env">
                    Precio de envío
                  </label>
                  <Input
                    id="pos-env"
                    type="number"
                    min={0}
                    value={envioCosto}
                    onChange={(e) => setEnvioCosto(e.target.value)}
                    className="h-9 border-white/15 bg-white/5 text-[#f2eee6]"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <ul className="mt-4 max-h-48 flex-1 space-y-2 overflow-y-auto">
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
            <p className="flex justify-between text-sm text-sand/70">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMxn(subtotal)}</span>
            </p>
            {conEnvio ? (
              <p className="mt-1 flex justify-between text-sm text-sand/70">
                <span>Envío</span>
                <span className="tabular-nums">{formatMxn(envioNum)}</span>
              </p>
            ) : null}
            <p className="mt-2 flex justify-between font-display text-xl font-semibold text-[#f2eee6]">
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
              {conEnvio ? "Cobrar e imprimir ticket" : "Cobrar"}
            </Button>
            {lastSale?.conEnvio ? (
              <Button
                type="button"
                variant="outline"
                className="mt-2 h-10 w-full gap-1.5 border-white/20 bg-transparent text-[#f2eee6] hover:bg-white/10"
                onClick={() => {
                  try {
                    printThermalTicket(lastSale);
                    setError(null);
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "No se pudo abrir el ticket."
                    );
                  }
                }}
              >
                <Printer className="size-3.5" />
                Reimprimir ticket {lastSale.folio}
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

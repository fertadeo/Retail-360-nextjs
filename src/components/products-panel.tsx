"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listPriceLists,
  listProducts,
  pushMeliProduct,
  pushWooProduct,
  upsertProduct,
  upsertProductChannelLink,
  usingRemoteApi,
} from "@/lib/store";
import { useRetailQuery } from "@/lib/use-retail-query";
import {
  CATEGORY_LABELS,
  type Product,
  type ProductCategory,
} from "@/lib/types";
import { formatMxn } from "@/lib/utils";

const CATS = Object.keys(CATEGORY_LABELS) as ProductCategory[];

export function ProductsPanel() {
  const {
    data: products,
    loading,
    error,
    reload,
  } = useRetailQuery(() => listProducts(), []);
  const { data: lists, error: listsError } = useRetailQuery(
    () => listPriceLists(true),
    []
  );
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState<string | null>(null);

  async function syncChannel(
    productId: string,
    channel: "woocommerce" | "mercadolibre"
  ) {
    if (!usingRemoteApi()) {
      setSyncMsg("Sync requiere API remota (NEXT_PUBLIC_API_URL).");
      return;
    }
    const key = `${channel}:${productId}`;
    setSyncBusy(key);
    setSyncMsg(null);
    try {
      if (channel === "woocommerce") {
        const r = await pushWooProduct(productId, "both");
        setSyncMsg(`WC #${r.externalId}: stock ${r.stock} · $${r.price}`);
      } else {
        const r = await pushMeliProduct(productId, "both");
        setSyncMsg(`ML ${r.externalId}: stock ${r.stock} · $${r.price}`);
      }
      reload();
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "Error de sync.");
    } finally {
      setSyncBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Inventario
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            Productos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alta, ficha QR y sync a WooCommerce / Mercado Libre.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="h-10"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setDetail(null);
          }}
        >
          Cargar producto
        </Button>
      </div>

      {creating || editing ? (
        <ProductEditor
          initial={editing ?? undefined}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            reload();
          }}
        />
      ) : null}

      {detail ? (
        <ProductDetailModal
          product={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEditing(detail);
            setCreating(false);
            setDetail(null);
          }}
        />
      ) : null}

      {syncMsg ? (
        <p className="rounded-lg bg-tealSoft/60 px-3 py-2 text-sm text-charcoal">
          {syncMsg}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl bg-card/90 ring-1 ring-border/70">
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Cargando productos…</p>
        ) : error || listsError ? (
          <p className="px-4 py-6 text-sm text-destructive">
            {error ?? listsError}
          </p>
        ) : null}
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                Categoría
              </th>
              <th className="px-4 py-3 font-medium">Default</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">
                Listas
              </th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {(products ?? []).map((p) => (
              <tr
                key={p.id}
                className={!p.activo ? "opacity-50" : undefined}
              >
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-left font-medium hover:text-teal hover:underline"
                    onClick={() => setDetail(p)}
                  >
                    {p.nombre}
                  </button>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {CATEGORY_LABELS[p.categoria]}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatMxn(p.precio)}</td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                  {(lists ?? [])
                    .map(
                      (pl) =>
                        `${pl.codigo} ${formatMxn(p.precios[pl.id] ?? p.precio)}`
                    )
                    .join(" · ")}
                </td>
                <td className="px-4 py-3 tabular-nums">{p.stock}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      className="text-xs font-medium text-teal hover:underline disabled:opacity-40"
                      disabled={Boolean(syncBusy)}
                      title="Empujar a WooCommerce"
                      onClick={() => void syncChannel(p.id, "woocommerce")}
                    >
                      {syncBusy === `woocommerce:${p.id}` ? "…" : "WC"}
                    </button>
                    <button
                      type="button"
                      className="text-xs font-medium text-amber-700 hover:underline disabled:opacity-40"
                      disabled={Boolean(syncBusy)}
                      title="Empujar a Mercado Libre"
                      onClick={() => void syncChannel(p.id, "mercadolibre")}
                    >
                      {syncBusy === `mercadolibre:${p.id}` ? "…" : "ML"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:underline"
                      onClick={() => setDetail(p)}
                    >
                      <QrCode className="size-3.5" />
                      Ficha
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
                      onClick={() => {
                        setEditing(p);
                        setCreating(false);
                        setDetail(null);
                      }}
                    >
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: el{" "}
        <Link href="/catalogo" className="font-medium text-teal hover:underline">
          catálogo
        </Link>{" "}
        solo muestra productos activos.
      </p>
    </div>
  );
}

function ProductEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Product;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const {
    data: lists,
    loading,
    error: loadError,
  } = useRetailQuery(() => listPriceLists(true), []);
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [categoria, setCategoria] = useState<ProductCategory>(
    initial?.categoria ?? "otros"
  );
  const [precios, setPrecios] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const pl of lists ?? []) {
      map[pl.id] = String(
        initial?.precios[pl.id] ?? initial?.precio ?? 0
      );
    }
    return map;
  });
  useEffect(() => {
    if (!lists) return;
    setPrecios((current) => {
      const next = { ...current };
      for (const pl of lists) {
        if (next[pl.id] == null) {
          next[pl.id] = String(
            initial?.precios[pl.id] ?? initial?.precio ?? 0
          );
        }
      }
      return next;
    });
  }, [initial, lists]);
  const [costo, setCosto] = useState(String(initial?.costo ?? 0));
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [activo, setActivo] = useState(initial?.activo ?? true);
  const [wooId, setWooId] = useState(
    initial?.channelLinks?.find((l) => l.channel === "woocommerce")
      ?.externalId ?? ""
  );
  const [meliId, setMeliId] = useState(
    initial?.channelLinks?.find((l) => l.channel === "mercadolibre")
      ?.externalId ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const preciosNum: Record<string, number> = {};
      for (const pl of lists ?? []) {
        preciosNum[pl.id] = Number(precios[pl.id]) || 0;
      }
      const defaultList = lists?.find((l) => l.esDefault) ?? lists?.[0];
      const saved = await upsertProduct({
        id: initial?.id,
        sku,
        nombre,
        categoria,
        precio: defaultList ? preciosNum[defaultList.id] ?? 0 : 0,
        precios: preciosNum,
        costo: Number(costo) || 0,
        stock: Number(stock) || 0,
        descripcion,
        activo,
      });
      if (wooId.trim()) {
        await upsertProductChannelLink(saved.id, "woocommerce", {
          externalId: wooId.trim(),
          externalSku: sku,
        });
      }
      if (meliId.trim()) {
        await upsertProductChannelLink(saved.id, "mercadolibre", {
          externalId: meliId.trim(),
          externalSku: sku,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="space-y-4 rounded-xl bg-card/90 p-5 ring-1 ring-border/70"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <h2 className="font-display text-lg font-medium text-charcoal">
        {initial ? "Editar producto" : "Nuevo producto"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat">Categoría</Label>
          <select
            id="cat"
            className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as ProductCategory)}
          >
            {CATS.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <p className="text-sm font-medium">Precios por lista</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(lists ?? []).map((pl) => (
              <div key={pl.id} className="space-y-1.5">
                <Label htmlFor={`precio-${pl.id}`}>
                  {pl.nombre}
                  {pl.esDefault ? " (default)" : ""}
                </Label>
                <Input
                  id={`precio-${pl.id}`}
                  type="number"
                  value={precios[pl.id] ?? "0"}
                  onChange={(e) =>
                    setPrecios((prev) => ({
                      ...prev,
                      [pl.id]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Las listas se gestionan en Configuración.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="costo">Costo</Label>
          <Input
            id="costo"
            type="number"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2 pb-2">
          <input
            id="activo"
            type="checkbox"
            className="size-4"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
          />
          <Label htmlFor="activo">Activo en catálogo</Label>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="desc">Descripción</Label>
          <Input
            id="desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="woo-id">ID WooCommerce</Label>
          <Input
            id="woo-id"
            value={wooId}
            onChange={(e) => setWooId(e.target.value)}
            placeholder="vacío = crear al empujar"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meli-id">Ítem Mercado Libre</Label>
          <Input
            id="meli-id"
            value={meliId}
            onChange={(e) => setMeliId(e.target.value)}
            placeholder="MLA…"
          />
        </div>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

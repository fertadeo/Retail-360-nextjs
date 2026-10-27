"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { QrCode } from "lucide-react";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listPriceLists, listProducts, upsertProduct } from "@/lib/store";
import {
  CATEGORY_LABELS,
  type Product,
  type ProductCategory,
} from "@/lib/types";
import { formatMxn } from "@/lib/utils";

const CATS = Object.keys(CATEGORY_LABELS) as ProductCategory[];

export function ProductsPanel() {
  const [tick, setTick] = useState(0);
  const products = useMemo(() => {
    void tick;
    return listProducts();
  }, [tick]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);

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
            Alta, ficha con QR/barcode e impresión térmica de etiquetas.
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
            setTick((t) => t + 1);
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

      <div className="overflow-hidden rounded-xl bg-card/90 ring-1 ring-border/70">
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
            {products.map((p) => (
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
                  {listPriceLists(true)
                    .map(
                      (pl) =>
                        `${pl.codigo} ${formatMxn(p.precios[pl.id] ?? p.precio)}`
                    )
                    .join(" · ")}
                </td>
                <td className="px-4 py-3 tabular-nums">{p.stock}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
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
  const lists = listPriceLists(true);
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [categoria, setCategoria] = useState<ProductCategory>(
    initial?.categoria ?? "otros"
  );
  const [precios, setPrecios] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const pl of lists) {
      map[pl.id] = String(
        initial?.precios[pl.id] ?? initial?.precio ?? 0
      );
    }
    return map;
  });
  const [costo, setCosto] = useState(String(initial?.costo ?? 0));
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [activo, setActivo] = useState(initial?.activo ?? true);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    try {
      const preciosNum: Record<string, number> = {};
      for (const pl of lists) {
        preciosNum[pl.id] = Number(precios[pl.id]) || 0;
      }
      const defaultList = lists.find((l) => l.esDefault) ?? lists[0];
      upsertProduct({
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
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  }

  return (
    <form
      className="space-y-4 rounded-xl bg-card/90 p-5 ring-1 ring-border/70"
      onSubmit={(e) => {
        e.preventDefault();
        save();
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
            {lists.map((pl) => (
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
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit">Guardar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

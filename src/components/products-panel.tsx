"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listProducts, upsertProduct } from "@/lib/store";
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
            Alta y edición de SKUs, precios y stock.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="h-10"
          onClick={() => {
            setCreating(true);
            setEditing(null);
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

      <div className="overflow-hidden rounded-xl bg-card/90 ring-1 ring-border/70">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                Categoría
              </th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {products.map((p) => (
              <tr key={p.id} className={!p.activo ? "opacity-50" : undefined}>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3 font-medium">{p.nombre}</td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {CATEGORY_LABELS[p.categoria]}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatMxn(p.precio)}</td>
                <td className="px-4 py-3 tabular-nums">{p.stock}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="text-sm font-medium text-teal hover:underline"
                    onClick={() => {
                      setEditing(p);
                      setCreating(false);
                    }}
                  >
                    Editar
                  </button>
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
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [categoria, setCategoria] = useState<ProductCategory>(
    initial?.categoria ?? "otros"
  );
  const [precio, setPrecio] = useState(String(initial?.precio ?? 0));
  const [costo, setCosto] = useState(String(initial?.costo ?? 0));
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [activo, setActivo] = useState(initial?.activo ?? true);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    try {
      upsertProduct({
        id: initial?.id,
        sku,
        nombre,
        categoria,
        precio: Number(precio) || 0,
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
        <div className="space-y-1.5">
          <Label htmlFor="precio">Precio</Label>
          <Input
            id="precio"
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
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

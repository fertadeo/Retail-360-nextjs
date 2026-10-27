"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  getDefaultPriceListId,
  getPriceList,
  listPriceLists,
  listProducts,
} from "@/lib/store";
import {
  CATEGORY_LABELS,
  productPrice,
  type ProductCategory,
} from "@/lib/types";
import { formatMxn } from "@/lib/utils";

export function CatalogGrid() {
  const lists = listPriceLists(true);
  const [priceListId, setPriceListId] = useState(getDefaultPriceListId());
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ProductCategory | "todos">("todos");
  const items = useMemo(() => {
    return listProducts().filter((p) => {
      if (!p.activo) return false;
      if (cat !== "todos" && p.categoria !== cat) return false;
      if (!q.trim()) return true;
      const needle = q.trim().toLowerCase();
      return (
        p.nombre.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle)
      );
    });
  }, [q, cat]);

  const listName = getPriceList(priceListId)?.nombre ?? "Default";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Vitrina
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
          Catálogo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Precios según lista seleccionada ({listName}).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o SKU…"
          className="sm:max-w-xs"
        />
        <select
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
          value={cat}
          onChange={(e) =>
            setCat(e.target.value as ProductCategory | "todos")
          }
        >
          <option value="todos">Todas las categorías</option>
          {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
          value={priceListId}
          onChange={(e) => setPriceListId(e.target.value)}
        >
          {lists.map((pl) => (
            <option key={pl.id} value={pl.id}>
              {pl.nombre}
              {pl.esDefault ? " (default)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <article
            key={p.id}
            className="flex flex-col rounded-xl bg-card/90 p-4 ring-1 ring-border/70"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {CATEGORY_LABELS[p.categoria]} · {p.sku}
            </p>
            <h2 className="mt-1 font-display text-lg font-medium text-charcoal">
              {p.nombre}
            </h2>
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
              {p.descripcion || "Sin descripción."}
            </p>
            <div className="mt-4 flex items-end justify-between">
              <p className="font-display text-xl font-semibold tabular-nums text-teal">
                {formatMxn(productPrice(p, priceListId))}
              </p>
              <p className="text-xs text-muted-foreground">
                Stock {p.stock}
              </p>
            </div>
          </article>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-10 text-center text-sm text-muted-foreground">
          No hay productos con ese filtro.
        </p>
      ) : null}
    </div>
  );
}

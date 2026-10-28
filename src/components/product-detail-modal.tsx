"use client";

import { useEffect, useState } from "react";
import { Printer, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPriceLists } from "@/lib/store";
import { useRetailQuery } from "@/lib/use-retail-query";
import {
  barcodeSvgDataUrl,
  printProductLabel,
  productBarcodeValue,
  productQrPayload,
  qrDataUrl,
} from "@/lib/product-codes";
import {
  CATEGORY_LABELS,
  type Product,
} from "@/lib/types";
import { formatMxn } from "@/lib/utils";

export function ProductDetailModal({
  product,
  onClose,
  onEdit,
}: {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [qrSrc, setQrSrc] = useState<string>("");
  const [barcodeSrc, setBarcodeSrc] = useState<string>("");
  const [copies, setCopies] = useState("1");
  const [includeQr, setIncludeQr] = useState(true);
  const [printError, setPrintError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const {
    data: lists,
    loading: listsLoading,
    error: listsError,
  } = useRetailQuery(() => listPriceLists(true), []);
  const code = productBarcodeValue(product);

  useEffect(() => {
    let cancelled = false;
    setBarcodeSrc(barcodeSvgDataUrl(code));
    qrDataUrl(productQrPayload(product), 200)
      .then((url) => {
        if (!cancelled) setQrSrc(url);
      })
      .catch(() => {
        if (!cancelled) setQrSrc("");
      });
    return () => {
      cancelled = true;
    };
  }, [product, code]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function handlePrint() {
    setPrintError(null);
    setPrinting(true);
    try {
      await printProductLabel(product, {
        includeQr,
        copies: Number(copies) || 1,
      });
    } catch (e) {
      setPrintError(
        e instanceof Error ? e.message : "No se pudo imprimir la etiqueta."
      );
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/45 p-3 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[min(92vh,44rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-card shadow-2xl ring-1 ring-border/80"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/60 bg-card/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Ficha de producto
            </p>
            <h2
              id="product-detail-title"
              className="font-display text-xl font-semibold tracking-tight text-charcoal"
            >
              {product.nombre}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-teal">{product.sku}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-muted/50 px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Categoría
              </dt>
              <dd className="mt-0.5 font-medium">
                {CATEGORY_LABELS[product.categoria]}
              </dd>
            </div>
            <div className="rounded-xl bg-muted/50 px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Stock
              </dt>
              <dd className="mt-0.5 font-medium tabular-nums">{product.stock}</dd>
            </div>
            <div className="rounded-xl bg-muted/50 px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Precio default
              </dt>
              <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-teal">
                {formatMxn(product.precio)}
              </dd>
            </div>
            <div className="rounded-xl bg-muted/50 px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Estado
              </dt>
              <dd className="mt-0.5 font-medium">
                {product.activo ? "Activo" : "Inactivo"}
              </dd>
            </div>
          </dl>

          {product.descripcion ? (
            <p className="text-sm text-muted-foreground">{product.descripcion}</p>
          ) : null}

          <div className="rounded-xl border border-border/70 bg-background/50 px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Precios por lista
            </p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {(lists ?? []).map((pl) => (
                <li
                  key={pl.id}
                  className="flex justify-between gap-2 tabular-nums"
                >
                  <span className="text-muted-foreground">
                    {pl.nombre}
                    {pl.esDefault ? " · default" : ""}
                  </span>
                  <span className="font-medium">
                    {formatMxn(product.precios[pl.id] ?? product.precio)}
                  </span>
                </li>
              ))}
              {listsLoading ? (
                <li className="text-muted-foreground">Cargando…</li>
              ) : listsError ? (
                <li className="text-destructive">{listsError}</li>
              ) : null}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-white p-4 text-center">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Código de barras
              </p>
              {barcodeSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={barcodeSrc}
                  alt={`Código de barras ${code}`}
                  className="mx-auto h-auto w-full max-w-[240px]"
                />
              ) : (
                <p className="py-8 text-xs text-muted-foreground">Generando…</p>
              )}
              <p className="mt-1 font-mono text-xs text-charcoal">{code}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-white p-4 text-center">
              <p className="mb-2 flex items-center justify-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                <QrCode className="size-3" />
                Código QR
              </p>
              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrSrc}
                  alt={`QR ${code}`}
                  className="mx-auto size-[140px]"
                />
              ) : (
                <p className="py-8 text-xs text-muted-foreground">Generando…</p>
              )}
              <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                {productQrPayload(product)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-teal/30 bg-teal-soft/40 px-4 py-4">
            <p className="font-medium text-charcoal">
              Imprimir etiqueta térmica
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              80 mm · barcode CODE128{includeQr ? " + QR" : ""} · driver de
              impresora del sistema
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="w-20 space-y-1">
                <label
                  className="text-[11px] text-muted-foreground"
                  htmlFor="label-copies"
                >
                  Copias
                </label>
                <Input
                  id="label-copies"
                  type="number"
                  min={1}
                  max={20}
                  value={copies}
                  onChange={(e) => setCopies(e.target.value)}
                  className="h-9 tabular-nums"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-teal"
                  checked={includeQr}
                  onChange={(e) => setIncludeQr(e.target.checked)}
                />
                Incluir QR
              </label>
              <Button
                type="button"
                className="h-9 flex-1 gap-1.5 sm:flex-none"
                disabled={printing}
                onClick={() => void handlePrint()}
              >
                <Printer className="size-3.5" />
                {printing ? "Preparando…" : "Imprimir etiqueta"}
              </Button>
            </div>
            {printError ? (
              <p className="mt-2 text-sm text-destructive">{printError}</p>
            ) : null}
          </div>
        </div>

        <footer className="sticky bottom-0 flex gap-2 border-t border-border/60 bg-card/95 px-5 py-3 backdrop-blur">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" className="flex-1" onClick={onEdit}>
            Editar producto
          </Button>
        </footer>
      </div>
    </div>
  );
}

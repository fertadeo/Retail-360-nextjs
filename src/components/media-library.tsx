"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  Images,
  Plus,
  Search,
  Trash2,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { isApiMode } from "@/lib/api-config";
import {
  fileToMediaPayload,
  formatBytes,
  type MediaKind,
  type MediaLibraryCounts,
  type MediaLibraryItem,
} from "@/lib/media-library";
import { cn } from "@/lib/utils";

type TabId = MediaKind;

const memoryItems: MediaLibraryItem[] = [];

function countsOf(items: MediaLibraryItem[]): MediaLibraryCounts {
  let images = 0;
  let attachments = 0;
  let imagesBytes = 0;
  let attachmentsBytes = 0;
  for (const item of items) {
    const bytes = Math.max(0, Number(item.sizeBytes) || 0);
    if (item.kind === "image") {
      images += 1;
      imagesBytes += bytes;
    } else {
      attachments += 1;
      attachmentsBytes += bytes;
    }
  }
  return {
    images,
    attachments,
    total: items.length,
    totalBytes: imagesBytes + attachmentsBytes,
    imagesBytes,
    attachmentsBytes,
  };
}

export function MediaLibrary() {
  const [tab, setTab] = useState<TabId>("image");
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [counts, setCounts] = useState<MediaLibraryCounts>({
    images: 0,
    attachments: 0,
    total: 0,
    totalBytes: 0,
    imagesBytes: 0,
    attachmentsBytes: 0,
  });
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeApplying, setOptimizeApplying] = useState(false);
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const [optimizeMsg, setOptimizeMsg] = useState<string | null>(null);
  const [optimizeSkipped, setOptimizeSkipped] = useState(0);
  const [optimizeErrors, setOptimizeErrors] = useState(0);
  const [optimizePreviews, setOptimizePreviews] = useState<
    Array<{
      id: string;
      title: string;
      productId: string | null;
      sourceLabel: string;
      before: {
        filename: string;
        mime: string;
        sizeBytes: number;
        dataUrl: string;
      };
      after: {
        filename: string;
        mime: string;
        sizeBytes: number;
        dataUrl: string;
      };
      savedBytes: number;
    }>
  >([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setError(null);
    try {
      if (!isApiMode()) {
        setItems([...memoryItems]);
        setCounts(countsOf(memoryItems));
        return;
      }
      const data = await api.listMedia();
      setItems(data.items);
      setCounts(data.counts);
    } catch (err) {
      setItems([]);
      setCounts({
        images: 0,
        attachments: 0,
        total: 0,
        totalBytes: 0,
        imagesBytes: 0,
        attachmentsBytes: 0,
      });
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (item.kind !== tab) return false;
      if (!q) return true;
      return [item.filename, item.title, item.subtitle, item.sourceLabel]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, tab, query]);

  const previewIndex = useMemo(
    () => (previewId ? filtered.findIndex((i) => i.id === previewId) : -1),
    [filtered, previewId]
  );
  const preview = previewIndex >= 0 ? filtered[previewIndex] : null;

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const payload = await fileToMediaPayload(file);
      const kind: MediaKind = payload.mime.startsWith("image/")
        ? "image"
        : "attachment";
      if (!isApiMode()) {
        const item: MediaLibraryItem = {
          id: `local_${Date.now()}`,
          kind,
          source: "library",
          sourceLabel:
            kind === "image" ? "Imagen de biblioteca" : "Archivo de biblioteca",
          filename: payload.filename,
          mime: payload.mime,
          sizeBytes: payload.sizeBytes,
          dataUrl: payload.dataUrl,
          uploadedAt: new Date().toISOString().slice(0, 10),
          title: payload.filename,
          subtitle: "",
          entityHref: "/biblioteca",
          productId: null,
        };
        memoryItems.unshift(item);
        setTab(kind);
        await refresh();
        return;
      }
      await api.createMedia({
        ...payload,
        kind,
        title: payload.filename,
      });
      setTab(kind);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      if (!isApiMode()) {
        const idx = memoryItems.findIndex((i) => i.id === id);
        if (idx >= 0) memoryItems.splice(idx, 1);
      } else {
        await api.deleteMedia(id);
      }
      if (previewId === id) setPreviewId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  }

  async function previewOptimize() {
    if (!isApiMode()) {
      setError("Optimizar requiere modo API.");
      return;
    }
    setOptimizing(true);
    setOptimizeMsg(null);
    setError(null);
    try {
      const data = await api.optimizeMedia({ dryRun: true, limit: 20 });
      setOptimizePreviews(data.previews ?? []);
      setOptimizeSkipped(data.skipped);
      setOptimizeErrors(data.errors);
      setOptimizeOpen(true);
      if ((data.previews ?? []).length === 0) {
        setOptimizeMsg(
          `Nada para convertir · omitidas ${data.skipped} · errores ${data.errors}`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo preparar la optimización."
      );
    } finally {
      setOptimizing(false);
    }
  }

  async function applyOptimize() {
    if (optimizePreviews.length === 0) {
      setOptimizeOpen(false);
      return;
    }
    setOptimizeApplying(true);
    setError(null);
    try {
      const data = await api.optimizeMedia({
        dryRun: false,
        ids: optimizePreviews.map((p) => p.id),
        limit: optimizePreviews.length,
      });
      setOptimizeOpen(false);
      setOptimizePreviews([]);
      setOptimizeMsg(
        `Optimizadas ${data.converted} · omitidas ${data.skipped} · errores ${data.errors}`
      );
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo aplicar la optimización."
      );
    } finally {
      setOptimizeApplying(false);
    }
  }

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "image", label: "Imágenes", count: counts.images },
    { id: "attachment", label: "Archivos adjuntos", count: counts.attachments },
  ];

  return (
    <div className="animate-aurix-fade space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
            Biblioteca de medios
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Imágenes de productos y archivos adjuntos del comercio activo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col items-end gap-0.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Images className="size-4 text-teal" />
              <span className="tabular-nums">
                {counts.total} archivos ·{" "}
                <span className="font-medium text-charcoal">
                  {formatBytes(counts.totalBytes ?? 0)}
                </span>
              </span>
            </div>
            <p className="text-[0.7rem] tabular-nums">
              Imágenes {formatBytes(counts.imagesBytes ?? 0)} · Adjuntos{" "}
              {formatBytes(counts.attachmentsBytes ?? 0)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || optimizing || optimizeApplying || !isApiMode()}
            onClick={() => void previewOptimize()}
          >
            {optimizing ? "Preparando…" : "Optimizar imágenes"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleUpload(file);
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Plus className="size-3.5" />
            {uploading ? "Subiendo…" : "Subir"}
          </Button>
        </div>
      </div>

      {optimizeMsg ? (
        <p className="rounded-lg bg-teal/10 px-3 py-2 text-sm text-teal">
          {optimizeMsg}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Tipo de medio"
          className="inline-flex rounded-lg bg-secondary/70 p-1 ring-1 ring-border/60"
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                  active
                    ? "bg-card text-charcoal shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}{" "}
                <span
                  className={cn(
                    "tabular-nums",
                    active ? "text-teal" : "text-muted-foreground"
                  )}
                >
                  ({t.count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o producto…"
            className="pl-8"
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!ready ? (
        <p className="text-sm text-muted-foreground">Cargando biblioteca…</p>
      ) : filtered.length === 0 ? (
        <EmptyState tab={tab} hasQuery={Boolean(query.trim())} />
      ) : tab === "image" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <ImageCard
              key={item.id}
              item={item}
              onOpen={() => setPreviewId(item.id)}
              onDelete={() => void handleDelete(item.id)}
            />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl bg-card/90 ring-1 ring-border/70">
          {filtered.map((item) => (
            <AttachmentRow
              key={item.id}
              item={item}
              onOpen={() => setPreviewId(item.id)}
              onDelete={() => void handleDelete(item.id)}
            />
          ))}
        </ul>
      )}

      {preview ? (
        <MediaLightbox
          item={preview}
          index={previewIndex}
          total={filtered.length}
          onClose={() => setPreviewId(null)}
          onPrev={() => {
            if (previewIndex <= 0) return;
            setPreviewId(filtered[previewIndex - 1].id);
          }}
          onNext={() => {
            if (previewIndex < 0 || previewIndex >= filtered.length - 1) return;
            setPreviewId(filtered[previewIndex + 1].id);
          }}
        />
      ) : null}

      {optimizeOpen ? (
        <OptimizePreviewModal
          previews={optimizePreviews}
          skipped={optimizeSkipped}
          errors={optimizeErrors}
          applying={optimizeApplying}
          onClose={() => {
            if (!optimizeApplying) setOptimizeOpen(false);
          }}
          onApply={() => void applyOptimize()}
        />
      ) : null}
    </div>
  );
}

function OptimizePreviewModal({
  previews,
  skipped,
  errors,
  applying,
  onClose,
  onApply,
}: {
  previews: Array<{
    id: string;
    title: string;
    productId: string | null;
    sourceLabel: string;
    before: {
      filename: string;
      mime: string;
      sizeBytes: number;
      dataUrl: string;
    };
    after: {
      filename: string;
      mime: string;
      sizeBytes: number;
      dataUrl: string;
    };
    savedBytes: number;
  }>;
  skipped: number;
  errors: number;
  applying: boolean;
  onClose: () => void;
  onApply: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !applying) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applying, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] grid place-items-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="optimize-media-preview-title"
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-charcoal/75 backdrop-blur-md"
        disabled={applying}
        onClick={() => {
          if (!applying) onClose();
        }}
      />
      <div className="relative z-[1] flex max-h-[min(96dvh,920px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-border">
        <header className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="optimize-media-preview-title"
                className="font-display text-lg font-semibold text-charcoal"
              >
                Vista previa de optimización
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Así se verán al aplicar WebP. Se renombran y se actualiza el
                producto o biblioteca que las usa.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
              onClick={onClose}
              disabled={applying}
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <p className="text-sm text-muted-foreground">
            {previews.length} listas · omitidas {skipped} · errores {errors}
          </p>
          {previews.length === 0 ? (
            <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
              No hay rasters pendientes de convertir en este lote.
            </p>
          ) : (
            <ul className="space-y-4">
              {previews.map((p) => (
                <li
                  key={p.id}
                  className="overflow-hidden rounded-xl ring-1 ring-border/70"
                >
                  <div className="grid gap-0 sm:grid-cols-2">
                    <OptimizeSide
                      label="Antes"
                      filename={p.before.filename}
                      sizeBytes={p.before.sizeBytes}
                      dataUrl={p.before.dataUrl}
                    />
                    <OptimizeSide
                      label="Después"
                      filename={p.after.filename}
                      sizeBytes={p.after.sizeBytes}
                      dataUrl={p.after.dataUrl}
                      highlight
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                    <span className="truncate font-medium text-charcoal">
                      {p.title}
                      {p.productId ? ` · ${p.sourceLabel}` : ""}
                    </span>
                    <span className="tabular-nums text-teal">
                      −{formatBytes(p.savedBytes)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border bg-card px-4 py-3 sm:px-5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={applying}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={applying || previews.length === 0}
            onClick={onApply}
          >
            {applying
              ? "Aplicando…"
              : previews.length > 0
                ? `Aplicar ${previews.length}`
                : "Cerrar"}
          </Button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

function OptimizeSide({
  label,
  filename,
  sizeBytes,
  dataUrl,
  highlight,
}: {
  label: string;
  filename: string;
  sizeBytes: number;
  dataUrl: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("space-y-2 p-3", highlight ? "bg-teal/5" : "bg-card")}>
      <div className="flex items-center justify-between gap-2 text-[0.7rem]">
        <span
          className={cn(
            "font-medium uppercase tracking-wide",
            highlight ? "text-teal" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {formatBytes(sizeBytes)}
        </span>
      </div>
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-secondary ring-1 ring-border/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={filename}
          className="h-full w-full object-contain"
        />
      </div>
      <p className="truncate text-xs font-medium text-charcoal">{filename}</p>
    </div>
  );
}

function EmptyState({ tab, hasQuery }: { tab: TabId; hasQuery: boolean }) {
  return (
    <div className="rounded-xl bg-card/90 px-6 py-14 text-center ring-1 ring-border/70">
      {tab === "image" ? (
        <ImageIcon className="mx-auto size-8 text-muted-foreground/70" />
      ) : (
        <FileText className="mx-auto size-8 text-muted-foreground/70" />
      )}
      <p className="mt-3 font-display text-lg font-medium text-charcoal">
        {hasQuery
          ? "Sin resultados"
          : tab === "image"
            ? "Todavía no hay imágenes"
            : "Todavía no hay archivos adjuntos"}
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {hasQuery
          ? "Probá con otro término de búsqueda."
          : "Subí fotos de productos o documentos con el botón Subir."}
      </p>
    </div>
  );
}

function ImageCard({
  item,
  onOpen,
  onDelete,
}: {
  item: MediaLibraryItem;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl bg-card/90 ring-1 ring-border/70">
      <button
        type="button"
        onClick={onOpen}
        className="group relative block aspect-[4/3] w-full overflow-hidden bg-secondary/40"
      >
        {item.dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.dataUrl}
            alt={item.filename}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-8 opacity-50" />
          </div>
        )}
      </button>
      <div className="space-y-1.5 px-3 py-3">
        <p className="truncate text-sm font-medium text-charcoal">
          {item.filename}
        </p>
        <p className="truncate text-xs text-muted-foreground">{item.title}</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="truncate text-[0.7rem] text-muted-foreground">
            {item.sourceLabel}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              className="text-[0.7rem] font-medium text-destructive hover:underline"
            >
              Borrar
            </button>
            <Link
              href={item.entityHref}
              className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-teal hover:underline"
            >
              Abrir <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function AttachmentRow({
  item,
  onOpen,
  onDelete,
}: {
  item: MediaLibraryItem;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/80">
          <FileText className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-charcoal">
            {item.filename}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {item.title}
            {item.subtitle ? ` · ${item.subtitle}` : ""}
          </p>
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
            {item.sourceLabel} · {formatBytes(item.sizeBytes)}
            {item.uploadedAt ? ` · ${item.uploadedAt}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.dataUrl ? (
          <>
            <button
              type="button"
              onClick={onOpen}
              className="text-xs font-medium text-teal hover:underline"
            >
              Ver
            </button>
            <a
              href={item.dataUrl}
              download={item.filename}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Download className="size-3" />
              Descargar
            </a>
          </>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
        >
          <Trash2 className="size-3" />
          Borrar
        </button>
        <Link
          href={item.entityHref}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Origen <ExternalLink className="size-3" />
        </Link>
      </div>
    </li>
  );
}

function MediaLightbox({
  item,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  item: MediaLibraryItem;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [mounted, setMounted] = useState(false);
  const isImage = item.kind === "image" && Boolean(item.dataUrl);
  const isPdf = item.mime === "application/pdf" && Boolean(item.dataUrl);
  const canPrev = index > 0;
  const canNext = index >= 0 && index < total - 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setZoom(1);
  }, [item.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))));
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex h-dvh w-screen flex-col bg-[#0c0a09]/92 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`Vista previa: ${item.filename}`}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#161310]/95 px-4 py-3 sm:px-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/8 text-[#5eead4] ring-1 ring-white/10">
          {isImage ? (
            <ImageIcon className="size-4" />
          ) : (
            <FileText className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold tracking-tight text-[#f4f0e8] sm:text-lg">
            {item.filename}
          </p>
          <p className="truncate text-xs text-white/45 sm:text-sm">
            {item.title}
            {item.subtitle ? ` · ${item.subtitle}` : ""}
          </p>
        </div>
        <div className="hidden flex-wrap items-center gap-1.5 md:flex">
          <MetaChip>{item.sourceLabel}</MetaChip>
          <MetaChip>{formatBytes(item.sizeBytes)}</MetaChip>
          {item.uploadedAt ? <MetaChip>{item.uploadedAt}</MetaChip> : null}
          <MetaChip>{shortMime(item.mime)}</MetaChip>
        </div>
        {item.dataUrl ? (
          <a
            href={item.dataUrl}
            download={item.filename}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#5eead4]/15 px-3 text-xs font-medium text-[#5eead4] ring-1 ring-[#5eead4]/25 transition hover:bg-[#5eead4]/25"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Descargar</span>
          </a>
        ) : null}
        <Link
          href={item.entityHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/8 px-3 text-xs font-medium text-white/70 ring-1 ring-white/10 transition hover:bg-white/14 hover:text-[#f4f0e8]"
        >
          <ExternalLink className="size-3.5" />
          <span className="hidden sm:inline">Origen</span>
        </Link>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#f4f0e8] ring-1 ring-white/15 transition hover:bg-white/18"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label="Anterior"
              disabled={!canPrev}
              onClick={onPrev}
              className="absolute left-2 top-1/2 z-20 flex size-14 -translate-y-1/2 items-center justify-center rounded-full bg-[#5eead4] text-[#0c0a09] shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-4 ring-[#5eead4]/25 transition hover:scale-105 hover:bg-[#7af0dc] disabled:pointer-events-none disabled:opacity-30 sm:left-4 sm:size-16"
            >
              <ChevronLeft className="size-8 sm:size-9" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              disabled={!canNext}
              onClick={onNext}
              className="absolute right-2 top-1/2 z-20 flex size-14 -translate-y-1/2 items-center justify-center rounded-full bg-[#5eead4] text-[#0c0a09] shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-4 ring-[#5eead4]/25 transition hover:scale-105 hover:bg-[#7af0dc] disabled:pointer-events-none disabled:opacity-30 sm:right-4 sm:size-16"
            >
              <ChevronRight className="size-8 sm:size-9" strokeWidth={2.5} />
            </button>
          </>
        ) : null}

        <div
          className="flex h-full items-center justify-center overflow-auto p-4 sm:p-8"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(255,255,255,0.04), transparent 65%), radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "auto, 16px 16px",
          }}
          onClick={onClose}
        >
          {isImage ? (
            <div
              className="relative rounded-2xl bg-[#f7f3ec] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.5)] ring-1 ring-white/20 sm:p-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.dataUrl!}
                alt={item.filename}
                className="mx-auto block h-auto w-auto max-w-[min(92vw,1100px)] rounded-lg object-contain"
                style={{
                  maxHeight: `min(${Math.round(78 * zoom)}dvh, ${Math.round(900 * zoom)}px)`,
                }}
              />
            </div>
          ) : isPdf ? (
            <iframe
              title={item.filename}
              src={item.dataUrl!}
              className="h-full min-h-[70dvh] w-full max-w-5xl rounded-2xl bg-white shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className="flex flex-col items-center gap-3 rounded-2xl bg-white/5 px-8 py-10 text-center text-white/65 ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <FileText className="size-12 opacity-50" />
              <p className="text-sm">Vista previa no disponible para este tipo.</p>
              {item.dataUrl ? (
                <a
                  href={item.dataUrl}
                  download={item.filename}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5eead4] hover:underline"
                >
                  <Download className="size-3.5" />
                  Descargar archivo
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-center gap-2 border-t border-white/10 bg-[#161310]/95 px-4 py-3 sm:gap-3">
        {isImage ? (
          <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Alejar"
              className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-[#f4f0e8]"
              onClick={() =>
                setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))
              }
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-xs tabular-nums text-white/55">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Acercar"
              className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-[#f4f0e8]"
              onClick={() =>
                setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))
              }
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>
        ) : null}

        {total > 1 ? (
          <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Anterior"
              disabled={!canPrev}
              className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-[#f4f0e8] disabled:opacity-35"
              onClick={onPrev}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[3.25rem] text-center text-xs tabular-nums text-white/55">
              {index + 1}/{total}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Siguiente"
              disabled={!canNext}
              className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-[#f4f0e8] disabled:opacity-35"
              onClick={onNext}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}

        <p className="hidden text-[0.7rem] text-white/35 sm:block">
          Esc cierra · ← → navega{isImage ? " · +/− zoom" : ""}
        </p>
      </footer>
    </div>,
    document.body
  );
}

function shortMime(mime: string): string {
  const m = mime.trim().toLowerCase();
  if (m.startsWith("image/")) return m.replace("image/", "").toUpperCase();
  if (m === "application/pdf") return "PDF";
  const part = m.split("/").pop();
  return (part || mime || "archivo").toUpperCase();
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/8 px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-white/60 ring-1 ring-white/10">
      {children}
    </span>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  linkWooBySku,
  listBranches,
  listChannels,
  listPriceLists,
  pushMeliAll,
  pushWooAll,
  saveChannel,
  usingRemoteApi,
} from "@/lib/store";
import type { Channel, ChannelConfig, StockMode } from "@/lib/types";
import { useRetailQuery } from "@/lib/use-retail-query";

export function ChannelsPanel() {
  const { data, loading, error, reload } = useRetailQuery(
    () =>
      Promise.all([listChannels(), listPriceLists(true), listBranches(true)]),
    []
  );
  const channels = data?.[0] ?? [];
  const lists = data?.[1] ?? [];
  const branches = data?.[2] ?? [];
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const woo = channels.find((c) => c.channel === "woocommerce");
  const meli = channels.find((c) => c.channel === "mercadolibre");

  async function runBulk(kind: "woo" | "meli" | "link") {
    if (!usingRemoteApi()) {
      setMessage("Conectá el API (NEXT_PUBLIC_API_URL) para sincronizar.");
      return;
    }
    setBusy(kind);
    setMessage(null);
    try {
      if (kind === "link") {
        const r = await linkWooBySku();
        setMessage(`WooCommerce: ${r.linked} vinculados, ${r.skipped} omitidos.`);
      } else if (kind === "woo") {
        const r = await pushWooAll("both");
        const ok = r.results.filter((x) => x.ok).length;
        setMessage(`WooCommerce push: ${ok}/${r.results.length} ok.`);
      } else {
        const r = await pushMeliAll("both");
        const ok = r.results.filter((x) => x.ok).length;
        setMessage(`Mercado Libre push: ${ok}/${r.results.length} ok.`);
      }
      reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error de sync.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Integraciones
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
          Canales
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Sync de stock y precio hacia WooCommerce (tienda virtual) y Mercado
          Libre. Vinculá por SKU o ID de publicación y empujá desde productos.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando canales…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {message ? (
        <p className="rounded-lg bg-tealSoft/60 px-3 py-2 text-sm text-charcoal">
          {message}
        </p>
      ) : null}

      {woo ? (
        <ChannelForm
          title="WooCommerce"
          config={woo}
          lists={lists}
          branches={branches}
          onSaved={reload}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={Boolean(busy)}
                onClick={() => void runBulk("link")}
              >
                {busy === "link" ? "…" : "Vincular por SKU"}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={Boolean(busy)}
                onClick={() => void runBulk("woo")}
              >
                {busy === "woo" ? "…" : "Push todos"}
              </Button>
            </div>
          }
        />
      ) : null}

      {meli ? (
        <ChannelForm
          title="Mercado Libre"
          config={meli}
          lists={lists}
          branches={branches}
          onSaved={reload}
          actions={
            <Button
              type="button"
              size="sm"
              disabled={Boolean(busy)}
              onClick={() => void runBulk("meli")}
            >
              {busy === "meli" ? "…" : "Push todos"}
            </Button>
          }
        />
      ) : null}
    </div>
  );
}

function ChannelForm({
  title,
  config,
  lists,
  branches,
  onSaved,
  actions,
}: {
  title: string;
  config: ChannelConfig;
  lists: Array<{ id: string; nombre: string }>;
  branches: Array<{ id: string; nombre: string }>;
  onSaved: () => void;
  actions?: ReactNode;
}) {
  const [enabled, setEnabled] = useState(config.enabled);
  const [storeUrl, setStoreUrl] = useState(config.storeUrl ?? "");
  const [consumerKey, setConsumerKey] = useState(config.consumerKey ?? "");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [sellerId, setSellerId] = useState(config.sellerId ?? "");
  const [siteId, setSiteId] = useState(config.siteId || "MLA");
  const [priceListId, setPriceListId] = useState(config.priceListId ?? "");
  const [stockMode, setStockMode] = useState<StockMode>(config.stockMode);
  const [stockBranchId, setStockBranchId] = useState(
    config.stockBranchId ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(config.enabled);
    setStoreUrl(config.storeUrl ?? "");
    setConsumerKey(config.consumerKey ?? "");
    setSellerId(config.sellerId ?? "");
    setSiteId(config.siteId || "MLA");
    setPriceListId(config.priceListId ?? "");
    setStockMode(config.stockMode);
    setStockBranchId(config.stockBranchId ?? "");
  }, [config]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const channel = config.channel as Channel;
      await saveChannel(channel, {
        enabled,
        storeUrl: storeUrl || null,
        consumerKey: consumerKey || null,
        consumerSecret: consumerSecret || undefined,
        accessToken: accessToken || undefined,
        sellerId: sellerId || null,
        siteId,
        priceListId: priceListId || null,
        stockMode,
        stockBranchId: stockBranchId || null,
      });
      setConsumerSecret("");
      setAccessToken("");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  const isWoo = config.channel === "woocommerce";

  return (
    <section className="space-y-4 rounded-xl bg-card/90 p-5 ring-1 ring-border/70">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {config.configured
              ? `Configurado · última sync ${config.lastSyncAt ?? "—"}`
              : "Sin credenciales"}
            {config.consumerSecretMasked
              ? ` · secret ${config.consumerSecretMasked}`
              : null}
            {config.accessTokenMasked
              ? ` · token ${config.accessTokenMasked}`
              : null}
          </p>
        </div>
        {actions}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Canal habilitado
      </label>

      {isWoo ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>URL de la tienda</Label>
            <Input
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="https://mitienda.com"
            />
          </div>
          <div>
            <Label>Consumer key</Label>
            <Input
              value={consumerKey}
              onChange={(e) => setConsumerKey(e.target.value)}
            />
          </div>
          <div>
            <Label>Consumer secret (dejar vacío para no cambiar)</Label>
            <Input
              type="password"
              value={consumerSecret}
              onChange={(e) => setConsumerSecret(e.target.value)}
              placeholder={config.consumerSecretSet ? "••••" : ""}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Access token</Label>
            <Input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={config.accessTokenSet ? "••••" : "APP_USR-…"}
            />
          </div>
          <div>
            <Label>Seller ID</Label>
            <Input
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
            />
          </div>
          <div>
            <Label>Site ID</Label>
            <Input value={siteId} onChange={(e) => setSiteId(e.target.value)} />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label>Lista de precios al empujar</Label>
          <select
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={priceListId}
            onChange={(e) => setPriceListId(e.target.value)}
          >
            <option value="">Default del sistema</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Stock a publicar</Label>
          <select
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={stockMode}
            onChange={(e) => setStockMode(e.target.value as StockMode)}
          >
            <option value="total">Total (suma)</option>
            <option value="default_branch">Sucursal default</option>
            <option value="branch">Sucursal específica</option>
          </select>
        </div>
        <div>
          <Label>Sucursal (si aplica)</Label>
          <select
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={stockBranchId}
            onChange={(e) => setStockBranchId(e.target.value)}
            disabled={stockMode !== "branch"}
          >
            <option value="">—</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="button" disabled={saving} onClick={() => void save()}>
        Guardar {title}
      </Button>
    </section>
  );
}

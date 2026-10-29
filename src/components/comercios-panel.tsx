"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { useComercio } from "@/lib/comercio-context";
import { isApiMode } from "@/lib/api-config";
import type { Comercio, StockShareGroup, StockShareMode } from "@/lib/types";
import { useRetailQuery } from "@/lib/use-retail-query";

export function ComerciosPanel() {
  const { reload: reloadCtx } = useComercio();
  const { data, loading, error, reload } = useRetailQuery(
    () =>
      Promise.all([
        isApiMode()
          ? api.listComercios(false)
          : Promise.resolve([] as Comercio[]),
        isApiMode()
          ? api.listStockShareGroups()
          : Promise.resolve([] as StockShareGroup[]),
      ]),
    []
  );
  const comercios = data?.[0] ?? [];
  const groups = data?.[1] ?? [];

  const [editing, setEditing] = useState<Comercio | null>(null);
  const [creating, setCreating] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [rubro, setRubro] = useState("");
  const [direccion, setDireccion] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // share group form
  const [gNombre, setGNombre] = useState("");
  const [gModo, setGModo] = useState<StockShareMode>("rotate");
  const [gMembers, setGMembers] = useState<string[]>([]);
  const [editingGroup, setEditingGroup] = useState<StockShareGroup | null>(
    null
  );

  // transfer
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("1");

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setCodigo("");
    setNombre("");
    setRubro("");
    setDireccion("");
    setErr(null);
  }

  function startEdit(c: Comercio) {
    setCreating(false);
    setEditing(c);
    setCodigo(c.codigo);
    setNombre(c.nombre);
    setRubro(c.rubro);
    setDireccion(c.direccion);
    setErr(null);
  }

  async function saveComercio() {
    if (!isApiMode()) {
      setErr("Requiere API remota.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const body = { codigo, nombre, rubro, direccion, activa: true };
      if (editing) await api.updateComercio(editing.id, body);
      else await api.createComercio(body);
      setCreating(false);
      setEditing(null);
      setMsg("Comercio guardado.");
      reload();
      reloadCtx();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function saveGroup() {
    if (!isApiMode()) return;
    setSaving(true);
    setErr(null);
    try {
      await api.upsertStockShareGroup({
        id: editingGroup?.id,
        nombre: gNombre,
        modo: gModo,
        comercioIds: gMembers,
      });
      setGNombre("");
      setGMembers([]);
      setEditingGroup(null);
      setMsg(
        gModo === "shared"
          ? "Grupo de stock compartido guardado."
          : "Grupo de rotación guardado."
      );
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al guardar grupo.");
    } finally {
      setSaving(false);
    }
  }

  async function doTransfer() {
    if (!isApiMode()) return;
    setSaving(true);
    setErr(null);
    try {
      const r = await api.transferStock({
        fromComercioId: fromId,
        toComercioId: toId,
        sku,
        quantity: Number(qty) || 0,
      });
      setMsg(`Rotación OK. Origen: ${r.fromStock} · Destino: ${r.toStock}`);
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo rotar stock.");
    } finally {
      setSaving(false);
    }
  }

  function toggleMember(id: string) {
    setGMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Multicomercio
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            Comercios
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Cada comercio tiene su catálogo y listas de precios. Podés
            compartir stock (mismo pool por SKU) o rotar entre pares; un
            comercio de otro rubro queda aislado si no está en ningún grupo.
          </p>
        </div>
        <Button type="button" size="lg" className="h-10" onClick={startCreate}>
          Nuevo comercio
        </Button>
      </div>

      {msg ? (
        <p className="rounded-lg bg-tealSoft/60 px-3 py-2 text-sm">{msg}</p>
      ) : null}
      {err || error ? (
        <p className="text-sm text-destructive">{err ?? error}</p>
      ) : null}

      {creating || editing ? (
        <div className="space-y-3 rounded-xl bg-card/90 p-4 ring-1 ring-border/70">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Código</Label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <Label>Rubro</Label>
              <Input
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
                placeholder="Instrumentos / Accesorios / …"
              />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" disabled={saving} onClick={() => void saveComercio()}>
              Guardar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl bg-card/90 ring-1 ring-border/70">
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Cargando…</p>
        ) : null}
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Rubro</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {comercios.map((c) => (
              <tr key={c.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{c.codigo}</td>
                <td className="px-4 py-3">
                  {c.nombre}
                  {c.esDefault ? (
                    <span className="ml-2 text-xs text-teal">default</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.rubro || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(c)}
                  >
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-charcoal">
            Compartir o rotar stock
          </h2>
          <p className="text-sm text-muted-foreground">
            <strong className="font-medium text-charcoal">Compartido:</strong>{" "}
            mismo stock por SKU entre los miembros.{" "}
            <strong className="font-medium text-charcoal">Rotación:</strong>{" "}
            stock propio + transferencias entre comercios del grupo. Quien no
            esté en un grupo no comparte con nadie.
          </p>
        </div>

        <div className="space-y-3 rounded-xl bg-card/90 p-4 ring-1 ring-border/70">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Nombre del grupo</Label>
              <Input
                value={gNombre}
                onChange={(e) => setGNombre(e.target.value)}
                placeholder="Ej. Locales música"
              />
            </div>
            <div>
              <Label>Modo</Label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={gModo}
                onChange={(e) => setGModo(e.target.value as StockShareMode)}
              >
                <option value="rotate">Rotar (transferencias)</option>
                <option value="shared">Compartir (pool único)</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Comercios del grupo</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {comercios.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={gMembers.includes(c.id)}
                    onChange={() => toggleMember(c.id)}
                  />
                  {c.nombre}
                </label>
              ))}
            </div>
          </div>
          <Button type="button" disabled={saving} onClick={() => void saveGroup()}>
            {editingGroup ? "Actualizar grupo" : "Crear grupo"}
          </Button>
        </div>

        <ul className="space-y-2 text-sm">
          {groups.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card/80 px-3 py-2 ring-1 ring-border/60"
            >
              <span>
                <span className="font-medium">{g.nombre}</span>
                <span className="ml-2 text-muted-foreground">
                  {g.modo === "shared" ? "compartido" : "rotación"} ·{" "}
                  {g.comercioIds.length} comercios
                </span>
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingGroup(g);
                    setGNombre(g.nombre);
                    setGModo(g.modo);
                    setGMembers(g.comercioIds);
                  }}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void api.deleteStockShareGroup(g.id).then(() => reload())
                  }
                >
                  Quitar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl bg-card/90 p-4 ring-1 ring-border/70">
        <h2 className="font-display text-lg font-semibold text-charcoal">
          Rotar stock ahora
        </h2>
        <p className="text-xs text-muted-foreground">
          Ambos comercios deben estar en el mismo grupo (modo rotación). El SKU
          tiene que existir en origen y destino.
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <Label>Desde</Label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
            >
              <option value="">—</option>
              {comercios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Hacia</Label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
            >
              <option value="">—</option>
              {comercios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>SKU</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        </div>
        <Button type="button" disabled={saving} onClick={() => void doTransfer()}>
          Transferir
        </Button>
      </section>
    </div>
  );
}

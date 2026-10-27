"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getDefaultPriceListId,
  listPriceLists,
  setDefaultPriceList,
  upsertPriceList,
} from "@/lib/store";
import type { PriceList } from "@/lib/types";

export function SettingsPanel() {
  const [tick, setTick] = useState(0);
  const lists = useMemo(() => {
    void tick;
    return listPriceLists();
  }, [tick]);
  const defaultId = useMemo(() => {
    void tick;
    return getDefaultPriceListId();
  }, [tick]);

  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [editing, setEditing] = useState<PriceList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function refresh() {
    setTick((t) => t + 1);
  }

  function startCreate() {
    setEditing(null);
    setNombre("");
    setCodigo("");
    setError(null);
    setMessage(null);
  }

  function startEdit(pl: PriceList) {
    setEditing(pl);
    setNombre(pl.nombre);
    setCodigo(pl.codigo);
    setError(null);
    setMessage(null);
  }

  function save() {
    setError(null);
    setMessage(null);
    try {
      upsertPriceList({
        id: editing?.id,
        nombre,
        codigo: codigo || undefined,
        activa: editing?.activa ?? true,
        esDefault: editing?.esDefault ?? false,
      });
      setMessage(editing ? "Lista actualizada." : "Lista creada.");
      setEditing(null);
      setNombre("");
      setCodigo("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  }

  function toggleActive(pl: PriceList) {
    setError(null);
    try {
      upsertPriceList({
        id: pl.id,
        nombre: pl.nombre,
        codigo: pl.codigo,
        activa: !pl.activa,
        esDefault: pl.esDefault,
      });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar.");
    }
  }

  function makeDefault(pl: PriceList) {
    setError(null);
    try {
      setDefaultPriceList(pl.id);
      setMessage(`Default: ${pl.nombre}`);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo definir default.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Sistema
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
          Configuración
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Listas de precios diferenciadas (minorista, mayorista u otras que
          crees). Cada cliente puede tener una lista; el POS y el catálogo usan
          la default si no hay cliente.
        </p>
      </div>

      <section className="space-y-4 rounded-xl bg-card/90 p-5 ring-1 ring-border/70 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-medium text-charcoal">
              Listas de precios
            </h2>
            <p className="text-sm text-muted-foreground">
              Default actual:{" "}
              <span className="font-medium text-foreground">
                {lists.find((l) => l.id === defaultId)?.nombre ?? "—"}
              </span>
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={startCreate}>
            Nueva lista
          </Button>
        </div>

        <ul className="divide-y divide-border/60 overflow-hidden rounded-lg ring-1 ring-border/60">
          {lists.map((pl) => (
            <li
              key={pl.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">
                  {pl.nombre}
                  {pl.esDefault ? (
                    <span className="ml-2 rounded bg-teal-soft px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-teal">
                      default
                    </span>
                  ) : null}
                  {!pl.activa ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (inactiva)
                    </span>
                  ) : null}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {pl.codigo}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(pl)}
                >
                  Editar
                </Button>
                {!pl.esDefault ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={!pl.activa}
                    onClick={() => makeDefault(pl)}
                  >
                    Hacer default
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleActive(pl)}
                >
                  {pl.activa ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <form
          className="space-y-3 border-t border-border/60 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <h3 className="text-sm font-medium">
            {editing ? `Editar «${editing.nombre}»` : "Crear lista"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pl-nombre">Nombre</Label>
              <Input
                id="pl-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Distribuidor"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-codigo">Código</Label>
              <Input
                id="pl-codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Se genera del nombre si lo dejás vacío"
                className="font-mono text-sm"
              />
            </div>
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          {message ? (
            <p className="text-sm text-teal">{message}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit">
              {editing ? "Guardar cambios" : "Crear lista"}
            </Button>
            {editing ? (
              <Button type="button" variant="outline" onClick={startCreate}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listBranches,
  setDefaultBranch,
  upsertBranch,
} from "@/lib/store";
import type { Branch } from "@/lib/types";
import { useRetailQuery } from "@/lib/use-retail-query";

export function BranchesPanel() {
  const { data, loading, error: loadError, reload } = useRetailQuery(
    () => listBranches(false),
    []
  );
  const branches = data ?? [];
  const [editing, setEditing] = useState<Branch | null>(null);
  const [creating, setCreating] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setCodigo("");
    setNombre("");
    setDireccion("");
    setError(null);
  }

  function startEdit(b: Branch) {
    setCreating(false);
    setEditing(b);
    setCodigo(b.codigo);
    setNombre(b.nombre);
    setDireccion(b.direccion);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await upsertBranch({
        id: editing?.id,
        codigo,
        nombre,
        direccion,
        activa: editing?.activa ?? true,
        esDefault: editing?.esDefault ?? false,
      });
      setCreating(false);
      setEditing(null);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Multisucursal
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            Sucursales
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stock por punto de venta. El sync a tienda virtual puede usar el
            total o una sucursal concreta.
          </p>
        </div>
        <Button type="button" size="lg" className="h-10" onClick={startCreate}>
          Nueva sucursal
        </Button>
      </div>

      {creating || editing ? (
        <div className="space-y-4 rounded-xl bg-card/90 p-4 ring-1 ring-border/70">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="br-codigo">Código</Label>
              <Input
                id="br-codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="central"
              />
            </div>
            <div>
              <Label htmlFor="br-nombre">Nombre</Label>
              <Input
                id="br-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Casa central"
              />
            </div>
            <div>
              <Label htmlFor="br-dir">Dirección</Label>
              <Input
                id="br-dir"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="button" disabled={saving} onClick={() => void save()}>
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
        ) : loadError ? (
          <p className="px-4 py-6 text-sm text-destructive">{loadError}</p>
        ) : null}
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{b.codigo}</td>
                <td className="px-4 py-3">
                  {b.nombre}
                  {b.esDefault ? (
                    <span className="ml-2 text-xs text-teal">default</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {b.activa ? "Activa" : "Inactiva"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {!b.esDefault ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void setDefaultBranch(b.id).then(() => reload())
                        }
                      >
                        Default
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(b)}
                    >
                      Editar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

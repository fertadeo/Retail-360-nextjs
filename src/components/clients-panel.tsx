"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPriceList,
  listClients,
  listPriceLists,
  upsertClient,
} from "@/lib/store";
import type { Client } from "@/lib/types";

export function ClientsPanel() {
  const [tick, setTick] = useState(0);
  const clients = useMemo(() => {
    void tick;
    return listClients();
  }, [tick]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            CRM ligero
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Agenda para pedidos y facturación en mostrador.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="h-10"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Nuevo cliente
        </Button>
      </div>

      {formOpen ? (
        <ClientForm
          initial={editing ?? undefined}
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setTick((t) => t + 1);
          }}
        />
      ) : null}

      <ul className="divide-y divide-border/70 overflow-hidden rounded-xl bg-card/90 ring-1 ring-border/70">
        {clients.map((c) => (
          <li
            key={c.id}
            className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-foreground">{c.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {[c.email, c.telefono, c.rfc].filter(Boolean).join(" · ") ||
                  "Sin datos de contacto"}
              </p>
              <p className="mt-0.5 text-xs text-teal">
                Lista:{" "}
                {c.priceListId
                  ? getPriceList(c.priceListId)?.nombre ?? "—"
                  : "Default del sistema"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(c);
                setFormOpen(true);
              }}
            >
              Editar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClientForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Client;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const lists = listPriceLists(true);
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [telefono, setTelefono] = useState(initial?.telefono ?? "");
  const [rfc, setRfc] = useState(initial?.rfc ?? "");
  const [notas, setNotas] = useState(initial?.notas ?? "");
  const [priceListId, setPriceListId] = useState(initial?.priceListId ?? "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    try {
      upsertClient({
        id: initial?.id,
        nombre,
        email,
        telefono,
        rfc,
        notas,
        priceListId: priceListId || null,
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
      <h2 className="font-display text-lg font-medium">
        {initial ? "Editar cliente" : "Nuevo cliente"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cn">Nombre</Label>
          <Input
            id="cn"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="em">Email</Label>
          <Input
            id="em"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tel">Teléfono</Label>
          <Input
            id="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rfc">RFC</Label>
          <Input id="rfc" value={rfc} onChange={(e) => setRfc(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notas">Notas</Label>
          <Input
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="pl">Lista de precios</Label>
          <select
            id="pl"
            className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
            value={priceListId}
            onChange={(e) => setPriceListId(e.target.value)}
          >
            <option value="">Default del sistema</option>
            {lists.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit">Guardar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

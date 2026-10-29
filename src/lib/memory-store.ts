/**
 * Store en memoria — fallback local cuando no hay NEXT_PUBLIC_API_URL.
 */

import type {
  Branch,
  Channel,
  ChannelConfig,
  ChannelLink,
  Client,
  Order,
  PriceList,
  Product,
  StockMode,
} from "@/lib/types";
import { orderTotal, productPrice } from "@/lib/types";

export const PRICE_LIST_MINORISTA = "pl_minorista";
export const PRICE_LIST_MAYORISTA = "pl_mayorista";

const PRICE_LISTS: PriceList[] = [
  {
    id: PRICE_LIST_MINORISTA,
    nombre: "Minorista",
    codigo: "minorista",
    activa: true,
    esDefault: true,
  },
  {
    id: PRICE_LIST_MAYORISTA,
    nombre: "Mayorista",
    codigo: "mayorista",
    activa: true,
    esDefault: false,
  },
];

function withLists(
  base: number,
  mayorista: number
): { precio: number; precios: Record<string, number> } {
  return {
    precio: base,
    precios: {
      [PRICE_LIST_MINORISTA]: base,
      [PRICE_LIST_MAYORISTA]: mayorista,
    },
  };
}

const PRODUCTS: Product[] = [
  {
    id: "p1",
    sku: "BEB-001",
    nombre: "Agua mineral 600ml",
    categoria: "bebidas",
    ...withLists(18, 14),
    costo: 8,
    stock: 120,
    activo: true,
    descripcion: "Botella individual.",
  },
  {
    id: "p2",
    sku: "BEB-014",
    nombre: "Refresco cola 355ml",
    categoria: "bebidas",
    ...withLists(22, 17),
    costo: 11,
    stock: 80,
    activo: true,
    descripcion: "Lata.",
  },
  {
    id: "p3",
    sku: "ALI-210",
    nombre: "Galletas surtidas 200g",
    categoria: "alimentos",
    ...withLists(45, 36),
    costo: 22,
    stock: 40,
    activo: true,
    descripcion: "Caja familiar.",
  },
  {
    id: "p4",
    sku: "ALI-088",
    nombre: "Café molido 250g",
    categoria: "alimentos",
    ...withLists(95, 78),
    costo: 48,
    stock: 25,
    activo: true,
    descripcion: "Tueste medio.",
  },
  {
    id: "p5",
    sku: "LIM-003",
    nombre: "Detergente 1L",
    categoria: "limpieza",
    ...withLists(68, 55),
    costo: 35,
    stock: 18,
    activo: true,
    descripcion: "Lavanda.",
  },
  {
    id: "p6",
    sku: "OTR-901",
    nombre: "Bolsa reutilizable",
    categoria: "otros",
    ...withLists(35, 28),
    costo: 12,
    stock: 60,
    activo: true,
    descripcion: "Tela resistente.",
  },
];

const CLIENTS: Client[] = [
  {
    id: "c1",
    nombre: "María López",
    email: "maria@ejemplo.mx",
    telefono: "55 1234 5678",
    direccion: "Av. Reforma 120, Col. Centro, CDMX",
    rfc: "LOMA850101XXX",
    notas: "Cliente frecuente.",
    priceListId: PRICE_LIST_MINORISTA,
  },
  {
    id: "c2",
    nombre: "Comercial del Valle SA",
    email: "compras@valle.mx",
    telefono: "55 9876 5432",
    direccion: "Calle Industrial 45, Parque Valle, NL",
    rfc: "CVA920215ABC",
    notas: "Factura a mes vencido.",
    priceListId: PRICE_LIST_MAYORISTA,
  },
  {
    id: "c3",
    nombre: "Juan Pérez",
    email: "juan.perez@mail.com",
    telefono: "33 2222 1111",
    direccion: "Calle Roble 8, Zapopan, Jal.",
    rfc: "",
    notas: "",
    priceListId: null,
  },
];

const emptyEnvio = {
  conEnvio: false,
  envioCosto: 0,
  direccionEnvio: null as string | null,
  telefonoContacto: null as string | null,
  metodoPago: null as Order["metodoPago"],
};

const ORDERS: Order[] = [
  {
    id: "o1",
    folio: "P-1001",
    clientId: "c1",
    clienteNombre: "María López",
    status: "entregado",
    canal: "pedido",
    createdAt: "2026-10-25T15:20:00.000Z",
    priceListId: PRICE_LIST_MINORISTA,
    ...emptyEnvio,
    lines: [
      {
        productId: "p4",
        nombre: "Café molido 250g",
        cantidad: 2,
        precioUnitario: 95,
      },
      {
        productId: "p1",
        nombre: "Agua mineral 600ml",
        cantidad: 6,
        precioUnitario: 18,
      },
    ],
  },
  {
    id: "o2",
    folio: "POS-204",
    clientId: null,
    clienteNombre: "Mostrador",
    status: "entregado",
    canal: "pos",
    createdAt: "2026-10-27T18:05:00.000Z",
    priceListId: PRICE_LIST_MINORISTA,
    ...emptyEnvio,
    metodoPago: "efectivo",
    lines: [
      {
        productId: "p2",
        nombre: "Refresco cola 355ml",
        cantidad: 3,
        precioUnitario: 22,
      },
      {
        productId: "p3",
        nombre: "Galletas surtidas 200g",
        cantidad: 1,
        precioUnitario: 45,
      },
    ],
  },
  {
    id: "o3",
    folio: "P-1002",
    clientId: "c2",
    clienteNombre: "Comercial del Valle SA",
    status: "preparando",
    canal: "pedido",
    createdAt: "2026-10-27T12:00:00.000Z",
    priceListId: PRICE_LIST_MAYORISTA,
    ...emptyEnvio,
    lines: [
      {
        productId: "p5",
        nombre: "Detergente 1L",
        cantidad: 10,
        precioUnitario: 55,
      },
    ],
  },
];

let priceLists = structuredClone(PRICE_LISTS);
let products = structuredClone(PRODUCTS);
let clients = structuredClone(CLIENTS);
let orders = structuredClone(ORDERS);
let seq = 10;

function nextId(prefix: string) {
  seq += 1;
  return `${prefix}${seq}`;
}

function slugCodigo(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32);
}

export function listPriceLists(onlyActive = false): PriceList[] {
  const list = onlyActive ? priceLists.filter((p) => p.activa) : [...priceLists];
  return list.sort((a, b) => {
    if (a.esDefault !== b.esDefault) return a.esDefault ? -1 : 1;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

export function getDefaultPriceListId(): string {
  return (
    priceLists.find((p) => p.esDefault && p.activa)?.id ??
    priceLists.find((p) => p.activa)?.id ??
    PRICE_LIST_MINORISTA
  );
}

export function getPriceList(id: string): PriceList | undefined {
  return priceLists.find((p) => p.id === id);
}

export function upsertPriceList(input: {
  id?: string;
  nombre: string;
  codigo?: string;
  activa?: boolean;
  esDefault?: boolean;
}): PriceList {
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("Poné un nombre para la lista.");
  const codigo = (input.codigo?.trim() || slugCodigo(nombre)).toLowerCase();
  if (!codigo) throw new Error("Código inválido.");

  if (input.id) {
    const idx = priceLists.findIndex((p) => p.id === input.id);
    if (idx < 0) throw new Error("Lista no encontrada.");
    if (
      priceLists.some(
        (p) => p.id !== input.id && p.codigo === codigo
      )
    ) {
      throw new Error("Ya existe una lista con ese código.");
    }
    let next = [...priceLists];
    const updated: PriceList = {
      ...next[idx],
      nombre,
      codigo,
      activa: input.activa ?? next[idx].activa,
      esDefault: input.esDefault ?? next[idx].esDefault,
    };
    next[idx] = updated;
    if (updated.esDefault) {
      next = next.map((p) =>
        p.id === updated.id ? updated : { ...p, esDefault: false }
      );
    }
    if (!next.some((p) => p.esDefault && p.activa)) {
      throw new Error("Tiene que haber al menos una lista default activa.");
    }
    priceLists = next;
    syncProductDefaultPrices();
    return updated;
  }

  if (priceLists.some((p) => p.codigo === codigo)) {
    throw new Error("Ya existe una lista con ese código.");
  }
  const created: PriceList = {
    id: nextId("pl"),
    nombre,
    codigo,
    activa: input.activa ?? true,
    esDefault: Boolean(input.esDefault),
  };
  let next = [created, ...priceLists];
  if (created.esDefault) {
    next = next.map((p) =>
      p.id === created.id ? created : { ...p, esDefault: false }
    );
  }
  priceLists = next;
  // Sembrar precio = precio default en productos existentes
  products = products.map((p) => ({
    ...p,
    precios: {
      ...p.precios,
      [created.id]: p.precios[created.id] ?? p.precio,
    },
  }));
  return created;
}

export function setDefaultPriceList(id: string): PriceList {
  const target = priceLists.find((p) => p.id === id);
  if (!target) throw new Error("Lista no encontrada.");
  if (!target.activa) throw new Error("Activá la lista antes de ponerla default.");
  priceLists = priceLists.map((p) => ({
    ...p,
    esDefault: p.id === id,
  }));
  syncProductDefaultPrices();
  return getPriceList(id)!;
}

function syncProductDefaultPrices() {
  const def = getDefaultPriceListId();
  products = products.map((p) => ({
    ...p,
    precio: p.precios[def] ?? p.precio,
  }));
}

export function listProducts() {
  return [...products].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function upsertProduct(
  input: Omit<Product, "id"> & { id?: string }
): Product {
  if (!input.nombre.trim()) throw new Error("El nombre es obligatorio.");
  if (!input.sku.trim()) throw new Error("El SKU es obligatorio.");

  const def = getDefaultPriceListId();
  const precios = { ...(input.precios ?? {}) };
  const lists = listPriceLists();
  for (const pl of lists) {
    if (precios[pl.id] == null) {
      precios[pl.id] = input.precio ?? 0;
    }
    if (precios[pl.id]! < 0) throw new Error("Precio inválido.");
  }
  const precio = precios[def] ?? input.precio ?? 0;

  if (input.id) {
    const idx = products.findIndex((p) => p.id === input.id);
    if (idx < 0) throw new Error("Producto no encontrado.");
    const updated: Product = {
      ...products[idx],
      ...input,
      id: input.id,
      precio,
      precios,
      descripcion: input.descripcion.trim(),
      sku: input.sku.trim().toUpperCase(),
      nombre: input.nombre.trim(),
    };
    products = [...products];
    products[idx] = updated;
    return updated;
  }

  const product: Product = {
    id: nextId("p"),
    sku: input.sku.trim().toUpperCase(),
    nombre: input.nombre.trim(),
    categoria: input.categoria,
    precio,
    precios,
    costo: input.costo,
    stock: input.stock,
    activo: input.activo,
    descripcion: input.descripcion.trim(),
  };
  products = [product, ...products];
  return product;
}

export function listClients() {
  return [...clients].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function upsertClient(
  input: Omit<Client, "id"> & { id?: string }
): Client {
  if (!input.nombre.trim()) throw new Error("El nombre es obligatorio.");
  const priceListId =
    input.priceListId && getPriceList(input.priceListId)
      ? input.priceListId
      : null;

  if (input.id) {
    const idx = clients.findIndex((c) => c.id === input.id);
    if (idx < 0) throw new Error("Cliente no encontrado.");
    const updated: Client = {
      ...clients[idx],
      ...input,
      id: input.id,
      priceListId,
      nombre: input.nombre.trim(),
      email: input.email.trim(),
      telefono: input.telefono.trim(),
      direccion: (input.direccion ?? "").trim(),
      rfc: input.rfc.trim().toUpperCase(),
      notas: input.notas.trim(),
    };
    clients = [...clients];
    clients[idx] = updated;
    return updated;
  }
  const client: Client = {
    id: nextId("c"),
    nombre: input.nombre.trim(),
    email: input.email.trim(),
    telefono: input.telefono.trim(),
    direccion: (input.direccion ?? "").trim(),
    rfc: input.rfc.trim().toUpperCase(),
    notas: input.notas.trim(),
    priceListId,
  };
  clients = [client, ...clients];
  return client;
}

export function resolveClientPriceListId(
  clientId: string | null | undefined
): string {
  if (clientId) {
    const c = clients.find((x) => x.id === clientId);
    if (c?.priceListId && getPriceList(c.priceListId)?.activa) {
      return c.priceListId;
    }
  }
  return getDefaultPriceListId();
}

export function listOrders() {
  return [...orders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export type PosSaleOptions = {
  clientId?: string | null;
  priceListId?: string | null;
  conEnvio?: boolean;
  envioCosto?: number;
  direccionEnvio?: string;
  telefonoContacto?: string;
  metodoPago?: Order["metodoPago"];
};

export function addPosSale(
  lines: Order["lines"],
  options: PosSaleOptions = {}
): Order {
  if (!lines.length) throw new Error("Agregá al menos un producto.");
  const clientId = options.clientId ?? null;
  const client = clientId ? clients.find((c) => c.id === clientId) : null;
  const listId =
    options.priceListId ||
    resolveClientPriceListId(clientId) ||
    getDefaultPriceListId();
  const conEnvio = Boolean(options.conEnvio);
  const envioCosto = conEnvio
    ? Math.max(0, Number(options.envioCosto) || 0)
    : 0;
  const direccionEnvio = conEnvio
    ? (options.direccionEnvio ?? client?.direccion ?? "").trim() || null
    : null;
  const telefonoContacto = conEnvio
    ? (options.telefonoContacto ?? client?.telefono ?? "").trim() || null
    : null;
  const metodoPago = options.metodoPago ?? null;

  if (conEnvio) {
    if (!client && !(options.direccionEnvio ?? "").trim()) {
      throw new Error("Para envío indicá cliente o dirección de entrega.");
    }
    if (!direccionEnvio) {
      throw new Error("La dirección de envío es obligatoria.");
    }
    if (!telefonoContacto) {
      throw new Error("El teléfono de contacto es obligatorio para envío.");
    }
  }
  if (!metodoPago) {
    throw new Error("Elegí método de pago: efectivo o transferencia.");
  }

  const order: Order = {
    id: nextId("o"),
    folio: `POS-${200 + seq}`,
    clientId: client?.id ?? null,
    clienteNombre: client?.nombre ?? "Mostrador",
    status: conEnvio ? "preparando" : "entregado",
    canal: "pos",
    createdAt: new Date().toISOString(),
    priceListId: listId,
    lines,
    conEnvio,
    envioCosto,
    direccionEnvio,
    telefonoContacto,
    metodoPago,
  };
  for (const line of lines) {
    const p = products.find((x) => x.id === line.productId);
    if (p) {
      p.stock = Math.max(0, p.stock - line.cantidad);
    }
  }
  products = [...products];
  orders = [order, ...orders];
  return order;
}

export function addPedido(
  clientId: string,
  lines: Order["lines"]
): Order {
  if (!clientId) throw new Error("Elegí un cliente.");
  if (!lines.length) throw new Error("Agregá líneas al pedido.");
  const client = clients.find((c) => c.id === clientId);
  if (!client) throw new Error("Cliente no encontrado.");
  const listId = resolveClientPriceListId(clientId);
  const order: Order = {
    id: nextId("o"),
    folio: `P-${1000 + seq}`,
    clientId: client.id,
    clienteNombre: client.nombre,
    status: "confirmado",
    canal: "pedido",
    createdAt: new Date().toISOString(),
    priceListId: listId,
    lines,
    ...emptyEnvio,
  };
  orders = [order, ...orders];
  return order;
}

/** Pedido forzado a lista mayorista (módulo Mayorista). */
export function addMayoristaPedido(
  clientId: string,
  lines: Order["lines"]
): Order {
  if (!clientId) throw new Error("Elegí un cliente.");
  if (!lines.length) throw new Error("Agregá líneas al pedido.");
  const client = clients.find((c) => c.id === clientId);
  if (!client) throw new Error("Cliente no encontrado.");
  const mayorista = priceLists.find(
    (p) => p.id === PRICE_LIST_MAYORISTA && p.activa
  );
  if (!mayorista) {
    throw new Error(
      "No hay lista Mayorista activa. Creala o activala en Configuración."
    );
  }
  // Validar que las líneas usan precio mayorista
  const normalized = lines.map((l) => {
    const p = products.find((x) => x.id === l.productId);
    const unit = p ? productPrice(p, PRICE_LIST_MAYORISTA) : l.precioUnitario;
    return { ...l, precioUnitario: unit };
  });
  for (const line of normalized) {
    const p = products.find((x) => x.id === line.productId);
    if (p) p.stock = Math.max(0, p.stock - line.cantidad);
  }
  products = [...products];
  const order: Order = {
    id: nextId("o"),
    folio: `M-${2000 + seq}`,
    clientId: client.id,
    clienteNombre: client.nombre,
    status: "confirmado",
    canal: "mayorista",
    createdAt: new Date().toISOString(),
    priceListId: PRICE_LIST_MAYORISTA,
    lines: normalized,
    ...emptyEnvio,
  };
  orders = [order, ...orders];
  return order;
}

export function getOrder(id: string): Order | undefined {
  return orders.find((o) => o.id === id);
}

export function listMayoristaOrders(): Order[] {
  return listOrders().filter((o) => o.canal === "mayorista");
}

export { productPrice };

export function dashboardStats(todayIso?: string) {
  const day = todayIso ?? "2026-10-27";
  const ventasHoy = orders
    .filter(
      (o) =>
        o.createdAt.startsWith(day) &&
        o.status !== "cancelado" &&
        o.status !== "borrador"
    )
    .reduce((acc, o) => acc + orderTotal(o), 0);
  const stockBajo = products.filter((p) => p.activo && p.stock <= 20).length;
  return {
    productos: products.filter((p) => p.activo).length,
    clientes: clients.length,
    pedidosAbiertos: orders.filter(
      (o) => o.status === "confirmado" || o.status === "preparando"
    ).length,
    ventasHoy,
    stockBajo,
  };
}

let branches: Branch[] = [
  {
    id: "br_central",
    codigo: "central",
    nombre: "Casa central",
    direccion: "",
    activa: true,
    esDefault: true,
  },
];

let channelConfigs: ChannelConfig[] = [
  {
    channel: "woocommerce",
    enabled: false,
    storeUrl: null,
    consumerKey: null,
    consumerSecretSet: false,
    consumerSecretMasked: null,
    accessTokenSet: false,
    accessTokenMasked: null,
    sellerId: null,
    siteId: "MLA",
    priceListId: null,
    stockMode: "total",
    stockBranchId: null,
    lastSyncAt: null,
    configured: false,
  },
  {
    channel: "mercadolibre",
    enabled: false,
    storeUrl: null,
    consumerKey: null,
    consumerSecretSet: false,
    consumerSecretMasked: null,
    accessTokenSet: false,
    accessTokenMasked: null,
    sellerId: null,
    siteId: "MLA",
    priceListId: null,
    stockMode: "total",
    stockBranchId: null,
    lastSyncAt: null,
    configured: false,
  },
];

const productLinks = new Map<string, ChannelLink[]>();

export function listBranches(onlyActive = false): Branch[] {
  return onlyActive ? branches.filter((b) => b.activa) : [...branches];
}

export function upsertBranch(input: {
  id?: string;
  codigo: string;
  nombre: string;
  direccion?: string;
  activa?: boolean;
  esDefault?: boolean;
}): Branch {
  if (input.esDefault) {
    branches = branches.map((b) => ({ ...b, esDefault: false }));
  }
  if (input.id) {
    const idx = branches.findIndex((b) => b.id === input.id);
    if (idx < 0) throw new Error("Sucursal no encontrada.");
    const next: Branch = {
      ...branches[idx],
      codigo: input.codigo,
      nombre: input.nombre,
      direccion: input.direccion ?? "",
      activa: input.activa ?? true,
      esDefault: input.esDefault ?? branches[idx].esDefault,
    };
    branches[idx] = next;
    return next;
  }
  const created: Branch = {
    id: `br_${Date.now()}`,
    codigo: input.codigo,
    nombre: input.nombre,
    direccion: input.direccion ?? "",
    activa: input.activa ?? true,
    esDefault: Boolean(input.esDefault),
  };
  branches = [...branches, created];
  return created;
}

export function setDefaultBranch(id: string): Branch {
  branches = branches.map((b) => ({
    ...b,
    esDefault: b.id === id,
    activa: b.id === id ? true : b.activa,
  }));
  const found = branches.find((b) => b.id === id);
  if (!found) throw new Error("Sucursal no encontrada.");
  return found;
}

export function listChannels(): ChannelConfig[] {
  return channelConfigs.map((c) => ({ ...c }));
}

export function saveChannel(
  channel: Channel,
  body: {
    enabled?: boolean;
    storeUrl?: string | null;
    consumerKey?: string | null;
    consumerSecret?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    sellerId?: string | null;
    siteId?: string | null;
    priceListId?: string | null;
    stockMode?: StockMode;
    stockBranchId?: string | null;
  }
): ChannelConfig {
  channelConfigs = channelConfigs.map((c) => {
    if (c.channel !== channel) return c;
    const next: ChannelConfig = {
      ...c,
      enabled: body.enabled ?? c.enabled,
      storeUrl: body.storeUrl !== undefined ? body.storeUrl : c.storeUrl,
      consumerKey:
        body.consumerKey !== undefined ? body.consumerKey : c.consumerKey,
      consumerSecretSet: body.consumerSecret
        ? true
        : c.consumerSecretSet,
      accessTokenSet: body.accessToken ? true : c.accessTokenSet,
      sellerId: body.sellerId !== undefined ? body.sellerId : c.sellerId,
      siteId: body.siteId ?? c.siteId,
      priceListId:
        body.priceListId !== undefined ? body.priceListId : c.priceListId,
      stockMode: body.stockMode ?? c.stockMode,
      stockBranchId:
        body.stockBranchId !== undefined
          ? body.stockBranchId
          : c.stockBranchId,
    };
    next.configured =
      channel === "woocommerce"
        ? Boolean(next.storeUrl && next.consumerKey && next.consumerSecretSet)
        : next.accessTokenSet;
    return next;
  });
  return channelConfigs.find((c) => c.channel === channel)!;
}

export function upsertProductChannelLink(
  productId: string,
  channel: Channel,
  body: { externalId: string; externalSku?: string; syncEnabled?: boolean }
): ChannelLink {
  const link: ChannelLink = {
    productId,
    channel,
    externalId: body.externalId,
    externalSku: body.externalSku ?? "",
    syncEnabled: body.syncEnabled !== false,
    lastSyncedAt: null,
    lastError: null,
  };
  const prev = (productLinks.get(productId) ?? []).filter(
    (l) => l.channel !== channel
  );
  productLinks.set(productId, [...prev, link]);
  return link;
}

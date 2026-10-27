/**
 * Store en memoria (gold template). La API Aurix lo reemplazará.
 */
import type { Client, Order, Product } from "@/lib/types";

const PRODUCTS: Product[] = [
  {
    id: "p1",
    sku: "BEB-001",
    nombre: "Agua mineral 600ml",
    categoria: "bebidas",
    precio: 18,
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
    precio: 22,
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
    precio: 45,
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
    precio: 95,
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
    precio: 68,
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
    precio: 35,
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
    rfc: "LOMA850101XXX",
    notas: "Cliente frecuente.",
  },
  {
    id: "c2",
    nombre: "Comercial del Valle SA",
    email: "compras@valle.mx",
    telefono: "55 9876 5432",
    rfc: "CVA920215ABC",
    notas: "Factura a mes vencido.",
  },
  {
    id: "c3",
    nombre: "Juan Pérez",
    email: "juan.perez@mail.com",
    telefono: "33 2222 1111",
    rfc: "",
    notas: "",
  },
];

const ORDERS: Order[] = [
  {
    id: "o1",
    folio: "P-1001",
    clientId: "c1",
    clienteNombre: "María López",
    status: "entregado",
    canal: "pedido",
    createdAt: "2026-10-25T15:20:00.000Z",
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
    lines: [
      {
        productId: "p5",
        nombre: "Detergente 1L",
        cantidad: 10,
        precioUnitario: 68,
      },
    ],
  },
];

let products = structuredClone(PRODUCTS);
let clients = structuredClone(CLIENTS);
let orders = structuredClone(ORDERS);
let seq = 10;

function nextId(prefix: string) {
  seq += 1;
  return `${prefix}${seq}`;
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
  if (input.precio < 0) throw new Error("Precio inválido.");

  if (input.id) {
    const idx = products.findIndex((p) => p.id === input.id);
    if (idx < 0) throw new Error("Producto no encontrado.");
    const updated = { ...products[idx], ...input, id: input.id };
    products = [...products];
    products[idx] = updated;
    return updated;
  }

  const product: Product = {
    id: nextId("p"),
    sku: input.sku.trim().toUpperCase(),
    nombre: input.nombre.trim(),
    categoria: input.categoria,
    precio: input.precio,
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
  if (input.id) {
    const idx = clients.findIndex((c) => c.id === input.id);
    if (idx < 0) throw new Error("Cliente no encontrado.");
    const updated = { ...clients[idx], ...input, id: input.id };
    clients = [...clients];
    clients[idx] = updated;
    return updated;
  }
  const client: Client = {
    id: nextId("c"),
    nombre: input.nombre.trim(),
    email: input.email.trim(),
    telefono: input.telefono.trim(),
    rfc: input.rfc.trim().toUpperCase(),
    notas: input.notas.trim(),
  };
  clients = [client, ...clients];
  return client;
}

export function listOrders() {
  return [...orders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function addPosSale(lines: Order["lines"], clientId: string | null): Order {
  if (!lines.length) throw new Error("Agregá al menos un producto.");
  const client = clientId ? clients.find((c) => c.id === clientId) : null;
  const order: Order = {
    id: nextId("o"),
    folio: `POS-${200 + seq}`,
    clientId: client?.id ?? null,
    clienteNombre: client?.nombre ?? "Mostrador",
    status: "entregado",
    canal: "pos",
    createdAt: new Date().toISOString(),
    lines,
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
  const order: Order = {
    id: nextId("o"),
    folio: `P-${1000 + seq}`,
    clientId: client.id,
    clienteNombre: client.nombre,
    status: "confirmado",
    canal: "pedido",
    createdAt: new Date().toISOString(),
    lines,
  };
  orders = [order, ...orders];
  return order;
}

export function dashboardStats(todayIso?: string) {
  const day =
    todayIso ??
    // Fallback estático para prerender; el cliente puede pasar la fecha real.
    "2026-10-27";
  const ventasHoy = orders
    .filter(
      (o) =>
        o.createdAt.startsWith(day) &&
        o.status !== "cancelado" &&
        o.status !== "borrador"
    )
    .reduce(
      (acc, o) =>
        acc +
        o.lines.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0),
      0
    );
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

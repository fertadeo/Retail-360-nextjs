import { apiUrl } from "@/lib/api-config";
import type {
  Branch,
  Channel,
  ChannelConfig,
  ChannelLink,
  Client,
  Order,
  OrderLine,
  PaymentMethod,
  PriceList,
  Product,
  ProductCategory,
  StockMode,
} from "@/lib/types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: text };
    }
  }
  if (!res.ok) {
    const msg =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Error HTTP ${res.status}`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export const api = {
  health: () =>
    request<{ ok: boolean; db: boolean }>("/health"),

  dashboardStats: (day?: string) =>
    request<{
      productos: number;
      clientes: number;
      pedidosAbiertos: number;
      ventasHoy: number;
      stockBajo: number;
    }>(day ? `/dashboard/stats?day=${encodeURIComponent(day)}` : "/dashboard/stats"),

  listPriceLists: (onlyActive = false) =>
    request<PriceList[]>(
      onlyActive ? "/price-lists?active=1" : "/price-lists"
    ),

  createPriceList: (body: {
    nombre: string;
    codigo?: string;
    activa?: boolean;
    esDefault?: boolean;
  }) =>
    request<PriceList>("/price-lists", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updatePriceList: (
    id: string,
    body: Partial<{
      nombre: string;
      codigo: string;
      activa: boolean;
      esDefault: boolean;
    }>
  ) =>
    request<PriceList>(`/price-lists/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  setDefaultPriceList: (id: string) =>
    request<PriceList>(`/price-lists/${id}/set-default`, {
      method: "POST",
    }),

  listProducts: () => request<Product[]>("/products"),

  getProduct: (id: string) => request<Product>(`/products/${id}`),

  createProduct: (body: {
    sku: string;
    nombre: string;
    categoria: ProductCategory;
    costo: number;
    stock: number;
    activo?: boolean;
    descripcion?: string;
    precios: Record<string, number>;
  }) =>
    request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateProduct: (
    id: string,
    body: {
      sku: string;
      nombre: string;
      categoria: ProductCategory;
      costo: number;
      stock: number;
      activo?: boolean;
      descripcion?: string;
      precios: Record<string, number>;
    }
  ) =>
    request<Product>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  listClients: () => request<Client[]>("/clients"),

  createClient: (body: Omit<Client, "id">) =>
    request<Client>("/clients", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateClient: (id: string, body: Omit<Client, "id">) =>
    request<Client>(`/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  listOrders: (canal?: "pos" | "pedido" | "mayorista") =>
    request<Order[]>(
      canal ? `/orders?canal=${canal}` : "/orders"
    ),

  getOrder: (id: string) => request<Order>(`/orders/${id}`),

  createPedido: (clientId: string, lines: OrderLine[]) =>
    request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify({ clientId, lines }),
    }),

  posCheckout: (body: {
    lines: OrderLine[];
    clientId?: string | null;
    priceListId?: string | null;
    conEnvio?: boolean;
    envioCosto?: number;
    direccionEnvio?: string;
    telefonoContacto?: string;
    metodoPago: PaymentMethod;
  }) =>
    request<Order>("/pos/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listWholesaleOrders: () => request<Order[]>("/wholesale/orders"),

  createWholesaleOrder: (clientId: string, lines: OrderLine[]) =>
    request<Order>("/wholesale/orders", {
      method: "POST",
      body: JSON.stringify({ clientId, lines }),
    }),

  listBranches: (onlyActive = false) =>
    request<Branch[]>(
      onlyActive ? "/branches?active=1" : "/branches"
    ),

  createBranch: (body: {
    codigo: string;
    nombre: string;
    direccion?: string;
    activa?: boolean;
    esDefault?: boolean;
  }) =>
    request<Branch>("/branches", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateBranch: (
    id: string,
    body: {
      codigo: string;
      nombre: string;
      direccion?: string;
      activa?: boolean;
      esDefault?: boolean;
    }
  ) =>
    request<Branch>(`/branches/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  setDefaultBranch: (id: string) =>
    request<Branch>(`/branches/${id}/set-default`, { method: "POST" }),

  listChannels: () => request<ChannelConfig[]>("/channels"),

  getChannel: (channel: Channel) =>
    request<ChannelConfig>(`/channels/${channel}`),

  saveChannel: (
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
  ) =>
    request<ChannelConfig>(`/channels/${channel}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  upsertProductChannelLink: (
    productId: string,
    channel: Channel,
    body: { externalId: string; externalSku?: string; syncEnabled?: boolean }
  ) =>
    request<ChannelLink>(`/products/${productId}/channels/${channel}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteProductChannelLink: (productId: string, channel: Channel) =>
    request<void>(`/products/${productId}/channels/${channel}`, {
      method: "DELETE",
    }),

  pushWooProduct: (
    productId: string,
    mode: "stock" | "price" | "both" | "full" = "both"
  ) =>
    request<{ externalId: string; stock: number; price: number }>(
      `/channels/woocommerce/products/${productId}/push`,
      { method: "POST", body: JSON.stringify({ mode }) }
    ),

  pushWooAll: (mode: "stock" | "price" | "both" | "full" = "both") =>
    request<{ results: Array<{ productId: string; ok: boolean; error?: string }> }>(
      "/channels/woocommerce/push-all",
      { method: "POST", body: JSON.stringify({ mode }) }
    ),

  linkWooBySku: () =>
    request<{ linked: number; skipped: number }>(
      "/channels/woocommerce/link-by-sku",
      { method: "POST" }
    ),

  pushMeliProduct: (
    productId: string,
    mode: "stock" | "price" | "both" = "both"
  ) =>
    request<{ externalId: string; stock: number; price: number }>(
      `/channels/mercadolibre/products/${productId}/push`,
      { method: "POST", body: JSON.stringify({ mode }) }
    ),

  pushMeliAll: (mode: "stock" | "price" | "both" = "both") =>
    request<{ results: Array<{ productId: string; ok: boolean; error?: string }> }>(
      "/channels/mercadolibre/push-all",
      { method: "POST", body: JSON.stringify({ mode }) }
    ),
};

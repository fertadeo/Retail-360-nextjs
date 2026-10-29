import { apiUrl } from "@/lib/api-config";
import type {
  Branch,
  Channel,
  ChannelConfig,
  ChannelLink,
  Client,
  Comercio,
  DiscountBasis,
  DiscountMode,
  DiscountRule,
  DiscountTier,
  Order,
  OrderLine,
  PaymentMethod,
  PriceList,
  Product,
  ProductCategory,
  Quote,
  QuoteStatus,
  StockMode,
  StockShareGroup,
  StockShareMode,
} from "@/lib/types";

export type QuotePayload = {
  clientId?: string | null;
  clienteNombre?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  priceListId?: string | null;
  discountRuleId?: string | null;
  discountMode?: DiscountMode;
  discountBasis?: DiscountBasis;
  tiers?: DiscountTier[];
  descuentoManualPct?: number;
  status?: QuoteStatus;
  validezDias?: number;
  notas?: string;
  lines: Array<{
    productId?: string | null;
    sku?: string;
    nombre?: string;
    cantidad: number;
    precioUnitario?: number;
    lineDescuentoPct?: number;
  }>;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function activeComercioHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const id = localStorage.getItem("retail360.comercioId");
  return id ? { "X-Comercio-Id": id } : {};
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
      ...activeComercioHeader(),
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

  listComercios: (onlyActive = false) =>
    request<Comercio[]>(
      onlyActive ? "/comercios?active=1" : "/comercios"
    ),

  createComercio: (body: {
    codigo: string;
    nombre: string;
    rubro?: string;
    direccion?: string;
    activa?: boolean;
    esDefault?: boolean;
  }) =>
    request<Comercio>("/comercios", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateComercio: (
    id: string,
    body: {
      codigo: string;
      nombre: string;
      rubro?: string;
      direccion?: string;
      activa?: boolean;
      esDefault?: boolean;
    }
  ) =>
    request<Comercio>(`/comercios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  setDefaultComercio: (id: string) =>
    request<Comercio>(`/comercios/${id}/set-default`, { method: "POST" }),

  listStockShareGroups: () =>
    request<StockShareGroup[]>("/stock-share-groups"),

  upsertStockShareGroup: (body: {
    id?: string;
    nombre: string;
    modo: StockShareMode;
    activa?: boolean;
    comercioIds: string[];
  }) =>
    body.id
      ? request<StockShareGroup>(`/stock-share-groups/${body.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        })
      : request<StockShareGroup>("/stock-share-groups", {
          method: "POST",
          body: JSON.stringify(body),
        }),

  deleteStockShareGroup: (id: string) =>
    request<void>(`/stock-share-groups/${id}`, { method: "DELETE" }),

  transferStock: (body: {
    fromComercioId: string;
    toComercioId: string;
    sku: string;
    quantity: number;
  }) =>
    request<{ fromStock: number; toStock: number }>("/stock/transfer", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listDiscountRules: (onlyActive = false) =>
    request<DiscountRule[]>(
      onlyActive ? "/discount-rules?active=1" : "/discount-rules"
    ),

  upsertDiscountRule: (body: {
    id?: string;
    nombre: string;
    descripcion?: string;
    basis?: DiscountBasis;
    priceListId?: string | null;
    activa?: boolean;
    tiers: DiscountTier[];
  }) =>
    body.id
      ? request<DiscountRule>(`/discount-rules/${body.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        })
      : request<DiscountRule>("/discount-rules", {
          method: "POST",
          body: JSON.stringify(body),
        }),

  deleteDiscountRule: (id: string) =>
    request<void>(`/discount-rules/${id}`, { method: "DELETE" }),

  listQuotes: (status?: QuoteStatus) =>
    request<Quote[]>(
      status ? `/quotes?status=${encodeURIComponent(status)}` : "/quotes"
    ),

  getQuote: (id: string) => request<Quote>(`/quotes/${id}`),

  previewQuote: (body: QuotePayload) =>
    request<{
      lines: Quote["lines"];
      subtotal: number;
      descuentoPctAplicado: number;
      descuentoMonto: number;
      total: number;
      tiers: DiscountTier[];
    }>("/quotes/preview", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createQuote: (body: QuotePayload) =>
    request<Quote>("/quotes", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateQuote: (id: string, body: QuotePayload) =>
    request<Quote>(`/quotes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  setQuoteStatus: (id: string, status: QuoteStatus) =>
    request<Quote>(`/quotes/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  deleteQuote: (id: string) =>
    request<void>(`/quotes/${id}`, { method: "DELETE" }),

  listMedia: (params?: { kind?: "image" | "attachment" | "all"; q?: string }) => {
    const sp = new URLSearchParams();
    if (params?.kind && params.kind !== "all") sp.set("kind", params.kind);
    if (params?.q) sp.set("q", params.q);
    const qs = sp.toString();
    return request<{
      items: import("@/lib/media-library").MediaLibraryItem[];
      counts: import("@/lib/media-library").MediaLibraryCounts;
    }>(`/media${qs ? `?${qs}` : ""}`);
  },

  createMedia: (body: {
    productId?: string | null;
    kind?: "image" | "attachment";
    filename: string;
    mime: string;
    sizeBytes: number;
    dataUrl: string | null;
    title?: string;
  }) =>
    request<import("@/lib/media-library").MediaLibraryItem>("/media", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteMedia: (id: string) =>
    request<void>(`/media/${id}`, { method: "DELETE" }),
};

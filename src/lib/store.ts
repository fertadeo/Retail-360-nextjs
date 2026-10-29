/**
 * Capa de datos del gold.
 * Con NEXT_PUBLIC_API_URL → API remota.
 * Sin env → memory-store (demo local).
 */
import { api } from "@/lib/api-client";
import { isApiMode } from "@/lib/api-config";
import * as memory from "@/lib/memory-store";
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

export {
  PRICE_LIST_MAYORISTA,
  PRICE_LIST_MINORISTA,
} from "@/lib/memory-store";

export type { PosSaleOptions } from "@/lib/memory-store";
export { productPrice } from "@/lib/types";

export function usingRemoteApi(): boolean {
  return isApiMode();
}

export async function listPriceLists(
  onlyActive = false
): Promise<PriceList[]> {
  if (!isApiMode()) return memory.listPriceLists(onlyActive);
  return api.listPriceLists(onlyActive);
}

export async function getPriceList(
  id: string
): Promise<PriceList | undefined> {
  if (!isApiMode()) return memory.getPriceList(id);
  const lists = await api.listPriceLists(false);
  return lists.find((p) => p.id === id);
}

export async function getDefaultPriceListId(): Promise<string> {
  if (!isApiMode()) return memory.getDefaultPriceListId();
  const lists = await api.listPriceLists(true);
  return (
    lists.find((p) => p.esDefault)?.id ??
    lists[0]?.id ??
    memory.PRICE_LIST_MINORISTA
  );
}

export async function upsertPriceList(input: {
  id?: string;
  nombre: string;
  codigo?: string;
  activa?: boolean;
  esDefault?: boolean;
}): Promise<PriceList> {
  if (!isApiMode()) return memory.upsertPriceList(input);
  if (input.id) {
    return api.updatePriceList(input.id, {
      nombre: input.nombre,
      codigo: input.codigo,
      activa: input.activa,
      esDefault: input.esDefault,
    });
  }
  return api.createPriceList(input);
}

export async function setDefaultPriceList(id: string): Promise<PriceList> {
  if (!isApiMode()) return memory.setDefaultPriceList(id);
  return api.setDefaultPriceList(id);
}

export async function listProducts(): Promise<Product[]> {
  if (!isApiMode()) return memory.listProducts();
  return api.listProducts();
}

export async function getProduct(
  id: string
): Promise<Product | undefined> {
  if (!isApiMode()) return memory.getProduct(id);
  try {
    return await api.getProduct(id);
  } catch {
    return undefined;
  }
}

export async function upsertProduct(
  input: Omit<Product, "id"> & { id?: string }
): Promise<Product> {
  if (!isApiMode()) return memory.upsertProduct(input);
  const body = {
    sku: input.sku,
    nombre: input.nombre,
    categoria: input.categoria,
    costo: input.costo,
    stock: input.stock,
    activo: input.activo,
    descripcion: input.descripcion,
    precios: input.precios,
  };
  if (input.id) return api.updateProduct(input.id, body);
  return api.createProduct(body);
}

export async function listClients(): Promise<Client[]> {
  if (!isApiMode()) return memory.listClients();
  return api.listClients();
}

export async function upsertClient(
  input: Omit<Client, "id"> & { id?: string }
): Promise<Client> {
  if (!isApiMode()) return memory.upsertClient(input);
  const body = {
    nombre: input.nombre,
    email: input.email,
    telefono: input.telefono,
    direccion: input.direccion,
    rfc: input.rfc,
    notas: input.notas,
    priceListId: input.priceListId,
  };
  if (input.id) return api.updateClient(input.id, body);
  return api.createClient(body);
}

export async function resolveClientPriceListId(
  clientId: string | null | undefined
): Promise<string> {
  if (!isApiMode()) return memory.resolveClientPriceListId(clientId);
  if (clientId) {
    const clients = await api.listClients();
    const c = clients.find((x) => x.id === clientId);
    if (c?.priceListId) {
      const list = await getPriceList(c.priceListId);
      if (list?.activa) return list.id;
    }
  }
  return getDefaultPriceListId();
}

export async function listOrders(
  canal?: "pos" | "pedido" | "mayorista"
): Promise<Order[]> {
  if (!isApiMode()) {
    const all = memory.listOrders();
    return canal ? all.filter((o) => o.canal === canal) : all;
  }
  return api.listOrders(canal);
}

export async function getOrder(id: string): Promise<Order | undefined> {
  if (!isApiMode()) return memory.getOrder(id);
  try {
    return await api.getOrder(id);
  } catch {
    return undefined;
  }
}

export async function addPosSale(
  lines: Order["lines"],
  options: memory.PosSaleOptions = {}
): Promise<Order> {
  if (!isApiMode()) return memory.addPosSale(lines, options);
  if (!options.metodoPago) {
    throw new Error("Elegí método de pago: efectivo o transferencia.");
  }
  return api.posCheckout({
    lines,
    clientId: options.clientId,
    priceListId: options.priceListId,
    conEnvio: options.conEnvio,
    envioCosto: options.envioCosto,
    direccionEnvio: options.direccionEnvio,
    telefonoContacto: options.telefonoContacto,
    metodoPago: options.metodoPago,
  });
}

export async function addPedido(
  clientId: string,
  lines: Order["lines"]
): Promise<Order> {
  if (!isApiMode()) return memory.addPedido(clientId, lines);
  return api.createPedido(clientId, lines);
}

export async function addMayoristaPedido(
  clientId: string,
  lines: Order["lines"]
): Promise<Order> {
  if (!isApiMode()) return memory.addMayoristaPedido(clientId, lines);
  return api.createWholesaleOrder(clientId, lines);
}

export async function listMayoristaOrders(): Promise<Order[]> {
  if (!isApiMode()) return memory.listMayoristaOrders();
  return api.listWholesaleOrders();
}

export async function dashboardStats(todayIso?: string) {
  if (!isApiMode()) return memory.dashboardStats(todayIso);
  return api.dashboardStats(todayIso);
}

export async function listBranches(onlyActive = false): Promise<Branch[]> {
  if (!isApiMode()) return memory.listBranches(onlyActive);
  return api.listBranches(onlyActive);
}

export async function upsertBranch(input: {
  id?: string;
  codigo: string;
  nombre: string;
  direccion?: string;
  activa?: boolean;
  esDefault?: boolean;
}): Promise<Branch> {
  if (!isApiMode()) return memory.upsertBranch(input);
  if (input.id) {
    return api.updateBranch(input.id, {
      codigo: input.codigo,
      nombre: input.nombre,
      direccion: input.direccion,
      activa: input.activa,
      esDefault: input.esDefault,
    });
  }
  return api.createBranch(input);
}

export async function setDefaultBranch(id: string): Promise<Branch> {
  if (!isApiMode()) return memory.setDefaultBranch(id);
  return api.setDefaultBranch(id);
}

export async function listChannels(): Promise<ChannelConfig[]> {
  if (!isApiMode()) return memory.listChannels();
  return api.listChannels();
}

export async function saveChannel(
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
): Promise<ChannelConfig> {
  if (!isApiMode()) return memory.saveChannel(channel, body);
  return api.saveChannel(channel, body);
}

export async function upsertProductChannelLink(
  productId: string,
  channel: Channel,
  body: { externalId: string; externalSku?: string; syncEnabled?: boolean }
): Promise<ChannelLink> {
  if (!isApiMode()) {
    return memory.upsertProductChannelLink(productId, channel, body);
  }
  return api.upsertProductChannelLink(productId, channel, body);
}

export async function pushWooProduct(
  productId: string,
  mode: "stock" | "price" | "both" | "full" = "both"
) {
  if (!isApiMode()) throw new Error("Sync requiere API remota.");
  return api.pushWooProduct(productId, mode);
}

export async function pushMeliProduct(
  productId: string,
  mode: "stock" | "price" | "both" = "both"
) {
  if (!isApiMode()) throw new Error("Sync requiere API remota.");
  return api.pushMeliProduct(productId, mode);
}

export async function linkWooBySku() {
  if (!isApiMode()) throw new Error("Sync requiere API remota.");
  return api.linkWooBySku();
}

export async function pushWooAll(
  mode: "stock" | "price" | "both" | "full" = "both"
) {
  if (!isApiMode()) throw new Error("Sync requiere API remota.");
  return api.pushWooAll(mode);
}

export async function pushMeliAll(mode: "stock" | "price" | "both" = "both") {
  if (!isApiMode()) throw new Error("Sync requiere API remota.");
  return api.pushMeliAll(mode);
}

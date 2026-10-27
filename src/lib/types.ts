export type ProductCategory =
  | "bebidas"
  | "alimentos"
  | "limpieza"
  | "otros";

/** Lista de precios diferenciada (minorista, mayorista, custom…). */
export type PriceList = {
  id: string;
  nombre: string;
  codigo: string;
  activa: boolean;
  /** Una sola lista default para catálogo / POS sin cliente. */
  esDefault: boolean;
};

export type Product = {
  id: string;
  sku: string;
  nombre: string;
  categoria: ProductCategory;
  /** Precio de la lista default (atajo / compat). */
  precio: number;
  /** Precio por lista: priceListId → monto. */
  precios: Record<string, number>;
  costo: number;
  stock: number;
  activo: boolean;
  descripcion: string;
};

export type PaymentMethod = "efectivo" | "transferencia";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export type Client = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  /** Dirección de entrega / domicilio. */
  direccion: string;
  rfc: string;
  notas: string;
  /** Lista de precios asignada; null = default del sistema. */
  priceListId: string | null;
};

export type OrderStatus =
  | "borrador"
  | "confirmado"
  | "preparando"
  | "entregado"
  | "cancelado";

export type OrderLine = {
  productId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

export type Order = {
  id: string;
  folio: string;
  clientId: string | null;
  clienteNombre: string;
  status: OrderStatus;
  lines: OrderLine[];
  createdAt: string;
  canal: "pos" | "pedido" | "mayorista";
  priceListId: string | null;
  /** Pedido POS (u otro) con entrega a domicilio. */
  conEnvio: boolean;
  envioCosto: number;
  direccionEnvio: string | null;
  telefonoContacto: string | null;
  metodoPago: PaymentMethod | null;
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  bebidas: "Bebidas",
  alimentos: "Alimentos",
  limpieza: "Limpieza",
  otros: "Otros",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  borrador: "Borrador",
  confirmado: "Confirmado",
  preparando: "Preparando",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function orderSubtotal(order: Order): number {
  return order.lines.reduce(
    (acc, l) => acc + l.cantidad * l.precioUnitario,
    0
  );
}

export function orderTotal(order: Order): number {
  return orderSubtotal(order) + (order.conEnvio ? order.envioCosto : 0);
}

export function productPrice(
  product: Product,
  priceListId: string | null | undefined
): number {
  if (priceListId && product.precios[priceListId] != null) {
    return product.precios[priceListId];
  }
  return product.precio;
}

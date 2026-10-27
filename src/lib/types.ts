export type ProductCategory =
  | "bebidas"
  | "alimentos"
  | "limpieza"
  | "otros";

export type Product = {
  id: string;
  sku: string;
  nombre: string;
  categoria: ProductCategory;
  precio: number;
  costo: number;
  stock: number;
  activo: boolean;
  descripcion: string;
};

export type Client = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rfc: string;
  notas: string;
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
  canal: "pos" | "pedido";
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

export function orderTotal(order: Order): number {
  return order.lines.reduce(
    (acc, l) => acc + l.cantidad * l.precioUnitario,
    0
  );
}

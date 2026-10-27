import { jsPDF } from "jspdf";
import { AURIX_BRAND, aurixLogoDataUrl } from "@/lib/brand";
import type { Client, Order } from "@/lib/types";
import { ORDER_STATUS_LABELS, orderTotal } from "@/lib/types";
import { formatMxn } from "@/lib/utils";

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export type BoletaInput = {
  order: Order;
  client: Client | null;
  /** Título del documento */
  title?: string;
};

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

/**
 * Boleta de compra PDF — estética plantilla Aurix.
 * Luego cada negocio cambia logo / colores / razón social.
 */
export function downloadBoletaPdf(input: BoletaInput): void {
  const { order, client } = input;
  const title = input.title ?? "Boleta de compra · Mayorista";
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  const c = AURIX_BRAND.color;
  const charcoal = hexRgb(c.charcoal);
  const teal = hexRgb(c.teal);
  const tealSoft = hexRgb(c.tealSoft);
  const muted = hexRgb(c.muted);
  const line = hexRgb(c.line);
  const paper = hexRgb(c.paper);

  doc.setFillColor(...paper);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");

  doc.setFillColor(...charcoal);
  doc.rect(0, 0, pageW, 28, "F");

  const logo = aurixLogoDataUrl(160);
  if (logo) {
    doc.addImage(logo, "PNG", margin, 6, 16, 16);
  }

  doc.setTextColor(250, 248, 244);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(AURIX_BRAND.name, margin + 20, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 196, 188);
  doc.text(AURIX_BRAND.tagline, margin + 20, 19);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(94, 234, 212);
  doc.text(order.folio, pageW - margin, 13, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 196, 188);
  doc.text(fmtDate(order.createdAt), pageW - margin, 19, { align: "right" });

  let y = 40;
  doc.setTextColor(...charcoal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, margin, y);

  y += 3;
  doc.setDrawColor(...teal);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + 36, y);

  y += 10;
  const colW = (contentW - 6) / 2;
  drawCard(doc, margin, y, colW, 32, line);
  drawCard(doc, margin + colW + 6, y, colW, 32, line);

  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "bold");
  doc.text("EMITIDO POR", margin + 4, y + 6);
  doc.text("CLIENTE", margin + colW + 10, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...charcoal);
  doc.setFontSize(9);
  doc.text(AURIX_BRAND.legalName, margin + 4, y + 12);
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text(AURIX_BRAND.contact.web, margin + 4, y + 18);
  doc.text(AURIX_BRAND.contact.mail, margin + 4, y + 23);

  doc.setTextColor(...charcoal);
  doc.setFontSize(9);
  doc.text(order.clienteNombre, margin + colW + 10, y + 12);
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  if (client) {
    const lines = [
      client.email || null,
      client.telefono || null,
      client.rfc ? `RFC ${client.rfc}` : null,
    ].filter(Boolean) as string[];
    lines.forEach((row, i) => {
      doc.text(row, margin + colW + 10, y + 18 + i * 5);
    });
  } else {
    doc.text("Sin ficha de cliente", margin + colW + 10, y + 18);
  }

  y += 40;
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text("Canal: Mayorista", margin, y);
  doc.text("Lista de precios: Mayorista", margin + 50, y);
  doc.text(
    `Estado: ${ORDER_STATUS_LABELS[order.status]}`,
    margin + 120,
    y
  );

  y += 8;
  const rowH = 8;
  const cols = {
    sku: margin,
    desc: margin + 28,
    qty: margin + 118,
    unit: margin + 138,
    total: margin + 162,
  };

  doc.setFillColor(...tealSoft);
  doc.roundedRect(margin, y, contentW, rowH, 1.2, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...teal);
  doc.text("SKU / ÍTEM", cols.desc, y + 5.2);
  doc.text("CANT.", cols.qty, y + 5.2);
  doc.text("P. UNIT.", cols.unit, y + 5.2);
  doc.text("IMPORTE", cols.total, y + 5.2);

  y += rowH + 1;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...charcoal);

  order.lines.forEach((orderLine, idx) => {
    if (y > 250) {
      doc.addPage();
      doc.setFillColor(...paper);
      doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");
      y = 24;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(245, 242, 236);
      doc.rect(margin, y - 1, contentW, rowH, "F");
    }
    const importe = orderLine.cantidad * orderLine.precioUnitario;
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(String(idx + 1).padStart(2, "0"), cols.sku, y + 4.5);
    doc.setTextColor(...charcoal);
    const nombre =
      orderLine.nombre.length > 42
        ? `${orderLine.nombre.slice(0, 40)}…`
        : orderLine.nombre;
    doc.text(nombre, cols.desc, y + 4.5);
    doc.text(String(orderLine.cantidad), cols.qty + 8, y + 4.5, {
      align: "right",
    });
    doc.text(formatMxn(orderLine.precioUnitario), cols.unit + 18, y + 4.5, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.text(formatMxn(importe), pageW - margin, y + 4.5, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    y += rowH;
  });

  y += 6;
  const total = orderTotal(order);
  doc.setDrawColor(...line);
  doc.setLineWidth(0.3);
  doc.line(margin + contentW * 0.55, y, pageW - margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("Subtotal", margin + contentW * 0.55, y);
  doc.setTextColor(...charcoal);
  doc.text(formatMxn(total), pageW - margin, y, { align: "right" });
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...teal);
  doc.text("Total", margin + contentW * 0.55, y);
  doc.text(formatMxn(total), pageW - margin, y, { align: "right" });

  const footerY = 280;
  doc.setDrawColor(...line);
  doc.line(margin, footerY, pageW - margin, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text(AURIX_BRAND.contact.note, margin, footerY + 5, {
    maxWidth: contentW,
  });
  doc.text(
    `${AURIX_BRAND.name} · ${AURIX_BRAND.contact.web}`,
    pageW - margin,
    footerY + 10,
    { align: "right" }
  );

  doc.save(`boleta-${order.folio}.pdf`);
}

function drawCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  border: [number, number, number]
) {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
}

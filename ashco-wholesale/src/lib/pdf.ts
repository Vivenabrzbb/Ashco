import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatGBP, type Order, type OrderItem } from './types';

const BRAND_ORANGE = rgb(1, 0.376, 0); // #FF6000
const INK = rgb(0.04, 0.04, 0.04);
const GREY = rgb(0.45, 0.45, 0.45);
const WHITE = rgb(1, 1, 1);
const LIGHT_LINE = rgb(0.88, 0.88, 0.88);

export async function generateInvoicePdf(order: Order, items: OrderItem[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 60;

  // --- Top: business name (left) + invoice number (right) --------------
  page.drawText('ASHCO WHOLESALE', { x: margin, y, size: 24, font: bold, color: INK });

  const invoiceLabel = `Invoice ${order.invoice_number}`;
  const invoiceLabelWidth = bold.widthOfTextAtSize(invoiceLabel, 20);
  page.drawText(invoiceLabel, {
    x: width - margin - invoiceLabelWidth,
    y: y + 4,
    size: 20,
    font: bold,
    color: INK,
  });
  const subLabel = 'Order confirmation';
  const subLabelWidth = font.widthOfTextAtSize(subLabel, 10);
  page.drawText(subLabel, {
    x: width - margin - subLabelWidth,
    y: y - 14,
    size: 10,
    font,
    color: GREY,
  });

  y -= 70;

  // --- BILL TO block (left) ----------------------------------------------
  page.drawText('BILL TO', { x: margin, y, size: 9, font: bold, color: INK });
  y -= 16;
  page.drawText(order.customer_name, { x: margin, y, size: 11, font: bold, color: INK });
  y -= 15;
  const addressLines = [order.address_line1, order.address_line2 || '', order.city, order.postcode].filter(
    Boolean
  );
  for (const line of addressLines) {
    page.drawText(line, { x: margin, y, size: 10, font, color: GREY });
    y -= 14;
  }
  page.drawText(order.customer_email, { x: margin, y, size: 10, font, color: GREY });

  // reset y for the banded strip below both blocks
  y -= 40;

  // --- Banded strip: Invoice No / Order date / Delivery to / Total due ---
  const stripHeight = 56;
  const stripY = y - stripHeight;
  const stripWidth = width - margin * 2;
  const colWidth = stripWidth / 4;

  // orange background for first 3 columns
  page.drawRectangle({
    x: margin,
    y: stripY,
    width: colWidth * 3,
    height: stripHeight,
    color: BRAND_ORANGE,
  });
  // dark background for the total column
  page.drawRectangle({
    x: margin + colWidth * 3,
    y: stripY,
    width: colWidth,
    height: stripHeight,
    color: INK,
  });

  function stripCell(label: string, value: string, colIndex: number, valueColor = WHITE) {
    const cx = margin + colWidth * colIndex + 14;
    page.drawText(label, { x: cx, y: stripY + 34, size: 8, font: bold, color: WHITE });
    page.drawText(value, { x: cx, y: stripY + 14, size: 13, font: bold, color: valueColor });
  }

  stripCell('INVOICE NO.', order.invoice_number, 0);
  stripCell('ORDER DATE', new Date(order.created_at).toLocaleDateString('en-GB'), 1);
  stripCell('POSTCODE', order.postcode, 2);
  stripCell('TOTAL DUE', formatGBP(order.subtotal_pence), 3, BRAND_ORANGE);

  y = stripY - 40;

  // --- Item table header ---------------------------------------------
  page.drawText('DESCRIPTION', { x: margin, y, size: 9, font: bold, color: INK });
  page.drawText('QTY', { x: width - margin - 220, y, size: 9, font: bold, color: INK });
  page.drawText('UNIT PRICE', { x: width - margin - 160, y, size: 9, font: bold, color: INK });
  page.drawText('AMOUNT', { x: width - margin - 70, y, size: 9, font: bold, color: INK });
  y -= 8;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: INK });
  y -= 22;

  for (const item of items) {
    const lineTotal = item.unit_price_pence * item.quantity;
    page.drawText(truncate(item.product_name, 48), { x: margin, y, size: 10, font, color: INK });
    page.drawText(String(item.quantity), { x: width - margin - 216, y, size: 10, font, color: INK });
    page.drawText(formatGBP(item.unit_price_pence), {
      x: width - margin - 160,
      y,
      size: 10,
      font,
      color: INK,
    });
    page.drawText(formatGBP(lineTotal), { x: width - margin - 70, y, size: 10, font, color: INK });
    y -= 12;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: LIGHT_LINE,
    });
    y -= 20;

    if (y < 140) y = height - 60; // simple overflow guard for very long orders
  }

  y -= 6;

  // --- Subtotal ----------------------------------------------------------
  page.drawText('Subtotal:', { x: width - margin - 190, y, size: 11, font: bold, color: INK });
  page.drawText(formatGBP(order.subtotal_pence), {
    x: width - margin - 70,
    y,
    size: 11,
    font: bold,
    color: INK,
  });
  y -= 20;
  page.drawText('Total (GBP):', { x: width - margin - 190, y, size: 13, font: bold, color: INK });
  page.drawText(formatGBP(order.subtotal_pence), {
    x: width - margin - 70,
    y,
    size: 13,
    font: bold,
    color: BRAND_ORANGE,
  });

  y -= 60;
  page.drawText(
    'This confirms your order. Ashco Wholesale will be in touch to confirm availability',
    { x: margin, y, size: 9, font, color: GREY }
  );
  y -= 12;
  page.drawText('and arrange payment before dispatch.', { x: margin, y, size: 9, font, color: GREY });

  // --- Footer ------------------------------------------------------------
  const footerY = 60;
  page.drawLine({
    start: { x: margin, y: footerY + 20 },
    end: { x: width - margin, y: footerY + 20 },
    thickness: 1,
    color: LIGHT_LINE,
  });
  page.drawText('Ashco Wholesale', { x: margin, y: footerY, size: 10, font: bold, color: INK });
  page.drawText('ashcowholesale@gmail.com', { x: margin, y: footerY - 14, size: 9, font, color: GREY });

  return pdfDoc.save();
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

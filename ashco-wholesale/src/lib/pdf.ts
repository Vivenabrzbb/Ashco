import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatGBP, type Order, type OrderItem } from './types';

const BRAND_ORANGE = rgb(1, 0.376, 0); // #FF6000
const INK = rgb(0.06, 0.06, 0.06);
const GREY = rgb(0.45, 0.45, 0.45);

export async function generateInvoicePdf(order: Order, items: OrderItem[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 60;

  // Header
  page.drawText('ASHCO WHOLESALE', { x: 50, y, size: 22, font: bold, color: INK });
  page.drawText('INVOICE', { x: width - 150, y, size: 22, font: bold, color: BRAND_ORANGE });
  y -= 20;
  page.drawText('ashcowholesale@gmail.com', { x: 50, y, size: 10, font, color: GREY });
  y -= 40;

  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 30;

  // Invoice meta + bill-to, side by side
  const metaX = width - 220;
  page.drawText('Invoice number', { x: metaX, y, size: 9, font, color: GREY });
  page.drawText('Date', { x: metaX, y: y - 30, size: 9, font, color: GREY });

  page.drawText(order.invoice_number, { x: metaX, y: y - 14, size: 12, font: bold, color: INK });
  page.drawText(new Date(order.created_at).toLocaleDateString('en-GB'), {
    x: metaX,
    y: y - 44,
    size: 12,
    font: bold,
    color: INK,
  });

  page.drawText('Bill to', { x: 50, y, size: 9, font, color: GREY });
  page.drawText(order.customer_name, { x: 50, y: y - 14, size: 12, font: bold, color: INK });
  const addressLines = [
    order.address_line1,
    order.address_line2 || '',
    order.city,
    order.postcode,
  ].filter(Boolean);
  let addrY = y - 30;
  for (const line of addressLines) {
    page.drawText(line, { x: 50, y: addrY, size: 10, font, color: INK });
    addrY -= 14;
  }
  page.drawText(order.customer_email, { x: 50, y: addrY - 2, size: 10, font, color: GREY });

  y -= 120;

  // Table header
  page.drawRectangle({ x: 50, y: y - 6, width: width - 100, height: 22, color: rgb(0.96, 0.96, 0.96) });
  page.drawText('ITEM', { x: 58, y, size: 9, font: bold, color: INK });
  page.drawText('QTY', { x: 350, y, size: 9, font: bold, color: INK });
  page.drawText('UNIT PRICE', { x: 410, y, size: 9, font: bold, color: INK });
  page.drawText('TOTAL', { x: 500, y, size: 9, font: bold, color: INK });
  y -= 30;

  for (const item of items) {
    const lineTotal = item.unit_price_pence * item.quantity;
    page.drawText(truncate(item.product_name, 45), { x: 58, y, size: 10, font, color: INK });
    page.drawText(String(item.quantity), { x: 358, y, size: 10, font, color: INK });
    page.drawText(formatGBP(item.unit_price_pence), { x: 410, y, size: 10, font, color: INK });
    page.drawText(formatGBP(lineTotal), { x: 500, y, size: 10, font, color: INK });
    y -= 22;

    if (y < 120) {
      // simple overflow guard for very long orders
      y = height - 60;
    }
  }

  y -= 10;
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 30;

  page.drawText('SUBTOTAL', { x: 400, y, size: 11, font: bold, color: INK });
  page.drawText(formatGBP(order.subtotal_pence), { x: 500, y, size: 11, font: bold, color: BRAND_ORANGE });
  y -= 50;

  page.drawText(
    'This invoice confirms your order. Ashco Wholesale will be in touch to confirm',
    { x: 50, y, size: 9, font, color: GREY }
  );
  y -= 12;
  page.drawText('availability and arrange payment before dispatch.', {
    x: 50,
    y,
    size: 9,
    font,
    color: GREY,
  });

  return pdfDoc.save();
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

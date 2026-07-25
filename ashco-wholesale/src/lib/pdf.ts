import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatGBP, type Order, type OrderItem } from './types';

const BRAND_ORANGE = rgb(1, 0.376, 0); // #FF6000
const INK = rgb(0.06, 0.06, 0.06);
const GREY = rgb(0.4, 0.4, 0.4);
const LIGHT_LINE = rgb(0.85, 0.85, 0.85);

export async function generateInvoicePdf(order: Order, items: OrderItem[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 54;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 60;

  // --- Top-left logo: ASH (ink) + CO (orange), WHOLESALE below --------
  const ashWidth = bold.widthOfTextAtSize('ASH', 26);
  page.drawText('ASH', { x: margin, y, size: 26, font: bold, color: INK });
  page.drawText('CO', { x: margin + ashWidth, y, size: 26, font: bold, color: BRAND_ORANGE });
  page.drawText('WHOLESALE', { x: margin, y: y - 24, size: 13, font: bold, color: INK });

  // --- Top-right: Invoice heading + meta -------------------------------
  const rightColX = width - margin - 200;
  page.drawText('Invoice', { x: rightColX, y: y + 4, size: 24, font: bold, color: INK });
  y -= 12;
  page.drawText(`Invoice No. ${order.invoice_number}`, {
    x: rightColX,
    y: y - 20,
    size: 10,
    font,
    color: GREY,
  });
  page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString('en-GB')}`, {
    x: rightColX,
    y: y - 34,
    size: 10,
    font,
    color: GREY,
  });

  y -= 70;

  page.drawText('Billed to:', { x: rightColX, y, size: 10, font: bold, color: INK });
  y -= 16;
  page.drawText(order.customer_name, { x: rightColX, y, size: 10, font, color: GREY });
  y -= 14;
  if (order.customer_phone) {
    page.drawText(order.customer_phone, { x: rightColX, y, size: 10, font, color: GREY });
    y -= 14;
  }
  const addressLines = [order.address_line1, order.address_line2 || '', `${order.city}, ${order.postcode}`].filter(
    Boolean
  );
  for (const line of addressLines) {
    page.drawText(line, { x: rightColX, y, size: 10, font, color: GREY, maxWidth: 200 });
    y -= 14;
  }

  y -= 30;

  // --- Item table ---------------------------------------------------------
  page.drawText('DESCRIPTION', { x: margin, y, size: 9, font: bold, color: INK });
  page.drawText('QTY', { x: width - margin - 220, y, size: 9, font: bold, color: INK });
  page.drawText('UNIT PRICE', { x: width - margin - 160, y, size: 9, font: bold, color: INK });
  page.drawText('AMOUNT', { x: width - margin - 70, y, size: 9, font: bold, color: INK });
  y -= 8;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: INK });
  y -= 24;

  for (const item of items) {
    const lineTotal = item.unit_price_pence * item.quantity;
    const label = item.vat_exempt
      ? `${truncate(item.product_name, 40)} (VAT free)`
      : truncate(item.product_name, 48);
    page.drawText(label, { x: margin, y, size: 10, font, color: INK });
    page.drawText(String(item.quantity), { x: width - margin - 216, y, size: 10, font, color: INK });
    page.drawText(formatGBP(item.unit_price_pence), {
      x: width - margin - 160,
      y,
      size: 10,
      font,
      color: INK,
    });
    page.drawText(formatGBP(lineTotal), { x: width - margin - 70, y, size: 10, font, color: INK });
    y -= 28;

    if (y < 160) y = height - 60; // overflow guard for very long orders
  }

  y -= 6;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: LIGHT_LINE });
  y -= 30;

  // --- Sub-total / Total (right-aligned), note on the left ----------------
  const noteY = y;
  page.drawText('We will contact you to confirm this order', {
    x: margin,
    y: noteY,
    size: 9,
    font,
    color: GREY,
  });
  page.drawText('and arrange payment before dispatch.', {
    x: margin,
    y: noteY - 13,
    size: 9,
    font,
    color: GREY,
  });

  page.drawText('Sub-Total (net)', { x: width - margin - 190, y, size: 10, font, color: GREY });
  page.drawText(formatGBP(order.subtotal_pence), {
    x: width - margin - 70,
    y,
    size: 10,
    font,
    color: INK,
  });
  y -= 18;

  page.drawText('VAT (20%)', { x: width - margin - 190, y, size: 10, font, color: GREY });
  page.drawText(formatGBP(order.vat_pence), {
    x: width - margin - 70,
    y,
    size: 10,
    font,
    color: INK,
  });
  y -= 20;
  page.drawLine({
    start: { x: width - margin - 190, y: y + 8 },
    end: { x: width - margin, y: y + 8 },
    thickness: 0.5,
    color: LIGHT_LINE,
  });
  page.drawText('Total', { x: width - margin - 190, y, size: 12, font: bold, color: INK });
  page.drawText(formatGBP(order.subtotal_pence + order.vat_pence), {
    x: width - margin - 70,
    y,
    size: 12,
    font: bold,
    color: BRAND_ORANGE,
  });

  // --- Footer: Contact | Next steps ---------------------------------------
  const footerY = 110;
  page.drawLine({
    start: { x: margin, y: footerY + 30 },
    end: { x: width - margin, y: footerY + 30 },
    thickness: 1,
    color: LIGHT_LINE,
  });

  page.drawText('Contact', { x: margin, y: footerY, size: 13, font: bold, color: INK });
  page.drawText('ashcowholesale@gmail.com', { x: margin, y: footerY - 18, size: 9, font, color: GREY });

  const rightFooterX = width - margin - 220;
  page.drawText('Next steps', { x: rightFooterX, y: footerY, size: 13, font: bold, color: INK });
  page.drawText('We will call to confirm availability', {
    x: rightFooterX,
    y: footerY - 18,
    size: 9,
    font,
    color: GREY,
  });
  page.drawText('and arrange payment before dispatch.', {
    x: rightFooterX,
    y: footerY - 32,
    size: 9,
    font,
    color: GREY,
  });

  return pdfDoc.save();
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

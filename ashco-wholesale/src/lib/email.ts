import { Resend } from 'resend';
import { formatGBP, type Order, type OrderItem } from './types';

const resend = new Resend(process.env.RESEND_API_KEY);

const STORE_EMAIL = process.env.STORE_NOTIFICATION_EMAIL || 'ashcowholesale@gmail.com';
// Must be a verified domain in Resend once you go live — see README.
const FROM_ADDRESS = process.env.STORE_FROM_EMAIL || 'Ashco Wholesale <onboarding@resend.dev>';

export async function sendInvoiceEmails(order: Order, items: OrderItem[], pdfBytes: Uint8Array) {
  const attachment = {
    filename: `invoice-${order.invoice_number}.pdf`,
    content: Buffer.from(pdfBytes),
  };

  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;color:#0A0A0A;">${escapeHtml(item.product_name)}</td>
          <td style="padding:8px 0;text-align:center;color:#0A0A0A;">${item.quantity}</td>
          <td style="padding:8px 0;text-align:right;color:#0A0A0A;">${formatGBP(
            item.unit_price_pence * item.quantity
          )}</td>
        </tr>`
    )
    .join('');

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#0A0A0A;">Thanks for your order, ${escapeHtml(order.customer_name)}</h2>
      <p style="color:#444;">We've received order <strong>${order.invoice_number}</strong>. Ashco Wholesale
      will be in touch shortly to confirm availability and arrange payment. Your invoice is attached.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <thead>
          <tr style="border-bottom:2px solid #0A0A0A;">
            <th style="text-align:left;padding-bottom:8px;">Item</th>
            <th style="text-align:center;padding-bottom:8px;">Qty</th>
            <th style="text-align:right;padding-bottom:8px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="text-align:right;font-size:16px;color:#FF6000;font-weight:bold;">
        Subtotal: ${formatGBP(order.subtotal_pence)}
      </p>
      <p style="color:#444;">Delivery address:<br/>
      ${escapeHtml(order.address_line1)}<br/>
      ${order.address_line2 ? escapeHtml(order.address_line2) + '<br/>' : ''}
      ${escapeHtml(order.city)}, ${escapeHtml(order.postcode)}</p>
    </div>
  `;

  const ownerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#0A0A0A;">New order: ${order.invoice_number}</h2>
      <p style="color:#444;"><strong>${escapeHtml(order.customer_name)}</strong><br/>
      ${escapeHtml(order.customer_email)}${order.customer_phone ? ' · ' + escapeHtml(order.customer_phone) : ''}</p>
      <p style="color:#444;">${escapeHtml(order.address_line1)}<br/>
      ${order.address_line2 ? escapeHtml(order.address_line2) + '<br/>' : ''}
      ${escapeHtml(order.city)}, ${escapeHtml(order.postcode)}</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <thead>
          <tr style="border-bottom:2px solid #0A0A0A;">
            <th style="text-align:left;padding-bottom:8px;">Item</th>
            <th style="text-align:center;padding-bottom:8px;">Qty</th>
            <th style="text-align:right;padding-bottom:8px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="text-align:right;font-size:16px;color:#FF6000;font-weight:bold;">
        Subtotal: ${formatGBP(order.subtotal_pence)}
      </p>
      <p style="color:#888;font-size:12px;">Contact the customer to confirm the order and take payment.</p>
    </div>
  `;

  await Promise.all([
    resend.emails.send({
      from: FROM_ADDRESS,
      to: order.customer_email,
      subject: `Your Ashco Wholesale order ${order.invoice_number}`,
      html: customerHtml,
      attachments: [attachment],
    }),
    resend.emails.send({
      from: FROM_ADDRESS,
      to: STORE_EMAIL,
      subject: `New order ${order.invoice_number} — ${order.customer_name}`,
      html: ownerHtml,
      attachments: [attachment],
    }),
  ]);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

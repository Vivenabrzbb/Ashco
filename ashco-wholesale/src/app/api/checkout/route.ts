import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateInvoicePdf } from '@/lib/pdf';
import { sendInvoiceEmails } from '@/lib/email';
import { isLikelyUkPostcode, VAT_RATE, type CheckoutPayload, type Order, type OrderItem } from '@/lib/types';

export async function POST(request: Request) {
  const body: CheckoutPayload = await request.json();

  // --- Validate input --------------------------------------------------
  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
  }
  if (!body.customer_name?.trim() || !body.customer_email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }
  if (!body.address_line1?.trim() || !body.city?.trim() || !body.postcode?.trim()) {
    return NextResponse.json({ error: 'A full UK delivery address is required.' }, { status: 400 });
  }
  if (!isLikelyUkPostcode(body.postcode)) {
    return NextResponse.json({ error: 'That doesn\u2019t look like a valid UK postcode.' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // --- Re-fetch live prices from the DB — never trust client-sent prices ---
  const productIds = body.items.map((i) => i.product_id);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price_pence, in_stock, vat_exempt')
    .in('id', productIds);

  if (productsError || !products || products.length === 0) {
    return NextResponse.json({ error: 'Could not load products for this order.' }, { status: 400 });
  }

  const lineItems = body.items.map((item) => {
    const product = products.find((p) => p.id === item.product_id);
    if (!product) throw new Error('Product not found');
    const lineNet = product.price_pence * item.quantity;
    const vat_exempt = product.vat_exempt ?? false;
    const vat_pence = vat_exempt ? 0 : Math.round(lineNet * VAT_RATE);
    return {
      product_id: product.id,
      product_name: product.name,
      unit_price_pence: product.price_pence,
      quantity: item.quantity,
      vat_exempt,
      vat_pence,
    };
  });

  const unavailable = body.items.filter((item) => {
    const product = products.find((p) => p.id === item.product_id);
    return !product || !product.in_stock;
  });
  if (unavailable.length > 0) {
    return NextResponse.json(
      { error: 'One or more items in your cart are no longer available.' },
      { status: 400 }
    );
  }

  const subtotal_pence = lineItems.reduce((sum, li) => sum + li.unit_price_pence * li.quantity, 0);
  const vat_pence = lineItems.reduce((sum, li) => sum + li.vat_pence, 0);

  // --- Generate a human-readable invoice number ---------------------------
  const { data: seqData, error: seqError } = await supabase.rpc('nextval_invoice_number');
  let invoiceNumber: string;
  if (seqError || !seqData) {
    // Fallback if the RPC helper isn't installed — still unique, just less pretty.
    invoiceNumber = `AW-${Date.now()}`;
  } else {
    invoiceNumber = `AW-${seqData}`;
  }

  // --- Insert order + items -------------------------------------------
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      invoice_number: invoiceNumber,
      customer_name: body.customer_name.trim(),
      customer_email: body.customer_email.trim(),
      customer_phone: body.customer_phone?.trim() || null,
      address_line1: body.address_line1.trim(),
      address_line2: body.address_line2?.trim() || null,
      city: body.city.trim(),
      postcode: body.postcode.trim().toUpperCase(),
      subtotal_pence,
      vat_pence,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Could not create your order. Please try again.' }, { status: 500 });
  }

  const { data: insertedItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(lineItems.map((li) => ({ ...li, order_id: order.id })))
    .select();

  if (itemsError || !insertedItems) {
    return NextResponse.json({ error: 'Could not save order items.' }, { status: 500 });
  }

  // --- Generate PDF + send emails ---------------------------------------
  try {
    const pdfBytes = await generateInvoicePdf(order as Order, insertedItems as OrderItem[]);
    await sendInvoiceEmails(order as Order, insertedItems as OrderItem[], pdfBytes);
  } catch (err) {
    // Order is already saved — don't fail the checkout if only the email step breaks.
    // You'll still see the order in /admin/orders and can follow up manually.
    console.error('Invoice email failed:', err);
  }

  return NextResponse.json({ orderId: order.id, invoiceNumber: order.invoice_number });
}

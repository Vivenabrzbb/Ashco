import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Header } from '@/components/Header';
import { formatGBP, type Order, type OrderItem } from '@/lib/types';

export default async function OrderConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (!order) {
    notFound();
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id);

  const typedOrder = order as Order;
  const typedItems = (items as OrderItem[]) || [];

  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-signal text-2xl font-bold text-ink">
          ✓
        </div>

        <h1 className="mb-3 font-display text-3xl font-extrabold text-paper">
          Order received
        </h1>

        <p className="mb-2 text-ash">
          Invoice{' '}
          <span className="font-bold text-paper">
            {typedOrder.invoice_number}
          </span>{' '}
          has been emailed to{' '}
          <span className="text-paper">
            {typedOrder.customer_email}
          </span>.
        </p>

        <p className="mb-10 text-ash">
          Ashco Wholesale will contact you shortly to confirm the order and
          arrange payment.
        </p>

        <div className="rounded-2xl border border-line bg-panel p-6 text-left">
          <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
            <span className="font-display font-bold text-paper">
              Order summary
            </span>

            <span className="text-sm text-ash">
              {new Date(typedOrder.created_at).toLocaleDateString('en-GB')}
            </span>
          </div>

          <div className="space-y-2">
            {typedItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm"
              >
                <span className="text-ash">
                  {item.quantity} × {item.product_name}
                  {item.vat_exempt ? ' (VAT free)' : ''}
                </span>

                <span className="text-paper">
                  {formatGBP(item.unit_price_pence * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1 border-t border-line pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-ash">Subtotal</span>

              <span className="text-paper">
                {formatGBP(typedOrder.subtotal_pence)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-ash">VAT</span>

              <span className="text-paper">
                {formatGBP(typedOrder.vat_pence)}
              </span>
            </div>

            <div className="flex justify-between pt-1">
              <span className="font-display font-bold text-paper">
                Total
              </span>

              <span className="font-display font-bold text-signal">
                {formatGBP(
                  typedOrder.subtotal_pence + typedOrder.vat_pence
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <a
            href={`/api/invoice/${typedOrder.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 font-display font-bold text-ink transition hover:bg-signalDim"
          >
            Download invoice (PDF)
          </a>
        </div>

        <div>
          <Link
            href="/"
            className="mt-6 inline-block font-bold text-signal hover:underline"
          >
            ← Back to stock 
          </Link>
        </div>
      </div>
    </div>
  );
}

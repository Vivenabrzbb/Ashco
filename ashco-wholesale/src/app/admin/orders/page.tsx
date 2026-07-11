import { createClient } from '@/lib/supabase/server';
import { formatGBP, type Order, type OrderItem } from '@/lib/types';

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: allItems } = await supabase.from('order_items').select('*');

  const typedOrders = (orders as Order[]) || [];
  const typedItems = (allItems as OrderItem[]) || [];

  return (
    <div>
      <h1 className="mb-8 font-display text-2xl font-bold text-paper">
        {typedOrders.length} order{typedOrders.length !== 1 ? 's' : ''}
      </h1>

      {typedOrders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-12 text-center text-ash">
          No orders yet.
        </p>
      ) : (
        <div className="space-y-4">
          {typedOrders.map((order) => {
            const items = typedItems.filter((i) => i.order_id === order.id);
            return (
              <div key={order.id} className="rounded-2xl border border-line bg-panel p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-bold text-paper">
                      {order.invoice_number} — {order.customer_name}
                    </p>
                    <p className="text-sm text-ash">
                      {order.customer_email}
                      {order.customer_phone ? ` · ${order.customer_phone}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-signal/20 px-3 py-1 text-xs font-bold uppercase text-signal">
                    {order.status}
                  </span>
                </div>

                <p className="mb-4 text-sm text-ash">
                  {order.address_line1}
                  {order.address_line2 ? `, ${order.address_line2}` : ''}, {order.city},{' '}
                  {order.postcode}
                </p>

                <div className="divide-y divide-line border-t border-line pt-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 text-sm">
                      <span className="text-ash">
                        {item.quantity} × {item.product_name}
                      </span>
                      <span className="text-paper">
                        {formatGBP(item.unit_price_pence * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-between border-t border-line pt-3">
                  <span className="text-sm text-ash">
                    {new Date(order.created_at).toLocaleString('en-GB')}
                  </span>
                  <span className="font-display font-bold text-signal">
                    {formatGBP(order.subtotal_pence)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

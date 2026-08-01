import { createClient } from '@/lib/supabase/server';
import { OrdersKanban } from '@/components/OrdersKanban';
import type { Order, OrderItem } from '@/lib/types';

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

  const itemsByOrder: Record<string, OrderItem[]> = {};
  for (const item of typedItems) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push(item);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-paper">
          {typedOrders.length} order{typedOrders.length !== 1 ? 's' : ''}
        </h1>
        <p className="text-sm text-ash">Drag a card to a new column, or use the dropdown on mobile.</p>
      </div>

      {typedOrders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-12 text-center text-ash">
          No orders yet.
        </p>
      ) : (
        <OrdersKanban initialOrders={typedOrders} itemsByOrder={itemsByOrder} />
      )}
    </div>
  );
}

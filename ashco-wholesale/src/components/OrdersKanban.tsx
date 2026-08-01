'use client';

import { useMemo, useState } from 'react';
import { formatGBP, type Order, type OrderItem, type OrderStatus } from '@/lib/types';

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'paid', label: 'Paid' },
  { status: 'cancelled', label: 'Cancelled' },
];

// Orders placed within this window get a "New" pulse on their card.
const NEW_ORDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export function OrdersKanban({
  initialOrders,
  itemsByOrder,
}: {
  initialOrders: Order[];
  itemsByOrder: Record<string, OrderItem[]>;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<OrderStatus | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = {
      pending: [],
      confirmed: [],
      paid: [],
      cancelled: [],
    };
    for (const order of orders) {
      const status = (order.status as OrderStatus) || 'pending';
      if (map[status]) map[status].push(order);
    }
    return map;
  }, [orders]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    const previous = orders;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    setUpdatingId(orderId);

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    setUpdatingId(null);
    if (!res.ok) {
      // Roll back on failure so the board doesn't lie about what actually saved.
      setOrders(previous);
      alert('Could not update order status. Please try again.');
    }
  }

  async function handleDelete(orderId: string, invoiceNumber: string) {
    if (!confirm(`Delete order ${invoiceNumber}? This cannot be undone.`)) return;

    const previous = orders;
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
    if (!res.ok) {
      setOrders(previous);
      alert('Could not delete order. Please try again.');
    }
  }

  function isNew(order: Order) {
    return Date.now() - new Date(order.created_at).getTime() < NEW_ORDER_WINDOW_MS;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((col) => (
        <div
          key={col.status}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverStatus(col.status);
          }}
          onDragLeave={() => setDragOverStatus((prev) => (prev === col.status ? null : prev))}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverStatus(null);
            if (draggingId) updateStatus(draggingId, col.status);
            setDraggingId(null);
          }}
          className={`flex flex-col rounded-2xl border p-3 transition ${
            dragOverStatus === col.status
              ? 'border-signal bg-signal/5'
              : 'border-line bg-panel'
          }`}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="font-display font-bold text-paper">{col.label}</h3>
            <span className="rounded-full bg-line px-2 py-0.5 text-xs font-bold text-ash">
              {grouped[col.status].length}
            </span>
          </div>

          <div className="flex min-h-[120px] flex-col gap-3">
            {grouped[col.status].length === 0 && (
              <div className="rounded-xl border border-dashed border-line py-8 text-center text-xs text-ash">
                No orders
              </div>
            )}

            {grouped[col.status].map((order) => {
              const items = itemsByOrder[order.id] || [];
              const total = order.subtotal_pence + order.vat_pence;
              return (
                <div
                  key={order.id}
                  draggable
                  onDragStart={() => setDraggingId(order.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`cursor-grab rounded-xl border border-line bg-ink p-3 shadow-sm transition active:cursor-grabbing ${
                    updatingId === order.id ? 'opacity-50' : ''
                  } ${draggingId === order.id ? 'opacity-40' : ''}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-paper">
                      {order.invoice_number}
                    </span>
                    {isNew(order) && (
                      <span className="rounded-full bg-signal px-2 py-0.5 text-[10px] font-bold uppercase text-ink">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mb-1 text-xs text-ash">{order.customer_name}</p>
                  <p className="mb-2 text-xs text-ash">
                    {items.length} item{items.length !== 1 ? 's' : ''} ·{' '}
                    {new Date(order.created_at).toLocaleDateString('en-GB')}
                  </p>
                  <p className="mb-3 font-display font-bold text-signal">{formatGBP(total)}</p>

                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                      className="flex-1 rounded-lg border border-line bg-panel px-2 py-1 text-xs text-paper focus:border-signal focus:outline-none"
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.status} value={c.status}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDelete(order.id, order.invoice_number)}
                      aria-label={`Delete order ${order.invoice_number}`}
                      className="text-xs font-medium text-ash hover:text-signal"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

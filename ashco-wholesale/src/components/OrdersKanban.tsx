'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatGBP, type Order, type OrderItem, type OrderStatus } from '@/lib/types';

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'paid', label: 'Paid' },
  { status: 'cancelled', label: 'Cancelled' },
];

const NEW_ORDER_WINDOW_MS = 24 * 60 * 60 * 1000;

// Short two-tone chime using the Web Audio API — no audio file to host or load.
function playChime() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.14);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.3);
    });
  } catch {
    // Audio isn't critical — fail silently if the browser blocks it.
  }
}

export function OrdersKanban({
  initialOrders,
  initialItemsByOrder,
}: {
  initialOrders: Order[];
  initialItemsByOrder: Record<string, OrderItem[]>;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>(initialItemsByOrder);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<OrderStatus | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(
    'default'
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifPermission('unsupported');
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  // Live updates: subscribe to new rows landing in `orders` and pull that
  // order onto the board immediately, without a page refresh.
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('orders-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const newOrder = payload.new as Order;

          setOrders((prev) => (prev.some((o) => o.id === newOrder.id) ? prev : [newOrder, ...prev]));

          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', newOrder.id);

          setItemsByOrder((prev) => ({ ...prev, [newOrder.id]: (items as OrderItem[]) || [] }));

          showToast(`New order ${newOrder.invoice_number} from ${newOrder.customer_name}`);
          playChime();

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('New Ashco order', {
              body: `${newOrder.invoice_number} — ${newOrder.customer_name}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showToast]);

  async function requestNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  }

  const grouped = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = { pending: [], confirmed: [], paid: [], cancelled: [] };
    for (const order of orders) {
      const status = (order.status as OrderStatus) || 'pending';
      if (map[status]) map[status].push(order);
    }
    return map;
  }, [orders]);

  const viewingOrder = viewingOrderId ? orders.find((o) => o.id === viewingOrderId) || null : null;

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
    } else if (viewingOrderId === orderId) {
      setViewingOrderId(null);
    }
  }

  function isNew(order: Order) {
    return Date.now() - new Date(order.created_at).getTime() < NEW_ORDER_WINDOW_MS;
  }

  return (
    <div>
      {toast && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-3 rounded-xl border border-signal bg-ink px-4 py-3 shadow-lg">
          <span className="flex h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-signal" />
          <span className="text-sm font-medium text-paper">{toast}</span>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="text-ash hover:text-signal"
          >
            ×
          </button>
        </div>
      )}

      {notifPermission === 'default' && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3">
          <p className="text-sm text-ash">
            Turn on browser notifications to get alerted the moment a new order comes in, even if
            this tab is in the background.
          </p>
          <button
            onClick={requestNotifications}
            className="flex-shrink-0 rounded-full bg-signal px-4 py-2 text-sm font-bold text-ink hover:bg-signalDim"
          >
            Enable notifications
          </button>
        </div>
      )}
      {notifPermission === 'denied' && (
        <div className="mb-6 rounded-xl border border-line bg-panel px-4 py-3">
          <p className="text-sm text-ash">
            Browser notifications are blocked. You&apos;ll still see new orders live on this board
            and hear a chime while this tab is open — to also get OS-level pop-ups, allow
            notifications for this site in your browser settings.
          </p>
        </div>
      )}

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
              dragOverStatus === col.status ? 'border-signal bg-signal/5' : 'border-line bg-panel'
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

                    <button
                      onClick={() => setViewingOrderId(order.id)}
                      className="mb-2 w-full rounded-lg border border-line py-1.5 text-xs font-bold text-paper hover:border-signal hover:text-signal"
                    >
                      View details
                    </button>

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

      {viewingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-paper/50 p-4"
          onClick={() => setViewingOrderId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-ink p-6 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-paper">
                  {viewingOrder.invoice_number}
                </h3>
                <p className="text-sm text-ash">
                  {new Date(viewingOrder.created_at).toLocaleString('en-GB')}
                </p>
              </div>
              <button
                onClick={() => setViewingOrderId(null)}
                aria-label="Close"
                className="text-2xl leading-none text-ash hover:text-signal"
              >
                ×
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-line bg-panel p-4">
              <p className="font-display font-bold text-paper">{viewingOrder.customer_name}</p>
              <p className="text-sm text-ash">{viewingOrder.customer_email}</p>
              {viewingOrder.customer_phone && (
                <p className="text-sm text-ash">{viewingOrder.customer_phone}</p>
              )}
              <p className="mt-2 text-sm text-ash">
                {viewingOrder.address_line1}
                {viewingOrder.address_line2 ? `, ${viewingOrder.address_line2}` : ''}
                <br />
                {viewingOrder.city}, {viewingOrder.postcode}
              </p>
            </div>

            <div className="mb-4 divide-y divide-line border-t border-line pt-2">
              {(itemsByOrder[viewingOrder.id] || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="text-paper">
                      {item.quantity} × {item.product_name}
                    </p>
                    {item.vat_exempt && <p className="text-xs text-ash">VAT free</p>}
                  </div>
                  <span className="font-display font-bold text-paper">
                    {formatGBP(item.unit_price_pence * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-6 space-y-1 border-t border-line pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-ash">Subtotal</span>
                <span className="text-paper">{formatGBP(viewingOrder.subtotal_pence)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ash">VAT</span>
                <span className="text-paper">{formatGBP(viewingOrder.vat_pence)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-display font-bold text-paper">Total</span>
                <span className="font-display font-bold text-signal">
                  {formatGBP(viewingOrder.subtotal_pence + viewingOrder.vat_pence)}
                </span>
              </div>
            </div>

            
              href={`/api/invoice/${viewingOrder.id}`}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-full bg-signal py-2.5 text-center text-sm font-bold text-ink hover:bg-signalDim"
            >
              Download invoice (PDF)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

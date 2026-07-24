'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { useCart } from '@/components/CartProvider';
import { formatGBP } from '@/lib/types';

export default function CartPage() {
  const { lines, removeItem, setQuantity, subtotalPence } = useCart();

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-10 font-display text-3xl font-extrabold text-paper">Your cart</h1>

        {lines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-20 text-center text-ash">
            <p className="mb-4">Your cart is empty.</p>
            <Link href="/" className="font-bold text-signal hover:underline">
              Browse stock →
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-line rounded-2xl border border-line bg-panel">
              {lines.map((line) => (
                <div key={line.product_id} className="flex items-center gap-4 p-5">
                  <div className="flex-1">
                    <p className="font-display font-bold text-paper">{line.name}</p>
                    <p className="text-sm text-ash">{formatGBP(line.price_pence)} each</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(line.product_id, line.quantity - 1)}
                      className="h-8 w-8 rounded-full border border-line text-paper hover:border-signal hover:text-signal"
                      aria-label={`Decrease quantity of ${line.name}`}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-paper">{line.quantity}</span>
                    <button
                      onClick={() => setQuantity(line.product_id, line.quantity + 1)}
                      className="h-8 w-8 rounded-full border border-line text-paper hover:border-signal hover:text-signal"
                      aria-label={`Increase quantity of ${line.name}`}
                    >
                      +
                    </button>
                  </div>

                  <p className="w-24 text-right font-display font-bold text-signal">
                    {formatGBP(line.price_pence * line.quantity)}
                  </p>

                  <button
                    onClick={() => removeItem(line.product_id)}
                    className="text-sm text-ash hover:text-signal"
                    aria-label={`Remove ${line.name} from cart`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <span className="font-display text-lg text-paper">Subtotal</span>
              <span className="font-display text-2xl font-extrabold text-signal">
                {formatGBP(subtotalPence)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="mt-6 block w-full rounded-full bg-signal py-4 text-center font-display font-bold text-ink transition hover:bg-signalDim"
            >
              Continue to delivery details
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

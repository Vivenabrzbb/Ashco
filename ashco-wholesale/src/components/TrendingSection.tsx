'use client';

import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';
import { formatGBP, type Product } from '@/lib/types';

const SLIDE_DURATION_MS = 4500;

export function TrendingSection({ products }: { products: Product[] }) {
  const trending = products.filter((p) => p.tag === 'trending' && p.in_stock);
  const { addItem } = useCart();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (trending.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % trending.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [trending.length]);

  if (trending.length === 0) return null;

  const current = trending[index];

  function goTo(i: number) {
    setIndex((i + trending.length) % trending.length);
  }

  return (
    <section className="border-b border-line px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal text-sm font-bold text-ink">
            🔥
          </span>
          <h2 className="font-display text-2xl font-bold text-paper">Trending now</h2>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="relative flex h-[280px] items-end sm:h-[320px]">
            {current.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={current.id}
                src={current.image_url}
                alt={current.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-line">
                <span className="font-display text-sm uppercase tracking-widest text-ash">
                  No image
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-paper/90 via-paper/20 to-transparent" />

            <div className="relative z-10 flex w-full items-end justify-between gap-4 p-6 sm:p-8">
              <div>
                <span className="mb-2 inline-block rounded-full bg-signal px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">
                  Trending
                </span>
                <h3 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
                  {current.name}
                </h3>
                <p className="mt-1 text-sm text-ink/70">{current.category}</p>
              </div>

              <div className="flex flex-shrink-0 flex-col items-end gap-3">
                <span className="font-display text-2xl font-extrabold text-signal">
                  {formatGBP(current.price_pence)}
                </span>
                <button
                  onClick={() =>
                    addItem({
                      product_id: current.id,
                      name: current.name,
                      price_pence: current.price_pence,
                    })
                  }
                  className="rounded-full bg-signal px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-white"
                >
                  Add to cart
                </button>
              </div>
            </div>

            {trending.length > 1 && (
              <>
                <button
                  onClick={() => goTo(index - 1)}
                  aria-label="Previous"
                  className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 text-lg text-paper hover:bg-ink"
                >
                  ‹
                </button>
                <button
                  onClick={() => goTo(index + 1)}
                  aria-label="Next"
                  className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 text-lg text-paper hover:bg-ink"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {trending.length > 1 && (
            <div className="flex justify-center gap-2 py-4">
              {trending.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? 'w-6 bg-signal' : 'w-2 bg-line'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

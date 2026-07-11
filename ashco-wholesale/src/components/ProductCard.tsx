'use client';

import { useState } from 'react';
import { useCart } from './CartProvider';
import { formatGBP, type Product } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      product_id: product.id,
      name: product.name,
      price_pence: product.price_pence,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition hover:border-signal/50">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-line">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ash">
            <span className="font-display text-sm uppercase tracking-widest">No image</span>
          </div>
        )}
        {!product.in_stock && (
          <div className="absolute right-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ash">
            Out of stock
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-bold text-paper">{product.name}</h3>
        <p className="flex-1 text-sm leading-relaxed text-ash">{product.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-xl font-extrabold text-signal">
            {formatGBP(product.price_pence)}
          </span>
          <button
            onClick={handleAdd}
            disabled={!product.in_stock}
            className="rounded-full bg-signal px-4 py-2 text-sm font-bold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:bg-line disabled:text-ash"
          >
            {added ? 'Added ✓' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

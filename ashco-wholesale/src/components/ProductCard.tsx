'use client';

import { useCart } from './CartProvider';
import { formatGBP, TAG_LABELS, type Product } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  const { lines, addItem, setQuantity } = useCart();

  const inCart = lines.find((l) => l.product_id === product.id);
  const quantity = inCart?.quantity ?? 0;

  function handleAdd() {
    addItem({
      product_id: product.id,
      name: product.name,
      price_pence: product.price_pence,
    });
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition hover:border-signal/50">
      <div className="relative aspect-square w-full overflow-hidden bg-line">
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

        {product.tag !== 'none' && (
          <div className="absolute left-3 top-3 rounded-full bg-signal px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">
            {TAG_LABELS[product.tag]}
          </div>
        )}

        {!product.in_stock && (
          <div className="absolute right-3 top-3 rounded-full bg-paper/85 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">
            Out of stock
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-medium uppercase tracking-wide text-ash">
          {product.category || 'Uncategorised'}
          {product.subcategory ? ` · ${product.subcategory}` : ''}
        </span>
        <h3 className="-mt-1 font-display text-lg font-bold text-paper">{product.name}</h3>
        <p className="flex-1 text-sm leading-relaxed text-ash">{product.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-xl font-extrabold text-signal">
            {formatGBP(product.price_pence)}
          </span>

          {!product.in_stock ? (
            <span className="rounded-full bg-line px-4 py-2 text-sm font-bold text-ash">
              Unavailable
            </span>
          ) : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="rounded-full bg-signal px-4 py-2 text-sm font-bold text-ink transition hover:bg-white"
            >
              Add to cart
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-full border border-signal bg-signal/10 px-1 py-1">
              <button
                onClick={() => setQuantity(product.id, quantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold text-signal hover:bg-signal/20"
                aria-label={`Decrease quantity of ${product.name}`}
              >
                −
              </button>
              <span className="min-w-[1.25rem] text-center font-display font-bold text-paper">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(product.id, quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold text-signal hover:bg-signal/20"
                aria-label={`Increase quantity of ${product.name}`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

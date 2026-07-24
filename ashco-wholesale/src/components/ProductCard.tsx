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
    <div className="group flex flex-col rounded-2xl border border-line bg-panel transition hover:border-signal/50">
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-line">
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

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-5">
        <span className="text-xs font-medium uppercase tracking-wide text-ash">
          {product.category || 'Uncategorised'}
          {product.subcategory ? ` · ${product.subcategory}` : ''}
        </span>
        <h3 className="-mt-1 font-display text-sm font-bold text-paper sm:text-lg">{product.name}</h3>
        <p className="hidden flex-1 text-sm leading-relaxed text-ash sm:block">{product.description}</p>

        <div className="mt-1 flex flex-col gap-1.5 sm:mt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="font-display text-base font-extrabold text-signal sm:text-xl">
            {formatGBP(product.price_pence)}
          </span>

          {!product.in_stock ? (
            <span className="w-fit rounded-full bg-line px-3 py-1.5 text-xs font-bold text-ash sm:px-4 sm:py-2 sm:text-sm">
              Unavailable
            </span>
          ) : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="w-full touch-manipulation select-none rounded-full bg-signal px-3 py-2 text-xs font-bold text-ink transition hover:bg-signalDim active:scale-95 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
            >
              Add to cart
            </button>
          ) : (
            <div className="flex w-full touch-manipulation select-none items-center justify-between gap-1 rounded-full border border-signal bg-signal/10 px-1 py-1 sm:w-auto sm:justify-center sm:gap-3">
              <button
                onClick={() => setQuantity(product.id, quantity - 1)}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-base font-bold text-signal hover:bg-signal/20 active:scale-90 sm:h-8 sm:w-8 sm:text-lg"
                aria-label={`Decrease quantity of ${product.name}`}
              >
                −
              </button>
              <span className="min-w-[1rem] text-center font-display text-sm font-bold text-paper sm:min-w-[1.25rem] sm:text-base">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(product.id, quantity + 1)}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-base font-bold text-signal hover:bg-signal/20 active:scale-90 sm:h-8 sm:w-8 sm:text-lg"
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

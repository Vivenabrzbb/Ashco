import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

export function TrendingSection({ products }: { products: Product[] }) {
  const trending = products.filter((p) => p.tag === 'trending' && p.in_stock);

  if (trending.length === 0) return null;

  return (
    <section className="border-b border-line px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal text-sm font-bold text-ink">
            🔥
          </span>
          <h2 className="font-display text-2xl font-bold text-paper">Trending now</h2>
        </div>

       <div className="-mx-6 flex gap-6 overflow-x-auto px-6 pb-2">
          {trending.map((product) => (
            <div key={product.id} className="w-64 flex-shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

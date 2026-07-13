'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types';

export function StoreFront({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [subcategory, setSubcategory] = useState<string>('All');

  // Sync filter state from the URL (set by the sidebar menu, or a shared link)
  useEffect(() => {
    setCategory(searchParams.get('category') || 'All');
    setSubcategory(searchParams.get('subcategory') || 'All');
  }, [searchParams]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || 'Uncategorised'));
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  const subcategories = useMemo(() => {
    if (category === 'All') return [];
    const set = new Set(
      products
        .filter((p) => (p.category || 'Uncategorised') === category && p.subcategory)
        .map((p) => p.subcategory as string)
    );
    return Array.from(set).sort();
  }, [products, category]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = category === 'All' || (p.category || 'Uncategorised') === category;
      const matchesSubcategory =
        subcategory === 'All' || !subcategory || p.subcategory === subcategory;
      const matchesQuery =
        !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return matchesCategory && matchesSubcategory && matchesQuery;
    });
  }, [products, query, category, subcategory]);

  function selectCategory(cat: string) {
    setCategory(cat);
    setSubcategory('All');
    router.push(cat === 'All' ? '/' : `/?category=${encodeURIComponent(cat)}`);
  }

  function selectSubcategory(sub: string) {
    setSubcategory(sub);
    if (sub === 'All') {
      router.push(`/?category=${encodeURIComponent(category)}`);
    } else {
      router.push(`/?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(sub)}`);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-paper">Available stock</h2>
        <div className="relative w-full max-w-xs">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-full border border-line bg-panel px-4 py-2 text-sm text-paper placeholder:text-ash focus:border-signal focus:outline-none"
          />
        </div>
      </div>

      {categories.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => selectCategory(cat)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                category === cat
                  ? 'border-signal bg-signal text-ink'
                  : 'border-line text-ash hover:border-signal hover:text-signal'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {subcategories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => selectSubcategory('All')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              subcategory === 'All'
                ? 'border-signal text-signal'
                : 'border-line text-ash hover:border-signal hover:text-signal'
            }`}
          >
            All {category}
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => selectSubcategory(sub)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                subcategory === sub
                  ? 'border-signal text-signal'
                  : 'border-line text-ash hover:border-signal hover:text-signal'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-20 text-center text-ash">
          {products.length === 0
            ? 'No products listed yet. Check back shortly.'
            : `No products match your filters.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

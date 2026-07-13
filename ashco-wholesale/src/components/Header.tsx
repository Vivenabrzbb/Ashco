'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import { CategoryMenu } from './CategoryMenu';

export function Header() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <CategoryMenu />
          <Link href="/" className="font-display text-xl font-extrabold tracking-tight text-paper">
            ASHCO<span className="text-signal">.</span>
            <span className="ml-1 text-xs font-body font-medium uppercase tracking-[0.2em] text-ash">
              Wholesale
            </span>
          </Link>
        </div>
        <Link
          href="/cart"
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-paper transition hover:border-signal hover:text-signal"
        >
          Cart
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-signal px-1 text-xs font-bold text-ink">
            {itemCount}
          </span>
        </Link>
      </div>
    </header>
  );
}

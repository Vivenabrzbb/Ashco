import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { StoreFront } from '@/components/StoreFront';
import type { Product } from '@/lib/types';

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  const list = (products as Product[]) || [];

  return (
    <div className="min-h-screen">
      <Header />

      <section className="grain border-b border-line px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 font-body text-sm font-medium uppercase tracking-[0.3em] text-signal">
            UK bulk stock
          </p>
          <h1 className="max-w-2xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-paper md:text-6xl">
            Straightforward wholesale, no middlemen.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ash">
            Browse the current stock list, add what you need to your order, and submit your
            delivery details. We&apos;ll confirm availability and arrange payment directly with you.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={null}>
            <StoreFront products={list} />
          </Suspense>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-10 text-center text-sm text-ash">
        Ashco Wholesale · ashcowholesale@gmail.com
      </footer>
    </div>
  );
}

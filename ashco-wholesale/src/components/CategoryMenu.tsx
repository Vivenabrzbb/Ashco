'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type CategoryTree = Record<string, Set<string>>;

export function CategoryMenu() {
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState<CategoryTree>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from('products').select('category, subcategory');
      const next: CategoryTree = {};
      (data || []).forEach((row) => {
        const cat = row.category || 'Uncategorised';
        if (!next[cat]) next[cat] = new Set();
        if (row.subcategory) next[cat].add(row.subcategory);
      });
      setTree(next);
    })();
  }, [open]);

  function goTo(category: string, subcategory?: string) {
    const params = new URLSearchParams();
    params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    router.push(`/?${params.toString()}`, { scroll: false });
    setOpen(false);
  }

  function goToTag(tag: string) {
    router.push(`/?tag=${encodeURIComponent(tag)}`, { scroll: false });
    setOpen(false);
  }

  const categories = Object.keys(tree).sort();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open category menu"
        className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-paper transition hover:border-signal hover:text-signal"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="block h-[2px] w-4 bg-current" />
          <span className="block h-[2px] w-4 bg-current" />
          <span className="block h-[2px] w-4 bg-current" />
        </span>
        Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-paper/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-ink shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <span className="font-display text-lg font-bold text-paper">Categories</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-2xl leading-none text-ash hover:text-signal"
              >
                ×
              </button>
            </div>

            <div className="flex-1 px-2 py-3">
              {categories.length === 0 && (
                <p className="px-4 py-6 text-sm text-ash">No categories yet.</p>
              )}
              {categories.map((cat) => {
                const subs = Array.from(tree[cat]).sort();
                const isExpanded = expanded === cat;
                return (
                  <div key={cat} className="border-b border-line last:border-b-0">
                    <button
                      onClick={() => (subs.length > 0 ? setExpanded(isExpanded ? null : cat) : goTo(cat))}
                      className="flex w-full items-center justify-between px-4 py-4 text-left font-display font-bold text-paper hover:text-signal"
                    >
                      <span onClick={(e) => { e.stopPropagation(); goTo(cat); }}>{cat}</span>
                      {subs.length > 0 && (
                        <span className={`text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          ▾
                        </span>
                      )}
                    </button>
                    {isExpanded && subs.length > 0 && (
                      <div className="pb-3 pl-6">
                        {subs.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => goTo(cat, sub)}
                            className="block w-full px-2 py-2 text-left text-sm text-ash hover:text-signal"
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

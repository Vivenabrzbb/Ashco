'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TAG_LABELS, type ProductTag } from '@/lib/types';

type CategoryTree = Record<string, Set<string>>;

const QUICK_LINK_TAGS: Exclude<ProductTag, 'none'>[] = ['trending', 'offer', 'clearance', 'new'];

export function CategoryMenu() {
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState<CategoryTree>({});
  const [availableTags, setAvailableTags] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from('products').select('category, subcategory, tag');
      const next: CategoryTree = {};
      const tags = new Set<string>();
      (data || []).forEach((row) => {
        const cat = row.category || 'Uncategorised';
        if (!next[cat]) next[cat] = new Set();
        if (row.subcategory) next[cat].add(row.subcategory);
        if (row.tag && row.tag !== 'none') tags.add(row.tag);
      });
      setTree(next);
      setAvailableTags(tags);
    })();
  }, [open]);

  // Prevent the page behind the drawer from scrolling while it's open —
  // avoids the underlying page "showing through" below the drawer, especially
  // noticeable in full-page screenshots or on mobile browsers.
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
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
  const quickLinks = QUICK_LINK_TAGS.filter((t) => availableTags.has(t));

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
        <div className="fixed inset-0 z-50 flex" style={{ height: '100dvh' }}>
          <div
            className="absolute inset-0 bg-paper/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto overscroll-contain bg-ink shadow-xl">
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

            <div className="flex-1 px-4 py-4">
              {quickLinks.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {quickLinks.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => goToTag(tag)}
                      className="rounded-xl border border-signal bg-signal/5 px-3 py-3 text-sm font-bold text-signal hover:bg-signal hover:text-ink"
                    >
                      {TAG_LABELS[tag]}
                    </button>
                  ))}
                </div>
              )}

              {categories.length === 0 && (
                <p className="rounded-xl bg-panel px-4 py-6 text-center text-sm text-ash">
                  No categories yet — add products with a category in /admin.
                </p>
              )}

              <div className="space-y-2">
                {categories.map((cat) => {
                  const subs = Array.from(tree[cat]).sort();
                  const isExpanded = expanded === cat;
                  return (
                    <div
                      key={cat}
                      className={`overflow-hidden rounded-xl border transition ${
                        isExpanded ? 'border-signal bg-signal/5' : 'border-line bg-panel'
                      }`}
                    >
                      <button
                        onClick={() => {
                          if (subs.length > 0) {
                            setExpanded(isExpanded ? null : cat);
                          } else {
                            goTo(cat);
                          }
                        }}
                        className="flex w-full items-center justify-between px-4 py-4 text-left"
                      >
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            goTo(cat);
                          }}
                          className="font-display text-base font-bold text-paper hover:text-signal"
                        >
                          {cat}
                        </span>
                        {subs.length > 0 && (
                          <span
                            className={`text-sm text-ash transition-transform ${
                              isExpanded ? 'rotate-180 text-signal' : ''
                            }`}
                          >
                            ▾
                          </span>
                        )}
                      </button>
                      {isExpanded && subs.length > 0 && (
                        <div className="space-y-1 px-3 pb-3">
                          {subs.map((sub) => (
                            <button
                              key={sub}
                              onClick={() => goTo(cat, sub)}
                              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ash hover:bg-ink hover:text-signal"
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
        </div>
      )}
    </>
  );
}

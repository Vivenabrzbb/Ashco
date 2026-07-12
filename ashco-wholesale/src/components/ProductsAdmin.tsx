'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatGBP, type Product, type ProductTag } from '@/lib/types';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  in_stock: true,
  tag: 'none' as ProductTag,
};

export function ProductsAdmin({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: (product.price_pence / 100).toString(),
      image_url: product.image_url || '',
      in_stock: product.in_stock,
      tag: product.tag || 'none',
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) {
      setError(`Image upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    setForm((prev) => ({ ...prev, image_url: data.publicUrl }));
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Enter a valid price.');
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      price_pence: Math.round(priceNum * 100),
      image_url: form.image_url || null,
      in_stock: form.in_stock,
      tag: form.tag,
    };

    const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Could not save product.');
      setSaving(false);
      return;
    }

    if (editingId) {
      setProducts((prev) => prev.map((p) => (p.id === editingId ? data : p)));
    } else {
      setProducts((prev) => [data, ...prev]);
    }

    resetForm();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function toggleStock(product: Product) {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, in_stock: !product.in_stock }),
    });
    const data = await res.json();
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? data : p)));
    }
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[380px_1fr]">
      {/* Form */}
      <div className="h-fit rounded-2xl border border-line bg-panel p-6">
        <h2 className="mb-6 font-display text-lg font-bold text-paper">
          {editingId ? 'Edit product' : 'Add product'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-ash">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-paper focus:border-signal focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ash">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-paper focus:border-signal focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ash">Price (£)</span>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-paper focus:border-signal focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ash">Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="w-full text-sm text-ash file:mr-3 file:rounded-full file:border-0 file:bg-signal file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-ink"
            />
            {uploading && <p className="mt-1 text-xs text-ash">Uploading…</p>}
            {form.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="Preview" className="mt-2 h-24 w-full rounded-lg object-cover" />
            )}
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.in_stock}
              onChange={(e) => setForm((p) => ({ ...p, in_stock: e.target.checked }))}
              className="h-4 w-4 accent-signal"
            />
            <span className="text-sm text-ash">In stock</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ash">Badge</span>
            <select
              value={form.tag}
              onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value as ProductTag }))}
              className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-paper focus:border-signal focus:outline-none"
            >
              <option value="none">None</option>
              <option value="clearance">Clearance</option>
              <option value="trending">Trending</option>
              <option value="new">New</option>
            </select>
          </label>

          {error && (
            <p className="rounded-lg border border-signal/40 bg-signal/10 p-2 text-xs text-signal">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 rounded-full bg-signal py-2.5 font-display font-bold text-ink hover:bg-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-line px-4 text-sm text-ash hover:text-paper"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div>
        <h2 className="mb-6 font-display text-lg font-bold text-paper">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </h2>
        <div className="divide-y divide-line rounded-2xl border border-line bg-panel">
          {products.length === 0 && (
            <p className="p-8 text-center text-ash">No products yet — add your first one.</p>
          )}
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-4 p-4">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-line">
                {product.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-paper">{product.name}</p>
                <p className="text-sm text-ash">{formatGBP(product.price_pence)}</p>
              </div>
              <button
                onClick={() => toggleStock(product)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  product.in_stock ? 'bg-signal/20 text-signal' : 'bg-line text-ash'
                }`}
              >
                {product.in_stock ? 'In stock' : 'Out of stock'}
              </button>
              <button
                onClick={() => startEdit(product)}
                className="text-sm font-medium text-ash hover:text-signal"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="text-sm font-medium text-ash hover:text-signal"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

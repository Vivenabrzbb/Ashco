'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { useCart } from '@/components/CartProvider';
import { formatGBP } from '@/lib/types';

export default function CheckoutPage() {
  const { lines, subtotalPence, clear } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postcode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      clear();
      router.push(`/order-confirmation/${data.orderId}`);
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-xl px-6 py-24 text-center text-ash">
          <p className="mb-4">Your cart is empty.</p>
          <Link href="/" className="font-bold text-signal hover:underline">
            Browse stock →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-2 font-display text-3xl font-extrabold text-paper">Delivery details</h1>
        <p className="mb-10 text-ash">
          We&apos;ll generate an invoice and send it to you. Ashco Wholesale will contact you to
          confirm the order and arrange payment.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <input
                required
                value={form.customer_name}
                onChange={(e) => update('customer_name', e.target.value)}
                className="input"
                placeholder="Jordan Smith"
              />
            </Field>
            <Field label="Email" required>
              <input
                required
                type="email"
                value={form.customer_email}
                onChange={(e) => update('customer_email', e.target.value)}
                className="input"
                placeholder="jordan@company.co.uk"
              />
            </Field>
          </div>

          <Field label="Phone">
            <input
              value={form.customer_phone}
              onChange={(e) => update('customer_phone', e.target.value)}
              className="input"
              placeholder="07123 456789"
            />
          </Field>

          <Field label="Address line 1" required>
            <input
              required
              value={form.address_line1}
              onChange={(e) => update('address_line1', e.target.value)}
              className="input"
              placeholder="14 Warehouse Road"
            />
          </Field>

          <Field label="Address line 2">
            <input
              value={form.address_line2}
              onChange={(e) => update('address_line2', e.target.value)}
              className="input"
              placeholder="Unit 3"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Town / City" required>
              <input
                required
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                className="input"
                placeholder="Coventry"
              />
            </Field>
            <Field label="Postcode" required>
              <input
                required
                value={form.postcode}
                onChange={(e) => update('postcode', e.target.value.toUpperCase())}
                className="input"
                placeholder="CV1 5FB"
              />
            </Field>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-ash">{lines.length} item{lines.length > 1 ? 's' : ''}</span>
              <span className="font-display text-xl font-extrabold text-signal">
                {formatGBP(subtotalPence)}
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-signal/40 bg-signal/10 p-4 text-sm text-signal">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-signal py-4 text-center font-display font-bold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Placing order…' : 'Place order & generate invoice'}
          </button>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: #141414;
          border: 1px solid #262626;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: #F5F3EE;
        }
        .input:focus {
          outline: 2px solid #FF6000;
          border-color: #FF6000;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ash">
        {label} {required && <span className="text-signal">*</span>}
      </span>
      {children}
    </label>
  );
}

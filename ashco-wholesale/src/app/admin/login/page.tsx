'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-line bg-panel p-8">
        <h1 className="mb-1 font-display text-2xl font-extrabold text-paper">Ashco Admin</h1>
        <p className="mb-8 text-sm text-ash">Sign in to manage products and view orders.</p>

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-medium text-ash">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-paper focus:border-signal focus:outline-none"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-2 block text-sm font-medium text-ash">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-ink px-4 py-3 text-paper focus:border-signal focus:outline-none"
          />
        </label>

        {error && (
          <p className="mb-4 rounded-lg border border-signal/40 bg-signal/10 p-3 text-sm text-signal">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-signal py-3 font-display font-bold text-ink transition hover:bg-white disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

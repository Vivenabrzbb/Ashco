import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-line px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-display text-lg font-extrabold text-paper">
              ASHCO<span className="text-signal">.</span> Admin
            </Link>
            <nav className="flex gap-6 text-sm font-medium">
              <Link href="/admin" className="text-ash hover:text-signal">
                Products
              </Link>
              <Link href="/admin/orders" className="text-ash hover:text-signal">
                Orders
              </Link>
              <Link href="/" className="text-ash hover:text-signal">
                View store
              </Link>
            </nav>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

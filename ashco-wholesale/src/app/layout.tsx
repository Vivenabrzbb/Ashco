import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import { CartProvider } from '@/components/CartProvider';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'Ashco Wholesale',
  description: 'Bulk stock, straightforward ordering.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${dmSans.variable} font-body bg-ink text-paper`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

import { createClient } from '@/lib/supabase/server';
import { ProductsAdmin } from '@/components/ProductsAdmin';
import type { Product } from '@/lib/types';

export const revalidate = 0;

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  return <ProductsAdmin initialProducts={(products as Product[]) || []} />;
}

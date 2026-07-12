import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: body.name,
      description: body.description || '',
      price_pence: body.price_pence,
      image_url: body.image_url || null,
      in_stock: body.in_stock ?? true,
      tag: body.tag || 'none',
      category: body.category || 'Uncategorised',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

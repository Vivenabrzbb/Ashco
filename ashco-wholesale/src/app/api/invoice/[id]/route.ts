import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateInvoicePdf } from '@/lib/pdf';
import type { Order, OrderItem } from '@/lib/types';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', id);

  const pdfBytes = await generateInvoicePdf(order as Order, (items as OrderItem[]) || []);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${(order as Order).invoice_number}.pdf"`,
    },
  });
}

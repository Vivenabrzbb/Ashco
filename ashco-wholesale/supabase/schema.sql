-- Ashco Wholesale — Supabase schema
-- Run this in Supabase SQL Editor once, on a fresh project.

-- 1. PRODUCTS ---------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_pence integer not null check (price_pence >= 0), -- store money as integer pence, avoids float rounding
  image_url text,
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. ORDERS -------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  postcode text not null,
  status text not null default 'pending', -- pending | confirmed | paid | cancelled
  subtotal_pence integer not null,
  created_at timestamptz not null default now()
);

-- 3. ORDER ITEMS ---------------------------------------------------------
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,   -- snapshot, in case product changes/is deleted later
  unit_price_pence integer not null,
  quantity integer not null check (quantity > 0)
);

-- 4. SEQUENCE for human-readable invoice numbers -------------------------
create sequence if not exists invoice_number_seq start 1001;

-- Wraps nextval() so the API (PostgREST) can call it as an RPC function.
create or replace function nextval_invoice_number()
returns bigint
language sql
as $$
  select nextval('invoice_number_seq');
$$;

-- 5. ROW LEVEL SECURITY ---------------------------------------------------
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Anyone (anon) can read products that are in stock — this is the public storefront
create policy "public can read products"
  on products for select
  using (true);

-- Only authenticated users (you, logged into /admin) can write products
create policy "authenticated can insert products"
  on products for insert
  to authenticated
  with check (true);

create policy "authenticated can update products"
  on products for update
  to authenticated
  using (true);

create policy "authenticated can delete products"
  on products for delete
  to authenticated
  using (true);

-- Orders: nobody can read/write directly from the browser.
-- All order creation goes through the server-side API route using the service role key.
-- Only authenticated admins can read orders (for the dashboard).
create policy "authenticated can read orders"
  on orders for select
  to authenticated
  using (true);

create policy "authenticated can read order items"
  on order_items for select
  to authenticated
  using (true);

-- 6. Storage bucket for product images (optional, run once) --------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "authenticated can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "authenticated can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

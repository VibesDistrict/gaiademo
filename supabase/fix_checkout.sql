-- Fix checkout (run entire file in Supabase SQL Editor)

-- 1) Complete orders table if it existed before MVP
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists order_type text;
alter table public.orders alter column customer_name set default 'Cliente';
alter table public.orders alter column order_type set default 'pickup';
alter table public.orders add column if not exists fulfillment text;
alter table public.orders add column if not exists status text default 'pending_payment';
alter table public.orders add column if not exists address text;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_ref text;
alter table public.orders add column if not exists payment_proof_url text;
alter table public.orders add column if not exists subtotal_usd numeric(10,2) default 0;
alter table public.orders add column if not exists delivery_fee_usd numeric(10,2) default 0;
alter table public.orders add column if not exists total_usd numeric(10,2) default 0;
alter table public.orders add column if not exists rate_bs numeric(12,4) default 0;
alter table public.orders add column if not exists updated_at timestamptz default now();

-- 2) Storage bucket (no MIME restriction — iPhone a veces manda tipos raros)
insert into storage.buckets (id, name, public, file_size_limit)
values ('payment-proofs', 'payment-proofs', false, 10485760)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = null;

drop policy if exists "proofs_upload_own" on storage.objects;
create policy "proofs_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "proofs_update_own" on storage.objects;
create policy "proofs_update_own" on storage.objects
  for update using (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "proofs_read_own_or_admin" on storage.objects;
create policy "proofs_read_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'payment-proofs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

-- 3) order_items + RLS
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name_snapshot text not null,
  unit_price_usd numeric(10,2) not null,
  qty int not null check (qty > 0)
);

alter table public.order_items enable row level security;

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- 4) Orders RLS (re-apply in case missing)
alter table public.orders enable row level security;

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

drop policy if exists "orders_update_own_pending" on public.orders;
create policy "orders_update_own_pending" on public.orders
  for update using (
    (auth.uid() = user_id and status in ('pending_payment', 'payment_review'))
    or public.is_admin()
  )
  with check (
    (auth.uid() = user_id and status in ('pending_payment', 'payment_review'))
    or public.is_admin()
  );

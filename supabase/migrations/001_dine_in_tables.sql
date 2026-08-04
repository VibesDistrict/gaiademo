-- Gaia Pasta: Dinner In + mesas QR
-- Run after base schema.sql

-- Allow dine_in fulfillment
alter table public.orders drop constraint if exists orders_fulfillment_check;
alter table public.orders
  add constraint orders_fulfillment_check
  check (fulfillment in ('pickup', 'delivery', 'dine_in'));

-- Restaurant tables
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  number int not null unique check (number > 0),
  code text not null unique,
  label text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists table_id uuid references public.tables (id) on delete set null;

create index if not exists orders_table_id_idx on public.orders (table_id);
create index if not exists tables_code_idx on public.tables (code);

alter table public.tables enable row level security;

drop policy if exists "tables_public_read_active" on public.tables;
create policy "tables_public_read_active" on public.tables
  for select using (active = true or public.is_admin());

drop policy if exists "tables_admin_write" on public.tables;
create policy "tables_admin_write" on public.tables
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed 12 mesas (safe if re-run)
insert into public.tables (number, code, label)
select
  n,
  'mesa-' || n,
  'Mesa ' || n
from generate_series(1, 12) as n
on conflict (number) do nothing;

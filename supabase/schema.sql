-- Gaia Pasta schema: run in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- Restaurant tables (Dinner In / QR)
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  number int not null unique check (number > 0),
  code text not null unique,
  label text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_usd numeric(10,2) not null check (price_usd >= 0),
  image_url text,
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Payment accounts (pago móvil, tarjeta, binance)
create table if not exists public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  method text not null check (method in ('pago_movil', 'tarjeta', 'binance')),
  label text not null,
  details jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Key/value settings
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fulfillment text not null check (fulfillment in ('pickup', 'delivery', 'dine_in')),
  table_id uuid references public.tables (id) on delete set null,
  status text not null default 'pending_payment' check (
    status in (
      'pending_payment',
      'payment_review',
      'confirmed',
      'preparing',
      'ready',
      'delivered',
      'picked_up',
      'cancelled'
    )
  ),
  address text,
  notes text,
  payment_method text check (payment_method in ('pago_movil', 'tarjeta', 'binance')),
  payment_ref text,
  payment_proof_url text,
  subtotal_usd numeric(10,2) not null default 0,
  delivery_fee_usd numeric(10,2) not null default 0,
  total_usd numeric(10,2) not null default 0,
  rate_bs numeric(12,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name_snapshot text not null,
  unit_price_usd numeric(10,2) not null,
  qty int not null check (qty > 0)
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.profiles_prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'No autorizado para cambiar el rol';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_orders_updated_at();

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.profiles_prevent_role_escalation();

-- RLS
alter table public.profiles enable row level security;
alter table public.tables enable row level security;
alter table public.products enable row level security;
alter table public.payment_accounts enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "tables_public_read_active" on public.tables;
create policy "tables_public_read_active" on public.tables
  for select using (active = true or public.is_admin());

drop policy if exists "tables_admin_write" on public.tables;
create policy "tables_admin_write" on public.tables
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id and role = 'customer');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (true);

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payment_accounts_public_read" on public.payment_accounts;
create policy "payment_accounts_public_read" on public.payment_accounts
  for select using (active = true or public.is_admin());

drop policy if exists "payment_accounts_admin_write" on public.payment_accounts;
create policy "payment_accounts_admin_write" on public.payment_accounts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings
  for select using (true);

drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

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

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- Saved delivery addresses
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default '',
  address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_addresses_user_id_idx
  on public.customer_addresses (user_id);

create or replace function public.customer_addresses_single_default()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_default then
    update public.customer_addresses
    set is_default = false, updated_at = now()
    where user_id = new.user_id and id is distinct from new.id;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customer_addresses_single_default on public.customer_addresses;
create trigger customer_addresses_single_default
  before insert or update on public.customer_addresses
  for each row execute function public.customer_addresses_single_default();

alter table public.customer_addresses enable row level security;

drop policy if exists "customer_addresses_select_own" on public.customer_addresses;
create policy "customer_addresses_select_own" on public.customer_addresses
  for select using (auth.uid() = user_id);

drop policy if exists "customer_addresses_insert_own" on public.customer_addresses;
create policy "customer_addresses_insert_own" on public.customer_addresses
  for insert with check (auth.uid() = user_id);

drop policy if exists "customer_addresses_update_own" on public.customer_addresses;
create policy "customer_addresses_update_own" on public.customer_addresses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "customer_addresses_delete_own" on public.customer_addresses;
create policy "customer_addresses_delete_own" on public.customer_addresses
  for delete using (auth.uid() = user_id);

-- Feedback (reviews + suggestions)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  type text not null check (type in ('review', 'suggestion')),
  rating int check (rating is null or (rating >= 1 and rating <= 5)),
  message text not null default '',
  customer_name text not null default '',
  read_by_admin boolean not null default false,
  created_at timestamptz not null default now(),
  constraint feedback_review_rating check (
    type = 'suggestion'
    or (type = 'review' and rating is not null)
  )
);

create unique index if not exists feedback_review_order_unique
  on public.feedback (user_id, order_id)
  where type = 'review' and order_id is not null;

alter table public.feedback enable row level security;

drop policy if exists "feedback_select_own_or_admin" on public.feedback;
create policy "feedback_select_own_or_admin" on public.feedback
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback
  for insert with check (
    auth.uid() = user_id
    and (
      type = 'suggestion'
      or (
        type = 'review'
        and order_id is not null
        and rating is not null
        and exists (
          select 1 from public.orders o
          where o.id = order_id
            and o.user_id = auth.uid()
            and o.status in ('delivered', 'picked_up')
        )
      )
    )
  );

drop policy if exists "feedback_update_admin" on public.feedback;
create policy "feedback_update_admin" on public.feedback
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "feedback_delete_admin" on public.feedback;
create policy "feedback_delete_admin" on public.feedback
  for delete using (public.is_admin());

-- Storage bucket for payment proofs
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

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

-- Seed settings
insert into public.settings (key, value) values
  ('rate_bs', '36.50'),
  ('auto_bcv_rate', 'true'),
  ('rate_bs_updated_at', ''),
  ('delivery_fee_usd', '2.00'),
  ('min_order_usd', '5.00'),
  ('store_closed', 'false'),
  ('whatsapp', '584121234567'),
  ('open_hours', 'Martes a Domingo 4:00pm - 10:00pm'),
  ('auto_whatsapp_notify', 'true'),
  ('pickup_address', ''),
  ('notify_customer_on_status', 'true'),
  ('instagram', ''),
  ('tiktok', ''),
  ('facebook', ''),
  ('promo_enabled', 'false'),
  ('promo_sponsor', ''),
  ('promo_title', ''),
  ('promo_subtitle', ''),
  ('promo_link', ''),
  ('promo_image_url', ''),
  ('promo_cta', 'Ver más')
on conflict (key) do nothing;

-- Seed products (only if empty)
insert into public.products (name, description, price_usd, available, sort_order)
select * from (values
  ('Fettuccine Alfredo', 'Crema, parmesano y toque de pimienta.', 9.50::numeric, true, 1),
  ('Penne Arrabbiata', 'Salsa de tomate picante y ajo.', 8.50, true, 2),
  ('Spaghetti Bolognese', 'Ragú de carne lento y hierbas.', 9.00, true, 3),
  ('Ravioli de ricotta', 'Rellenos con salsa rosa.', 10.00, true, 4),
  ('Farfalle pesto', 'Pesto casero y cherry.', 9.00, true, 5),
  ('Camarones en salsa blanca', 'Fettuccine cremoso con camarones.', 12.50, true, 6)
) as v(name, description, price_usd, available, sort_order)
where not exists (select 1 from public.products limit 1);

-- Seed mesas Dinner In (1–12)
insert into public.tables (number, code, label)
select n, 'mesa-' || n, 'Mesa ' || n
from generate_series(1, 12) as n
on conflict (number) do nothing;

-- Seed payment accounts (only if empty)
insert into public.payment_accounts (method, label, details, active)
select * from (values
  (
    'pago_movil',
    'Pago móvil',
    '{"bank":"Banesco","phone":"0412-0000000","cedula":"V-00000000","name":"Gaia Pasta"}'::jsonb,
    true
  ),
  (
    'tarjeta',
    'Transferencia / tarjeta',
    '{"bank":"Banesco","account":"0134-0000-00-0000000000","rif":"J-00000000-0","name":"Gaia Pasta"}'::jsonb,
    true
  ),
  (
    'binance',
    'Binance Pay / USDT',
    '{"network":"USDT TRC20","wallet":"TU_WALLET_AQUI","note":"Envía captura del pago"}'::jsonb,
    true
  )
) as v(method, label, details, active)
where not exists (select 1 from public.payment_accounts limit 1);

-- After first admin signup, promote with:
-- update public.profiles set role = 'admin' where id = '<user-uuid>';

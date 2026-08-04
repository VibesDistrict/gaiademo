-- Promo patrocinador + archivo de pedidos (ejecutar en Supabase SQL Editor)

-- Archivo de pedidos viejos
alter table public.orders add column if not exists archived boolean not null default false;
alter table public.orders add column if not exists archived_at timestamptz;

create index if not exists orders_archived_created_idx
  on public.orders (archived, created_at desc);

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin" on public.orders
  for delete using (public.is_admin());

-- Seeds promo (opcional)
insert into public.settings (key, value) values
  ('promo_enabled', 'false'),
  ('promo_sponsor', ''),
  ('promo_title', ''),
  ('promo_subtitle', ''),
  ('promo_link', ''),
  ('promo_image_url', ''),
  ('promo_cta', 'Ver más')
on conflict (key) do nothing;

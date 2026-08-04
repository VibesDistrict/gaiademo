-- Gaia Pasta Rewards: run once in Supabase SQL Editor
-- Estrellas por pedido completado (subtotal >= umbral), canje en checkout

alter table public.profiles
  add column if not exists loyalty_stars int not null default 0,
  add column if not exists loyalty_rewards_count int not null default 0;

alter table public.orders
  add column if not exists loyalty_star_earned boolean not null default false,
  add column if not exists loyalty_reward_applied boolean not null default false;

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_transactions_user_id_idx
  on public.loyalty_transactions (user_id, created_at desc);

create unique index if not exists loyalty_transactions_order_reason_uidx
  on public.loyalty_transactions (order_id, reason)
  where order_id is not null;

insert into public.settings (key, value) values
  ('loyalty_enabled', 'true'),
  ('loyalty_min_subtotal_usd', '20'),
  ('loyalty_stars_required', '5'),
  ('loyalty_reward_product_id', '')
on conflict (key) do nothing;

-- Impide que el cliente manipule sus estrellas
create or replace function public.profiles_prevent_loyalty_tamper()
returns trigger
language plpgsql
as $$
begin
  if new.loyalty_stars is distinct from old.loyalty_stars
     or new.loyalty_rewards_count is distinct from old.loyalty_rewards_count then
    if not public.is_admin() then
      new.loyalty_stars := old.loyalty_stars;
      new.loyalty_rewards_count := old.loyalty_rewards_count;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_loyalty_tamper on public.profiles;
create trigger profiles_prevent_loyalty_tamper
  before update on public.profiles
  for each row execute function public.profiles_prevent_loyalty_tamper();

create or replace function public.handle_order_loyalty()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enabled boolean;
  v_min numeric;
  v_required int;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  v_enabled := coalesce(
    (select value from public.settings where key = 'loyalty_enabled'),
    'false'
  ) = 'true';
  v_min := coalesce(
    (select nullif(value, '')::numeric from public.settings where key = 'loyalty_min_subtotal_usd'),
    20
  );

  if new.status in ('delivered', 'picked_up')
     and old.status not in ('delivered', 'picked_up')
     and not new.loyalty_reward_applied
     and not new.loyalty_star_earned
     and v_enabled
     and new.subtotal_usd >= v_min then
    update public.profiles
      set loyalty_stars = loyalty_stars + 1
      where id = new.user_id;

    insert into public.loyalty_transactions (user_id, order_id, delta, reason)
    values (new.user_id, new.id, 1, 'order_completed')
    on conflict do nothing;

    new.loyalty_star_earned := true;
  end if;

  if new.status = 'cancelled'
     and old.status <> 'cancelled'
     and old.loyalty_star_earned then
    update public.profiles
      set loyalty_stars = greatest(0, loyalty_stars - 1)
      where id = new.user_id;

    insert into public.loyalty_transactions (user_id, order_id, delta, reason)
    values (new.user_id, new.id, -1, 'order_cancelled')
    on conflict do nothing;

    new.loyalty_star_earned := false;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_loyalty on public.orders;
create trigger orders_loyalty
  before update on public.orders
  for each row execute function public.handle_order_loyalty();

create or replace function public.redeem_loyalty_reward(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_stars int;
  v_required int;
  v_product_id uuid;
  v_product_name text;
  v_enabled boolean;
begin
  select user_id into v_user_id
  from public.orders
  where id = p_order_id;

  if v_user_id is null or v_user_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  if exists (
    select 1 from public.orders
    where id = p_order_id and loyalty_reward_applied
  ) then
    return;
  end if;

  v_enabled := coalesce(
    (select value from public.settings where key = 'loyalty_enabled'),
    'false'
  ) = 'true';
  v_required := coalesce(
    (select nullif(value, '')::int from public.settings where key = 'loyalty_stars_required'),
    5
  );
  v_product_id := nullif(
    (select value from public.settings where key = 'loyalty_reward_product_id'),
    ''
  )::uuid;

  select loyalty_stars into v_stars
  from public.profiles
  where id = v_user_id;

  if not v_enabled or v_product_id is null or coalesce(v_stars, 0) < v_required then
    raise exception 'No tienes estrellas suficientes para canjear';
  end if;

  select name into v_product_name
  from public.products
  where id = v_product_id and available = true;

  if v_product_name is null then
    raise exception 'Producto de recompensa no disponible';
  end if;

  update public.profiles
  set
    loyalty_stars = loyalty_stars - v_required,
    loyalty_rewards_count = loyalty_rewards_count + 1
  where id = v_user_id;

  insert into public.loyalty_transactions (user_id, order_id, delta, reason)
  values (v_user_id, p_order_id, -v_required, 'reward_redemption');

  insert into public.order_items (
    order_id,
    product_id,
    name_snapshot,
    unit_price_usd,
    qty
  ) values (
    p_order_id,
    v_product_id,
    v_product_name || ' (Recompensa)',
    0,
    1
  );

  update public.orders
  set loyalty_reward_applied = true
  where id = p_order_id;
end;
$$;

grant execute on function public.redeem_loyalty_reward(uuid) to authenticated;

alter table public.loyalty_transactions enable row level security;

drop policy if exists "loyalty_transactions_select_own_or_admin" on public.loyalty_transactions;
create policy "loyalty_transactions_select_own_or_admin" on public.loyalty_transactions
  for select using (auth.uid() = user_id or public.is_admin());

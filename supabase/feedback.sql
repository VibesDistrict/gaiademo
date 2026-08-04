-- Feedback: reviews (post-order) and suggestions
-- Run in Supabase SQL Editor

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

create index if not exists feedback_type_created_idx
  on public.feedback (type, created_at desc);

create index if not exists feedback_unread_idx
  on public.feedback (read_by_admin, created_at desc)
  where read_by_admin = false;

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

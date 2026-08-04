-- Run once in Supabase SQL Editor for live admin alerts + WhatsApp auto-open

-- 1) Enable Realtime on orders (admin panel hears new orders instantly)
alter publication supabase_realtime add table public.orders;

-- 2) Setting: open WhatsApp when customer confirms order
insert into public.settings (key, value) values
  ('auto_whatsapp_notify', 'true')
on conflict (key) do nothing;

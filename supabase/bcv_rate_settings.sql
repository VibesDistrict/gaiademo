-- Tasa BCV automática (proyectos existentes)
insert into settings (key, value)
values
  ('auto_bcv_rate', 'true'),
  ('rate_bs_updated_at', '')
on conflict (key) do nothing;

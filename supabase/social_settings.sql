-- Redes sociales en settings (proyectos existentes)
insert into settings (key, value)
values
  ('instagram', ''),
  ('tiktok', ''),
  ('facebook', '')
on conflict (key) do nothing;

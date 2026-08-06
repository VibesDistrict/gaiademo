-- Promover un usuario existente a admin (ejecutar en Supabase → SQL Editor)
--
-- 1) La persona debe registrarse antes en la app (correo + contraseña).
-- 2) Reemplaza el correo abajo por el de la nueva admin.
-- 3) Ejecuta TODO este script de una vez.

create or replace function public.profiles_prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'No autorizado para cambiar el rol';
  end if;
  return new;
end;
$$;

insert into public.profiles (id, full_name, phone, role)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'phone', ''),
  'admin'
from auth.users u
where lower(u.email) = lower('SEGUNDO_ADMIN@CORREO.COM')
on conflict (id) do update
set role = 'admin';

-- Verifica que quedó bien:
select p.id, p.full_name, p.phone, p.role, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin'
order by p.full_name;

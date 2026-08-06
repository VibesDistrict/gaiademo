-- Promueve wdiesel66@gmail.com a admin.
-- Ejecutar TODO de una vez en Supabase → SQL Editor
-- Proyecto correcto: alrfuxnaonpiyrzjzxpd (Gaia Pasta)

-- 1) Diagnóstico: ¿existe el usuario?
select id, email, created_at, email_confirmed_at
from auth.users
where lower(email) = lower('wdiesel66@gmail.com');

-- 2) Permitir promoción desde SQL Editor (auth.uid() es null ahí)
create or replace function public.profiles_prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- SQL Editor / service role no tienen sesión de usuario
  if auth.uid() is null then
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'No autorizado para cambiar el rol';
  end if;
  return new;
end;
$$;

-- 3) Promover (o crear perfil) por email
insert into public.profiles (id, full_name, phone, role)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), 'Will'),
  coalesce(u.raw_user_meta_data->>'phone', ''),
  'admin'
from auth.users u
where lower(u.email) = lower('wdiesel66@gmail.com')
on conflict (id) do update
set role = 'admin';

-- 4) Verificación final (debe mostrar role = admin)
select p.id, p.full_name, p.role, u.email
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('wdiesel66@gmail.com');

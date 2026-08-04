-- Promover un usuario existente a admin (ejecutar en Supabase → SQL Editor)
--
-- 1) La persona debe registrarse antes en la app (correo + contraseña).
-- 2) Reemplaza el correo abajo por el de la nueva admin.
-- 3) Ejecuta TODO este script de una vez.

-- El trigger bloquea cambios de rol si no hay sesión admin (auth.uid() es null en SQL Editor).
alter table public.profiles disable trigger profiles_prevent_role_escalation;

update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where lower(email) = lower('SEGUNDO_ADMIN@CORREO.COM')
  limit 1
);

alter table public.profiles enable trigger profiles_prevent_role_escalation;

-- Verifica que quedó bien (debe listar todos los admins):
select p.id, p.full_name, p.phone, p.role, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin'
order by p.full_name;

-- Limpia wdiesel66@gmail.com y deja el signup listo para nacer como admin.
-- Ejecutar TODO de una vez en Supabase → SQL Editor
-- Proyecto: alrfuxnaonpiyrzjzxpd

-- 0) Ver qué hay antes
select id, email, created_at
from auth.users
where lower(email) = lower('wdiesel66@gmail.com');

-- 1) Borrar usuario Auth (cascade limpia profiles, orders, addresses, feedback, loyalty…)
-- Nota: no borrar storage.objects por SQL (Supabase lo bloquea).
-- Si hay comprobantes huérfanos, bórralos luego en Storage → payment-proofs.
delete from auth.users
where lower(email) = lower('wdiesel66@gmail.com');

-- 2) Confirmar que ya no existe
select id, email
from auth.users
where lower(email) = lower('wdiesel66@gmail.com');
-- ↑ debe devolver 0 filas

-- 3) Al registrarse de nuevo, este correo nace como admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'customer';
begin
  if lower(coalesce(new.email, '')) = lower('wdiesel66@gmail.com') then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 4) Mantener el trigger de rol usable desde SQL Editor
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

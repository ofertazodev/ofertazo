-- Bootstrap the initial Ofertazo administrator.
-- This is intentionally limited to the project owner's verified account.
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = lower('ofertazodev@gmail.com')
on conflict (user_id, role) do nothing;

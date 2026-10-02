-- Allow authenticated administrators to create and maintain catalog records.
insert into public.country_settings (country_code, name, default_currency_code, timezone)
values ('BO', 'Bolivia', 'BOB', 'America/La_Paz')
on conflict (country_code) do nothing;

create policy country_settings_admin_write on public.country_settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

grant insert, update, delete on public.country_settings to authenticated;
grant insert, update, delete on public.destinations to authenticated;
grant insert, update, delete on public.providers to authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert, update, delete on public.offers to authenticated;
grant insert, update, delete on public.product_media to authenticated;

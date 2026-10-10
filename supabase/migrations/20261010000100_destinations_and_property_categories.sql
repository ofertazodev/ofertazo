-- TripYa feedback (2026-10-10):
-- 1. More tourist cities for the "Lugares" filter. Admins can add, edit, hide or delete them from /admin.
-- 2. Accommodation categories become the 8 groups travelers choose from.

-- ---------------------------------------------------------------------------
-- 1. Cities
-- ---------------------------------------------------------------------------
insert into public.destinations (country_code, name, slug, kind, description, is_published, sort_order) values
  ('BO', 'El Alto', 'el-alto', 'city', 'Vista panorámica de La Paz, ferias y arquitectura cholet.', true, 9),
  ('BO', 'Samaipata', 'samaipata', 'city', 'Pueblo de valle, El Fuerte, viñedos y el Parque Amboró.', true, 10),
  ('BO', 'Copacabana', 'copacabana', 'city', 'A orillas del Titicaca y puerta a la Isla del Sol.', true, 11),
  ('BO', 'Coroico', 'coroico', 'city', 'Yungas, clima cálido, cafetales y el famoso Camino de la Muerte.', true, 12),
  ('BO', 'Rurrenabaque', 'rurrenabaque', 'city', 'Amazonía, pampas y la entrada al Parque Madidi.', true, 13),
  ('BO', 'Torotoro', 'torotoro', 'city', 'Cañones, cavernas y huellas de dinosaurio.', true, 14),
  ('BO', 'Tupiza', 'tupiza', 'city', 'Paisajes rojos del sur, quebradas y la ruta al salar.', true, 15)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Accommodation categories
--    hotel, apartment, house_villa, hostel, ecolodge, cabin, boutique_hotel, glamping
-- ---------------------------------------------------------------------------
alter table public.products drop constraint if exists products_property_type_valid;

update public.products set property_type = case property_type
    when 'resort' then 'hotel'
    when 'villa' then 'house_villa'
    when 'vacation_home' then 'house_villa'
    when 'lodge' then 'ecolodge'
    else property_type
  end
where property_type in ('resort', 'villa', 'vacation_home', 'lodge');

update public.provider_applications set property_type = case property_type
    when 'resort' then 'hotel'
    when 'villa' then 'house_villa'
    when 'vacation_home' then 'house_villa'
    when 'lodge' then 'ecolodge'
    else property_type
  end
where property_type in ('resort', 'villa', 'vacation_home', 'lodge');

alter table public.products
  add constraint products_property_type_valid check (
    property_type is null
    or property_type in ('hotel', 'apartment', 'house_villa', 'hostel', 'ecolodge', 'cabin', 'boutique_hotel', 'glamping')
  );

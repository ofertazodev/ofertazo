-- Sample offers so the catalog doesn't look empty during the pilot.
-- They are regular rows (admins can edit or delete them from /admin) flagged with products.is_sample:
-- the site labels them "Ejemplo" and they can never be booked (trigger below).
-- Photos are real, freely licensed images from Wikimedia Commons, credited in each description.

alter table public.products add column if not exists is_sample boolean not null default false;
comment on column public.products.is_sample is 'Demo listing shown to fill the catalog. Labeled on the site and never bookable.';

create or replace function public.reject_sample_bookings()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if exists (select 1 from public.products where id = new.product_id and is_sample) then
    raise exception 'offer_not_found';
  end if;
  return new;
end;
$fn$;

drop trigger if exists booking_items_reject_samples on public.booking_items;
create trigger booking_items_reject_samples
before insert on public.booking_items
for each row execute function public.reject_sample_bookings();

-- Owned by the first admin; nothing is inserted if no admin exists yet.
insert into public.providers (owner_id, legal_name, trade_name, email, country_code, status)
select r.user_id, 'Tripya (ejemplos)', 'Tripya ejemplos', 'ejemplos@tripya.invalid', 'BO', 'approved'
from public.user_roles r
where r.role = 'admin'
  and not exists (select 1 from public.providers where trade_name = 'Tripya ejemplos')
order by r.user_id
limit 1;

-- Hotel con vista al Illimani
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes,
    property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy, check_in_time, check_out_time,
    latitude, longitude, is_published, is_sample)
  select pv.id, d.id, 'accommodation'::public.product_type, 'ejemplo-hotel-vista-illimani', 'Hotel con vista al Illimani', 'Habitación doble en un hotel tranquilo de la zona sur de La Paz, con desayuno buffet y vista despejada al Illimani. A pocos minutos del teleférico y del Valle de la Luna.

Fotos de referencia: Kurt Kaiser (CC0); juhauski72 (CC BY 2.0), vía Wikimedia Commons.', 'BOB', 52000, 'Habitación doble + desayuno', array['Desayuno buffet', 'Wi-Fi', 'Calefacción']::text[],
    'hotel', 'per_night', 2, 1, array['wifi', 'breakfast', 'heating', 'view']::text[], 'Oferta de ejemplo: no se puede reservar.', 'Oferta de ejemplo.', '14:00', '11:00',
    -16.54, -68.08, true, true
  from public.providers pv
  join public.destinations d on d.slug = 'la-paz'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/Bed in hotel room 5.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Bed_in_hotel_room_5.jpg/1280px-Bed_in_hotel_room_5.jpg', 'Hotel con vista al Illimani', 0),
    ('external/wikimedia/Illimani from the outskirts La Paz.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/Illimani_from_the_outskirts_La_Paz.jpg/1280px-Illimani_from_the_outskirts_La_Paz.jpg', 'Hotel con vista al Illimani', 1)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'normal'::public.offer_kind, 'Hotel con vista al Illimani', 52000, 39000, 'BOB', now(), null, true, true
from ins;

-- Departamento moderno en Equipetrol
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes,
    property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy, check_in_time, check_out_time,
    latitude, longitude, is_published, is_sample)
  select pv.id, d.id, 'accommodation'::public.product_type, 'ejemplo-departamento-equipetrol', 'Departamento moderno en Equipetrol', 'Departamento luminoso de dos dormitorios en Equipetrol, la zona de restaurantes y vida nocturna de Santa Cruz. Edificio con piscina y parqueo.

Fotos de referencia: Lo (CC0); EEJCC (CC BY-SA 4.0), vía Wikimedia Commons.', 'BOB', 45000, '2 dormitorios, hasta 4 personas', array['Piscina del edificio', 'Parqueo', 'Cocina equipada']::text[],
    'apartment', 'per_night', 4, 2, array['wifi', 'air_conditioning', 'kitchen', 'parking', 'pool']::text[], 'Oferta de ejemplo: no se puede reservar.', 'Oferta de ejemplo.', '14:00', '11:00',
    -17.77, -63.195, true, true
  from public.providers pv
  join public.destinations d on d.slug = 'santa-cruz'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/The living room that needs houseplants.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/The_living_room_that_needs_houseplants.jpg/1280px-The_living_room_that_needs_houseplants.jpg', 'Departamento moderno en Equipetrol', 0),
    ('external/wikimedia/Edificios en Equipetrol, Santa Cruz de la Sierra, Bolivia.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Edificios_en_Equipetrol%2C_Santa_Cruz_de_la_Sierra%2C_Bolivia.jpg/1280px-Edificios_en_Equipetrol%2C_Santa_Cruz_de_la_Sierra%2C_Bolivia.jpg', 'Departamento moderno en Equipetrol', 1)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'normal'::public.offer_kind, 'Departamento moderno en Equipetrol', 45000, 32000, 'BOB', now(), null, false, true
from ins;

-- Casa con piscina en Samaipata
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes,
    property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy, check_in_time, check_out_time,
    latitude, longitude, is_published, is_sample)
  select pv.id, d.id, 'accommodation'::public.product_type, 'ejemplo-casa-piscina-samaipata', 'Casa con piscina en Samaipata', 'Casa de campo para grupos y familias a 10 minutos del pueblo de Samaipata, con piscina, jardín y parrilla. Ideal para visitar El Fuerte y el Parque Amboró.

Fotos de referencia: Rospompom (CC BY-SA 3.0); Rospompom (CC BY-SA 3.0), vía Wikimedia Commons.', 'BOB', 120000, 'Casa completa, hasta 8 personas', array['Piscina privada', 'Parrilla', 'Jardín']::text[],
    'house_villa', 'per_night', 8, 2, array['pool', 'garden', 'bbq', 'parking', 'wifi', 'kitchen', 'pets']::text[], 'Oferta de ejemplo: no se puede reservar.', 'Oferta de ejemplo.', '14:00', '11:00',
    -18.179, -63.875, true, true
  from public.providers pv
  join public.destinations d on d.slug = 'samaipata'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/Sangker Villa Book - 4.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/Sangker_Villa_Book_-_4.jpg/1280px-Sangker_Villa_Book_-_4.jpg', 'Casa con piscina en Samaipata', 0),
    ('external/wikimedia/Sangker Villa Book - 7.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Sangker_Villa_Book_-_7.jpg/1280px-Sangker_Villa_Book_-_7.jpg', 'Casa con piscina en Samaipata', 1)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'flash'::public.offer_kind, 'Casa con piscina en Samaipata', 120000, 89000, 'BOB', now(), now() + interval '5 days', true, true
from ins;

-- Hostal en el centro histórico de Sucre
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes,
    property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy, check_in_time, check_out_time,
    latitude, longitude, is_published, is_sample)
  select pv.id, d.id, 'accommodation'::public.product_type, 'ejemplo-hostal-centro-sucre', 'Hostal en el centro histórico de Sucre', 'Hostal sencillo y limpio a dos cuadras de la plaza 25 de Mayo. Habitaciones privadas y compartidas, desayuno incluido y terraza con vista a los techos de la ciudad blanca.

Fotos de referencia: Ciacho5 (CC BY-SA 4.0); Parallelepiped09 (CC BY-SA 4.0), vía Wikimedia Commons.', 'BOB', 16000, 'Habitación privada + desayuno', array['Desayuno', 'Wi-Fi', 'Terraza común']::text[],
    'hostel', 'per_night', 2, 1, array['wifi', 'breakfast']::text[], 'Oferta de ejemplo: no se puede reservar.', 'Oferta de ejemplo.', '14:00', '11:00',
    -19.048, -65.26, true, true
  from public.providers pv
  join public.destinations d on d.slug = 'sucre'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/Schronisko Magurka A 871.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Schronisko_Magurka_A_871.jpg/1280px-Schronisko_Magurka_A_871.jpg', 'Hostal en el centro histórico de Sucre', 0),
    ('external/wikimedia/Sucre Street.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0e/Sucre_Street.jpg/1280px-Sucre_Street.jpg', 'Hostal en el centro histórico de Sucre', 1)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'normal'::public.offer_kind, 'Hostal en el centro histórico de Sucre', 16000, 12000, 'BOB', now(), null, false, true
from ins;

-- Ecolodge en la selva de Rurrenabaque
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes,
    property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy, check_in_time, check_out_time,
    latitude, longitude, is_published, is_sample)
  select pv.id, d.id, 'accommodation'::public.product_type, 'ejemplo-ecolodge-rurrenabaque', 'Ecolodge en la selva de Rurrenabaque', 'Programa de 3 días en un ecolodge a orillas del río, rodeado de selva amazónica. Incluye traslados en bote, todas las comidas y caminatas guiadas para ver monos, aves y caimanes.

Fotos de referencia: James Martins (CC BY 3.0); Gabrarq77 (CC BY-SA 4.0), vía Wikimedia Commons.', 'BOB', 210000, '3 días / 2 noches, todo incluido', array['Traslado en bote', 'Todas las comidas', 'Guía naturalista']::text[],
    'ecolodge', 'per_person', 6, 2, array['restaurant', 'view', 'garden']::text[], 'Oferta de ejemplo: no se puede reservar.', 'Oferta de ejemplo.', '14:00', '11:00',
    -14.442, -67.528, true, true
  from public.providers pv
  join public.destinations d on d.slug = 'rurrenabaque'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/Amazon rainforest jungle resort - panoramio.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Amazon_rainforest_jungle_resort_-_panoramio.jpg/1280px-Amazon_rainforest_jungle_resort_-_panoramio.jpg', 'Ecolodge en la selva de Rurrenabaque', 0),
    ('external/wikimedia/Rio Beni, Rurrenabaque.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Rio_Beni%2C_Rurrenabaque.jpg/1280px-Rio_Beni%2C_Rurrenabaque.jpg', 'Ecolodge en la selva de Rurrenabaque', 1)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'normal'::public.offer_kind, 'Ecolodge en la selva de Rurrenabaque', 210000, 165000, 'BOB', now(), null, true, true
from ins;

-- Cabañas entre las nubes de Coroico
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes,
    property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy, check_in_time, check_out_time,
    latitude, longitude, is_published, is_sample)
  select pv.id, d.id, 'accommodation'::public.product_type, 'ejemplo-cabanas-coroico', 'Cabañas entre las nubes de Coroico', 'Cabañas de madera con terraza propia y vista a los Yungas, piscina y zona de parrilla. Clima cálido todo el año, a tres horas de La Paz.

Fotos de referencia: Forest Service Northern Region from Missoula, MT, USA (Public domain); Alhen (CC BY-SA 4.0), vía Wikimedia Commons.', 'BOB', 38000, 'Cabaña para 4 personas', array['Terraza privada', 'Piscina', 'Parrilla']::text[],
    'cabin', 'per_night', 4, 1, array['pool', 'view', 'bbq', 'wifi', 'parking']::text[], 'Oferta de ejemplo: no se puede reservar.', 'Oferta de ejemplo.', '14:00', '11:00',
    -16.188, -67.727, true, true
  from public.providers pv
  join public.destinations d on d.slug = 'coroico'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/Schnaus Cabin (7563230812).jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Schnaus_Cabin_%287563230812%29.jpg/1280px-Schnaus_Cabin_%287563230812%29.jpg', 'Cabañas entre las nubes de Coroico', 0),
    ('external/wikimedia/Coroico nubes y montañas.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/Coroico_nubes_y_monta%C3%B1as.jpg/1280px-Coroico_nubes_y_monta%C3%B1as.jpg', 'Cabañas entre las nubes de Coroico', 1)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'normal'::public.offer_kind, 'Cabañas entre las nubes de Coroico', 38000, 29000, 'BOB', now(), null, false, true
from ins;

-- Hotel boutique colonial en Sucre
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes,
    property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy, check_in_time, check_out_time,
    latitude, longitude, is_published, is_sample)
  select pv.id, d.id, 'accommodation'::public.product_type, 'ejemplo-hotel-boutique-sucre', 'Hotel boutique colonial en Sucre', 'Casona colonial restaurada con patio interior, solo doce habitaciones y restaurante propio. A pasos de la Recoleta y del centro histórico.

Fotos de referencia: alku (CC BY 3.0); Parallelepiped09 (CC BY-SA 4.0), vía Wikimedia Commons.', 'BOB', 69000, 'Habitación superior + desayuno', array['Desayuno a la carta', 'Wi-Fi', 'Restaurante']::text[],
    'boutique_hotel', 'per_night', 2, 1, array['wifi', 'breakfast', 'restaurant', 'heating']::text[], 'Oferta de ejemplo: no se puede reservar.', 'Oferta de ejemplo.', '14:00', '11:00',
    -19.043, -65.259, true, true
  from public.providers pv
  join public.destinations d on d.slug = 'sucre'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/Savoy Boutique standard room - panoramio.jpg', 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Savoy_Boutique_standard_room_-_panoramio.jpg', 'Hotel boutique colonial en Sucre', 0),
    ('external/wikimedia/Sucre Square.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Sucre_Square.jpg/1280px-Sucre_Square.jpg', 'Hotel boutique colonial en Sucre', 1)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'normal'::public.offer_kind, 'Hotel boutique colonial en Sucre', 69000, 52000, 'BOB', now(), null, false, true
from ins;

-- Glamping frente al Salar de Uyuni
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes,
    property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy, check_in_time, check_out_time,
    latitude, longitude, is_published, is_sample)
  select pv.id, d.id, 'accommodation'::public.product_type, 'ejemplo-glamping-salar-uyuni', 'Glamping frente al Salar de Uyuni', 'Una noche en domo climatizado al borde del salar, con cena, desayuno y tour al atardecer sobre el espejo de agua. Para ver el cielo estrellado más limpio de Bolivia.

Fotos de referencia: DONANENTHUSIAST (CC BY-SA 4.0); Diego Delso (CC BY-SA 4.0), vía Wikimedia Commons.', 'BOB', 190000, '1 noche + tour al atardecer', array['Cena y desayuno', 'Tour al atardecer', 'Domo calefaccionado']::text[],
    'glamping', 'per_person', 2, 1, array['heating', 'breakfast', 'view']::text[], 'Oferta de ejemplo: no se puede reservar.', 'Oferta de ejemplo.', '14:00', '11:00',
    -20.46, -66.825, true, true
  from public.providers pv
  join public.destinations d on d.slug = 'uyuni'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/In Glamping (Marineping) dome - 1.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/In_Glamping_%28Marineping%29_dome_-_1.jpg/1280px-In_Glamping_%28Marineping%29_dome_-_1.jpg', 'Glamping frente al Salar de Uyuni', 0),
    ('external/wikimedia/Salar de Uyuni, Bolivia, 2016-02-04, DD 10-12 HDR.JPG', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Salar_de_Uyuni%2C_Bolivia%2C_2016-02-04%2C_DD_10-12_HDR.JPG/1280px-Salar_de_Uyuni%2C_Bolivia%2C_2016-02-04%2C_DD_10-12_HDR.JPG', 'Glamping frente al Salar de Uyuni', 1)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'flash'::public.offer_kind, 'Glamping frente al Salar de Uyuni', 190000, 145000, 'BOB', now(), now() + interval '3 days', true, true
from ins;

-- Escapada a la Isla del Sol
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes,
    property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy, check_in_time, check_out_time,
    latitude, longitude, is_published, is_sample)
  select pv.id, d.id, 'package'::public.product_type, 'ejemplo-escapada-isla-del-sol', 'Escapada a la Isla del Sol', 'Dos días en el Lago Titicaca: bote desde Copacabana, caminata por los senderos incas de la Isla del Sol y noche en un hospedaje con vista al lago.

Fotos de referencia: Jawira (CC BY-SA 4.0); Qhanaaru (CC0), vía Wikimedia Commons.', 'BOB', 95000, '2 días / 1 noche', array['Bote ida y vuelta', 'Hospedaje', 'Desayuno', 'Guía local']::text[],
    null, 'per_person', null, 1, '{}'::text[], 'Oferta de ejemplo: no se puede reservar.', 'Oferta de ejemplo.', null, null,
    -16.017, -69.17, true, true
  from public.providers pv
  join public.destinations d on d.slug = 'copacabana'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/Isla del Sol y Lago Titicaca, marzo 2025.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Isla_del_Sol_y_Lago_Titicaca%2C_marzo_2025.jpg/1280px-Isla_del_Sol_y_Lago_Titicaca%2C_marzo_2025.jpg', 'Escapada a la Isla del Sol', 0),
    ('external/wikimedia/Isla de Sol, Lago Titicaca 3.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f0/Isla_de_Sol%2C_Lago_Titicaca_3.jpg/1280px-Isla_de_Sol%2C_Lago_Titicaca_3.jpg', 'Escapada a la Isla del Sol', 1)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'normal'::public.offer_kind, 'Escapada a la Isla del Sol', 95000, 69000, 'BOB', now(), null, false, true
from ins;

-- Ruta del vino y singani en Tarija
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes,
    property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy, check_in_time, check_out_time,
    latitude, longitude, is_published, is_sample)
  select pv.id, d.id, 'package'::public.product_type, 'ejemplo-ruta-del-vino-tarija', 'Ruta del vino y singani en Tarija', 'Tres días por los viñedos de altura del Valle Central: visitas a bodegas, degustaciones de vino y singani, almuerzo campestre y alojamiento en el centro de Tarija.

Fotos de referencia: Aldrihe (CC BY-SA 4.0); Aldrihe (CC BY-SA 4.0), vía Wikimedia Commons.', 'BOB', 120000, '3 días / 2 noches', array['Alojamiento', 'Visitas a 3 bodegas', 'Degustaciones', 'Transporte']::text[],
    null, 'per_person', null, 2, '{}'::text[], 'Oferta de ejemplo: no se puede reservar.', 'Oferta de ejemplo.', null, null,
    -21.535, -64.729, true, true
  from public.providers pv
  join public.destinations d on d.slug = 'tarija'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/Vineyards in Tarija 2.jpg', 'https://upload.wikimedia.org/wikipedia/commons/9/99/Vineyards_in_Tarija_2.jpg', 'Ruta del vino y singani en Tarija', 0),
    ('external/wikimedia/Vineyards in Tarija 3.jpg', 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Vineyards_in_Tarija_3.jpg', 'Ruta del vino y singani en Tarija', 1)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'normal'::public.offer_kind, 'Ruta del vino y singani en Tarija', 120000, 84000, 'BOB', now(), null, true, true
from ins;

-- Expedición al Cañón de Torotoro
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes,
    property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy, check_in_time, check_out_time,
    latitude, longitude, is_published, is_sample)
  select pv.id, d.id, 'tour'::public.product_type, 'ejemplo-expedicion-canon-torotoro', 'Expedición al Cañón de Torotoro', 'Día completo en el Parque Nacional Torotoro: mirador del cañón, bajada al Vergel, huellas de dinosaurio y la Caverna de Umajalanta con guía comunitario.

Fotos de referencia: Gaumut (CC BY-SA 3.0); Vaido Otsar (CC BY-SA 4.0), vía Wikimedia Commons.', 'BOB', 45000, '1 día', array['Guía comunitario', 'Entrada al parque', 'Almuerzo']::text[],
    null, 'per_person', null, 1, '{}'::text[], 'Oferta de ejemplo: no se puede reservar.', 'Oferta de ejemplo.', null, null,
    -18.133, -65.763, true, true
  from public.providers pv
  join public.destinations d on d.slug = 'torotoro'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/Canyon of Torotoro.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Canyon_of_Torotoro.jpg/1280px-Canyon_of_Torotoro.jpg', 'Expedición al Cañón de Torotoro', 0),
    ('external/wikimedia/ToroToro canyon 2017.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/ToroToro_canyon_2017.jpg/1280px-ToroToro_canyon_2017.jpg', 'Expedición al Cañón de Torotoro', 1)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'flash'::public.offer_kind, 'Expedición al Cañón de Torotoro', 45000, 35000, 'BOB', now(), now() + interval '4 days', false, true
from ins;

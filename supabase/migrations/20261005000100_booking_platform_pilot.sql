-- Ofertazo pilot platform: full listings, canonical destinations, booking requests,
-- provider applications and tightened booking permissions.
-- Payment collection is intentionally NOT part of this migration (pending business decision).

-- ---------------------------------------------------------------------------
-- 1. Listings: everything the offer page needs
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists property_type text,
  add column if not exists pricing_unit text not null default 'per_stay',
  add column if not exists capacity_max integer,
  add column if not exists min_nights integer not null default 1,
  add column if not exists max_nights integer,
  add column if not exists amenities text[] not null default '{}',
  add column if not exists extras jsonb not null default '[]'::jsonb,
  add column if not exists booking_conditions text not null default '',
  add column if not exists cancellation_policy text not null default '',
  add column if not exists check_in_time text,
  add column if not exists check_out_time text,
  add column if not exists stay_available_from date,
  add column if not exists stay_available_to date,
  add column if not exists address text,
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6),
  add column if not exists verified_at timestamptz,
  add column if not exists verification_summary text,
  add column if not exists google_rating numeric(2,1),
  add column if not exists google_review_count integer,
  add column if not exists google_maps_url text,
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.products
  add constraint products_property_type_valid check (property_type is null or property_type in ('hotel', 'boutique_hotel', 'resort', 'lodge', 'villa', 'apartment', 'vacation_home', 'hostel', 'cabin')),
  add constraint products_pricing_unit_valid check (pricing_unit in ('per_stay', 'per_night', 'per_person')),
  add constraint products_capacity_positive check (capacity_max is null or capacity_max > 0),
  add constraint products_min_nights_positive check (min_nights >= 1),
  add constraint products_max_nights_order check (max_nights is null or max_nights >= min_nights),
  add constraint products_extras_array check (jsonb_typeof(extras) = 'array'),
  add constraint products_translations_object check (jsonb_typeof(translations) = 'object'),
  add constraint products_stay_window check (stay_available_to is null or stay_available_from is null or stay_available_to > stay_available_from),
  add constraint products_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint products_longitude_range check (longitude is null or longitude between -180 and 180),
  add constraint products_google_rating_range check (google_rating is null or google_rating between 0 and 5),
  add constraint products_google_reviews_positive check (google_review_count is null or google_review_count >= 0);

comment on column public.products.extras is 'Paid add-ons: [{"id": "slug", "name": "Cena", "price_minor": 15000}]. Price is per stay, in the product currency.';
comment on column public.products.rating is 'Own rating, only from completed Ofertazo bookings. Never seeded with demo data.';
comment on column public.products.google_rating is 'Rating copied manually from Google Maps, shown with a link to the source.';

-- Demo ratings must never reach production.
update public.products set rating = 0, review_count = 0;

-- ---------------------------------------------------------------------------
-- 2. Canonical destinations (one page per city)
-- ---------------------------------------------------------------------------
alter table public.destinations
  add column if not exists image_url text,
  add column if not exists sort_order integer not null default 100,
  add column if not exists translations jsonb not null default '{}'::jsonb;

insert into public.destinations (country_code, name, slug, kind, description, is_published, sort_order) values
  ('BO', 'Tarija', 'tarija', 'city', 'Valles, viñedos de altura, singani y el clima más amable de Bolivia.', true, 1),
  ('BO', 'Uyuni', 'uyuni', 'city', 'El salar más grande del mundo, lagunas de colores y hoteles de sal.', true, 2),
  ('BO', 'La Paz', 'la-paz', 'city', 'Ciudad en las alturas, teleféricos, Valle de la Luna y puerta al Titicaca.', true, 3),
  ('BO', 'Santa Cruz', 'santa-cruz', 'city', 'Calor, naturaleza, Samaipata y las misiones de la Chiquitania.', true, 4),
  ('BO', 'Sucre', 'sucre', 'city', 'La ciudad blanca: patrimonio colonial, museos y huellas de dinosaurio.', true, 5),
  ('BO', 'Potosí', 'potosi', 'city', 'Historia minera, el Cerro Rico y la Casa de la Moneda.', true, 6),
  ('BO', 'Oruro', 'oruro', 'city', 'Capital del folklore y de uno de los carnavales más grandes de América.', true, 7),
  ('BO', 'Cochabamba', 'cochabamba', 'city', 'La capital gastronómica del país y puerta a Torotoro.', true, 8)
on conflict (slug) do update set is_published = true, kind = 'city', sort_order = excluded.sort_order;

-- The admin form used to create one throwaway destination per offer (slug "...-destination").
-- Move their location data to the product and re-attach products to the canonical city.
update public.products p
set address = coalesce(p.address, d.address),
    latitude = coalesce(p.latitude, d.latitude),
    longitude = coalesce(p.longitude, d.longitude)
from public.destinations d
where d.id = p.destination_id and d.slug like '%-destination';

update public.products p
set destination_id = c.id
from public.destinations d, public.destinations c
where d.id = p.destination_id
  and d.slug like '%-destination'
  and c.kind = 'city'
  and c.slug not like '%-destination'
  and translate(lower(trim(d.name)), 'áéíóú', 'aeiou') = translate(lower(c.name), 'áéíóú', 'aeiou');

update public.destinations d
set is_published = false
where d.slug like '%-destination'
  and not exists (select 1 from public.products p where p.destination_id = d.id);

-- Friendly URL for the first real listing (shared on social media).
update public.products set slug = 'tolomosa'
where slug = 'tolomosa-1790902598975'
  and not exists (select 1 from public.products where slug = 'tolomosa');

-- ---------------------------------------------------------------------------
-- 3. Booking requests
-- ---------------------------------------------------------------------------
alter table public.bookings alter column traveler_id drop not null;

alter table public.bookings
  add column if not exists code text,
  add column if not exists contact_phone text,
  add column if not exists check_in date,
  add column if not exists check_out date,
  add column if not exists guests integer,
  add column if not exists notes text,
  add column if not exists locale text not null default 'es',
  add column if not exists attribution jsonb not null default '{}'::jsonb,
  add column if not exists admin_notes text;

alter table public.bookings
  add constraint bookings_code_unique unique (code),
  add constraint bookings_guests_positive check (guests is null or guests > 0),
  add constraint bookings_stay_order check (check_out is null or check_in is null or check_out > check_in);

alter table public.booking_items
  add column if not exists extras jsonb not null default '[]'::jsonb,
  add column if not exists guests integer,
  add column if not exists nights integer;

create index if not exists bookings_status_idx on public.bookings(status, created_at desc);
create index if not exists bookings_email_idx on public.bookings(lower(contact_email), created_at desc);
create index if not exists booking_items_offer_idx on public.booking_items(offer_id);

-- Bookings are only created through create_booking_request (prices computed here, never by the client).
-- Travelers must not be able to change status or insert items with arbitrary prices.
drop policy if exists bookings_traveler_insert on public.bookings;
drop policy if exists bookings_traveler_update on public.bookings;
drop policy if exists booking_items_booking_insert on public.booking_items;
drop policy if exists travelers_booking_insert on public.travelers;

create policy bookings_admin_update on public.bookings
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke insert on public.bookings, public.booking_items, public.travelers from authenticated;

-- Valid status transitions, enforced in the database.
create or replace function public.enforce_booking_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.status = old.status then
    return new;
  end if;
  if not (
    (old.status = 'pending' and new.status in ('awaiting_payment', 'confirmed', 'cancelled', 'expired')) or
    (old.status = 'awaiting_payment' and new.status in ('paid', 'confirmed', 'cancelled', 'expired')) or
    (old.status = 'paid' and new.status in ('confirmed', 'refunded', 'disputed')) or
    (old.status = 'confirmed' and new.status in ('completed', 'cancelled', 'refunded', 'disputed')) or
    (old.status = 'completed' and new.status in ('disputed', 'refunded')) or
    (old.status = 'disputed' and new.status in ('completed', 'refunded'))
  ) then
    raise exception 'invalid_status_transition: % -> %', old.status, new.status;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_enforce_transition on public.bookings;
create trigger bookings_enforce_transition
before update on public.bookings
for each row execute procedure public.enforce_booking_transition();

create or replace function public.generate_booking_code()
returns text
language plpgsql
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea;
  result text;
  i integer;
begin
  loop
    bytes := gen_random_bytes(6);
    result := 'OFZ-';
    for i in 0..5 loop
      result := result || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
    end loop;
    exit when not exists (select 1 from public.bookings where code = result);
  end loop;
  return result;
end;
$$;

revoke execute on function public.generate_booking_code() from public, anon, authenticated;

-- Remaining units per published offer (bookings are private, so expose only the count).
create or replace function public.offer_remaining_units()
returns table (offer_id uuid, remaining integer)
language sql
stable
security definer
set search_path = public
as $$
  select o.id,
         greatest(o.max_units - count(b.id) filter (where b.status not in ('cancelled', 'expired', 'refunded')), 0)::integer
  from public.offers o
  left join public.booking_items bi on bi.offer_id = o.id
  left join public.bookings b on b.id = bi.booking_id
  where o.is_published and o.max_units is not null
  group by o.id, o.max_units;
$$;

grant execute on function public.offer_remaining_units() to anon, authenticated;

create or replace function public.create_booking_request(
  p_offer_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests integer,
  p_extra_ids text[],
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_notes text,
  p_locale text,
  p_attribution jsonb
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_offer public.offers%rowtype;
  v_product public.products%rowtype;
  v_today date;
  v_nights integer;
  v_used integer;
  v_base bigint;
  v_extras jsonb;
  v_extras_total bigint;
  v_total bigint;
  v_code text;
  v_booking_id uuid;
  v_locale text := case when p_locale in ('es', 'en', 'fr') then p_locale else 'es' end;
begin
  if p_contact_name is null or length(trim(p_contact_name)) < 2 or length(p_contact_name) > 120 then
    raise exception 'invalid_name';
  end if;
  if p_contact_email is null or length(p_contact_email) > 254 or trim(p_contact_email) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;
  if p_contact_phone is null or length(p_contact_phone) > 30 or length(regexp_replace(p_contact_phone, '\D', '', 'g')) < 7 then
    raise exception 'invalid_phone';
  end if;
  if p_notes is not null and length(p_notes) > 1000 then
    raise exception 'invalid_notes';
  end if;
  if p_guests is null or p_guests < 1 or p_guests > 50 then
    raise exception 'invalid_guests';
  end if;

  if (select count(*) from public.bookings
      where lower(contact_email) = lower(trim(p_contact_email))
        and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'too_many_requests';
  end if;

  -- Lock the offer row so concurrent requests cannot oversell the last units.
  select * into v_offer from public.offers where id = p_offer_id and is_published for update;
  if not found then
    raise exception 'offer_not_found';
  end if;
  if v_offer.starts_at is not null and v_offer.starts_at > now() then
    raise exception 'offer_not_started';
  end if;
  if v_offer.ends_at is not null and v_offer.ends_at <= now() then
    raise exception 'offer_ended';
  end if;

  select * into v_product from public.products where id = v_offer.product_id and is_published;
  if not found then
    raise exception 'offer_not_found';
  end if;

  select (now() at time zone coalesce(cs.timezone, 'America/La_Paz'))::date into v_today
  from public.destinations d
  left join public.country_settings cs on cs.country_code = d.country_code
  where d.id = v_product.destination_id;

  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in
     or p_check_in < coalesce(v_today, current_date) or p_check_out - p_check_in > 60 then
    raise exception 'invalid_dates';
  end if;
  v_nights := p_check_out - p_check_in;
  if v_nights < v_product.min_nights or (v_product.max_nights is not null and v_nights > v_product.max_nights) then
    raise exception 'invalid_nights';
  end if;
  if (v_product.stay_available_from is not null and p_check_in < v_product.stay_available_from)
     or (v_product.stay_available_to is not null and p_check_out > v_product.stay_available_to) then
    raise exception 'dates_unavailable';
  end if;
  if v_product.capacity_max is not null and p_guests > v_product.capacity_max then
    raise exception 'too_many_guests';
  end if;

  if v_offer.max_units is not null then
    select count(*) into v_used
    from public.booking_items bi
    join public.bookings b on b.id = bi.booking_id
    where bi.offer_id = v_offer.id and b.status not in ('cancelled', 'expired', 'refunded');
    if v_used >= v_offer.max_units then
      raise exception 'sold_out';
    end if;
  end if;

  v_base := case v_product.pricing_unit
    when 'per_night' then v_offer.promotional_price_minor * v_nights
    when 'per_person' then v_offer.promotional_price_minor * p_guests
    else v_offer.promotional_price_minor
  end;

  select coalesce(jsonb_agg(jsonb_build_object('id', e ->> 'id', 'name', e ->> 'name', 'price_minor', (e ->> 'price_minor')::bigint)), '[]'::jsonb),
         coalesce(sum((e ->> 'price_minor')::bigint), 0)
  into v_extras, v_extras_total
  from jsonb_array_elements(v_product.extras) e
  where e ->> 'id' = any(coalesce(p_extra_ids, '{}'::text[]));

  v_total := v_base + v_extras_total;
  v_code := public.generate_booking_code();

  insert into public.bookings (
    traveler_id, status, currency_code, subtotal_minor, commission_minor, total_minor,
    contact_name, contact_email, contact_phone, code, check_in, check_out, guests, notes, locale, attribution
  ) values (
    auth.uid(), 'pending', v_offer.currency_code, v_total, 0, v_total,
    trim(p_contact_name), lower(trim(p_contact_email)), trim(p_contact_phone), v_code, p_check_in, p_check_out, p_guests,
    nullif(trim(coalesce(p_notes, '')), ''), v_locale,
    jsonb_strip_nulls(jsonb_build_object(
      'utm_source', left(p_attribution ->> 'utm_source', 100),
      'utm_medium', left(p_attribution ->> 'utm_medium', 100),
      'utm_campaign', left(p_attribution ->> 'utm_campaign', 100),
      'utm_content', left(p_attribution ->> 'utm_content', 100),
      'utm_term', left(p_attribution ->> 'utm_term', 100),
      'referrer', left(p_attribution ->> 'referrer', 300),
      'landing_page', left(p_attribution ->> 'landing_page', 300)
    ))
  ) returning id into v_booking_id;

  insert into public.booking_items (
    booking_id, product_id, offer_id, service_date, quantity, unit_price_minor,
    commission_rate, commission_minor, currency_code, title_snapshot, extras, guests, nights
  ) values (
    v_booking_id, v_product.id, v_offer.id, p_check_in, 1, v_offer.promotional_price_minor,
    0, 0, v_offer.currency_code, v_product.title, v_extras, p_guests, v_nights
  );

  return v_code;
end;
$$;

revoke execute on function public.create_booking_request(uuid, date, date, integer, text[], text, text, text, text, text, jsonb) from public;
grant execute on function public.create_booking_request(uuid, date, date, integer, text[], text, text, text, text, text, jsonb) to anon, authenticated;

-- Guests look up their booking with code + email (no account required).
create or replace function public.get_booking_by_code(p_code text, p_email text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'code', b.code,
    'status', b.status,
    'check_in', b.check_in,
    'check_out', b.check_out,
    'guests', b.guests,
    'total_minor', b.total_minor,
    'currency_code', b.currency_code,
    'contact_name', b.contact_name,
    'title', bi.title_snapshot,
    'product_slug', p.slug,
    'extras', bi.extras,
    'created_at', b.created_at
  )
  from public.bookings b
  join public.booking_items bi on bi.booking_id = b.id
  join public.products p on p.id = bi.product_id
  where b.code = upper(trim(p_code))
    and b.contact_email = lower(trim(p_email))
  limit 1;
$$;

revoke execute on function public.get_booking_by_code(text, text) from public;
grant execute on function public.get_booking_by_code(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Provider applications ("Publica tu alojamiento")
-- ---------------------------------------------------------------------------
create table if not exists public.provider_applications (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new' check (status in ('new', 'contacted', 'approved', 'rejected')),
  business_name text not null check (length(business_name) between 2 and 160),
  property_type text not null check (length(property_type) <= 40),
  city text not null check (length(city) between 2 and 80),
  address text check (length(address) <= 300),
  contact_name text not null check (length(contact_name) between 2 and 120),
  email text not null check (length(email) <= 254),
  phone text not null check (length(phone) between 7 and 30),
  website text check (length(website) <= 300),
  capacity text check (length(capacity) <= 200),
  services text check (length(services) <= 2000),
  regular_price text check (length(regular_price) <= 300),
  offered_price text check (length(offered_price) <= 300),
  high_season text check (length(high_season) <= 500),
  low_season text check (length(low_season) <= 500),
  availability text check (length(availability) <= 1000),
  conditions text check (length(conditions) <= 2000),
  message text check (length(message) <= 2000),
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 12),
  locale text not null default 'es' check (locale in ('es', 'en', 'fr')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provider_applications_status_idx on public.provider_applications(status, created_at desc);

alter table public.provider_applications enable row level security;

create policy provider_applications_public_insert on public.provider_applications
for insert to anon, authenticated
with check (status = 'new' and admin_notes is null);

create policy provider_applications_admin_read on public.provider_applications
for select to authenticated
using (public.is_admin());

create policy provider_applications_admin_update on public.provider_applications
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

grant insert on public.provider_applications to anon, authenticated;
grant select, update on public.provider_applications to authenticated;

-- Private bucket: anyone can upload into incoming/, only admins can read.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('provider-applications', 'provider-applications', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy provider_applications_upload on storage.objects
for insert to anon, authenticated
with check (bucket_id = 'provider-applications' and (storage.foldername(name))[1] = 'incoming');

create policy provider_applications_admin_read_files on storage.objects
for select to authenticated
using (bucket_id = 'provider-applications' and public.is_admin());

create policy provider_applications_admin_delete_files on storage.objects
for delete to authenticated
using (bucket_id = 'provider-applications' and public.is_admin());

-- Offer photos: keep uploads to images of reasonable size.
update storage.buckets
set file_size_limit = 8388608, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'offer-media';

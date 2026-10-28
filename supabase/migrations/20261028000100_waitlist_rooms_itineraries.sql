-- Launch waitlist ("Únete a la familia Tripya"), richer offer pages and room choice when booking.
--  1. waitlist_signups: first travelers who want launch news and early discounts. Written only through join_waitlist(); read by admins.
--  2. products: restrictions, perks ("lo que negociamos para ti"), what is not included, TripAdvisor rating,
--     location note + nearby places, room options (with supplement) and a day-by-day itinerary with a route map.
--  3. bookings: adults / children / infants and the chosen room. Prices are still computed only here, on the server.
--  4. Samples: the La Paz hotel and the Uyuni glamping get rooms, perks and nearby places; new sample circuit
--     "Salar de Uyuni 3 días / 2 noches" with its itinerary.
--  5. The new site languages (pt, de, zh, ja, ko) are accepted where a locale is stored.

-- ---------------------------------------------------------------------------
-- 1. Waitlist
-- ---------------------------------------------------------------------------
create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (length(first_name) between 1 and 80),
  last_name text not null check (length(last_name) between 1 and 80),
  email text not null check (length(email) <= 254),
  whatsapp text check (whatsapp is null or length(whatsapp) <= 30),
  destination text not null check (destination in ('tarija', 'santa_cruz', 'la_paz_uyuni', 'sucre_potosi', 'cochabamba', 'other')),
  interest text not null check (interest in ('yes', 'depends', 'curious')),
  wants_updates boolean not null default false,
  privacy_accepted_at timestamptz not null,
  locale text not null default 'es',
  attribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists waitlist_signups_email_key on public.waitlist_signups (lower(email));
create index if not exists waitlist_signups_created_at_idx on public.waitlist_signups (created_at desc);

alter table public.waitlist_signups enable row level security;

drop policy if exists waitlist_admin_read on public.waitlist_signups;
create policy waitlist_admin_read on public.waitlist_signups for select to authenticated using (public.is_admin());
drop policy if exists waitlist_admin_delete on public.waitlist_signups;
create policy waitlist_admin_delete on public.waitlist_signups for delete to authenticated using (public.is_admin());

revoke all on public.waitlist_signups from anon, authenticated;
grant select, delete on public.waitlist_signups to authenticated;

-- Signing up twice with the same email updates the answers instead of creating a duplicate.
create or replace function public.join_waitlist(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_whatsapp text,
  p_destination text,
  p_interest text,
  p_wants_updates boolean,
  p_privacy_accepted boolean,
  p_locale text,
  p_attribution jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_whatsapp text := nullif(trim(coalesce(p_whatsapp, '')), '');
begin
  if length(trim(coalesce(p_first_name, ''))) < 1 or length(p_first_name) > 80 then
    raise exception 'invalid_first_name';
  end if;
  if length(trim(coalesce(p_last_name, ''))) < 1 or length(p_last_name) > 80 then
    raise exception 'invalid_last_name';
  end if;
  if length(v_email) > 254 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;
  if v_whatsapp is not null and (length(v_whatsapp) > 30 or length(regexp_replace(v_whatsapp, '\D', '', 'g')) < 7) then
    raise exception 'invalid_whatsapp';
  end if;
  if p_destination is null or p_destination not in ('tarija', 'santa_cruz', 'la_paz_uyuni', 'sucre_potosi', 'cochabamba', 'other') then
    raise exception 'invalid_destination';
  end if;
  if p_interest is null or p_interest not in ('yes', 'depends', 'curious') then
    raise exception 'invalid_interest';
  end if;
  if p_privacy_accepted is not true then
    raise exception 'privacy_required';
  end if;
  -- Basic flood protection for an anonymous endpoint.
  if (select count(*) from public.waitlist_signups where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'too_many_requests';
  end if;

  insert into public.waitlist_signups (first_name, last_name, email, whatsapp, destination, interest, wants_updates, privacy_accepted_at, locale, attribution)
  values (
    trim(p_first_name), trim(p_last_name), v_email, v_whatsapp, p_destination, p_interest, coalesce(p_wants_updates, false), now(),
    case when p_locale in ('es', 'en', 'fr', 'pt', 'de', 'zh', 'ja', 'ko') then p_locale else 'es' end,
    jsonb_strip_nulls(jsonb_build_object(
      'utm_source', left(p_attribution ->> 'utm_source', 100),
      'utm_medium', left(p_attribution ->> 'utm_medium', 100),
      'utm_campaign', left(p_attribution ->> 'utm_campaign', 100),
      'referrer', left(p_attribution ->> 'referrer', 300),
      'landing_page', left(p_attribution ->> 'landing_page', 300)
    ))
  )
  on conflict (lower(email)) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    whatsapp = coalesce(excluded.whatsapp, waitlist_signups.whatsapp),
    destination = excluded.destination,
    interest = excluded.interest,
    wants_updates = excluded.wants_updates,
    privacy_accepted_at = excluded.privacy_accepted_at,
    locale = excluded.locale,
    updated_at = now();
end;
$$;

revoke all on function public.join_waitlist(text, text, text, text, text, text, boolean, boolean, text, jsonb) from public;
grant execute on function public.join_waitlist(text, text, text, text, text, text, boolean, boolean, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Offer page content
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists restrictions text[] not null default '{}',
  add column if not exists perks text[] not null default '{}',
  add column if not exists excludes text[] not null default '{}',
  add column if not exists tripadvisor_rating numeric(2,1) check (tripadvisor_rating is null or tripadvisor_rating between 0 and 5),
  add column if not exists tripadvisor_review_count integer check (tripadvisor_review_count is null or tripadvisor_review_count >= 0),
  add column if not exists tripadvisor_url text,
  add column if not exists location_note text,
  add column if not exists nearby_places jsonb not null default '[]'::jsonb,
  add column if not exists room_options jsonb not null default '[]'::jsonb,
  add column if not exists itinerary jsonb not null default '[]'::jsonb;

comment on column public.products.perks is 'Extras Tripya negotiated for its travelers (welcome drink, late check-out...). Shown as "Lo que negociamos para ti".';
comment on column public.products.nearby_places is '[{name, minutes, mode: walk|car}] travel time to points of interest.';
comment on column public.products.room_options is '[{id, name, description, image_url, features[], beds, size_m2, max_guests, supplement_minor}]. First option is the base rate (supplement 0).';
comment on column public.products.itinerary is '[{day, title, description, overnight, stops: [{name, lat, lng}]}] for circuits and packages; drawn as a route map.';

-- ---------------------------------------------------------------------------
-- 3. Bookings: guest breakdown + room
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists adults integer check (adults is null or adults >= 1),
  add column if not exists children integer not null default 0 check (children >= 0),
  add column if not exists infants integer not null default 0 check (infants >= 0);

alter table public.booking_items
  add column if not exists room_option jsonb;

drop function if exists public.create_booking_request(uuid, date, date, integer, text[], text, text, text, text, text, jsonb);

-- p_guests = adults. Children count toward capacity and per-person prices; infants (<2) do not.
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
  p_attribution jsonb,
  p_children integer default 0,
  p_infants integer default 0,
  p_room_id text default null
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
  v_people integer;
  v_base bigint;
  v_room jsonb;
  v_room_total bigint := 0;
  v_extras jsonb;
  v_extras_total bigint;
  v_total bigint;
  v_code text;
  v_booking_id uuid;
  v_children integer := coalesce(p_children, 0);
  v_infants integer := coalesce(p_infants, 0);
  v_locale text := case when p_locale in ('es', 'en', 'fr', 'pt', 'de', 'zh', 'ja', 'ko') then p_locale else 'es' end;
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
  if p_guests is null or p_guests < 1 or p_guests > 50 or v_children < 0 or v_children > 20 or v_infants < 0 or v_infants > 10 then
    raise exception 'invalid_guests';
  end if;
  v_people := p_guests + v_children;

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
  if v_product.capacity_max is not null and v_people > v_product.capacity_max then
    raise exception 'too_many_guests';
  end if;

  -- Room: the chosen one, or the first (base) option when the product has rooms and none was sent.
  if jsonb_array_length(coalesce(v_product.room_options, '[]'::jsonb)) > 0 then
    if p_room_id is null then
      v_room := v_product.room_options -> 0;
    else
      select e.value into v_room from jsonb_array_elements(v_product.room_options) as e where e.value ->> 'id' = p_room_id limit 1;
      if v_room is null then
        raise exception 'invalid_room';
      end if;
    end if;
    if (v_room ->> 'max_guests') is not null and v_people > (v_room ->> 'max_guests')::integer then
      raise exception 'too_many_guests';
    end if;
    v_room_total := greatest(coalesce((v_room ->> 'supplement_minor')::bigint, 0), 0)
                    * case when v_product.pricing_unit = 'per_night' then v_nights else 1 end;
    v_room := jsonb_build_object('id', v_room ->> 'id', 'name', v_room ->> 'name',
                                 'supplement_minor', coalesce((v_room ->> 'supplement_minor')::bigint, 0), 'total_minor', v_room_total);
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
    when 'per_person' then v_offer.promotional_price_minor * v_people
    else v_offer.promotional_price_minor
  end;

  select coalesce(jsonb_agg(jsonb_build_object('id', e ->> 'id', 'name', e ->> 'name', 'price_minor', (e ->> 'price_minor')::bigint)), '[]'::jsonb),
         coalesce(sum((e ->> 'price_minor')::bigint), 0)
  into v_extras, v_extras_total
  from jsonb_array_elements(v_product.extras) e
  where e ->> 'id' = any(coalesce(p_extra_ids, '{}'::text[]));

  v_total := v_base + v_room_total + v_extras_total;
  v_code := public.generate_booking_code();

  insert into public.bookings (
    traveler_id, status, currency_code, subtotal_minor, commission_minor, total_minor,
    contact_name, contact_email, contact_phone, code, check_in, check_out, guests, adults, children, infants, notes, locale, attribution
  ) values (
    auth.uid(), 'pending', v_offer.currency_code, v_total, 0, v_total,
    trim(p_contact_name), lower(trim(p_contact_email)), trim(p_contact_phone), v_code, p_check_in, p_check_out, v_people,
    p_guests, v_children, v_infants,
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
    commission_rate, commission_minor, currency_code, title_snapshot, extras, guests, nights, room_option
  ) values (
    v_booking_id, v_product.id, v_offer.id, p_check_in, 1, v_offer.promotional_price_minor,
    0, 0, v_offer.currency_code, v_product.title, v_extras, v_people, v_nights, v_room
  );

  return v_code;
end;
$$;

revoke execute on function public.create_booking_request(uuid, date, date, integer, text[], text, text, text, text, text, jsonb, integer, integer, text) from public;
grant execute on function public.create_booking_request(uuid, date, date, integer, text[], text, text, text, text, text, jsonb, integer, integer, text) to anon, authenticated;

-- Same as before, plus the guest breakdown and the room for the sales agent's WhatsApp message.
create or replace function public.booking_whatsapp_handoff(p_code text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_result jsonb;
begin
  select * into v_booking from public.bookings
  where code = upper(trim(p_code)) and contact_email = lower(trim(p_email));
  if not found then
    return null;
  end if;

  update public.bookings
  set handed_off_at = coalesce(handed_off_at, now()),
      status = case when status = 'pending' then 'awaiting_payment'::public.booking_status else status end
  where id = v_booking.id;

  select jsonb_build_object(
    'code', v_booking.code,
    'title', bi.title_snapshot,
    'partner', pv.trade_name,
    'destination', d.name,
    'check_in', v_booking.check_in,
    'check_out', v_booking.check_out,
    'nights', bi.nights,
    'guests', v_booking.guests,
    'adults', v_booking.adults,
    'children', v_booking.children,
    'infants', v_booking.infants,
    'room', bi.room_option,
    'extras', bi.extras,
    'total_minor', v_booking.total_minor,
    'currency_code', v_booking.currency_code,
    'contact_name', v_booking.contact_name,
    'contact_phone', v_booking.contact_phone
  ) into v_result
  from public.booking_items bi
  join public.products p on p.id = bi.product_id
  left join public.providers pv on pv.id = p.provider_id
  left join public.destinations d on d.id = p.destination_id
  where bi.booking_id = v_booking.id
  limit 1;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Sample content
-- ---------------------------------------------------------------------------
update public.products set
  description = 'Despierta frente al Illimani. Este hotel tranquilo de la zona sur de La Paz combina habitaciones cálidas y luminosas con un desayuno buffet generoso y una terraza desde la que el nevado se ve entero en los días despejados.

Calacoto es el barrio ideal para descubrir La Paz sin el ruido del centro: cafés, restaurantes y el teleférico a pocos pasos, y el Valle de la Luna a un corto viaje en auto. Al volver de recorrer la ciudad, te espera calefacción en la habitación, Wi-Fi rápido y un equipo que te ayuda a organizar tus excursiones.

Fotos de referencia: Kurt Kaiser (CC0); juhauski72 (CC BY 2.0), vía Wikimedia Commons.',
  restrictions = array['Prohibido fumar en las habitaciones', 'No se admiten mascotas', 'Prohibidas las fiestas y eventos', 'Silencio a partir de las 22:00', 'Documento de identidad obligatorio al hacer el check-in']::text[],
  perks = array['Bebida de bienvenida al llegar', 'Regalito Tripya en la habitación', 'Late check-out hasta las 13:00 según disponibilidad', 'Mate de coca para la altura, cortesía de la casa']::text[],
  location_note = 'A 25 min en auto del centro histórico',
  nearby_places = '[
    {"name": "Teleférico Línea Verde", "minutes": 8, "mode": "walk"},
    {"name": "Calle 21 de Calacoto (cafés y restaurantes)", "minutes": 5, "mode": "walk"},
    {"name": "Valle de la Luna", "minutes": 15, "mode": "car"},
    {"name": "Plaza Murillo y centro histórico", "minutes": 25, "mode": "car"},
    {"name": "Mirador Killi Killi", "minutes": 35, "mode": "car"}
  ]'::jsonb,
  room_options = '[
    {"id": "doble-estandar", "name": "Habitación doble estándar", "description": "Cómoda y cálida, ideal para descansar después de recorrer la ciudad.",
     "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Bed_in_hotel_room_5.jpg/1280px-Bed_in_hotel_room_5.jpg",
     "features": ["Baño privado", "Calefacción", "Wi-Fi", "TV"], "beds": "1 cama matrimonial", "size_m2": 20, "max_guests": 2, "supplement_minor": 0},
    {"id": "superior-vista-illimani", "name": "Habitación superior con vista al Illimani", "description": "Ventanal hacia el nevado y más espacio para relajarte.",
     "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/Bed_in_hotel_room_2.jpg/1280px-Bed_in_hotel_room_2.jpg",
     "features": ["Vista al Illimani", "Baño privado con ducha", "Calefacción", "Escritorio"], "beds": "1 cama queen", "size_m2": 26, "max_guests": 2, "supplement_minor": 8000},
    {"id": "suite-familiar", "name": "Suite familiar", "description": "Dos ambientes para viajar en familia con niños.",
     "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Hotel-suite-bedroom.jpg/1280px-Hotel-suite-bedroom.jpg",
     "features": ["Sala de estar", "Baño privado con tina", "Minibar", "Vista a la ciudad"], "beds": "1 cama king + 1 sofá cama", "size_m2": 38, "max_guests": 4, "supplement_minor": 18000}
  ]'::jsonb,
  capacity_max = 4
where slug = 'ejemplo-hotel-vista-illimani' and is_sample;

update public.products set
  restrictions = array['Prohibido fumar dentro de los domos', 'No apto para mascotas', 'Altura: 3.650 m. Consulta a tu médico si tienes problemas cardíacos o respiratorios']::text[],
  perks = array['Chocolate caliente de bienvenida', 'Foto de perspectiva en el salar tomada por el guía', 'Regalito Tripya: bolsita de sal de Uyuni']::text[],
  location_note = 'A 20 min en auto del pueblo de Uyuni',
  nearby_places = '[
    {"name": "Espejo de agua del salar", "minutes": 2, "mode": "walk"},
    {"name": "Colchani (artesanías de sal)", "minutes": 10, "mode": "car"},
    {"name": "Cementerio de Trenes", "minutes": 25, "mode": "car"},
    {"name": "Isla Incahuasi", "minutes": 90, "mode": "car"}
  ]'::jsonb,
  room_options = '[
    {"id": "domo-clasico", "name": "Domo clásico", "description": "Domo climatizado con cama cómoda y ventana al salar.",
     "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Bed_in_hotel_room_3.jpg/1280px-Bed_in_hotel_room_3.jpg",
     "features": ["Calefacción", "Baño privado", "Ventana panorámica"], "beds": "1 cama matrimonial", "size_m2": 18, "max_guests": 2, "supplement_minor": 0},
    {"id": "domo-estrellas", "name": "Domo con techo transparente", "description": "Duerme mirando el cielo estrellado del altiplano.",
     "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/Bed_in_hotel_room_4.jpg/1280px-Bed_in_hotel_room_4.jpg",
     "features": ["Techo transparente", "Calefacción", "Baño privado", "Telescopio compartido"], "beds": "1 cama king", "size_m2": 22, "max_guests": 2, "supplement_minor": 25000}
  ]'::jsonb
where slug = 'ejemplo-glamping-salar-uyuni' and is_sample;

-- Circuito Salar de Uyuni 3 días / 2 noches (route and times are the classic tour, approximate).
with ins as (
  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label, includes, excludes,
    restrictions, perks, property_type, pricing_unit, capacity_max, min_nights, max_nights, amenities, booking_conditions, cancellation_policy,
    check_in_time, check_out_time, latitude, longitude, location_note, itinerary, is_published, is_sample)
  select pv.id, d.id, 'package'::public.product_type, 'ejemplo-circuito-salar-uyuni-3-dias', 'Circuito Salar de Uyuni y lagunas de colores · 3 días / 2 noches',
    'El viaje que todos sueñan hacer en Bolivia. En 3 días cruzas el salar más grande del mundo, duermes en un hotel hecho de sal, sigues la ruta de las lagunas altiplánicas llenas de flamencos y ves amanecer entre los géiseres a casi 5.000 metros.

Viajas en una camioneta 4x4 con chofer-guía que conoce cada rincón del altiplano y con un grupo pequeño (máximo 6 viajeros). Las comidas están incluidas y preparadas en ruta, así que tú solo te ocupas de mirar por la ventana.

Fotos de referencia: Cristobal Frigerio, kallerna, Diego Delso, El Guanche (CC BY-SA 4.0 / CC BY 2.0), vía Wikimedia Commons.',
    'BOB', 140000, '3 días / 2 noches · 4x4 compartido',
    array['Transporte en 4x4 con chofer-guía en español', '1 noche en hotel de sal (habitación compartida)', '1 noche en refugio cerca de Laguna Colorada', 'Pensión completa: desde el almuerzo del día 1 hasta el desayuno del día 3', 'Agua potable durante el recorrido', 'Botiquín de primeros auxilios y oxígeno']::text[],
    array['Entrada a la Reserva Eduardo Avaroa (aprox. Bs 150)', 'Entrada a la Isla Incahuasi (aprox. Bs 30)', 'Aguas termales de Polques (aprox. Bs 6)', 'Alquiler de bolsa de dormir', 'Uso de baños en ruta (aprox. Bs 5)', 'Propinas']::text[],
    array['Altura máxima cerca de 5.000 m: no recomendado para embarazadas ni personas con problemas cardíacos', 'Niños desde 6 años', 'Lleva efectivo en bolivianos para las entradas', 'Por la noche la temperatura puede bajar a -15 °C: ropa térmica obligatoria']::text[],
    array['Bolsa de dormir de alta montaña sin costo', 'Snack andino y mate de coca en ruta', 'Regalito Tripya: kit de fotos de perspectiva en el salar']::text[],
    null, 'per_person', 6, 2, 2, '{}'::text[],
    'Salida diaria a las 10:30 desde la oficina en Uyuni. Presentarse 30 minutos antes con pasaporte o carnet. Oferta de ejemplo.',
    'Oferta de ejemplo.', '10:30', '17:30', -20.4597, -66.825,
    'Salida y llegada en el pueblo de Uyuni',
    '[
      {"day": 1, "title": "Cementerio de Trenes, Colchani e Isla Incahuasi",
       "description": "Salimos de Uyuni hacia el Cementerio de Trenes, seguimos a Colchani para ver cómo se procesa la sal y entramos al salar: Monumento del Dakar, Plaza de las Banderas, fotos de perspectiva y almuerzo sobre la sal. Por la tarde, cactus gigantes en la Isla Incahuasi y atardecer en el salar.",
       "overnight": "Hotel de sal en la orilla sur del salar",
       "stops": [
         {"name": "Uyuni", "lat": -20.4597, "lng": -66.825},
         {"name": "Cementerio de Trenes", "lat": -20.4806, "lng": -66.8361},
         {"name": "Colchani", "lat": -20.3008, "lng": -66.9361},
         {"name": "Plaza de las Banderas", "lat": -20.2667, "lng": -67.0417},
         {"name": "Isla Incahuasi", "lat": -20.2422, "lng": -67.6253},
         {"name": "Hotel de sal (San Juan)", "lat": -20.9967, "lng": -67.6644}
       ]},
      {"day": 2, "title": "Desierto de Chiguana, lagunas altiplánicas y Árbol de Piedra",
       "description": "Cruzamos el Desierto de Chiguana con vista al volcán Ollagüe, todavía activo. Recorremos las lagunas Cañapa y Hedionda, llenas de flamencos, almorzamos junto al agua y seguimos al Desierto de Siloli y su famoso Árbol de Piedra. Terminamos en la Laguna Colorada, roja por las algas.",
       "overnight": "Refugio cerca de Laguna Colorada (4.300 m)",
       "stops": [
         {"name": "Desierto de Chiguana", "lat": -21.0833, "lng": -67.85},
         {"name": "Mirador del Volcán Ollagüe", "lat": -21.25, "lng": -68.05},
         {"name": "Laguna Cañapa", "lat": -21.505, "lng": -68.0167},
         {"name": "Laguna Hedionda", "lat": -21.5667, "lng": -68.05},
         {"name": "Árbol de Piedra", "lat": -22.0464, "lng": -67.8869},
         {"name": "Laguna Colorada", "lat": -22.2, "lng": -67.7833}
       ]},
      {"day": 3, "title": "Géiseres Sol de Mañana, termas de Polques y Laguna Verde",
       "description": "Madrugamos para ver los Géiseres Sol de Mañana al amanecer (4.900 m). Desayuno junto a las aguas termales de Polques, donde puedes darte un baño, y paso por el Desierto de Dalí hasta la Laguna Verde, al pie del volcán Licancabur. Regreso a Uyuni por el Valle de Rocas, con llegada aproximada a las 17:30.",
       "overnight": null,
       "stops": [
         {"name": "Géiseres Sol de Mañana", "lat": -22.4333, "lng": -67.75},
         {"name": "Termas de Polques", "lat": -22.5333, "lng": -67.65},
         {"name": "Desierto de Dalí", "lat": -22.65, "lng": -67.7333},
         {"name": "Laguna Verde", "lat": -22.793, "lng": -67.827},
         {"name": "Valle de Rocas", "lat": -21.6, "lng": -67.25},
         {"name": "Uyuni", "lat": -20.4597, "lng": -66.825}
       ]}
    ]'::jsonb,
    true, true
  from public.providers pv
  join public.destinations d on d.slug = 'uyuni'
  where pv.trade_name = 'Tripya ejemplos'
  on conflict (slug) do nothing
  returning id
), media as (
  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select ins.id, m.path, m.url, m.alt, m.ord from ins cross join (values
    ('external/wikimedia/Isla Incahuasi Uyuni 2018.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d2/Isla_Incahuasi_Uyuni_2018.jpg/1280px-Isla_Incahuasi_Uyuni_2018.jpg', 'Isla Incahuasi en el Salar de Uyuni', 0),
    ('external/wikimedia/Andean Flamingos Laguna Colorada Bolivia Luca Galuzzi 2006.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Andean_Flamingos_Laguna_Colorada_Bolivia_Luca_Galuzzi_2006.jpg/1280px-Andean_Flamingos_Laguna_Colorada_Bolivia_Luca_Galuzzi_2006.jpg', 'Flamencos en la Laguna Colorada', 1),
    ('external/wikimedia/Arbol de Piedra.jpg', 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Arbol_de_Piedra.jpg', 'Árbol de Piedra en el Desierto de Siloli', 2),
    ('external/wikimedia/Laguna Verde, Bolivia.jpg', 'https://upload.wikimedia.org/wikipedia/commons/7/77/Laguna_Verde%2C_Bolivia.jpg', 'Laguna Verde y volcán Licancabur', 3),
    ('external/wikimedia/CEMENTERIO DE TRENES UYUNI 2017.jpg', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/CEMENTERIO_DE_TRENES_UYUNI_2017.jpg/1280px-CEMENTERIO_DE_TRENES_UYUNI_2017.jpg', 'Cementerio de Trenes de Uyuni', 4)
  ) as m(path, url, alt, ord)
  returning product_id
)
insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, ends_at, featured, is_published)
select ins.id, 'normal'::public.offer_kind, 'Circuito Salar de Uyuni y lagunas de colores · 3 días / 2 noches', 140000, 115000, 'BOB', now(), null, true, true
from ins;

-- ---------------------------------------------------------------------------
-- 5. New site languages (pt, de, zh, ja, ko) accepted wherever the locale is stored
-- ---------------------------------------------------------------------------
alter table public.provider_applications drop constraint if exists provider_applications_locale_check;
alter table public.provider_applications add constraint provider_applications_locale_check check (locale in ('es', 'en', 'fr', 'pt', 'de', 'zh', 'ja', 'ko'));

create or replace function public.track_event(
  p_event text,
  p_fingerprint text,
  p_path text default null,
  p_offer_slug text default null,
  p_destination_slug text default null,
  p_placement text default null,
  p_search_term text default null,
  p_source text default null,
  p_campaign text default null,
  p_content text default null,
  p_device text default null,
  p_country text default null,
  p_locale text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_salt bytea;
  v_clean text := nullif(trim(p_event), '');
begin
  if v_clean is null or p_fingerprint is null or length(p_fingerprint) > 600 then
    return;
  end if;

  select salt into v_salt from public.analytics_salts where day = v_today;
  if v_salt is null then
    insert into public.analytics_salts (day, salt) values (v_today, gen_random_bytes(32))
    on conflict (day) do nothing;
    select salt into v_salt from public.analytics_salts where day = v_today;
    delete from public.analytics_salts where day < v_today - 1;
  end if;

  insert into public.analytics_events (event, visitor_hash, path, offer_slug, destination_slug, placement, search_term, source, campaign, content, device, country, locale)
  values (
    v_clean,
    encode(digest(v_salt || convert_to(p_fingerprint, 'UTF8'), 'sha256'), 'hex'),
    left(p_path, 300),
    left(nullif(p_offer_slug, ''), 120),
    left(nullif(p_destination_slug, ''), 120),
    left(nullif(p_placement, ''), 60),
    left(nullif(lower(trim(p_search_term)), ''), 80),
    coalesce(left(nullif(lower(p_source), ''), 40), 'directo'),
    left(nullif(p_campaign, ''), 100),
    left(nullif(p_content, ''), 100),
    case when p_device in ('mobile', 'tablet', 'desktop') then p_device end,
    left(nullif(upper(p_country), ''), 2),
    case when p_locale in ('es', 'en', 'fr', 'pt', 'de', 'zh', 'ja', 'ko') then p_locale end
  );
exception
  -- Unknown event names or bad input must never surface to the visitor.
  when check_violation then return;
end;
$$;

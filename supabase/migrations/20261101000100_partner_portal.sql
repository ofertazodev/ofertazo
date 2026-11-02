-- Partner portal (/socios): hotels, property owners and tour companies prepare their listings and send
-- price proposals to Tripya. Partners NEVER publish: their data, photos and prices are private drafts that
-- only they and the admins can see. Only an admin turns an accepted proposal into a public offer
-- (publish_partner_proposal). See DECISIONS.md (ADR panel de socios).

-- ---------------------------------------------------------------------------
-- 0. Catalog hardening: only admins write the public catalog
-- ---------------------------------------------------------------------------
drop policy if exists products_provider_write on public.products;
drop policy if exists offers_provider_write on public.offers;
drop policy if exists product_media_provider_write on public.product_media;
drop policy if exists inventory_provider_write on public.inventory_units;
create policy products_admin_write on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy offers_admin_write on public.offers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy product_media_admin_write on public.product_media for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy inventory_admin_write on public.inventory_units for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Partner rows hold internal notes (commission, contacts): members read their own data through partner_me().
drop policy if exists providers_owner_read on public.providers;
create policy providers_owner_read on public.providers for select using (owner_id = (select auth.uid()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- 1. Types
-- ---------------------------------------------------------------------------
create type public.partner_listing_kind as enum ('hotel', 'apartment', 'package');
create type public.partner_listing_status as enum ('draft', 'submitted', 'negotiating', 'accepted', 'published', 'rejected');
create type public.partner_proposal_status as enum ('sent', 'negotiating', 'accepted', 'rejected', 'withdrawn');

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------
create table public.partner_listings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  kind public.partner_listing_kind not null,
  name text not null check (length(trim(name)) between 2 and 120),
  destination_id uuid references public.destinations(id) on delete set null,
  city_text text check (city_text is null or length(city_text) <= 80),
  address text check (address is null or length(address) <= 300),
  latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9,6) check (longitude is null or longitude between -180 and 180),
  description text not null default '' check (length(description) <= 6000),
  property_type text check (property_type is null or property_type in ('hotel', 'apartment', 'house_villa', 'hostel', 'ecolodge', 'cabin', 'boutique_hotel', 'glamping')),
  amenities text[] not null default '{}',
  check_in_time text check (check_in_time is null or length(check_in_time) <= 20),
  check_out_time text check (check_out_time is null or length(check_out_time) <= 20),
  rules text not null default '' check (length(rules) <= 3000),
  duration_label text check (duration_label is null or length(duration_label) <= 120),
  includes text[] not null default '{}',
  excludes text[] not null default '{}',
  itinerary jsonb not null default '[]'::jsonb,
  floors integer not null default 1 check (floors between 1 and 60),
  status public.partner_listing_status not null default 'draft',
  product_id uuid references public.products(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index partner_listings_provider_idx on public.partner_listings (provider_id);

create table public.partner_units (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.partner_listings(id) on delete cascade,
  floor integer not null default 1 check (floor between 0 and 60),
  label text not null check (length(trim(label)) between 1 and 20),
  room_type text not null default '' check (length(room_type) <= 60),
  max_guests integer check (max_guests is null or max_guests between 1 and 30),
  beds text check (beds is null or length(beds) <= 120),
  size_m2 integer check (size_m2 is null or size_m2 between 1 and 2000),
  features text[] not null default '{}',
  description text not null default '' check (length(description) <= 1500),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index partner_units_listing_idx on public.partner_units (listing_id);

create table public.partner_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.partner_listings(id) on delete cascade,
  unit_id uuid references public.partner_units(id) on delete cascade,
  storage_path text not null check (length(storage_path) <= 400),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index partner_media_listing_idx on public.partner_media (listing_id);

create table public.partner_proposals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.partner_listings(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  status public.partner_proposal_status not null default 'sent',
  currency_code text not null default 'BOB' check (currency_code ~ '^[A-Z]{3}$'),
  valid_from date,
  valid_to date,
  benefits text not null default '' check (length(benefits) <= 2000),
  notes text not null default '' check (length(notes) <= 2000),
  admin_reply text check (admin_reply is null or length(admin_reply) <= 2000),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint partner_proposals_dates check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
create index partner_proposals_provider_idx on public.partner_proposals (provider_id, created_at desc);
create index partner_proposals_status_idx on public.partner_proposals (status, created_at desc);

create table public.partner_proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.partner_proposals(id) on delete cascade,
  room_type text check (room_type is null or length(room_type) <= 60),
  regular_price_minor bigint not null check (regular_price_minor > 0),
  offered_price_minor bigint not null check (offered_price_minor > 0),
  pricing_unit text not null check (pricing_unit in ('per_night', 'per_person', 'per_stay')),
  sort_order integer not null default 0,
  constraint partner_items_price_order check (offered_price_minor <= regular_price_minor)
);
create index partner_items_proposal_idx on public.partner_proposal_items (proposal_id);

create table public.partner_messages (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.partner_proposals(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete set null,
  author_role text not null check (author_role in ('partner', 'tripya')),
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index partner_messages_proposal_idx on public.partner_messages (proposal_id, created_at);

create table public.partner_invites (
  email text primary key check (email = lower(trim(email)) and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  provider_id uuid not null references public.providers(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Status transitions (changed only inside the functions below)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_partner_listing_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status or new.product_id is distinct from old.product_id then
    if coalesce(current_setting('tripya.partner_flow', true), '') <> 'on' then
      raise exception 'status_changes_only_through_functions';
    end if;
    if new.status is distinct from old.status and not (
      (old.status = 'draft' and new.status in ('submitted'))
      or (old.status = 'submitted' and new.status in ('negotiating', 'accepted', 'rejected', 'draft', 'published'))
      or (old.status = 'negotiating' and new.status in ('submitted', 'accepted', 'rejected', 'draft', 'published'))
      or (old.status = 'accepted' and new.status in ('published', 'negotiating'))
      or (old.status = 'rejected' and new.status in ('draft', 'submitted'))
    ) then
      raise exception 'invalid_status_transition: % -> %', old.status, new.status;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger partner_listings_status before update on public.partner_listings
for each row execute function public.enforce_partner_listing_status();

create or replace function public.enforce_partner_proposal_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(current_setting('tripya.partner_flow', true), '') <> 'on' then
    raise exception 'status_changes_only_through_functions';
  end if;
  if new.status is distinct from old.status and not (
    (old.status = 'sent' and new.status in ('negotiating', 'accepted', 'rejected', 'withdrawn'))
    or (old.status = 'negotiating' and new.status in ('accepted', 'rejected', 'withdrawn'))
  ) then
    raise exception 'invalid_status_transition: % -> %', old.status, new.status;
  end if;
  return new;
end;
$$;

create trigger partner_proposals_status before update on public.partner_proposals
for each row execute function public.enforce_partner_proposal_status();

-- Drafts can be edited by the partner only while they are not under review.
create or replace function public.partner_listing_editable(target_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.partner_listings l
    where l.id = target_listing_id
      and (public.is_admin() or (public.is_provider_member(l.provider_id) and l.status in ('draft', 'rejected')))
  );
$$;

create or replace function public.partner_listing_visible(target_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.partner_listings l
    where l.id = target_listing_id and (public.is_admin() or public.is_provider_member(l.provider_id))
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. RLS: nothing here is public
-- ---------------------------------------------------------------------------
alter table public.partner_listings enable row level security;
alter table public.partner_units enable row level security;
alter table public.partner_media enable row level security;
alter table public.partner_proposals enable row level security;
alter table public.partner_proposal_items enable row level security;
alter table public.partner_messages enable row level security;
alter table public.partner_invites enable row level security;

create policy partner_listings_read on public.partner_listings for select to authenticated
  using (public.is_admin() or public.is_provider_member(provider_id));
create policy partner_listings_insert on public.partner_listings for insert to authenticated
  with check (status = 'draft' and product_id is null and (public.is_admin() or public.is_provider_member(provider_id)));
create policy partner_listings_update on public.partner_listings for update to authenticated
  using (public.partner_listing_editable(id)) with check (public.is_admin() or public.is_provider_member(provider_id));
create policy partner_listings_delete on public.partner_listings for delete to authenticated
  using (public.partner_listing_editable(id) and product_id is null);

create policy partner_units_read on public.partner_units for select to authenticated using (public.partner_listing_visible(listing_id));
create policy partner_units_write on public.partner_units for all to authenticated
  using (public.partner_listing_editable(listing_id)) with check (public.partner_listing_editable(listing_id));

create policy partner_media_read on public.partner_media for select to authenticated using (public.partner_listing_visible(listing_id));
create policy partner_media_write on public.partner_media for all to authenticated
  using (public.partner_listing_editable(listing_id)) with check (public.partner_listing_editable(listing_id));

create policy partner_proposals_read on public.partner_proposals for select to authenticated
  using (public.is_admin() or public.is_provider_member(provider_id));
create policy partner_items_read on public.partner_proposal_items for select to authenticated
  using (exists (select 1 from public.partner_proposals p where p.id = proposal_id and (public.is_admin() or public.is_provider_member(p.provider_id))));

create policy partner_messages_read on public.partner_messages for select to authenticated
  using (exists (select 1 from public.partner_proposals p where p.id = proposal_id and (public.is_admin() or public.is_provider_member(p.provider_id))));
create policy partner_messages_insert on public.partner_messages for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.partner_proposals p
      where p.id = proposal_id
        and ((author_role = 'partner' and public.is_provider_member(p.provider_id)) or (author_role = 'tripya' and public.is_admin()))
    )
  );

create policy partner_invites_admin on public.partner_invites for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.partner_listings, public.partner_units, public.partner_media, public.partner_proposals,
  public.partner_proposal_items, public.partner_messages, public.partner_invites from anon, authenticated;
grant select, insert, delete on public.partner_listings to authenticated;
-- status and product_id are left out on purpose: they only change inside the functions below.
grant update (kind, name, destination_id, city_text, address, latitude, longitude, description, property_type, amenities,
  check_in_time, check_out_time, rules, duration_label, includes, excludes, itinerary, floors) on public.partner_listings to authenticated;
grant select, insert, update, delete on public.partner_units, public.partner_media to authenticated;
grant select on public.partner_proposals, public.partner_proposal_items to authenticated;
grant select, insert on public.partner_messages to authenticated;
grant select, insert, update, delete on public.partner_invites to authenticated;

-- Live chat.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.partner_messages;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Private photos: bucket partner-media, folder {provider_id}/{listing_id}/...
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('partner-media', 'partner-media', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.partner_media_access(object_name text, for_write boolean)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_parts text[] := string_to_array(object_name, '/');
  v_provider uuid;
  v_listing uuid;
begin
  if public.is_admin() then
    return true;
  end if;
  if array_length(v_parts, 1) < 3 or v_parts[1] !~ '^[0-9a-f-]{36}$' or v_parts[2] !~ '^[0-9a-f-]{36}$' then
    return false;
  end if;
  v_provider := v_parts[1]::uuid;
  v_listing := v_parts[2]::uuid;
  if not exists (select 1 from public.partner_listings where id = v_listing and provider_id = v_provider) then
    return false;
  end if;
  return case when for_write then public.partner_listing_editable(v_listing) else public.is_provider_member(v_provider) end;
end;
$$;

create policy partner_media_files_read on storage.objects for select to authenticated
  using (bucket_id = 'partner-media' and public.partner_media_access(name, false));
create policy partner_media_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'partner-media' and public.partner_media_access(name, true));
create policy partner_media_files_update on storage.objects for update to authenticated
  using (bucket_id = 'partner-media' and public.partner_media_access(name, true))
  with check (bucket_id = 'partner-media' and public.partner_media_access(name, true));
create policy partner_media_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'partner-media' and public.partner_media_access(name, true));

-- ---------------------------------------------------------------------------
-- 6. Access: only partners registered by an admin
-- ---------------------------------------------------------------------------
create or replace function public.link_partner_invite(p_user_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.partner_invites%rowtype;
begin
  for v_invite in select * from public.partner_invites where email = lower(trim(p_email)) loop
    insert into public.provider_members (provider_id, user_id) values (v_invite.provider_id, p_user_id) on conflict do nothing;
    insert into public.user_roles (user_id, role) values (p_user_id, 'provider_member') on conflict do nothing;
    update public.partner_invites set claimed_by = p_user_id, claimed_at = coalesce(claimed_at, now()) where email = v_invite.email;
  end loop;
end;
$$;
revoke all on function public.link_partner_invite(uuid, text) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  insert into public.user_roles (user_id, role) values (new.id, 'traveler');
  -- A partner invited by an admin gets panel access as soon as the account exists.
  if new.email is not null then
    perform public.link_partner_invite(new.id, new.email);
  end if;
  return new;
end;
$$;

create or replace function public.grant_partner_access(p_provider_id uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;
  if not exists (select 1 from public.providers where id = p_provider_id) then
    raise exception 'provider_not_found';
  end if;
  insert into public.partner_invites (email, provider_id, created_by) values (v_email, p_provider_id, auth.uid())
  on conflict (email) do update set provider_id = excluded.provider_id, created_by = excluded.created_by;
  select id into v_user from auth.users where lower(email) = v_email limit 1;
  if v_user is not null then
    perform public.link_partner_invite(v_user, v_email);
    return 'linked';
  end if;
  return 'invited';
end;
$$;

create or replace function public.revoke_partner_access(p_provider_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;
  delete from public.partner_invites where email = v_email and provider_id = p_provider_id;
  delete from public.provider_members m using auth.users u
  where m.user_id = u.id and lower(u.email) = v_email and m.provider_id = p_provider_id;
end;
$$;

-- Partners the current user belongs to (safe columns only: no internal notes).
create or replace function public.partner_me()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'trade_name', p.trade_name, 'partner_type', p.partner_type, 'city', p.city,
    'contact_name', p.contact_name, 'email', p.email, 'phone', p.phone) order by p.trade_name), '[]'::jsonb)
  from public.providers p
  where exists (select 1 from public.provider_members m where m.provider_id = p.id and m.user_id = (select auth.uid()));
$$;

-- Admin view of who has access to each partner.
create or replace function public.partner_access_list()
returns table (provider_id uuid, email text, claimed boolean)
language sql
stable
security definer
set search_path = public, auth
as $$
  select i.provider_id, i.email, i.claimed_at is not null from public.partner_invites i where public.is_admin()
  union
  select m.provider_id, lower(u.email), true from public.provider_members m join auth.users u on u.id = m.user_id
  where public.is_admin() and not exists (select 1 from public.partner_invites i where i.email = lower(u.email) and i.provider_id = m.provider_id);
$$;

-- ---------------------------------------------------------------------------
-- 7. Negotiation
-- ---------------------------------------------------------------------------
create or replace function public.submit_partner_proposal(
  p_listing_id uuid,
  p_items jsonb,
  p_valid_from date,
  p_valid_to date,
  p_benefits text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.partner_listings%rowtype;
  v_item jsonb;
  v_proposal uuid;
  v_index integer := 0;
begin
  select * into v_listing from public.partner_listings where id = p_listing_id for update;
  if not found or not public.is_provider_member(v_listing.provider_id) then
    raise exception 'not_allowed';
  end if;
  if v_listing.status not in ('draft', 'rejected', 'negotiating') then
    raise exception 'invalid_status';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'invalid_prices';
  end if;
  if not exists (select 1 from public.partner_media where listing_id = p_listing_id) then
    raise exception 'photos_required';
  end if;
  if v_listing.kind = 'hotel' and not exists (select 1 from public.partner_units where listing_id = p_listing_id and room_type <> '') then
    raise exception 'rooms_required';
  end if;
  if p_valid_from is not null and p_valid_from < current_date - 1 then
    raise exception 'invalid_dates';
  end if;
  if p_valid_to is not null and p_valid_from is not null and p_valid_to < p_valid_from then
    raise exception 'invalid_dates';
  end if;
  if length(coalesce(p_benefits, '')) > 2000 or length(coalesce(p_notes, '')) > 2000 then
    raise exception 'text_too_long';
  end if;

  perform set_config('tripya.partner_flow', 'on', true);
  -- A new proposal replaces the one under negotiation.
  update public.partner_proposals set status = 'withdrawn' where listing_id = p_listing_id and status in ('sent', 'negotiating');

  insert into public.partner_proposals (listing_id, provider_id, valid_from, valid_to, benefits, notes, created_by)
  values (p_listing_id, v_listing.provider_id, p_valid_from, p_valid_to, trim(coalesce(p_benefits, '')), trim(coalesce(p_notes, '')), auth.uid())
  returning id into v_proposal;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if coalesce(jsonb_typeof(v_item -> 'regular_price_minor'), '') <> 'number' or coalesce(jsonb_typeof(v_item -> 'offered_price_minor'), '') <> 'number'
       or (v_item ->> 'regular_price_minor') !~ '^\d{1,12}$' or (v_item ->> 'offered_price_minor') !~ '^\d{1,12}$' then
      raise exception 'invalid_prices';
    end if;
    if (v_item ->> 'offered_price_minor')::bigint > (v_item ->> 'regular_price_minor')::bigint or (v_item ->> 'offered_price_minor')::bigint <= 0 then
      raise exception 'invalid_prices';
    end if;
    insert into public.partner_proposal_items (proposal_id, room_type, regular_price_minor, offered_price_minor, pricing_unit, sort_order)
    values (v_proposal, nullif(left(trim(coalesce(v_item ->> 'room_type', '')), 60), ''), (v_item ->> 'regular_price_minor')::bigint,
      (v_item ->> 'offered_price_minor')::bigint,
      case when v_item ->> 'pricing_unit' in ('per_night', 'per_person', 'per_stay') then v_item ->> 'pricing_unit'
           when v_listing.kind = 'package' then 'per_person' else 'per_night' end,
      v_index);
    v_index := v_index + 1;
  end loop;

  update public.partner_listings set status = 'submitted' where id = p_listing_id;
  return v_proposal;
end;
$$;

create or replace function public.withdraw_partner_proposal(p_proposal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal public.partner_proposals%rowtype;
begin
  select * into v_proposal from public.partner_proposals where id = p_proposal_id for update;
  if not found or not public.is_provider_member(v_proposal.provider_id) then
    raise exception 'not_allowed';
  end if;
  if v_proposal.status not in ('sent', 'negotiating') then
    raise exception 'invalid_status';
  end if;
  perform set_config('tripya.partner_flow', 'on', true);
  update public.partner_proposals set status = 'withdrawn' where id = p_proposal_id;
  update public.partner_listings set status = 'draft' where id = v_proposal.listing_id and status in ('submitted', 'negotiating');
end;
$$;

-- Admin answer: open a negotiation (chat) or reject. Accepting goes through publish_partner_proposal.
create or replace function public.decide_partner_proposal(p_proposal_id uuid, p_decision text, p_reply text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal public.partner_proposals%rowtype;
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;
  if p_decision not in ('negotiating', 'rejected') then
    raise exception 'invalid_decision';
  end if;
  select * into v_proposal from public.partner_proposals where id = p_proposal_id for update;
  if not found then
    raise exception 'proposal_not_found';
  end if;
  perform set_config('tripya.partner_flow', 'on', true);
  update public.partner_proposals
  set status = p_decision::public.partner_proposal_status, admin_reply = nullif(trim(coalesce(p_reply, '')), ''), decided_at = now(), decided_by = auth.uid()
  where id = p_proposal_id;
  update public.partner_listings set status = p_decision::public.partner_listing_status where id = v_proposal.listing_id;
  if nullif(trim(coalesce(p_reply, '')), '') is not null then
    insert into public.partner_messages (proposal_id, author_id, author_role, body) values (p_proposal_id, auth.uid(), 'tripya', left(trim(p_reply), 2000));
  end if;
end;
$$;

-- The ONLY way from a partner proposal to the public site. Admin only.
-- p_media: photos the admin already copied to the public offer-media bucket: [{"unit_id": uuid|null, "path": text, "url": text}]
-- Prices: the cheapest room type (or the single item) is the offer price; other room types become room supplements.
create or replace function public.publish_partner_proposal(
  p_proposal_id uuid,
  p_destination_id uuid,
  p_slug text,
  p_title text,
  p_original_minor bigint,
  p_promo_minor bigint,
  p_media jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal public.partner_proposals%rowtype;
  v_listing public.partner_listings%rowtype;
  v_base_offered bigint;
  v_unit text;
  v_rooms jsonb := '[]'::jsonb;
  v_capacity integer;
  v_slug text := left(regexp_replace(lower(coalesce(p_slug, '')), '[^a-z0-9-]+', '-', 'g'), 70);
  v_product uuid;
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;
  select * into v_proposal from public.partner_proposals where id = p_proposal_id for update;
  if not found or v_proposal.status not in ('sent', 'negotiating', 'accepted') then
    raise exception 'invalid_status';
  end if;
  select * into v_listing from public.partner_listings where id = v_proposal.listing_id for update;
  if v_listing.product_id is not null then
    raise exception 'already_published';
  end if;
  if p_destination_id is null or not exists (select 1 from public.destinations where id = p_destination_id) then
    raise exception 'destination_required';
  end if;
  if p_original_minor is null or p_promo_minor is null or p_promo_minor <= 0 or p_promo_minor > p_original_minor then
    raise exception 'invalid_prices';
  end if;
  if length(trim(coalesce(p_title, ''))) < 3 or length(v_slug) < 3 then
    raise exception 'invalid_title';
  end if;
  if exists (select 1 from public.products where slug = v_slug) then
    v_slug := left(v_slug, 64) || '-' || substr(md5(random()::text), 1, 5);
  end if;

  select min(offered_price_minor), min(pricing_unit) into v_base_offered, v_unit from public.partner_proposal_items where proposal_id = p_proposal_id;

  if v_listing.kind = 'hotel' then
    -- One bookable option per proposed room type, cheapest first; supplement = difference with the cheapest offered price.
    select coalesce(jsonb_agg(room order by (room ->> 'supplement_minor')::bigint, room ->> 'name'), '[]'::jsonb) into v_rooms
    from (
      select jsonb_build_object(
        'id', left(regexp_replace(lower(i.room_type), '[^a-z0-9]+', '-', 'g'), 40) || '-' || i.sort_order,
        'name', i.room_type,
        'description', coalesce((select u.description from public.partner_units u where u.listing_id = v_listing.id and u.room_type = i.room_type and u.description <> '' limit 1), ''),
        'image_url', (select m ->> 'url' from jsonb_array_elements(coalesce(p_media, '[]'::jsonb)) m
                       join public.partner_units u on u.id::text = m ->> 'unit_id'
                       where u.listing_id = v_listing.id and u.room_type = i.room_type limit 1),
        'features', coalesce((select to_jsonb(u.features) from public.partner_units u where u.listing_id = v_listing.id and u.room_type = i.room_type and cardinality(u.features) > 0 limit 1), '[]'::jsonb),
        'beds', (select u.beds from public.partner_units u where u.listing_id = v_listing.id and u.room_type = i.room_type and u.beds is not null limit 1),
        'size_m2', (select u.size_m2 from public.partner_units u where u.listing_id = v_listing.id and u.room_type = i.room_type and u.size_m2 is not null limit 1),
        'max_guests', (select max(u.max_guests) from public.partner_units u where u.listing_id = v_listing.id and u.room_type = i.room_type),
        'supplement_minor', i.offered_price_minor - v_base_offered
      ) as room
      from public.partner_proposal_items i
      where i.proposal_id = p_proposal_id and i.room_type is not null
    ) rooms;
    select max((r ->> 'max_guests')::integer) into v_capacity from jsonb_array_elements(v_rooms) r;
  else
    select max(max_guests) into v_capacity from public.partner_units where listing_id = v_listing.id;
  end if;

  insert into public.products (provider_id, destination_id, type, slug, title, description, currency_code, base_price_minor, duration_label,
    includes, excludes, property_type, pricing_unit, capacity_max, min_nights, amenities, booking_conditions, cancellation_policy,
    check_in_time, check_out_time, stay_available_from, stay_available_to, address, latitude, longitude, perks, room_options, itinerary, is_published)
  values (v_listing.provider_id, p_destination_id,
    case when v_listing.kind = 'package' then 'package'::public.product_type else 'accommodation'::public.product_type end,
    v_slug, trim(p_title), v_listing.description, v_proposal.currency_code, p_promo_minor, v_listing.duration_label,
    v_listing.includes, v_listing.excludes,
    case when v_listing.kind = 'package' then null else coalesce(v_listing.property_type, case when v_listing.kind = 'hotel' then 'hotel' else 'apartment' end) end,
    coalesce(v_unit, case when v_listing.kind = 'package' then 'per_person' else 'per_night' end),
    v_capacity, 1, v_listing.amenities, v_listing.rules, '', v_listing.check_in_time, v_listing.check_out_time,
    v_proposal.valid_from, v_proposal.valid_to, v_listing.address, v_listing.latitude, v_listing.longitude,
    coalesce((select array_agg(trim(line)) from regexp_split_to_table(v_proposal.benefits, '\n') line where trim(line) <> ''), '{}'),
    v_rooms, v_listing.itinerary, true)
  returning id into v_product;

  insert into public.product_media (product_id, storage_path, public_url, alt_text, sort_order)
  select v_product, m ->> 'path', m ->> 'url', trim(p_title), (row_number() over ())::integer - 1
  from jsonb_array_elements(coalesce(p_media, '[]'::jsonb)) m
  where (m ->> 'url') like 'https://%';

  insert into public.offers (product_id, kind, title, original_price_minor, promotional_price_minor, currency_code, starts_at, featured, is_published)
  values (v_product, 'normal', trim(p_title), p_original_minor, p_promo_minor, v_proposal.currency_code, now(), false, true);

  perform set_config('tripya.partner_flow', 'on', true);
  update public.partner_proposals set status = 'accepted', decided_at = now(), decided_by = auth.uid() where id = p_proposal_id and status <> 'accepted';
  update public.partner_listings set status = 'published', product_id = v_product where id = v_listing.id;
  insert into public.partner_messages (proposal_id, author_id, author_role, body)
  values (p_proposal_id, auth.uid(), 'tripya', '¡Aceptamos tu oferta! Ya está publicada en Tripya.');
  return v_slug;
end;
$$;

revoke all on function public.grant_partner_access(uuid, text), public.revoke_partner_access(uuid, text), public.partner_me(), public.partner_access_list(),
  public.submit_partner_proposal(uuid, jsonb, date, date, text, text), public.withdraw_partner_proposal(uuid),
  public.decide_partner_proposal(uuid, text, text), public.publish_partner_proposal(uuid, uuid, text, text, bigint, bigint, jsonb),
  public.partner_listing_editable(uuid), public.partner_listing_visible(uuid), public.partner_media_access(text, boolean) from public, anon;
grant execute on function public.grant_partner_access(uuid, text), public.revoke_partner_access(uuid, text), public.partner_me(), public.partner_access_list(),
  public.submit_partner_proposal(uuid, jsonb, date, date, text, text), public.withdraw_partner_proposal(uuid),
  public.decide_partner_proposal(uuid, text, text), public.publish_partner_proposal(uuid, uuid, text, text, bigint, bigint, jsonb),
  public.partner_listing_editable(uuid), public.partner_listing_visible(uuid), public.partner_media_access(text, boolean) to authenticated;

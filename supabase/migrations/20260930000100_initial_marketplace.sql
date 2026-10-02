-- Ofertazo Travel: core marketplace MVP
-- Run with Supabase CLI or paste into the SQL Editor.

create extension if not exists pgcrypto;

create type public.app_role as enum ('traveler', 'provider_member', 'admin', 'finance_admin', 'superadmin');
create type public.provider_status as enum ('draft', 'pending_review', 'approved', 'rejected', 'suspended');
create type public.product_type as enum ('accommodation', 'tour', 'package');
create type public.offer_kind as enum ('normal', 'flash');
create type public.booking_status as enum ('pending', 'awaiting_payment', 'paid', 'confirmed', 'cancelled', 'refunded', 'completed', 'disputed', 'expired');
create type public.inventory_hold_status as enum ('active', 'converted', 'released', 'expired');

create table public.country_settings (
  country_code text primary key check (country_code ~ '^[A-Z]{2}$'),
  name text not null,
  default_currency_code text not null check (default_currency_code ~ '^[A-Z]{3}$'),
  timezone text not null,
  payout_delay_days integer not null default 7 check (payout_delay_days >= 0),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  avatar_url text,
  country_code text references public.country_settings(country_code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.destinations(id) on delete restrict,
  country_code text not null references public.country_settings(country_code),
  name text not null,
  slug text not null unique,
  kind text not null check (kind in ('country', 'region', 'city', 'zone', 'tourist_site')),
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  legal_name text not null,
  trade_name text not null,
  tax_id text,
  email text not null,
  phone text,
  description text,
  status public.provider_status not null default 'draft',
  country_code text not null references public.country_settings(country_code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.provider_members (
  provider_id uuid not null references public.providers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (provider_id, user_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete restrict,
  destination_id uuid not null references public.destinations(id) on delete restrict,
  type public.product_type not null,
  slug text not null unique,
  title text not null,
  description text not null default '',
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  base_price_minor bigint not null check (base_price_minor >= 0),
  duration_label text,
  includes text[] not null default '{}',
  rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  kind public.offer_kind not null default 'normal',
  title text not null,
  original_price_minor bigint not null check (original_price_minor >= 0),
  promotional_price_minor bigint not null check (promotional_price_minor >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  starts_at timestamptz,
  ends_at timestamptz,
  max_units integer check (max_units is null or max_units > 0),
  featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint offers_price_order check (promotional_price_minor <= original_price_minor),
  constraint offers_valid_window check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.inventory_units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  service_date date,
  total_units integer not null default 1 check (total_units >= 0),
  reserved_units integer not null default 0 check (reserved_units >= 0 and reserved_units <= total_units),
  unique (product_id, service_date)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references auth.users(id) on delete restrict,
  status public.booking_status not null default 'pending',
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  commission_minor bigint not null default 0 check (commission_minor >= 0),
  total_minor bigint not null default 0 check (total_minor >= 0),
  contact_name text not null,
  contact_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  offer_id uuid references public.offers(id) on delete restrict,
  service_date date,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  commission_rate numeric(7,4) not null default 0 check (commission_rate >= 0 and commission_rate <= 1),
  commission_minor bigint not null default 0 check (commission_minor >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  title_snapshot text not null,
  created_at timestamptz not null default now()
);

create table public.travelers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  full_name text not null,
  document_type text,
  document_last_four text,
  birth_date date,
  created_at timestamptz not null default now()
);

create table public.inventory_holds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  inventory_unit_id uuid not null references public.inventory_units(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  status public.inventory_hold_status not null default 'active',
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index destinations_parent_idx on public.destinations(parent_id);
create index products_destination_idx on public.products(destination_id);
create index products_provider_idx on public.products(provider_id);
create index products_published_idx on public.products(is_published) where is_published;
create index offers_product_idx on public.offers(product_id);
create index offers_active_idx on public.offers(is_published, starts_at, ends_at);
create index bookings_traveler_idx on public.bookings(traveler_id, created_at desc);
create index inventory_holds_expiry_idx on public.inventory_holds(status, expires_at);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('admin', 'finance_admin', 'superadmin')
  );
$$;

create or replace function public.is_provider_member(target_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.provider_members
    where provider_id = target_provider_id
      and user_id = (select auth.uid())
  ) or exists (
    select 1 from public.providers
    where id = target_provider_id
      and owner_id = (select auth.uid())
  );
$$;

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
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.country_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.destinations enable row level security;
alter table public.providers enable row level security;
alter table public.provider_members enable row level security;
alter table public.products enable row level security;
alter table public.product_media enable row level security;
alter table public.offers enable row level security;
alter table public.inventory_units enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.travelers enable row level security;
alter table public.inventory_holds enable row level security;
alter table public.favorites enable row level security;
alter table public.audit_logs enable row level security;

create policy country_settings_public_read on public.country_settings for select using (true);
create policy profiles_self_read on public.profiles for select using (id = (select auth.uid()) or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy roles_self_read on public.user_roles for select using (user_id = (select auth.uid()) or public.is_admin());
create policy destinations_public_read on public.destinations for select using (is_published or public.is_admin());
create policy destinations_admin_write on public.destinations for all using (public.is_admin()) with check (public.is_admin());
create policy providers_owner_read on public.providers for select using (owner_id = (select auth.uid()) or public.is_provider_member(id) or public.is_admin());
create policy providers_owner_write on public.providers for all using (owner_id = (select auth.uid()) or public.is_admin()) with check (owner_id = (select auth.uid()) or public.is_admin());
create policy provider_members_member_read on public.provider_members for select using (user_id = (select auth.uid()) or public.is_provider_member(provider_id) or public.is_admin());
create policy provider_members_admin_write on public.provider_members for all using (public.is_admin()) with check (public.is_admin());
create policy products_public_read on public.products for select using (is_published or public.is_provider_member(provider_id) or public.is_admin());
create policy products_provider_write on public.products for all using (public.is_provider_member(provider_id) or public.is_admin()) with check (public.is_provider_member(provider_id) or public.is_admin());
create policy product_media_public_read on public.product_media for select using (exists (select 1 from public.products p where p.id = product_id and (p.is_published or public.is_provider_member(p.provider_id) or public.is_admin())));
create policy product_media_provider_write on public.product_media for all using (exists (select 1 from public.products p where p.id = product_id and (public.is_provider_member(p.provider_id) or public.is_admin()))) with check (exists (select 1 from public.products p where p.id = product_id and (public.is_provider_member(p.provider_id) or public.is_admin())));
create policy offers_public_read on public.offers for select using (is_published or exists (select 1 from public.products p where p.id = product_id and (public.is_provider_member(p.provider_id) or public.is_admin())));
create policy offers_provider_write on public.offers for all using (exists (select 1 from public.products p where p.id = product_id and (public.is_provider_member(p.provider_id) or public.is_admin()))) with check (exists (select 1 from public.products p where p.id = product_id and (public.is_provider_member(p.provider_id) or public.is_admin())));
create policy inventory_public_read on public.inventory_units for select using (exists (select 1 from public.products p where p.id = product_id and (p.is_published or public.is_provider_member(p.provider_id) or public.is_admin())));
create policy inventory_provider_write on public.inventory_units for all using (exists (select 1 from public.products p where p.id = product_id and (public.is_provider_member(p.provider_id) or public.is_admin()))) with check (exists (select 1 from public.products p where p.id = product_id and (public.is_provider_member(p.provider_id) or public.is_admin())));
create policy bookings_traveler_read on public.bookings for select using (traveler_id = (select auth.uid()) or public.is_admin());
create policy bookings_traveler_insert on public.bookings for insert with check (traveler_id = (select auth.uid()));
create policy bookings_traveler_update on public.bookings for update using (traveler_id = (select auth.uid()) or public.is_admin()) with check (traveler_id = (select auth.uid()) or public.is_admin());
create policy booking_items_booking_read on public.booking_items for select using (exists (select 1 from public.bookings b where b.id = booking_id and (b.traveler_id = (select auth.uid()) or public.is_admin())));
create policy booking_items_booking_insert on public.booking_items for insert with check (exists (select 1 from public.bookings b where b.id = booking_id and b.traveler_id = (select auth.uid())));
create policy travelers_booking_read on public.travelers for select using (exists (select 1 from public.bookings b where b.id = booking_id and (b.traveler_id = (select auth.uid()) or public.is_admin())));
create policy travelers_booking_insert on public.travelers for insert with check (exists (select 1 from public.bookings b where b.id = booking_id and b.traveler_id = (select auth.uid())));
create policy holds_owner_read on public.inventory_holds for select using (created_by = (select auth.uid()) or public.is_admin());
create policy favorites_self_all on public.favorites for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy audit_admin_read on public.audit_logs for select using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.country_settings, public.destinations, public.products, public.product_media, public.offers, public.inventory_units to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.providers, public.provider_members, public.audit_logs to authenticated;
grant select, insert, update on public.bookings, public.booking_items, public.travelers, public.favorites to authenticated;

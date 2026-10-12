-- First-party, anonymous site statistics for the admin "Estadísticas" tab.
--
-- Privacy by design: no cookies, no IP addresses and no personal data are stored. The API route
-- passes "ip|user-agent" only to compute a visitor hash with a random salt that changes every day
-- and is deleted after 48 hours, so a visitor can be counted once per day but never identified or
-- followed across days. Events can only be written through track_event() and only admins can read.

create table public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event text not null check (event in (
    'page_view', 'view_item', 'select_item', 'search', 'click_whatsapp', 'begin_checkout',
    'checkout_step', 'generate_lead', 'view_destination', 'provider_application', 'language_change'
  )),
  visitor_hash text not null,
  path text,
  offer_slug text,
  destination_slug text,
  placement text,
  search_term text,
  source text not null default 'directo',
  campaign text,
  content text,
  device text check (device in ('mobile', 'tablet', 'desktop')),
  country text,
  locale text
);

create index analytics_events_time_idx on public.analytics_events (created_at desc);
create index analytics_events_event_time_idx on public.analytics_events (event, created_at desc);
create index analytics_events_offer_idx on public.analytics_events (offer_slug, event) where offer_slug is not null;

alter table public.analytics_events enable row level security;
create policy analytics_events_admin_read on public.analytics_events for select to authenticated using (public.is_admin());
grant select on public.analytics_events to authenticated;

-- Daily random salts. RLS without policies: nobody can read them through the API.
create table public.analytics_salts (
  day date primary key,
  salt bytea not null
);
alter table public.analytics_salts enable row level security;

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
    case when p_locale in ('es', 'en', 'fr') then p_locale end
  );
exception
  -- Unknown event names or bad input must never surface to the visitor.
  when check_violation then return;
end;
$$;

revoke all on function public.track_event(text, text, text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.track_event(text, text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- Everything the admin dashboard shows for the last p_days days, plus the previous period for deltas.
create or replace function public.analytics_summary(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 30), 1), 365);
  v_to timestamptz := now();
  v_from timestamptz := now() - make_interval(days => v_days);
  v_prev timestamptz := now() - make_interval(days => v_days * 2);
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;

  with cur as (select * from public.analytics_events where created_at >= v_from and created_at < v_to),
  prev as (select * from public.analytics_events where created_at >= v_prev and created_at < v_from),
  kpi as (
    select
      (select count(distinct visitor_hash) from cur) as visitors,
      (select count(*) from cur where event = 'page_view') as pageviews,
      (select count(*) from cur where event = 'view_item') as offer_views,
      (select count(*) from cur where event = 'click_whatsapp') as whatsapp,
      (select count(*) from cur where event = 'begin_checkout') as checkouts,
      (select count(*) from cur where event = 'generate_lead') as leads,
      (select count(distinct visitor_hash) from prev) as p_visitors,
      (select count(*) from prev where event = 'page_view') as p_pageviews,
      (select count(*) from prev where event = 'view_item') as p_offer_views,
      (select count(*) from prev where event = 'click_whatsapp') as p_whatsapp,
      (select count(*) from prev where event = 'begin_checkout') as p_checkouts,
      (select count(*) from prev where event = 'generate_lead') as p_leads
  )
  select jsonb_build_object(
    'days', v_days,
    'kpis', (select to_jsonb(kpi) from kpi),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day::date, 'visitors', coalesce(x.visitors, 0), 'pageviews', coalesce(x.pageviews, 0)) order by d.day), '[]'::jsonb)
      from generate_series((v_from at time zone 'America/La_Paz')::date, (v_to at time zone 'America/La_Paz')::date, interval '1 day') as d(day)
      left join (
        select (created_at at time zone 'America/La_Paz')::date as day, count(distinct visitor_hash) as visitors, count(*) filter (where event = 'page_view') as pageviews
        from cur group by 1
      ) x on x.day = d.day::date
    ),
    'funnel', jsonb_build_object(
      'visitors', (select count(distinct visitor_hash) from cur),
      'offer_viewers', (select count(distinct visitor_hash) from cur where event = 'view_item'),
      'checkout_starters', (select count(distinct visitor_hash) from cur where event = 'begin_checkout'),
      'lead_senders', (select count(distinct visitor_hash) from cur where event = 'generate_lead'),
      'whatsapp_clickers', (select count(distinct visitor_hash) from cur where event = 'click_whatsapp')
    ),
    'sources', (
      select coalesce(jsonb_agg(jsonb_build_object('label', source, 'visitors', visitors, 'leads', leads) order by visitors desc), '[]'::jsonb)
      from (select source, count(distinct visitor_hash) as visitors, count(*) filter (where event = 'generate_lead') as leads from cur group by source) s
    ),
    'devices', (
      select coalesce(jsonb_agg(jsonb_build_object('label', device, 'visitors', visitors) order by visitors desc), '[]'::jsonb)
      from (select coalesce(device, 'desktop') as device, count(distinct visitor_hash) as visitors from cur group by 1) s
    ),
    'countries', (
      select coalesce(jsonb_agg(jsonb_build_object('label', country, 'visitors', visitors) order by visitors desc), '[]'::jsonb)
      from (select coalesce(country, '??') as country, count(distinct visitor_hash) as visitors from cur group by 1 order by 2 desc limit 8) s
    ),
    'offers', (
      select coalesce(jsonb_agg(o order by o.views desc), '[]'::jsonb)
      from (
        select e.offer_slug as slug,
               coalesce(max(p.title), e.offer_slug) as title,
               bool_or(coalesce(p.is_sample, false)) as is_sample,
               count(*) filter (where e.event = 'view_item') as views,
               count(distinct e.visitor_hash) filter (where e.event = 'view_item') as visitors,
               count(*) filter (where e.event = 'select_item') as card_clicks,
               count(*) filter (where e.event = 'begin_checkout') as checkouts,
               count(*) filter (where e.event = 'generate_lead') as leads,
               count(*) filter (where e.event = 'click_whatsapp') as whatsapp
        from cur e
        left join public.products p on p.slug = e.offer_slug
        where e.offer_slug is not null
        group by e.offer_slug
      ) o
    ),
    'campaigns', (
      select coalesce(jsonb_agg(c order by c.visitors desc), '[]'::jsonb)
      from (
        select source, campaign, content, count(distinct visitor_hash) as visitors, count(*) filter (where event = 'generate_lead') as leads,
               count(*) filter (where event = 'click_whatsapp') as whatsapp
        from cur where campaign is not null or content is not null
        group by source, campaign, content order by 4 desc limit 15
      ) c
    ),
    'searches', (
      select coalesce(jsonb_agg(jsonb_build_object('label', search_term, 'count', n) order by n desc), '[]'::jsonb)
      from (select search_term, count(*) as n from cur where event = 'search' and search_term is not null group by 1 order by 2 desc limit 10) s
    ),
    'destinations', (
      select coalesce(jsonb_agg(jsonb_build_object('label', coalesce(d.name, x.destination_slug), 'count', x.n) order by x.n desc), '[]'::jsonb)
      from (select destination_slug, count(*) as n from cur where event = 'view_destination' and destination_slug is not null group by 1 order by 2 desc limit 10) x
      left join public.destinations d on d.slug = x.destination_slug
    ),
    'pages', (
      select coalesce(jsonb_agg(jsonb_build_object('label', path, 'count', n) order by n desc), '[]'::jsonb)
      from (select path, count(*) as n from cur where event = 'page_view' and path is not null group by 1 order by 2 desc limit 10) s
    ),
    'hours', (
      select coalesce(jsonb_agg(jsonb_build_object('hour', h.hour, 'visitors', coalesce(x.visitors, 0)) order by h.hour), '[]'::jsonb)
      from generate_series(0, 23) as h(hour)
      left join (select extract(hour from created_at at time zone 'America/La_Paz')::int as hour, count(distinct visitor_hash) as visitors from cur group by 1) x on x.hour = h.hour
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.analytics_summary(integer) from public;
grant execute on function public.analytics_summary(integer) to authenticated;

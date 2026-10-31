-- The waitlist form now asks for one of Bolivia's nine departments.
-- Answers saved with the previous options (la_paz_uyuni, sucre_potosi, other) stay valid.
alter table public.waitlist_signups drop constraint if exists waitlist_signups_destination_check;
alter table public.waitlist_signups add constraint waitlist_signups_destination_check check (destination in (
  'la_paz', 'oruro', 'potosi', 'cochabamba', 'chuquisaca', 'tarija', 'santa_cruz', 'beni', 'pando',
  'la_paz_uyuni', 'sucre_potosi', 'other'
));

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
  if p_destination is null or p_destination not in ('la_paz', 'oruro', 'potosi', 'cochabamba', 'chuquisaca', 'tarija', 'santa_cruz', 'beni', 'pando') then
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

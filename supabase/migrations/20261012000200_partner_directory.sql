-- Partner directory (admin → Socios): tourism companies, hotels and property owners with their
-- contact details. Partners are rows of public.providers; these columns hold what the team needs
-- to work with them. Contact details stay private: providers are only readable by their owner and admins.

alter table public.providers
  add column if not exists partner_type text not null default 'other',
  add column if not exists contact_name text,
  add column if not exists website text,
  add column if not exists city text,
  add column if not exists address text,
  add column if not exists notes text,
  add column if not exists application_id uuid references public.provider_applications(id) on delete set null;

alter table public.providers
  add constraint providers_partner_type_valid check (partner_type in ('hotel', 'owner', 'agency', 'tour_operator', 'other')),
  add constraint providers_text_lengths check (
    length(coalesce(contact_name, '')) <= 120 and length(coalesce(website, '')) <= 300 and length(coalesce(city, '')) <= 80
    and length(coalesce(address, '')) <= 300 and length(coalesce(notes, '')) <= 4000
  );

comment on column public.providers.partner_type is 'hotel | owner (dueño de alojamiento) | agency (agencia de turismo) | tour_operator | other';
comment on column public.providers.notes is 'Internal notes for the Tripya team (commission agreed, how to contact, etc.). Never shown on the site.';

-- Existing partners created from the offer form: best guess of their type and city.
update public.providers pv
set partner_type = case when exists (select 1 from public.products p where p.provider_id = pv.id and p.type = 'accommodation') then 'hotel' else 'agency' end
where partner_type = 'other' and trade_name <> 'Tripya ejemplos';

update public.providers pv
set city = d.name
from (
  select distinct on (p.provider_id) p.provider_id, d.name
  from public.products p join public.destinations d on d.id = p.destination_id
  order by p.provider_id, p.created_at
) d
where d.provider_id = pv.id and pv.city is null and pv.trade_name <> 'Tripya ejemplos';

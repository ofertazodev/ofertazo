-- Admin offer publishing support: map coordinates and public media storage.
alter table public.destinations
  add column if not exists address text,
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6),
  add constraint destinations_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint destinations_longitude_range check (longitude is null or longitude between -180 and 180);

insert into storage.buckets (id, name, public)
values ('offer-media', 'offer-media', true)
on conflict (id) do update set public = true;

create policy offer_media_public_read on storage.objects
for select using (bucket_id = 'offer-media');

create policy offer_media_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'offer-media' and public.is_admin());

create policy offer_media_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'offer-media' and public.is_admin())
with check (bucket_id = 'offer-media' and public.is_admin());

create policy offer_media_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'offer-media' and public.is_admin());

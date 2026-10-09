-- Providers now contact Ofertazo through WhatsApp; only admins publish content.
-- Remove public write access to provider applications and their photo bucket.
-- Existing rows and files stay readable by admins.

drop policy if exists provider_applications_public_insert on public.provider_applications;
revoke insert on public.provider_applications from anon, authenticated;

drop policy if exists provider_applications_upload on storage.objects;

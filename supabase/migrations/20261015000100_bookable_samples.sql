-- Sample offers can now be booked, so the whole booking → WhatsApp → "Confirmar pago" flow can be tested
-- with any offer. Their bookings show the partner "Tripya ejemplos", so the sales agent knows they are tests.
drop trigger if exists booking_items_reject_samples on public.booking_items;
drop function if exists public.reject_sample_bookings();

comment on column public.products.is_sample is 'Demo listing shown to fill the catalog. Labeled "Ejemplo" on the site; bookable for testing.';

-- Deleting sample offers also deletes their (test) bookings, which would otherwise block the delete.
create or replace function public.delete_sample_products(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  deleted integer;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  delete from public.bookings b
  where exists (
    select 1 from public.booking_items i
    join public.products p on p.id = i.product_id
    where i.booking_id = b.id and p.is_sample and p.id = any(p_ids)
  );

  delete from public.products where is_sample and id = any(p_ids);
  get diagnostics deleted = row_count;
  return deleted;
end;
$fn$;

revoke all on function public.delete_sample_products(uuid[]) from public, anon;
grant execute on function public.delete_sample_products(uuid[]) to authenticated;

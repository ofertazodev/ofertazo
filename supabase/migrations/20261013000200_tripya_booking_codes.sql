-- Booking codes carry the Tripya brand: TYA-XXXXXX (older OFZ-XXXXXX codes stay valid for lookups).
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
    result := 'TYA-';
    for i in 0..5 loop
      result := result || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
    end loop;
    exit when not exists (select 1 from public.bookings where code = result);
  end loop;
  return result;
end;
$$;

revoke execute on function public.generate_booking_code() from public, anon, authenticated;

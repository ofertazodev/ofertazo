-- Payment through the sales agent on WhatsApp (pilot, no online card payments):
-- 1. The traveler sends the booking request, sees a 5-second handoff screen and is sent to the sales
--    agent's WhatsApp with the booking details (including the partner, so the agent knows which QR to send).
--    booking_whatsapp_handoff() returns those details and marks the booking "awaiting_payment".
-- 2. Once the money arrives, an admin confirms it in /admin with confirm_booking_payment().

alter table public.bookings
  add column if not exists handed_off_at timestamptz,
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists payment_amount_minor bigint,
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_confirmed_by uuid references auth.users(id) on delete set null;

alter table public.bookings
  add constraint bookings_payment_method_valid check (payment_method is null or payment_method in ('qr', 'transfer', 'cash', 'card', 'other')),
  add constraint bookings_payment_amount_positive check (payment_amount_minor is null or payment_amount_minor >= 0),
  add constraint bookings_payment_reference_length check (payment_reference is null or length(payment_reference) <= 120);

-- The agent can confirm payment straight from a new request (pending -> paid).
create or replace function public.enforce_booking_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.status = old.status then
    return new;
  end if;
  if not (
    (old.status = 'pending' and new.status in ('awaiting_payment', 'paid', 'confirmed', 'cancelled', 'expired')) or
    (old.status = 'awaiting_payment' and new.status in ('paid', 'confirmed', 'cancelled', 'expired')) or
    (old.status = 'paid' and new.status in ('confirmed', 'refunded', 'disputed')) or
    (old.status = 'confirmed' and new.status in ('completed', 'cancelled', 'refunded', 'disputed')) or
    (old.status = 'completed' and new.status in ('disputed', 'refunded')) or
    (old.status = 'disputed' and new.status in ('completed', 'refunded'))
  ) then
    raise exception 'invalid_status_transition: % -> %', old.status, new.status;
  end if;
  return new;
end;
$$;

-- Details the traveler sends to the sales agent. Requires the booking code + email, like get_booking_by_code().
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

revoke all on function public.booking_whatsapp_handoff(text, text) from public;
grant execute on function public.booking_whatsapp_handoff(text, text) to anon, authenticated;

-- Admin confirms that the money arrived (QR, transfer...). Moves the booking to "paid".
create or replace function public.confirm_booking_payment(p_booking_id uuid, p_amount_minor bigint, p_reference text, p_method text default 'qr')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.booking_status;
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;
  select status into v_status from public.bookings where id = p_booking_id for update;
  if v_status is null then
    raise exception 'booking_not_found';
  end if;
  if v_status not in ('pending', 'awaiting_payment') then
    raise exception 'invalid_status_transition: % -> paid', v_status;
  end if;
  if p_amount_minor is null or p_amount_minor < 0 then
    raise exception 'invalid_amount';
  end if;

  update public.bookings
  set status = 'paid',
      payment_method = coalesce(nullif(p_method, ''), 'qr'),
      payment_reference = nullif(left(trim(coalesce(p_reference, '')), 120), ''),
      payment_amount_minor = p_amount_minor,
      payment_confirmed_at = now(),
      payment_confirmed_by = auth.uid()
  where id = p_booking_id;
end;
$$;

revoke all on function public.confirm_booking_payment(uuid, bigint, text, text) from public;
grant execute on function public.confirm_booking_payment(uuid, bigint, text, text) to authenticated;

# Base de datos

Diseño de PostgreSQL para Ofertazo Travel mediante Supabase.

## Migración inicial

La primera migración está en:

`supabase/migrations/20260930000100_initial_marketplace.sql`

La migración siguiente asigna el rol administrativo inicial a `ofertazodev@gmail.com`:

`supabase/migrations/20261001000200_assign_admin_role.sql`

Incluye el núcleo del MVP:

- Configuración de países, perfiles y roles.
- Destinos jerárquicos.
- Proveedores y miembros de proveedor.
- Productos, multimedia, ofertas y precios en unidad mínima (`bigint`).
- Inventario y holds temporales.
- Reservas, items y viajeros.
- Favoritos y auditoría.
- Enums, índices, funciones auxiliares y RLS.

## Ejecutarla en Supabase

Desde el SQL Editor de Supabase se puede pegar el contenido completo de la migración y ejecutar una sola vez.

Con Supabase CLI, después de enlazar el proyecto:

```powershell
npx supabase db push
```

Las migraciones iniciales ya fueron aplicadas al proyecto remoto mediante `npx supabase db push`.

## Migración del piloto de reservas

`supabase/migrations/20261005000100_booking_platform_pilot.sql`:

- `products`: tipo de alojamiento, unidad de precio (`per_stay` / `per_night` / `per_person`), capacidad, noches mín./máx., servicios (`amenities`), extras con precio (`extras` jsonb), condiciones, política de cancelación, check-in/out, fechas disponibles, dirección y coordenadas, verificación (`verified_at`, `verification_summary`), valoración de Google copiada a mano y `translations`.
- Se ponen a 0 las valoraciones de demostración (`rating`, `review_count`).
- `destinations`: ciudades canónicas con página propia. Las ofertas existentes se reasignan a su ciudad.
- `bookings`: código `OFZ-XXXXXX`, teléfono, fechas, personas, notas, idioma, atribución UTM y notas internas. `traveler_id` pasa a ser opcional (reserva sin cuenta).
- Funciones: `create_booking_request`, `get_booking_by_code`, `offer_remaining_units` y el trigger `enforce_booking_transition`.
- `provider_applications` y el bucket privado `provider-applications`.

## Lista de viajeros, habitaciones e itinerarios

`supabase/migrations/20261028000100_waitlist_rooms_itineraries.sql`:

- `waitlist_signups` (formulario «Únete a la familia Tripya»): solo se escribe con `join_waitlist()`; solo los admins leen y borran (admin → Viajeros, exportable a CSV).
- `products`: `restrictions`, `perks` («Lo que negociamos para ti»), `excludes`, nota de TripAdvisor copiada a mano, `location_note`, `nearby_places`, `room_options` e `itinerary` (jsonb).
- `bookings`: `adults`, `children`, `infants`. `booking_items.room_option` guarda la habitación elegida y su suplemento.
- `create_booking_request` acepta `p_children`, `p_infants` y `p_room_id` (con valores por defecto, compatibles con el cliente anterior). `booking_whatsapp_handoff` incluye habitación y desglose de personas.
- Ejemplos: habitaciones y beneficios en el hotel de La Paz y el glamping de Uyuni, y el circuito «Salar de Uyuni 3 días / 2 noches» con itinerario y ruta.
- Los idiomas nuevos (pt, de, zh, ja, ko) se aceptan en reservas, analítica y solicitudes.

## Siguiente migración

El ledger de doble entrada, pagos, reembolsos, comisiones, cuentas bancarias y payouts deben añadirse en una migración separada, con pruebas de invariantes financieros antes de activar operaciones reales.

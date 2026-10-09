# Seguridad

Criterios de seguridad de Ofertazo Travel. Revisar antes de aceptar pagos reales.

## Principios

- **Ofertazo no almacena datos de tarjetas ni credenciales bancarias de clientes.** Cuando se integre el pago, el cliente pagará en la página o app del banco o de la pasarela, y Ofertazo solo recibirá la confirmación (webhook firmado), nunca el número de tarjeta.
- Las contraseñas las gestiona Supabase Auth, guardadas con hash. La aplicación nunca las ve ni las guarda.
- Toda la lógica que decide dinero o permisos vive en la base de datos (RLS y funciones `security definer`), no en el navegador.

## Autorización (RLS)

- RLS activado en todas las tablas de `public`.
- El catálogo es de lectura pública y solo muestra lo publicado (`is_published`).
- **Reservas:** solo se crean mediante `create_booking_request()`, que valida los datos, calcula el precio en servidor, bloquea la oferta (`FOR UPDATE`) para no superar los cupos y limita a 5 solicitudes por email y hora. Los viajeros no pueden insertar ni modificar reservas directamente; solo un admin puede cambiar el estado.
- Las transiciones de estado válidas se imponen con un trigger (`enforce_booking_transition`).
- Consulta de reserva sin cuenta: `get_booking_by_code(código, email)` exige ambos datos y devuelve solo un resumen.
- **Solicitudes de proveedores:** cualquiera puede enviarlas. Solo los admins pueden leerlas. Las fotos van a un bucket privado (`provider-applications`) con límite de 5 MB y solo JPG, PNG o WebP; los admins las ven con enlaces firmados de una hora.
- El rol admin se comprueba en la base de datos (`is_admin()` sobre `user_roles`), no por el email en el frontend.

## Secretos

- `.env.local` está ignorado en git. Solo se usan claves públicas (`NEXT_PUBLIC_*`, anon key) en el navegador.
- `SUPABASE_SERVICE_ROLE_KEY` nunca se usa en el cliente. La app actual no la necesita.

## Cabeceras HTTP

`next.config.ts` añade `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy` y HSTS.

## Datos personales

- Se piden solo nombre, email, teléfono, fechas y personas. No se pide documento de identidad online.
- La analítica (GA4) solo se carga con consentimiento. La atribución UTM se guarda en el navegador y en la reserva, sin datos personales.

## Pendiente antes de cobrar online

- [ ] Elegir pasarela o banco (QR dinámico con webhook firmado) e implementar `PaymentProvider` (ver CLAUDE.md).
- [ ] Activar 2FA (MFA) en la cuenta admin de Supabase y en la del panel.
- [ ] Revisar las políticas de Storage del bucket `offer-media` y las copias de seguridad (PITR) en Supabase.
- [ ] Protección anti-bots en formularios públicos (por ejemplo Cloudflare Turnstile) si aparece spam.
- [ ] Revisión de seguridad completa del código y de las políticas RLS (tests pgTAP).
- [ ] Validación legal de privacidad (normativa boliviana y RGPD para visitantes europeos).

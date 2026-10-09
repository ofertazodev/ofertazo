# Ofertazo Travel

Marketplace de viajes para descubrir y reservar alojamientos, escapadas y experiencias. Piloto: Tarija, con 5–10 alojamientos.

## Estado

Plataforma de reservas del piloto (octubre 2026):

- Página completa por oferta, con galería, servicios, extras, condiciones, mapa, precio habitual y precio Ofertazo, contador Flash, botón de reserva y WhatsApp.
- Reserva en 5 pasos: fechas → personas y extras → datos → pago → confirmación. El precio se calcula en la base de datos y cada reserva recibe un código `OFZ-XXXXXX`.
- **El pago todavía no está implementado.** El paso de pago es informativo y el equipo envía las instrucciones después de confirmar la disponibilidad. Ver DECISIONS.md, ADR-0005.
- Páginas por destino, sección Alojamientos con filtros, Ofertas Flash, formulario «Publica tu alojamiento», sello de verificación, Ayuda/SAV y borradores legales.
- Tres idiomas (`/es`, `/en`, `/fr`) para toda la interfaz. El contenido de cada oferta es traducible desde el admin.
- Panel `/admin` con reservas y cambio de estado, solicitudes de proveedores, alta y edición de ofertas, generador de enlaces UTM y origen de las reservas.

## Puesta en marcha

```powershell
npm install
copy .env.example .env.local   # completar las variables
npx supabase db push           # aplica las migraciones pendientes
npm run dev
```

Variables importantes (ver `.env.example`):

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número del negocio. Sin él, los botones de WhatsApp no aparecen. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Email de soporte en Ayuda y en el pie de página. |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4. Sin él no se carga analítica ni el aviso de cookies. |
| `NEXT_PUBLIC_APP_URL` | URL pública. Se usa en mensajes de WhatsApp, enlaces UTM y vistas previas en redes. |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor local en http://localhost:3000 |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npx supabase db push` | Aplica migraciones al proyecto Supabase enlazado |

## Rutas públicas

`/{es|en|fr}` portada · `/ofertas` (`?flash=1`, `?q=`) · `/ofertas/{slug}` · `/reservar/{slug}` · `/reserva/{código}` · `/alojamientos` · `/destinos` · `/destinos/{slug}` · `/proveedores` · `/verificacion` · `/ayuda` · `/legal/{terminos|condiciones-reserva|cancelacion|reembolsos|privacidad|cookies}`

## Documentación

- [Arquitectura](ARCHITECTURE.md)
- [Base de datos](DATABASE.md)
- [Seguridad](SECURITY.md)
- [Decisiones](DECISIONS.md)
- [Analítica y enlaces de campaña](docs/ANALYTICS.md)
- [Especificación del producto](docs/PRODUCT_SPEC.md)

## Estructura

- `src/app/[locale]/`: páginas públicas por idioma. `src/app/admin/`: panel interno.
- `src/i18n/`: idiomas (`config.ts`) y diccionarios (`dictionaries/es.ts` es la referencia).
- `src/lib/`: catálogo (`catalog.ts`), dinero en centavos `bigint` (`money.ts`), analítica, WhatsApp.
- `src/components/`: componentes por área (`offers`, `booking`, `admin`, `site`...).
- `src/content/legal.ts`: borradores legales.
- `supabase/migrations/`: esquema, RLS y funciones (`create_booking_request`, `get_booking_by_code`).

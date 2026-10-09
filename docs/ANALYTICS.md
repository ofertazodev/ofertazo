# Analítica y enlaces de campaña

## Dos fuentes de datos

1. **Google Analytics 4**: visitas, origen, páginas, botones. Se activa con `NEXT_PUBLIC_GA_ID` y solo carga si el visitante acepta las cookies.
2. **Base de datos (panel admin → Resumen)**: reservas reales con su origen. Cada reserva guarda los parámetros UTM del enlace por el que llegó la persona (`bookings.attribution`). Esto no depende de las cookies.

## Eventos enviados a GA4

| Evento | Cuándo | Parámetros |
|---|---|---|
| `view_item` | Se abre la página de una oferta | `item_id` (slug), `item_name`, `item_category`, `destination`, `value`, `currency` |
| `select_item` | Clic en una tarjeta de oferta | `item_id`, `item_list_name` (home_flash, offers, destination_tarija...) |
| `search` | Búsqueda desde la portada | `search_term`, `guests` |
| `click_whatsapp` | Cualquier botón de WhatsApp | `placement` (floating, offer_price_card, offer_sticky_bar, booking_flow, help...), `offer` |
| `begin_checkout` | «Reservar ahora» | `item_id`, `placement` |
| `checkout_step` | Cada paso del flujo de reserva | `item_id`, `step` (1-5) |
| `generate_lead` | Solicitud de reserva enviada | `item_id`, `value`, `currency`, `nights`, `guests` |
| `view_destination` | Página de destino | `destination`, `offers` |
| `provider_application` | Formulario de proveedores enviado | `property_type`, `city` |
| `language_change` | Cambio de idioma | `language` |

En GA4, marca `generate_lead` como **evento clave** (conversión). El embudo es `view_item` → `begin_checkout` → `checkout_step` → `generate_lead`.

## Enlaces para TikTok / Instagram

Usa **un enlace distinto por video o publicación**. El panel admin (pestaña Ofertas → «Generador de enlaces») los crea así:

```
https://ofertazo.com/es/ofertas/tolomosa?utm_source=tiktok&utm_medium=social&utm_campaign=tolomosa&utm_content=video_piscina_1
```

- `utm_source`: red (tiktok, instagram, facebook, whatsapp).
- `utm_campaign`: la oferta.
- `utm_content`: el video o post concreto. Es el dato que dice qué contenido vende.

Se guarda el último enlace de campaña por el que llegó la persona (30 días). Si después vuelve directamente y reserva, la reserva se atribuye a ese enlace.

## SEO

Cada página de oferta tiene título, descripción e imagen para las vistas previas en WhatsApp, Facebook e Instagram, además de datos estructurados (`schema.org/Product`) y versiones por idioma (`hreflang`). Las páginas de reserva y las legales no se indexan.

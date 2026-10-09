# Decisiones arquitectónicas

Registro de decisiones de Ofertazo Travel.

## ADR-0001: Inicio del registro

- **Estado:** aceptada
- **Contexto:** el proyecto comienza con una fase documental antes de implementar código.
- **Decisión:** mantener las decisiones relevantes en este archivo y respetar `CLAUDE.md` como fuente de decisiones ya tomadas.

## ADR-0002: Idiomas con rutas por locale y diccionarios propios

- **Estado:** aceptada (2026-10-05)
- **Contexto:** el sitio debe estar en español, inglés y francés, y más adelante en portugués.
- **Decisión:** las rutas públicas cuelgan de `/[locale]` (`/es`, `/en`, `/fr`). El middleware redirige según la cookie `NEXT_LOCALE` o el idioma del navegador. Los textos de la interfaz viven en `src/i18n/dictionaries/*.ts`: `es.ts` es la referencia y TypeScript obliga a que los demás idiomas tengan las mismas claves. El contenido de las ofertas se traduce con `products.translations` (jsonb) y, si falta la traducción, se muestra en español. No se instaló `next-intl`: con tres idiomas y sin pluralización compleja, un diccionario tipado es suficiente y no añade dependencias.
- **Añadir un idioma:** agregarlo en `src/i18n/config.ts` y crear `dictionaries/<código>.ts`.

## ADR-0003: Reservas como solicitudes creadas por una función SQL

- **Estado:** aceptada (2026-10-05)
- **Contexto:** la mayoría de las visitas llegan desde TikTok o Instagram en el móvil; obligar a crear una cuenta para reservar reduce las reservas.
- **Decisión:** se puede reservar sin cuenta. `create_booking_request()` (`security definer`) valida, calcula el precio con los datos de la base, controla los cupos con `FOR UPDATE` y devuelve un código `OFZ-XXXXXX`. `bookings.traveler_id` pasa a ser opcional. Se eliminaron las políticas que permitían a un viajero insertar reservas o cambiar su estado.
- **Pendiente:** `inventory_holds` por fecha cuando haya inventario diario real. Por ahora: rango de fechas disponibles por producto + cupos por oferta.

## ADR-0004: Destinos canónicos

- **Estado:** aceptada (2026-10-05)
- **Decisión:** las ciudades (Tarija, Uyuni, La Paz, Santa Cruz, Sucre, Potosí, Oruro, Cochabamba) son destinos fijos con su propia página. La ubicación exacta (dirección y coordenadas) pasa a `products`. El admin ya no crea un destino por cada oferta.

## ADR-0005: Modelo de cobro pendiente

- **Estado:** pendiente de decisión del negocio
- **Contexto:** CLAUDE.md define a Ofertazo como merchant of record (cobra el total y paga al proveedor). Se está evaluando un modelo más simple para el piloto: anticipo o comisión cobrados por Ofertazo y el resto pagado en el alojamiento.
- **Situación actual:** el flujo de reserva termina en estado `pending`. El equipo confirma la disponibilidad, pasa la reserva a `awaiting_payment`, envía las instrucciones de pago por WhatsApp o email y marca `paid` y luego `confirmed` desde el admin. No se integra ningún medio de pago hasta decidir el modelo. La comisión se guarda en 0.

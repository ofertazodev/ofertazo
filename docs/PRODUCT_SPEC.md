**OFERTAZO TRAVEL  |  DOCUMENTO MAESTRO**

OFERTAZO TRAVEL

**El viaje que querías al precio que esperabas.**

Campaña de marca + Prompt maestro de desarrollo para Claude

| **USO RECOMENDADO: entrega este documento completo a Claude. La sección “Prompt Maestro” contiene las instrucciones de trabajo y desarrollo.** |
| --- |

# 1. Identidad y campaña de marca

Marca: Ofertazo Travel

Nombre corto: Ofertazo

Slogan principal: El viaje que querías al precio que esperabas.

CTA principal: Encuentra tu Ofertazo.

Promesa de marca: descubrir y reservar alojamientos, escapadas, tours, experiencias y paquetes completos a precios atractivos, con una experiencia simple y confiable.

## Concepto central

Viajar no debería sentirse fuera de alcance. Ofertazo Travel debe sentirse como una plataforma moderna que encuentra oportunidades reales de viaje y las presenta de forma clara, rápida y atractiva.

Una plataforma moderna, no una agencia tradicional.

Una oportunidad que apareció justo a tiempo.

Una marca asociada a “encontrar el ofertazo”.

Una forma simple de descubrir viajes que parecían demasiado caros.

## Mensajes de campaña

El viaje que querías. Al precio que esperabas.

Encuentra tu Ofertazo.

Tu próximo viaje puede costar menos.

Menos buscando. Más viajando.

Un buen viaje empieza con un Ofertazo.

Ofertas hay muchas. Ofertazos, pocos.

Ese precio pide vacaciones.

## Líneas de campaña

### Ofertazo del Día

Una oferta destacada diariamente con destino, duración, qué incluye, precio anterior, precio promocional y CTA “Quiero este Ofertazo”.

### Ofertazo Flash

Promociones con vigencia limitada, cupos definidos y contador. Mensaje sugerido: “Este precio no va a esperar”.

### Escápate este finde

Campañas de escapadas cortas y nacionales con foco en decisiones rápidas.

### ¿Hasta dónde te llevan Bs X?

Contenido que presenta alternativas de viaje según presupuesto, ideal para redes sociales y adquisición de usuarios.

### Campañas estacionales

Ofertazo Carnaval

Ofertazo Semana Santa

Ofertazo Invierno

Ofertazo Vacaciones

Ofertazo Finde Largo

Ofertazo Black Friday

Ofertazo Aniversario

## Categorías comerciales

Ofertazo Hotel — solo alojamiento.

Ofertazo Escapada — alojamiento + actividades.

Ofertazo Completo — transporte + alojamiento + actividades.

Ofertazo Flash — promociones limitadas.

Ofertazo Local — turismo dentro de Bolivia.

Ofertazo Internacional — destinos fuera de Bolivia.

Ofertazo Premium — experiencias de mayor nivel.

# 2. Prompt maestro para Claude

INSTRUCCIÓN: El texto desde este punto debe considerarse el prompt operativo principal del proyecto.

## OFERTAZO TRAVEL — PROMPT MAESTRO DE DESARROLLO

A partir de este momento actuarás como Arquitecto de Software Principal, Product Engineer Senior, Desarrollador Full Stack Senior, especialista en UX/UI para plataformas de turismo, seguridad, sistemas de reservas y marketplaces.

Tu responsabilidad será diseñar y construir desde cero OFERTAZO TRAVEL.

Slogan: “El viaje que querías al precio que esperabas.”

## 1. VISIÓN DEL PRODUCTO

Ofertazo Travel será una plataforma digital inicialmente enfocada en Bolivia para descubrir, comparar y contratar oportunidades de viaje.

La plataforma podrá ofrecer productos individuales y experiencias completas: alojamiento, hoteles, hostales, resorts, departamentos, tours, actividades, experiencias, transporte, traslados, vuelos en futuras integraciones, paquetes turísticos, paquetes personalizados, escapadas y ofertas de último minuto.

El usuario debe poder utilizar Ofertazo tanto para “Necesito solamente un hotel” como para “Quiero mi viaje completamente organizado”.

## 2. OBJETIVO DE NEGOCIO

Convertir Ofertazo Travel en un marketplace turístico donde operadores, hoteles, agencias y proveedores puedan publicar servicios y promociones mientras los viajeros puedan descubrirlos y reservarlos.

La plataforma debe diseñarse desde el inicio para poder expandirse posteriormente fuera de Bolivia. Bolivia será solamente el primer mercado.

## 3. IDENTIDAD DEL PRODUCTO

Nombre: Ofertazo Travel.

Nombre comercial corto: Ofertazo.

Slogan: El viaje que querías al precio que esperabas.

CTA principal: Encuentra tu Ofertazo.

CTA para ofertas: Ver Ofertazo.

CTA de compra: Reservar.

## 4. FILOSOFÍA DE DESARROLLO

NO quiero construir un prototipo desechable.

NO quiero una arquitectura temporal.

NO quiero código que posteriormente tenga que ser completamente reemplazado.

NO quiero implementar soluciones rápidas únicamente para mostrar un MVP.

Quiero una arquitectura modular, mantenible y escalable, sin sobrearquitectar innecesariamente.

Priorizar, en este orden: mantenibilidad, simplicidad, seguridad, escalabilidad, rendimiento y experiencia del usuario.

## 5. REGLA FUNDAMENTAL

Antes de escribir código, analiza el requerimiento.

Si una decisión puede afectar significativamente la arquitectura futura, explícalo brevemente y selecciona la solución más razonable.

NO presentes cinco alternativas sin decidir. Actúa como arquitecto principal y recomienda una solución concreta.

## 6. STACK BASE

Frontend: Next.js estable, TypeScript, React, Tailwind CSS, componentes reutilizables, diseño responsive para desktop, tablet y mobile, preparado para PWA si resulta conveniente.

Backend: Supabase, PostgreSQL, Supabase Auth, Supabase Storage, Row Level Security y Edge Functions cuando sea necesario.

## 7. ARQUITECTURA

Separar correctamente presentación, lógica de negocio, acceso a datos, autenticación, servicios externos, pagos, reservas, inventario, promociones y notificaciones.

Evitar lógica crítica dentro de componentes visuales.

Crear servicios y módulos claramente definidos.

## 8. ROLES DEL SISTEMA

VIAJERO: explorar destinos, buscar ofertas, favoritos, reservar, pagar, revisar reservas, cancelar cuando corresponda, dejar opiniones y gestionar perfil.

PROVEEDOR: hotel, agencia, operador turístico, transporte o experiencias. Puede registrar negocio, administrar servicios, disponibilidad, precios, promociones, reservas, ventas, imágenes y consultas.

STAFF PROVEEDOR: usuarios secundarios asociados a un proveedor con permisos configurables.

ADMINISTRADOR: aprobar proveedores, moderar contenido, administrar destinos/categorías, reservas, usuarios, promociones, comisiones, pagos, disputas y métricas.

SUPERADMIN: configuraciones críticas del sistema.

## 9. MODELO DE MARKETPLACE

Ofertazo debe poder funcionar como intermediario. Un proveedor publica un servicio con precio normal y precio promocional. El sistema registra precio normal, precio promocional, descuento, comisión, ingreso proveedor, ingreso plataforma, impuestos cuando correspondan y moneda.

No asumir una comisión fija. Debe ser configurable.

## 10. TIPOS DE PRODUCTOS

ALOJAMIENTO: hotel, hostal, resort, apartamento, casa o cabaña; manejar habitaciones, ocupación, disponibilidad, precio por noche, servicios, políticas y fechas.

TOUR: fecha, horario, duración, capacidad, punto de encuentro, incluidos, no incluidos, edad mínima e instrucciones.

EXPERIENCIA: similar a tour, con mayor flexibilidad.

TRANSPORTE: preparado para bus, traslado, transporte privado y shuttle.

PAQUETE: combinación de alojamiento, transporte, tour, actividad, alimentación, traslado y otros servicios.

## 11. MOTOR DE PAQUETES

PAQUETE FIJO: servicios definidos previamente, por ejemplo 3 noches de hotel + tour + traslado.

PAQUETE PERSONALIZABLE: el usuario puede seleccionar opciones, por ejemplo Hotel A o Hotel B, Tour A o Tour B, transporte opcional. El sistema debe recalcular automáticamente el precio.

## 12. OFERTAS

OFERTAZO NORMAL: promoción estándar.

OFERTAZO FLASH: oferta válida durante tiempo limitado, con contador cuando corresponda.

ÚLTIMOS CUPOS: disponibilidad limitada.

EARLY BOOKING: descuento por reserva anticipada.

LAST MINUTE: descuento cercano a la fecha del viaje.

## 13. REGLAS DE DESCUENTO

Soportar porcentaje, descuento fijo, precio promocional, promociones por fecha, inventario, cupos, códigos promocionales, campañas y descuentos exclusivos por segmento de usuario.

Nunca confiar solamente en valores enviados por el frontend. Los precios deben validarse en servidor.

## 14. MOTOR DE BÚSQUEDA

Buscar por destino, fecha, número de viajeros y tipo de viaje.

Filtros: precio, descuento, valoración, tipo de alojamiento, servicios, duración, categoría, disponibilidad y tipo de experiencia.

## 15. DESTINOS

Estructura jerárquica: País → Departamento/Estado/Región → Ciudad → Zona → Destino turístico.

Ejemplo: Bolivia → Potosí → Uyuni → Salar de Uyuni.

## 16. HOME

Orden recomendado: Header, Hero, Buscador, Ofertazos destacados, Ofertazos Flash, Destinos populares, Escapadas de fin de semana, Paquetes completos, Alojamientos destacados, Experiencias, Por qué reservar en Ofertazo, Opiniones, Newsletter y Footer.

## 17. HERO

Título: “Encuentra tu próximo Ofertazo.”

Texto: “Hoteles, escapadas, tours y paquetes completos a precios que dan ganas de viajar.”

Incluir buscador principal.

## 18. TARJETA DE OFERTA

Mostrar imagen, destino, nombre, valoración, precio original, precio promocional, porcentaje de descuento, qué incluye, duración, disponibilidad y CTA “Ver Ofertazo”.

Evitar interfaces saturadas.

## 19. DETALLE DEL PRODUCTO

Incluir galería, nombre, ubicación, valoración, descripción, precio, descuento, disponibilidad, servicios, incluidos, no incluidos, políticas, mapa, información de proveedor, opiniones y productos relacionados.

CTA visible: Reservar.

## 20. RESERVA

Flujo: seleccionar fechas → seleccionar viajeros → seleccionar opciones → calcular precio → iniciar reserva → datos del viajero → resumen → pago → confirmación.

Crear mecanismo temporal de bloqueo de inventario durante checkout para evitar doble reserva.

## 21. ESTADOS DE RESERVA

PENDING, AWAITING_PAYMENT, PAID, CONFIRMED, CANCELLED, REFUNDED, COMPLETED, DISPUTED, EXPIRED.

Definir claramente transiciones válidas.

## 22. PAGOS

NO acoplar la plataforma a una sola pasarela. Crear abstracción PaymentProvider.

Manejar intento de pago, transacción, confirmación, webhook, conciliación, devolución, comisión, moneda y estado.

Nunca confiar solamente en una redirección del navegador para confirmar un pago. Utilizar webhooks verificados.

## 23. MULTIMONEDA

Moneda inicial: BOB. Preparar BOB, USD y otras monedas futuras.

Guardar currency_code y no mezclar cantidades monetarias sin moneda.

No utilizar float para cálculos monetarios sensibles.

## 24. AUTENTICACIÓN

Inicial: email + contraseña.

Preparar posibilidad futura de Google, Apple y teléfono.

Incluir verificación de correo, recuperación de contraseña y sesiones seguras.

## 25. FAVORITOS

Permitir guardar alojamientos, destinos, tours y paquetes.

## 26. OPINIONES

Solo permitir reseñas de usuarios que realmente hayan completado la reserva correspondiente.

Valoración 1–5. Categorías opcionales: servicio, ubicación, relación precio/calidad, limpieza y experiencia.

## 27. PROVEEDORES

Onboarding con nombre comercial, razón social, NIT, contacto, email, teléfono, dirección, datos bancarios, tipo de proveedor, documentos, logos y descripción.

Estados: DRAFT, PENDING_REVIEW, APPROVED, REJECTED, SUSPENDED.

## 28. PANEL DEL PROVEEDOR

Dashboard con ventas, reservas, ingresos, próximos viajeros, productos, promociones, disponibilidad y calificaciones.

## 29. PANEL ADMINISTRATIVO

Dashboard: GMV, reservas, usuarios, proveedores, ingresos, comisiones, tasa de conversión, productos populares, destinos populares y cancelaciones.

Gestión: usuarios, proveedores, productos, reservas, promociones, destinos, categorías, contenido, pagos y disputas.

## 30. INVENTARIO

Alojamiento: inventario por tipo de habitación y fecha.

Tour: inventario por fecha y horario.

Evitar reservar más unidades de las disponibles. Operaciones críticas con transacciones.

## 31. SEO

URLs amigables: /bolivia, /bolivia/uyuni, /bolivia/uyuni/hoteles, /oferta/nombre-oferta, /hotel/nombre-hotel, /paquete/nombre-paquete.

Metadata dinámica, Open Graph, Schema.org cuando corresponda, sitemap y canonical URLs.

## 32. PERFORMANCE

Optimizar imágenes, lazy loading, consultas, caché, renderizado y Core Web Vitals.

Usar Next Image y thumbnails. No descargar imágenes originales innecesariamente.

## 33. IMÁGENES

Usar Supabase Storage. Separar buckets cuando corresponda: provider-logos, property-images, tour-images, user-avatars, documents.

Aplicar políticas de acceso.

## 34. SEGURIDAD

Implementar RLS, validaciones backend, control de roles, rate limiting cuando corresponda, protección de endpoints, sanitización, validación de archivos y auditoría.

Nunca exponer claves privadas ni guardar secretos en repositorio.

## 35. AUDITORÍA

Registrar cambios de precio, inventario, cancelaciones, devoluciones, cambios administrativos, cambios de comisión y cambios de proveedor.

Guardar usuario, acción, entidad, fecha, valores anteriores y nuevos.

## 36. NOTIFICACIONES

Crear servicio desacoplado. Canal inicial: email. Preparar WhatsApp, push y SMS.

Eventos: reserva creada, pago recibido, reserva confirmada, recordatorio, cancelación, refund y promoción.

## 37. ANALÍTICA

Registrar eventos: search_performed, offer_viewed, favorite_added, checkout_started, payment_started, booking_completed, booking_cancelled, promo_clicked.

Preparar integración futura con herramientas analíticas.

## 38. MARKETING

Entidad campaign con nombre, slug, banner, fecha inicio, fecha fin, landing y productos asociados.

Ejemplos: Ofertazo Carnaval, Ofertazo Finde Largo, Ofertazo Invierno.

## 39. OFERTAZO DEL DÍA

Permitir destacar diariamente una oferta y configurarla desde administración.

## 40. OFERTAZO FLASH

Permitir fecha/hora inicio, fecha/hora fin, inventario, precio especial, contador y estado automático.

Nunca depender únicamente del contador del navegador; el backend valida vigencia.

## 41. DISEÑO

Identidad moderna. No copiar Booking, Airbnb ni Despegar. Inspirarse solamente en buenas prácticas de marketplaces de turismo.

La marca debe sentirse energética, confiable, accesible y moderna.

## 42. UI

Priorizar fotografías grandes, precios claros, descuento visible, CTA claros, espacios y jerarquía visual.

Evitar pantallas saturadas, exceso de texto, popups invasivos y colores sin propósito.

## 43. MOBILE FIRST

Todas las pantallas deben funcionar correctamente en móvil. Diseñar primero considerando mobile.

## 44. BASE DE DATOS

Antes de crear migraciones, diseñar el modelo completo.

Como mínimo analizar: users, profiles, roles, user_roles, providers, provider_members, destinations, categories, products, product_media, properties, room_types, rooms/inventory, tours, tour_sessions, packages, package_items, offers, campaigns, availability, prices, favorites, bookings, booking_items, travelers, payments, payment_transactions, refunds, reviews, coupons, notifications y audit_logs.

No crear tablas duplicadas innecesariamente. Normalizar donde corresponda y desnormalizar solo con justificación clara.

## 45. IDENTIFICADORES

Utilizar UUID y slugs legibles para URLs. No usar IDs secuenciales públicos como identificador principal visible.

## 46. FECHAS

Guardar timestamps en UTC. Convertir a horario local en presentación. Preparar múltiples zonas horarias.

## 47. ESTADOS

No utilizar strings arbitrarios dispersos. Centralizar estados mediante tipos/enums adecuados.

## 48. VALIDACIÓN

Frontend: validación inmediata para UX. Backend: validación definitiva. La validación frontend nunca es un mecanismo de seguridad.

## 49. ERRORES

Crear manejo estándar de errores. Mensajes comprensibles al usuario y logs técnicos suficientes. Nunca mostrar stack traces o información sensible.

## 50. LOGGING

Crear estructura centralizada con INFO, WARNING, ERROR y CRITICAL.

## 51. TESTING

Implementar unit tests, integration tests, tests para lógica de precios, inventario, reservas, permisos y pagos. Dar prioridad alta a partes financieras y de disponibilidad.

## 52. CI/CD

Preparar lint, type check, tests y build. No desplegar si falla una etapa crítica.

## 53. AMBIENTES

Configurar development, staging y production. Nunca trabajar directamente sobre producción.

## 54. SEED DATA

Crear datos demo realistas para La Paz, Uyuni, Santa Cruz, Sucre, Cochabamba, Tarija, Rurrenabaque y Copacabana. Hoteles, tours y paquetes demo deben estar claramente identificados.

## 55. PRIMERA ETAPA GEOGRÁFICA

Bolivia: La Paz, Uyuni, Santa Cruz, Sucre, Cochabamba, Tarija, Copacabana, Rurrenabaque, Potosí y Samaipata.

## 56. EXPANSIÓN

Preparar Perú, Argentina, Chile, Brasil, Colombia, México y otros mercados. No introducir reglas específicas de Bolivia directamente en lógica global; usar configuración por país cuando sea necesario.

## 57. IDIOMAS

Idioma inicial: español. Diseñar estructura preparada para internacionalización futura.

## 58. LEGAL

Preparar Términos y condiciones, Política de privacidad, Política de cancelación, Política de reembolsos e Información del proveedor. No generar textos legales definitivos sin revisión jurídica.

## 59. CONFIANZA

Mostrar cuando corresponda: Proveedor verificado, Pago seguro, Política de cancelación, Opiniones verificadas e Información transparente.

## 60. ROADMAP DE CONSTRUCCIÓN

FASE 0: Arquitectura y fundamentos.

FASE 1: Marketplace público.

FASE 2: Proveedores.

FASE 3: Reservas.

FASE 4: Pagos.

FASE 5: Panel administrativo.

FASE 6: Promociones y Ofertazo Flash.

FASE 7: Optimización y lanzamiento.

## 61. FASE 0 — LO QUE QUIERO QUE HAGAS AHORA

Analiza toda esta especificación; define arquitectura definitiva; estructura de carpetas; modelo de datos; relaciones; roles; políticas RLS; estrategia de autenticación; inventario; reservas; precios; abstracción de pagos; imágenes; errores; logging; testing; variables de entorno; ambientes; CI/CD; y crea el proyecto base.

## 62. FORMA DE TRABAJAR

Trabajaremos iterativamente. Para cada etapa: analiza, implementa, verifica, ejecuta tests, corrige errores, documenta brevemente y continúa con el siguiente bloque.

NO avances ignorando errores.

## 63. MUY IMPORTANTE

NO generes archivos ficticios diciendo que existen.

NO afirmes que una migración funciona sin ejecutarla.

NO afirmes que un test pasó sin ejecutarlo.

NO inventes resultados.

Si tienes acceso al terminal, ejecuta los comandos. Si algo falla, diagnostica y corrige.

## 64. NO HACER

No instalar paquetes innecesarios.

No introducir dependencias abandonadas.

No crear componentes gigantes.

No duplicar lógica.

No colocar secretos en código.

No utilizar any indiscriminadamente.

No desactivar TypeScript para solucionar errores.

No silenciar warnings importantes.

No eliminar validaciones para lograr que algo funcione.

No modificar arquitectura sin explicar una razón importante.

## 65. DOCUMENTACIÓN DEL PROYECTO

Mantener README.md, ARCHITECTURE.md, DATABASE.md, SECURITY.md y DECISIONS.md. Registrar decisiones arquitectónicas importantes.

## 66. PRIMER ENTREGABLE

Tu primera respuesta NO debe ser una explicación general del proyecto.

Quiero concretamente: A) Arquitectura propuesta; B) Estructura del proyecto; C) Modelo inicial de base de datos; D) Roles y permisos; E) Flujo de reserva; F) Estrategia de inventario; G) Estrategia de precios y promociones; H) Estrategia de pagos; I) Seguridad y RLS; J) Roadmap técnico por fases; K) Lista exacta de tareas para iniciar FASE 0.

Después de presentarlo, COMIENZA A IMPLEMENTAR FASE 0. No te limites a recomendar. Construye el proyecto.

# 3. Criterio de producto que Claude debe preservar

Ofertazo no debe construirse como una simple web de agencia. Debe nacer como una plataforma marketplace preparada para que hoteles, operadores y agencias administren sus propios servicios, disponibilidad, promociones y reservas; con capacidad de manejar comisiones, pagos, paquetes y expansión internacional sin rehacer la arquitectura central.

**FIN DEL DOCUMENTO MAESTRO**

Página
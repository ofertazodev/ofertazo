# Ofertazo Travel — CLAUDE.md

Marketplace de viajes (Bolivia primero, multi-país después). Especificación completa: @docs/PRODUCT_SPEC.md
Este archivo contiene las DECISIONES YA TOMADAS. Si algo aquí contradice PRODUCT_SPEC.md, gana este archivo.

## Contexto de negocio (decidido)
- Es un NEGOCIO REAL para lanzar, no un prototipo.
- Ofertazo es MERCHANT OF RECORD: cobra al viajero, retiene comisión y liquida (payout) al proveedor.
  Consecuencia: contabilidad de doble entrada, liquidaciones, retenciones y conciliación son núcleo del sistema, no un extra.
- Moneda inicial BOB. Cada producto guarda precio en la moneda del proveedor. Conversiones solo informativas; nunca se cobra con un tipo de cambio sin fuente definida y registrada.

## Stack
- Next.js (App Router, versión estable actual) + TypeScript strict + Tailwind. pnpm.
- Supabase: Postgres, Auth, Storage, RLS, Edge Functions. Local con `pnpm supabase start` (CLI como devDependency).
- Validación: Zod (compartido cliente/servidor). Tests: Vitest (unit/integración) + Playwright (e2e) + tests SQL de RLS (pgTAP).
- Una sola app (sin monorepo) con carpeta `supabase/`. Reevaluar monorepo solo si aparece una segunda app.

## Reglas no negociables
- Dinero: enteros en unidad mínima (`bigint` centavos) + `currency_code` (ISO 4217). Prohibido float/number para montos. En TS usar tipo `Money { amount: bigint; currency: CurrencyCode }`.
- Precios SIEMPRE calculados en servidor (función SQL o Edge Function). El frontend solo muestra.
- Pagos confirmados SOLO por webhook verificado (firma/secret). Nunca por redirección del navegador. Webhooks idempotentes (`provider_event_id` único).
- Inventario: holds temporales (`inventory_holds` con `expires_at`) creados dentro de transacción con `SELECT ... FOR UPDATE`. Expiración con pg_cron. Nunca sobreventa.
- Estados como enums de Postgres; transiciones válidas forzadas en la BD (función/trigger), reflejadas en TS.
- Timestamps `timestamptz` en UTC. Fechas de estadía/tour como `date` + zona horaria del destino.
- UUID como PK; slugs para URLs. Nunca IDs secuenciales públicos.
- RLS habilitado en TODAS las tablas del schema público. Sin excepciones.
- `service_role` solo en servidor/Edge Functions, jamás en el cliente.
- Nada de reglas de Bolivia hardcodeadas: usar `country_settings`.

## Contabilidad (merchant of record)
- Ledger de doble entrada inmutable: `ledger_accounts`, `ledger_entries` (solo INSERT; correcciones con asientos inversos). Cada movimiento suma cero por moneda.
- Cuentas mínimas: efectivo en pasarela, pasivo por pagar a proveedor (por proveedor), ingreso por comisión, reembolsos, impuestos por pagar.
- Saldo del proveedor = derivado del ledger, nunca un campo editable.
- Liquidación: fondos del proveedor se liberan tras completarse el servicio + N días (configurable por país/proveedor). Tablas `payouts`, `payout_items`.
- Reembolsos y disputas generan asientos; si ya se pagó al proveedor, se crea deuda del proveedor compensable en el siguiente payout.
- Datos bancarios del proveedor: tabla separada, RLS estricta, acceso solo del propio proveedor (owner) y admin finanzas; cambios auditados.
- Comisión configurable (global → país → proveedor → producto); el % aplicado se copia (snapshot) en cada booking_item.

## Pagos
- Abstracción `PaymentProvider` (createIntent, verifyWebhook, parseEvent, refund, getStatus). Primer adaptador: QR bancario boliviano (pasarela aún por definir). Adaptador `FakeProvider` para dev/tests.

## Forma de trabajo
- Tareas grandes: primero Plan Mode, propuesta concreta (una solución, no cinco), luego implementar.
- Ciclo por bloque: implementar → `pnpm lint && pnpm typecheck && pnpm test` → corregir → documentar → commit.
- NO afirmar que algo funciona sin ejecutarlo. NO inventar resultados. Si falla, diagnosticar y corregir.
- NO `any` indiscriminado, NO `@ts-ignore` para tapar errores, NO desactivar reglas de lint, NO borrar validaciones.
- NO instalar paquetes sin justificar. Preferir dependencias mantenidas y estándar.
- NO secretos en el repo. `.env.local` ignorado; `.env.example` documentado.
- Commits convencionales (feat:, fix:, chore:, docs:, test:). Rama por bloque de trabajo.
- Decisiones arquitectónicas nuevas → registrar en DECISIONS.md (formato ADR corto).

## Documentación a mantener
README.md, ARCHITECTURE.md, DATABASE.md, SECURITY.md, DECISIONS.md.

## Alcance de la primera vertical
Esquema completo diseñado (spec §44 + ledger/payouts), pero implementación por vertical:
1. Alojamiento + Tour + Paquete fijo, con ofertas (normal/flash) y reserva de punta a punta con FakeProvider.
2. Luego: pagos reales, panel proveedor, admin, paquetes personalizables, transporte.

## Comandos
(Completar al crear el proyecto: dev, build, lint, typecheck, test, test:e2e, db:reset, db:types.)

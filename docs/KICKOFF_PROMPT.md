Lee CLAUDE.md y docs/PRODUCT_SPEC.md completos.

Estamos en FASE 0. Entrega primero, en un solo documento ARCHITECTURE.md + DATABASE.md, lo que pide la sección 66 (A–K),
aplicando las decisiones de CLAUDE.md (en especial: merchant of record con ledger de doble entrada y payouts).

Para el modelo de datos (C) incluye: todas las tablas de §44 + country_settings, ledger_accounts, ledger_entries,
payouts, payout_items, provider_bank_accounts, inventory_holds, commission_rules. Para cada tabla: columnas clave,
FKs, índices, enums y quién puede leer/escribir (RLS). Diagrama ER en Mermaid.

No escribas código todavía. Cuando termine el plan, espera mi aprobación.

Después de aprobado, implementa FASE 0 en este orden, verificando cada paso con comandos reales:
1. Next.js + TS strict + Tailwind + pnpm + ESLint + Prettier + Vitest + Playwright.
2. Supabase CLI como devDependency, `supabase init`, `supabase start` funcionando.
3. Migraciones base: enums, identidad/roles, destinos, proveedores, productos, inventario, bookings, pagos, ledger, auditoría. Con RLS en todo.
4. Tests pgTAP de RLS y tests de las funciones críticas (hold de inventario, cálculo de precio, transiciones de estado, asientos del ledger que suman cero).
5. Tipos generados (`supabase gen types`), cliente Supabase server/browser, módulo de errores y logger.
6. .env.example, scripts de package.json, workflow de GitHub Actions (lint, typecheck, test, build).
7. Seed demo claramente marcado (La Paz, Uyuni, Santa Cruz, Sucre, Cochabamba, Tarija, Rurrenabaque, Copacabana).
8. README, SECURITY, DECISIONS actualizados.

Después de cada paso: corre lint/typecheck/tests, corrige, haz commit y resume en 3 líneas.

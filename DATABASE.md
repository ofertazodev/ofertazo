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

## Siguiente migración

El ledger de doble entrada, pagos, reembolsos, comisiones, cuentas bancarias y payouts deben añadirse en una migración separada, con pruebas de invariantes financieros antes de activar operaciones reales.

# Rollback — §11 activity selection results

Fecha: 2026-07-16  

## Procedimiento local

1. Detener lecturas BFF/UI de cobertura.
2. `npx supabase db reset` hasta migración previa `20260716170000_..._point10_...` (eliminar o no aplicar `20260716190000_..._point11_...`).
3. Remover:
   - migración point11
   - servicios/tipos activity-selection del panel
   - ruta BFF `.../activity-selection`
   - `ActivitySelectionCoveragePanel` y cableado
   - scripts manage/verify point11
   - tests/docs/capturas point11

## Conservar

§§7–10, puente perfil↔RRS, política v1.3 de cálculo (no es ledger panel).

## No aplicar

Staging / producción sin dictamen separado.

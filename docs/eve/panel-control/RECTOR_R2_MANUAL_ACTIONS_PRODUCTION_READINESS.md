# R2 — Production readiness

## Checklist

- [x] Migración autenticada + grants
- [x] BFF POST sin service_role productivo en cliente
- [x] UI acciones desde `availableActions`
- [x] Verifier script
- [x] FX-08 seed (starting state)
- [x] Rollback no destructivo
- [x] Verifier `ok: true` estabilizado en gates
- [x] Happy path UI→BFF→RPC evidenciado
- [x] Playwright FX-08 oficial + capturas 01–09
- [x] Regresión R2 + R1 + legacy freeze + tsc/lint/build/audit (compuertas vigentes de la corrección de seguridad)
- [x] Playwright §§15–17 restaurado tras aplicar cadena de migraciones pendiente (Caso A)

**Dictamen actual:** APTA PARA PROMOCIÓN A PRODUCCIÓN (ver `RECTOR_R2_DICTAMEN.md`).

## Restauración §§15–17 (2026-07-21)

| Ítem | Estado |
|------|--------|
| Causa | Migración pendiente (`20260718100000` y posteriores) + colisión de versión `20260718030000` |
| Fix cadena | Rename unapplied point14 → `20260718030100`; `migration up --local` |
| Verifier §§15–17 | `ok: true`; Amber product events/actions = 0 |
| Playwright §§15–17 | PASS |
| Reconfirm R2 | Verifier `ok: true`; FX-08 PASS |
| R3 | No iniciado |
| Amber producto | No inventado / no poblado |

## Notas operativas locales

- El BFF de experiencia/acciones requiere `SUPABASE_SERVICE_ROLE_KEY` en el proceso de Next alineada al stack local (`npx supabase status`).
- Seeds oficiales: Unit2B (identidad Amber vacía), point15-17 OpVal A/B, FX-08.

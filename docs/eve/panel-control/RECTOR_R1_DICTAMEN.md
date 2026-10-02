# R1 — CONTRATOS BFF, VIEW MODELS Y ESTADOS DE DATOS  
## APTO PARA PROMOCIÓN A PRODUCCIÓN

**Fecha:** 2026-07-20  
**Corrección final:** SupportActionDrawer — submit → cierre → refresh  
**Autoridad:** `corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`

---

## Veredicto

**R1 — CONTRATOS BFF, VIEW MODELS Y ESTADOS DE DATOS APTO PARA PROMOCIÓN A PRODUCCIÓN**

R2 no iniciado.

---

## Causa factual del fallo Playwright §§15–17

1. **POST fallía** porque el proceso Next no tenía `SUPABASE_SERVICE_ROLE_KEY` / `EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY` (`.env.local` solo exponía URL + anon + password). El BFF `experience-actions` lanza `supabase_service_role_missing` → 5xx/catch → UI «No fue posible registrar la acción de soporte.» → el drawer **correctamente** permanecía abierto.
2. **Cierre gated por refresh:** aunque el POST hubiera sido 2xx, `submitAction` hacía `await load({ soft: true })` antes de resolver, y el drawer solo cerraba tras completar `onSubmit`. Un soft-refresh lento bloqueaba el cierre.

## Corrección

| Archivo | Cambio |
|---------|--------|
| `use-case-experience-state.ts` | Tras POST 2xx: resolver éxito y disparar `void load({ soft: true })` una vez (no await). `actionInFlightRef` anti doble POST. |
| `SupportActionDrawer.tsx` | Éxito → `onClose()` inmediato; error → drawer abierto + mensaje seguro; `submitPromiseRef` + `busy` anti doble clic. |
| `ExperienceGovernanceMode.tsx` | `drawerOpen` explícito; apertura solo por clic; `closeDrawer` limpia `selected`; sin `key` que remonte por refresh. |

Secuencia final:

```
POST experience-actions 2xx
  → submitAction resuelve
  → drawer cierra + selección limpia
  → soft refresh experience-state (una vez, no bloquea cierre)
```

Prueba anti-reapertura: `official-control-panel-support-action-drawer.test.mjs` (`drawerOpen` / sin `useEffect` de reopen / close antes de que settle el refresh).

## Compuertas (esta corrección)

| Compuerta | Resultado |
|-----------|-----------|
| Playwright §§15–17 | **PASS** |
| Playwright smoke panel | **PASS** |
| R1 + support-action tests | **PASS** |
| Regresión §§1–17 (node) | **PASS** 189/189 |
| TypeScript | **PASS** |
| ESLint tocados | **PASS** |
| Build limpio | **PASS** |
| BFF/RLS A/B | Evidencia vigente (sin cambio backend/auth/RLS) |

## No iniciar R2

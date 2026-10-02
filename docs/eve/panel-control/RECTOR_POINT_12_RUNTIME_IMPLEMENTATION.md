# RECTOR_POINT_12 — Runtime 40+20 (estructura §12-A)

**Fecha:** 2026-07-16  
**Título literal:** Runtime 40+20 y bloques individuales  
**Autoridad:** `Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`

---

## Separación vinculante

| Tramo | Estado |
|-------|--------|
| **§12-A** Estructura visual y navegación | **CERRADA** |
| **§12-B Entrega A** Matriz Base 40 en panel oficial | **Integrada** (visible con/sin run; ver `RECTOR_POINT_12_BASE_MATRIX_IMPLEMENTATION.md`) |
| **§12-B Entrega B** Matriz Causal 20 | **Visual + ledger factual** (ver ADR + bitácora Causal) |
| **§12-C** Gaps / timers / readiness | **Implementada** (ver `RECTOR_POINT_12_DELIVERY_C_IMPLEMENTATION.md`) |

Amber: sin run; estructura B0–B7 + Matrices Runtime con factuales No disponible; Estado de avance No evaluable.  
Causal: cierre desde `runtime_causal_evaluations` effective; sin backfill histórico.

---

## Entregado (§12-A)

- `ActivityRuntimePanel` tras `Cobertura de actividades`
- `RuntimeAvailability` + mensajes causales
- Resumen estructural (No disponible / —)
- Chips B0–B7 con etiquetas del plan; badge “Ruta crítica” solo en B0/B2/B3/B7 (metadato de diseño)
- Sin migraciones, ledger, RPC ni BFF operacional
- Sin `0/40`, `0/20`, ni uso de `base_visible_count` / `causal_visible_count`

## Archivos

- `presentation/runtime-availability.ts`
- `components/ActivityRuntimePanel.tsx`
- `CaseParticipantsPanel.tsx` (wiring)
- CSS módulo
- fixtures locales + e2e + regression 12a
- capturas `reports/local/rector-point-12/screenshots/`

## No entregado (§12-B)

BFF runtime-summary/blocks/gaps-readiness; conteos evaluables; readiness/gaps/timers factuales.

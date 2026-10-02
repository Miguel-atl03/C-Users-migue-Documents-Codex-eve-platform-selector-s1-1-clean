# Plan de implementación — Rector §§18–25 (corregido)

**Autoridad:** `Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` v1.0  
**Entrada:** `RECTOR_POINTS_18_25_GAP_MATRIX.md` (corregida)  
**Dictamen:** `RECTOR_POINTS_18_25_STATUS_DICTAMEN.md`  
**Fecha:** 2026-07-20  
**Naturaleza:** planificación. **No iniciar código** hasta aprobación de este plan corregido.

## Premisa

§§1–17 no se reabren como bloque. Solo se reabre el **requisito factual específico** afectado por una brecha residual (p. ej. BFF acción manual).

Las fases 0–6 están **mayoritariamente implementadas, con brechas residuales identificadas**. El trabajo dominante corresponde a **Fase 7 — Hardening**, sin ocultar brechas funcionales previas pendientes.

---

## Secuencia obligatoria R0 → R5

### Tramo R0 — Resolución de conformance

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Cerrar ambigüedades de componentes/endpoints equivalentes con dictamen de conformance |
| **Requisitos** | ExperienceSummary; ControlPanelStatusBar; company-state; manual-actions (§18–§19) |
| **Dependencias** | GAP_MATRIX R0 |
| **Alcance** | Solo documental |
| **Persistencia / BFF / UI / código** | ninguno |
| **Pruebas** | ninguna |
| **Evidencia** | tablas de conformance en GAP_MATRIX |
| **Riesgos** | declarar ABSORBIDO con pérdida real |
| **Entrada** | plan corregido aprobado |
| **Salida** | cuatro resoluciones con dictamen + acción residual explícita |
| **Compuerta** | revisión humana; sin TS/build |

**Resultado ya materializado en GAP_MATRIX (R0):**

| Requisito | Dictamen |
|-----------|----------|
| ExperienceSummary | ABSORBIDO SIN PÉRDIDA DE RESPONSABILIDAD |
| ControlPanelStatusBar | PARCIAL (no restaurar barra técnica) |
| company-state | ABSORBIDO (composición) / PARCIAL (VM única) |
| manual-actions | PARCIAL (RPC+DB sí; BFF/UI acción + caps ausentes) |

---

### Tramo R1 — Contratos BFF, view models y estados de datos

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Endurecer contratos **antes** de UI de hardening |
| **Requisitos** | §19 scope/VMs; §20 capabilities naming; §21 estados available/partial/stale/unavailable/error; freshness; normalización errores |
| **Dependencias** | R0 |
| **Archivos** | `official-control-panel-contract-*.ts`; capability-catalog; screen-state; BFF errores+requestId; docs `RECTOR_R1_*` |
| **Persistencia** | no |
| **BFF** | Opción B: wire éxito conservado; errores con `requestId`; company-state **sin** facade HTTP (ABSORBIDO tipado) |
| **UI** | mínima (`screenState` en experience hook); **sin** rediseño ni StatusBar técnica |
| **Seguridad** | catálogo capabilities exacto; deny-by-default; mutaciones R2 denied |
| **Pruebas** | `official-control-panel-r1-bff-contracts.test.mjs`; legacy freeze; access e2e existentes |
| **Evidencia** | `RECTOR_R1_*` docs |
| **Estado:** **CERRADO EN CÓDIGO / BLOQUEADO EN COMPUERTA E2E** — ver `RECTOR_R1_DICTAMEN.md`
| **Entrada** | R0 cerrado |
| **Salida** | contratos no ambiguos para R3 |
| **Compuerta** | TS, lint tocados, build limpio, secret scan, legacy freeze |

**Brechas que cerró:** company-state tipado; freshness/requestId contrato; capabilities naming; stale/unavailable en contrato. **Pendiente R3:** visual de screen states.

---

### Tramo R2 — Brechas funcionales residuales

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Implementar **solo** responsabilidades ausentes confirmadas |
| **Estado** | **CÓDIGO CERRADO / COMPUERTAS E2E PENDIENTES** — migraciones, BFF, UI, grants, verifier `ok:true`, FX-08 seed. Dictamen R2 **BLOQUEADA** hasta Playwright/capturas. |
| **Requisitos** | BFF/UI acción manual + caps `manage_manual_work`/`accept_manual_output`; adjuntos/versionado; grants por capability |
| **Dependencias** | R0 (manual-actions PARCIAL); R1 |
| **Archivos** | `manual-actions/route.ts`; ManualWorkPanel; migraciones R2; grants; verifier/seed/rollback |
| **Persistencia** | append-only vía RPC existente + tablas artifact R2; wrapper autenticado |
| **BFF** | POST gobernado → `eve_apply_manual_work_product_action_as_consultant` con JWT consultor |
| **UI** | acciones habilitadas solo con `availableActions.allowed` (stale visual → R3) |
| **Seguridad** | actor/razón/before/after/request_id; A/B deny; grants manage≠accept |
| **Pruebas** | Regresión R2 estática PASS; FX-08 seed; E2E producto pendiente |
| **Evidencia** | verifier + manifest FX-08; capturas pendientes |
| **Riesgos** | automatizar P-SUP-03/04/05 (prohibido); service_role en browser (prohibido) |
| **Entrada** | R1 verde; migraciones R2 aplicadas |
| **Salida** | estratos BFF/UI/caps Implementados; APTO solo con compuertas §17 |
| **Compuerta** | migraciones+rollback si aplica; RLS A/B; BFF A/B; append-only; TS; lint; build; DB lint; npm audit; secret/manifest scan; Playwright; a11y; observabilidad; legacy freeze; cero deuda crítica |

**No crear funcionalidad por nombre.** ExperienceSummary no se implementa si R0 = ABSORBIDO.

---

### Tramo R3 — Hardening de carga y degradación

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | UI/comportamiento §21 completo **después** de contratos R1 |
| **Requisitos** | loading, refreshing, partial, stale, forbidden, not_found, fatal, vacíos válidos, retry, request reference; StatusBar residual no técnico |
| **Dependencias** | R1; R2 si mutaciones (stale debe deshabilitarlas) |
| **Archivos** | shells error/loading; hooks; AttentionGovernancePanel; CSS a11y |
| **Pruebas** | e2e degradación + a11y focus |
| **Evidencia** | capturas por estado |
| **Entrada** | R1 (y R2 si hay mutaciones) |
| **Salida** | §21 sin AUSENTE en estados listados |
| **Compuerta** | igual R1 + Playwright subset + A11Y checklist parcial |
| **Estado** | **CERRADO / APTA** — `RECTOR_R3_DICTAMEN.md` |

---

### Tramo R4 — Fixtures y criterios de aceptación

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | Cerrar FX-01…FX-12 y CP/UX/SEC/A11Y residuales con test-only real |
| **Requisitos** | §22 completo |
| **Dependencias** | R2 (FX-08 producto); R3 para A11Y |
| **Archivos** | seeds FX aislados (no Amber); e2e FX; asserts CP |
| **Reglas** | mock ≠ cierre; captura ≠ prueba; seed sin assert ≠ cierre; Amber no se pobla para FX |
| **Pruebas** | matriz FX + criterios |
| **Evidencia** | manifest + capturas |
| **Entrada** | R1–R3 según dependencia |
| **Salida** | cada FX en TEST-ONLY REAL Y EVIDENCIADO, CUBIERTO POR ESCENARIO EQUIVALENTE (demostrado campo a campo), PARCIAL con brecha explícita, o AUSENTE — PENDIENTE |
| **Compuerta** | Playwright FX; no exigir suite completa en docs-only |
| **Estado** | **INICIADO / BLOQUEADO** — baseline+provision 12/12; e2e/capturas y gaps FX-03…06 pendientes — `RECTOR_R4_DICTAMEN.md` |

### Tramo R5 — Trazabilidad y cierre rector

| Campo | Contenido |
|-------|-----------|
| **Objetivo** | §24 completa; §25 cuatro preguntas respondibles con evidencia; dictamen final |
| **Dependencias** | R0–R4 ejecutados o residuales explícitos |
| **Código** | solo fixes menores detectados |
| **Pruebas** | smoke oficial |
| **Salida** | trazabilidad + respuestas 1–4 |
| **Compuerta** | documental + smoke; **no** declarar producción apta ni desplegar sin go-no-go humano |

---

## Prioridad

1. R0 conformance  
2. R1 contratos/datos/capabilities  
3. R2 brechas funcionales residuales  
4. R3 degradación  
5. R4 fixtures/aceptación  
6. R5 trazabilidad/cierre  

No mezclar R2 (mutaciones) con R3 (degradación) en la misma entrega salvo dependencia stale→mutación.

---

## Compuertas productivas (código)

migraciones incrementales · rollback · RLS A/B · BFF A/B · append-only · TypeScript · lint · build limpio · DB lint · npm audit · secret scan · manifest scan · legacy freeze · Playwright · a11y · observabilidad · cero deuda crítica

Documental (R0, partes R5): no Playwright costoso; sí verificar que no se tocaron secretos/rutas.

---

## Criterios de detención

- Reabrir §§1–17 completos sin brecha factual puntual  
- Usar Runtime v2 excluido  
- Migración MUI cosmética  
- Automatizar P-SUP-03/04/05  
- Experiencia como diagnóstico  
- service_role en browser  
- Declarar producción apta / deploy sin go-no-go  
- Clasificar mock como fixture cerrado  

---

## Consistencia con GAP_MATRIX

Toda brecha de la matriz tiene tramo R0–R5. Todo tramo responde a brechas listadas. El dictamen de estado debe coincidir.

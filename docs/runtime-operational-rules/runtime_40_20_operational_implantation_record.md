# Runtime 40/20 — Registro de implantación de reglas operativas

**Dictamen ID:** `EVE_RUNTIME_40_20_OPERATIONAL_RULES_IMPLANT_BASE40_CAUSAL20_V1`  
**Fecha:** 2026-07-11  
**Alcance:** implantación documental + cerebro operativo local (sin producción / Supabase / SQL / migraciones)

## Objetivo implantado

Corregir el error conceptual:

> El Runtime 40/20 NO significa “usar algunas preguntas hasta donde alcance”.

Por:

- 40 base **obligatorias por resolución** por cada `activity_runtime_run` profundo.
- 20 causales **evaluadas siempre**.
- Causales activadas obligatorias hasta cierre, derivación canónica, gap, reentry o manual review.
- No `ready` con base `skipped_silently`.
- No `ready` pleno con causal crítica activada sin resolver.

## Fuentes copiadas

| Fuente | Ruta repo |
| --- | --- |
| BASE-40 DOCX | `docs/runtime-operational-rules/Regla_Operativa_40_Preguntas_Base_EVE_MMABP_Ajustada.docx` |
| CAUSAL-20 DOCX | `docs/runtime-operational-rules/Regla_Operativa_20_Preguntas_Causales_EVE_MMABP_Ajustada.docx` |

## Artefactos documentales

- `base40_operational_rule.md` / `.json`
- `causal20_operational_rule.md` / `.json`
- `runtime_40_20_operational_implantation_record.md` (este archivo)
- `runtime_40_20_operational_implantation_traceability.json`
- `runtime_40_20_boundary_ledger.json`

## Cerebro operativo

| Módulo | Función |
| --- | --- |
| `base40-operational-rule.ts` | Contrato BASE-40 + IDs/estados |
| `causal20-operational-rule.ts` | Contrato CAUSAL-20 + prioridades |
| `base-resolution-gate.ts` | `evaluateBaseResolutionGate` |
| `causal-closure-gate.ts` | `evaluateCausalClosureGate` |
| `runtime-40-20-readiness-guard.ts` | Guard de readiness + handoff EvidenceBundle/MDSB |

## Superficies actualizadas

- Panel consultor Área 3: Base Resolution Gate + Causal Closure Gate + textos obligatorios.
- Fixture Ámbar: `baseResolutionByRun` (40) + `causalClosureByRun` (20) por run.
- Contrato CCP: campos de gate y versión de reglas.

## Fronteras respetadas

- Production touched: false
- Supabase / SQL / migraciones: false
- Controles manuales activados: false
- Descargas activadas: false
- Diagnóstico final automático: false
- Export productivo: false

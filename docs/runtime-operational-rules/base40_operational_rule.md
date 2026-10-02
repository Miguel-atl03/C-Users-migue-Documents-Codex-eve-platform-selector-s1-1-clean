# BASE-40 — Regla Operativa de Suficiencia Sistémica (40 Preguntas Base)

**rule_id:** `BASE-40`  
**Alcance:** `activity_runtime_run`  
**Aplica a:** toda actividad primaria que entra a Runtime profundo  
**Fuente DOCX:** `Regla_Operativa_40_Preguntas_Base_EVE_MMABP_Ajustada.docx`

## Corrección conceptual

El Runtime 40/20 **no** significa “usar algunas preguntas hasta donde alcance”.

Significa:

- **40 base obligatorias por resolución** para cada actividad primaria profunda.
- Una interacción puede no mostrarse al usuario, pero **no puede desaparecer**.
- Debe quedar capturada, confirmada, derivada, calculada, no aplicable con evidencia, flagged, reentry o manual review.

## Contrato operativo

| Campo | Valor |
| --- | --- |
| `base_interactions_required` | 40 |
| `mandatory_by_resolution` | true |
| `mandatory_as_visible_questions` | false |
| `silent_omission_allowed` | false |
| `ready_allowed_with_unresolved_base` | false |
| `ready_full_requires_all_base_resolved` | true |
| `parallel_production_requires_canonical_variables_provenance_readiness` | true |

## Estados estrictos permitidos

- `captured_user_evidence`
- `user_confirmed_prefill`
- `canonical_derivation_closed`
- `internal_calculated_closed`
- `not_applicable_with_evidence`
- `ready_with_flag`
- `blocked_by_missing_evidence`
- `blocked_by_missing_canonical_route`
- `reentry_required`
- `manual_review_required`
- `inferred_unconfirmed`
- `skipped_silently` (**prohibido en operación**)

### Reglas de estado

- `skipped_silently` = prohibido.
- `inferred_unconfirmed` no permite cierre pleno.
- `blocked_by_missing_evidence` no permite ready.
- `blocked_by_missing_canonical_route` no permite ready.
- `reentry_required` no permite ready.
- `manual_review_required` no permite ready pleno.

## Distribución cerrada (40)

| Bloque | IDs |
| --- | --- |
| 0 | B0-Q01, B0-Q02, B0-Q03, B0-Q04 |
| 0.5 | B05-Q05, B05-Q06, B05-Q07 |
| 1 | B1-Q08, B1-Q09, B1-Q10, B1-Q11 |
| 2 | B2-Q12 … B2-Q17 |
| 3 | B3-Q18 … B3-Q22 |
| 4 | B4-Q23 … B4-Q28 |
| 5 | B5-Q29 … B5-Q33 |
| 6 | B6-Q34 … B6-Q38 |
| 7 | B7-Q39, B7-Q40 |

## Base Resolution Gate

Antes de `ready` / handoff a EvidenceBundle o MDSB, el `BaseResolutionGate` verifica:

1. Existen 40 estados base (B0-Q01 … B7-Q40).
2. Cada registro tiene estado permitido.
3. Ninguno queda `skipped_silently`.
4. `inferred_unconfirmed` no cuenta como cierre pleno.
5. No falta variable canónica mínima, proveniencia ni salida MMABP/readiness cuando aplique.
6. Bases bloqueadas generan estados explícitos de bloqueo / reentry / manual review.

## Producción Paralela

Producción Paralela y Capa 2 **no** consumen texto libre sin variable canónica, proveniencia y readiness.

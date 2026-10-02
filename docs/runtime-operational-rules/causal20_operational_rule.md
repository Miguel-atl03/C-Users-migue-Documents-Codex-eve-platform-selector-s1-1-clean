# CAUSAL-20 — Regla Operativa de Suficiencia Sistémica (20 Preguntas Causales)

**rule_id:** `CAUSAL-20`  
**Alcance:** `activity_runtime_run`  
**Aplica a:** toda actividad primaria después de procesar bases fuente  
**Fuente DOCX:** `Regla_Operativa_20_Preguntas_Causales_EVE_MMABP_Ajustada.docx`

## Corrección conceptual

Las causales C01–C20 **no se preguntan siempre**, pero **sí se evalúan siempre**.

- Si la condición de apertura es falsa con evidencia → `not_triggered_with_evidence`.
- Si la condición es verdadera → `triggered_required` y debe resolverse.
- Si la activación es desconocida → **no** asumir falso (`activation_unknown`).
- Ninguna causal activada puede omitirse silenciosamente.

## Contrato operativo

| Campo | Valor |
| --- | --- |
| `causals_evaluated_always` | true |
| `causals_displayed_always` | false |
| `triggered_causal_required_to_close` | true |
| `activation_unknown_cannot_be_assumed_false` | true |
| `ready_full_blocked_by_open_triggered_causal` | true |

## Estados permitidos por causal

- `not_triggered_with_evidence`
- `triggered_required`
- `answered_closed`
- `closed_by_confirmed_negative`
- `closed_not_applicable`
- `activation_unknown`
- `triggered_unanswered`
- `route_missing`
- `contradiction_flag`
- `manual_review_required`
- `reentry_required`

## Distribución cerrada (20)

| Bloque | IDs |
| --- | --- |
| 0 | C01 |
| 0.5 | C02 |
| 1 | C03 |
| 2 | C04, C05, C06, C07 |
| 3 | C08, C09, C10 |
| 4 | C11, C12, C13, C14 |
| 5 | C15 |
| 6 | C16, C17, C18, C19 |
| 7 | C20 |

## Prioridades de bloqueo

### P0 — bloquean ready pleno

`C05`, `C09`, `C11`, `C20`

### P1 — no ready pleno; `ready_with_flags` solo con gap explícito

`C02`, `C03`, `C04`, `C08`, `C13`, `C14`, `C15`

### P2 — no declarar AHE prep suficiente

`C16`, `C17`, `C18`, `C19`

### P3 — no omitir; gap/reentry o bloquear submodelo

`C01`, `C06`, `C07`, `C10`, `C12`

## Frontera C20

C20 **nunca** produce diagnóstico final, IR, registry ni export productivo. Confirma o frena; no inventaria ni cierra VSM/AHE.

## Causal Closure Gate

Antes de `ready` / handoff:

1. C01–C20 fueron evaluadas.
2. Ninguna queda sin `activation_state`.
3. `not_triggered` exige evidencia.
4. `triggered_required` debe cerrarse (respuesta, derivación, negativo confirmado, reentry o manual review).
5. `activation_unknown` no se asume falso.
6. P0 abiertas bloquean ready pleno.

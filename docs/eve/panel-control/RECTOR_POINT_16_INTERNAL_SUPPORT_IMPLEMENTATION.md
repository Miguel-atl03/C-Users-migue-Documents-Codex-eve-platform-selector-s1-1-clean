# Rector Point 16 — Internal Support Implementation

## Alcance
Intervenciones auditadas sin alterar evidencia MBA.

## Persistencia
- `experience_support_action` append-only
- RPC `eve_apply_experience_support_action`

## Acciones
`send_message` | `resume_link` | `request_reentry` | `mark_manual_review` | `reopen_block` | `session_reset`

Alto riesgo exige `p_policy_authorized=true`.

## BFF
`POST /api/eve/official-consultant-control-panel/cases/:caseId/experience-actions`

## Prohibiciones (backend)
fix/override/force_continue/edit_answers/impersonate/force_readiness/close_gap/complete_screen/skip_gate

# R3 — Runtime → Panel permanent wiring report

## Circuit proven (non-Amber)

```
usuario operativo (RPC oficial eve_record_experience_screen_event)
  → support_requested factual
  → Consultor A GET experience-state
      → support item visible
      → send_support_message.allowed = true (grant explícito)
  → POST experience-actions (eve_apply_experience_action_as_consultant)
  → actionId auditado
  → soft-refresh GET ok
```

Script: `scripts/eve/official-control-panel/verify-runtime-to-panel-wiring.mjs`  
Evidence: `reports/local/rector-r3-degradation/diagnostics/09-runtime-to-panel.json`

## Guarantees

| Check | Result |
|-------|--------|
| No DML directo de transición | PASS (RPC only) |
| Verifier does not grant mid-flight | PASS |
| Amber product actions from probe | **0** |
| Consultor ≠ Runtime actor | PASS |
| Repeat on OpVal case | same wiring |

## Not used as product compensators

- Amber is never populated by this probe
- Seeds prepare identities/grants **before** verify; verify does not re-seed
- service_role does not invent `allowed`

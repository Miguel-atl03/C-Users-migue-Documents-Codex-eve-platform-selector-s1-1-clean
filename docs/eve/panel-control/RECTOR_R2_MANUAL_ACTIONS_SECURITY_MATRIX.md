# R2 — Security matrix (manual actions)

| Superficie | Actor | Regla | Resultado esperado |
|------------|-------|-------|--------------------|
| Core RPC `eve_apply_manual_work_transition` | authenticated | EXECUTE denegado | Deny |
| Wrapper product action | authenticated + assignment + grant | EXECUTE permitido | Transition / attach |
| Wrapper | sin auth.uid() | Fail closed | Deny |
| `accept_output` | sin grant `accept_manual_output` | Deny | 403 |
| manage actions | sin grant `manage_manual_work` | Deny | 403 |
| Consultor B → caso A | fuera de scope | Deny | 403/404 |
| DML directo artifact/event/idempotency | authenticated | Revoked + triggers | Reject |
| UPDATE/DELETE historial | cualquier rol vía trigger | Append-only | Exception |
| Actor en body | ignorado | Actor = auth.uid() | — |
| service_role para mutación productiva del Consultor | No requerido | BFF usa JWT | — |

## Grants

Tabla `eve_consultant_panel_capability_grant` (consultant × company × capability).  
Backfill de assignments activos con ambos grants. FX-08 Consultor C: solo `manage_manual_work`.

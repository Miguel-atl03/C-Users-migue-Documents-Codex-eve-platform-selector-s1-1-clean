# REPO-TBD — P-CLIENT-01 Vista 1 / Vista 5

Inventario de queries del DOCX P-CLIENT-01 §8 vs BFF actual.

| DOCX param | BFF actual | Tratamiento v1 |
|---|---|---|
| `case_id` | sí (`ControlPanelFilterScope`) | Soportado |
| `user_id` | sí | Soportado |
| `role_runtime_session_id` | sí | Soportado |
| `session_id` (diagnóstica) | no en filters | UI muestra selector disabled + reason `SESSION_ID_REPO_TBD` |
| `process_id=P-CLIENT-01` | `meta.effective_scope.pm_process_code` existe; no query filter dedicado | Scope de proceso se fija en UI al seleccionar card; no autoriza |
| `view=client-experience\|pre-runtime-context` (§2.1) | alias UI en cliente (`parsePClient01UrlView`); BFF `view` solo acepta keys nativas | Tab/foco P-CLIENT-01; no autoriza; mismo `effective_scope` case→user→role_runtime_session |
| `pm_process=P-CLIENT-01` | UI shell sincroniza card seleccionada | Embebe workspace bajo el PM en la misma ruta; no pantalla paralela |
| `cursor` / `limit` | operational-trace puede paginar aparte | No requerido para Vista 1/5 inicial |

Regla: query params seleccionan foco; no autorizan. Sin Supabase desde browser.

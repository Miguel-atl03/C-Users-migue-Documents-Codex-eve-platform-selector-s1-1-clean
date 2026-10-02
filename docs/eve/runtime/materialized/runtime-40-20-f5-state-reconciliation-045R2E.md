# Runtime 40/20 F5 State Reconciliation 045R2E

Status: locked_f5_state_source_conformance.

The state source cannot be reconciled to 459 definitions from explicit workbook columns without an extra grammar that authorizes tokenization or expansion.

| Candidate set | Columns | Unique records | Delta vs 459 |
| --- | --- | ---: | ---: |
| Minimal authorized | Estado rector asociado; Estado exportable; OLC requerido; Estado de especificacion material | 276 | -183 |
| Operational explicit | Estado rector asociado; Estado exportable; OLC requerido; Estado OLC correspondiente / maquina de estados; Estado PF producido; Estado de especificacion material | 414 | -45 |
| All state-like | Adds Estado de especificacion material v0.5 and Estado baseline post-ajuste v0.6 | 508 | +49 |

Decision: no eve_object_state_definition migration, loader or persistent smoke was created.

# MMABP Structured Input Security

Fecha: 2026-07-23

## Controles

- RLS habilitado y forzado en tablas normalizadas.
- DML directo revocado para `anon`, `authenticated` y `service_role`.
- Escritura permitida solo por funcion gobernada `eve_mmabp_normalize_structured_rule_inputs`.
- Append-only con triggers para UPDATE, DELETE y TRUNCATE.
- Lectura por consultor restringida por `eve_consultant_can_access_case(case_id)`.

## Evidencia

`reports/local/mmabp-structured-rule-inputs/append-only-probes.json`

Resultado: metricas criticas en cero; `directServiceRoleDmlGrants = 0`.

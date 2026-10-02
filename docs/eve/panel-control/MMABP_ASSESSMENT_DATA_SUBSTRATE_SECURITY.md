# MMABP Assessment Data Substrate Security

Fecha: 2026-07-23

## Controles materializados

- Tablas con RLS habilitado y `force row level security`.
- Revocacion de DML directo para `public`, `anon`, `authenticated` y `service_role`.
- Politicas de lectura para consultores con acceso al caso mediante `eve_consultant_can_access_case(case_id)`.
- Triggers append-only contra `UPDATE`, `DELETE` y `TRUNCATE` en paquetes, versiones, snapshots, indices, lineage, readiness y auditoria.
- RPC server-side para ingesta gobernada: valida schema, canonicaliza JSON, recalcula SHA-256 y registra auditoria.
- RPC server-side para snapshot gobernado: valida tipos, scope, hashes, lineage y construye indices desde contenido persistido.
- Ledger de idempotencia append-only con lock transaccional por `producer_type`, `producer_ref` e `idempotency_key`.
- RPC de readback y estado stale sin abrir SELECT directo a tablas cerradas.
- Acceso a contenido bruto de paquetes protegido por capability `view_authorized_evidence`.
- Verificador local comprueba `directServiceRoleDmlGrants=0`.

## Cadena de validacion esperada

empresa -> caso -> paquete -> version -> componente -> snapshot

La migracion conserva `company_id` y `case_id` en las tablas tecnicas para que la validacion acumulativa pueda ejecutarse antes de cualquier assessment.

## Fronteras

La prueba test-only se procesa por frontera server-side. No se aceptan rutas locales enviadas por navegador, JSON arbitrario desde React, hash declarado como autoridad, company/case sin validacion ni `service_role` como actor de negocio.

## Pruebas fisicas ejecutadas

- `schemaInvalid`: rechazado.
- `hashIncorrect`: rechazado.
- `typeIncorrect`: rechazado.
- `otherCaseComponent`: rechazado.
- `snapshotIncomplete`: rechazado.
- `irWithoutRegistry`: rechazado.
- `registryWithoutFacts`: rechazado.
- `factsWithoutEvidence`: rechazado.
- `Consultor B -> Caso A`: 0 filas.
- `Consultor C mismo caso sin view_authorized_evidence`: `view_authorized_evidence_required`.
- `UPDATE`, `DELETE`, `TRUNCATE`: rechazados por trigger en cada tabla append-only.
- `same key + same payload`: devuelve el mismo resultado para ingesta y snapshot.
- `same key + payload distinto`: devuelve `IDEMPOTENCY_CONFLICT`.
- Cada metrica de `eve_mmabp_substrate_metrics_v2`: detecta una violacion deliberada reversible.

Estas pruebas habilitan el sustrato factual, pero no habilitan CP-012 porque el productor de Conformance/Consistency no se ha iniciado.

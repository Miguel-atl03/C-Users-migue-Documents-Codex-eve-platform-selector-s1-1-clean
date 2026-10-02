# Conformidad de carga draft Runtime 40/20 — 042

## Cierre

La autoridad de NULL se resolvió por Rama B: SEMPERSIST-R1 gobierna la
persistencia semántica en los tres órganos, pero no exige NULL físico en las
doce columnas legacy.

La corrección RPC 042-A:

- rechaza cualquier campo legacy presente en el payload con
  `blocked_legacy_semantic_payload_present`;
- omite las doce columnas del `INSERT`;
- deja que PostgreSQL aplique sus defaults existentes;
- conserva lock, atomicidad, grants, idempotencia y comparación exacta;
- tiene rollback que restaura exactamente 040-D.

La prueba negativa produjo 0 escrituras. La carga posterior devolvió
`draft_loaded` y el replay exacto devolvió `idempotent_replay`.

## Estado protegido

- Producción consultada: no.
- Catálogo activado: no.
- B0 modificado: no.
- B1 conectado o modificado: no.
- Gaby modificado: no.
- Runs iniciados: no.
- Core/defaults alterados: no.
- Commit creado: no.
- Variable temporal de conexión eliminada: sí.

## Clasificación

`staging_runtime_40_20_catalog_draft_loaded`

Brecha siguiente única:
`runtime_40_20_QA_T001_T020_and_activation_gate_required`.

No se ejecutó QA completa ni activación.

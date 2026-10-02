# Runtime Manifest Remediation

`eve-platform` consume Capa 1 v2.1 desde `src/runtime/capa-1-v2-1-runtime-manifest.json`. Ese archivo es un snapshot compilado producido por `eve-canonical-system`; no es un catálogo local editable ni una reinterpretación de plataforma.

El loader estricto vive en `src/runtime/capa1-runtime-manifest.ts` y valida que el manifest declare `expected_platform_runtime_version = CAPA1_V2_1_RUNTIME_CONSUMER`.

## Contrato aplicado

El renderer usa campos del manifest: `field_type`, `answer_mode`, `options`, `allows_free_text`, `free_text_condition`, `help_text` y `short_ui_label`.

El branching ya no trunca `question_code`; las condiciones se resuelven por código completo.

La persistencia agrega estructura para mantener separadas respuesta original, aclaración, valor consolidado, provenance chain, readiness, confidence, flags y bundles.

## Bloque 7

El manifest exige `7.0`, `7.0a`, `7.1`, `7.2`, `7.3`, `7.3a` y `7.4`. La plataforma aplica máximo 3 microconfirmaciones visibles por escena, separa `preclassification_readiness` de `confidence_score` y normaliza confidence a escala 0-100.

## Bundles

La plataforma persiste bundles estructurados en `scene_answer_bundles`:

- `compensation_bundle`
- `ahe_observation_bundle`
- `evidence_bundle_for_transduction`

`evidence_bundle_for_transduction` no equivale a Capa 2. La salida consolidada tampoco equivale a Capa 2.

## Validación

Ejecutar:

```bash
npm run validate:manifest
```

El reporte queda en `reports/platform-manifest-conformance-report.json` y falla ante drift contractual.

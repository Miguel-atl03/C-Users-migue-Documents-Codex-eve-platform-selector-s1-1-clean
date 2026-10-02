# Runtime Observability

This platform exposes a minimal runtime observability audit for the promoted Capa 1 v2.1 manifest contract.

## Endpoint

`GET /api/runtime/observability?limit=50`

The endpoint reads recent scenes and reports:

- `preclassification_readiness` distribution;
- `confidence_score` buckets and average;
- transduction readiness distribution;
- Block 7 microconfirmation counts for `7.0a`, `7.1`, `7.2`, `7.3`, `7.3a`, `7.4`;
- required bundle coverage;
- non-diagnostic bundle guard;
- session intermediate output coverage;
- critical/warning anomalies.

## CLI Audit

Run with the local app server active:

```bash
npm run audit:runtime-observability
```

Optional scope:

```bash
$env:EVE_OBSERVABILITY_LIMIT="100"
npm run audit:runtime-observability
```

The report is written to:

`reports/runtime-observability-audit-report.json`

## Critical Drift

The audit fails when it detects:

- a canonicalized scene missing any required bundle;
- `confidence_score` missing or outside 0-100;
- inference without `preclassification_readiness`;
- any runtime bundle not marked `not_diagnostic`.

Warnings include recent sessions with scenes but no `session_intermediate_output` yet. Those can be normal during active capture, but should be watched in aggregate.

## Baseline Window

By default, the CLI audit starts at the promoted baseline window:

`EVE_OBSERVABILITY_SINCE=2026-05-19T17:23:00.000Z`

This avoids failing the post-contract audit because of historical pre-remediation scenes that were canonicalized before bundles existed. To audit all historical data, override the value explicitly:

```bash
$env:EVE_OBSERVABILITY_SINCE="1970-01-01T00:00:00.000Z"
npm run audit:runtime-observability
```

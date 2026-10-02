# Runtime VSM Dashboard

`/admin/runtime-vsm` is the internal VSM control surface for the governed Capa 1 v2.1 runtime in eve-platform.

It does not redefine the canon. It reads the promoted runtime manifest, the platform consumption contract, the post-baseline runtime repository, the conformance report, and the observability audit report.

## Baseline

Default operational baseline:

`2026-05-19T17:23:00.000Z`

The dashboard must not mix historical pre-remediation sessions with the governed runtime window unless an operator explicitly changes the `since` parameter in the API.

## VSM Map

- S1: live runtime operation. Shows sessions, scenes, output coverage, bundles, Block 7, provenance, confidence and recent cases.
- S2: coordination. Checks manifest version/hash, strict loader, contract validation, active runtime compatibility, and the anti-legacy catalog guard.
- S3: internal control. Tracks contractual persistence, separation rules, tactical thresholds and immediate corrective actions.
- S3*: independent audit. Uses the runtime observability audit and recent sampling to detect silent semantic drift that S3 aggregates may hide.
- S4: intelligence/adaptation. Shows weekly and monthly temporal series, emerging risks and release-associated drift.
- S5: policy/identity. Keeps promotion, rollback and non-collapsing invariants visible.
- Algedonic channel: durable priority signals with severity, responsible system and required action.

S3 and S3* are intentionally separate. S3 manages the present; S3* inspects the system independently.

## Temporal Series

The VSM snapshot exposes:

- `trends.weekly`
- `trends.monthly`
- `trends.driftSignals`

Each period contains:

- period start/end/label
- sessions and scenes count
- bundle completeness
- Block 7 completeness
- provenance presence
- intermediate output coverage
- confidence average and median
- readiness distribution
- microconfirmation average and max
- critical/major/minor anomalies
- manifest version distribution
- content hash distribution

## Drift Rules

Thresholds live in `src/runtime-vsm/runtime-vsm-thresholds.json`.

Temporal drift rules include:

- bundles complete drops for 2 consecutive periods: major S4 alert
- Block 7 complete drops for 2 consecutive periods: major S4 alert
- intermediate output drops for 2 consecutive periods: major S4 alert
- confidence average drops more than configured warning/major points: S4 alert
- microconfirmations average rises for 2 consecutive periods: major S4 alert
- microconfirmations max above 3 in any current period: critical alert
- critical anomalies in any current period: critical alert
- after manifest release, 2 or more key metrics worsen: major S4 alert
- ready_with_microconfirmations grows sustainably: major S4 alert

## Durable Audit

Run with the app server active:

```bash
npm run audit:runtime-vsm
```

This writes:

- `reports/runtime-vsm-dashboard-report.json`
- `reports/runtime-vsm-alerts.json`

The alerts file includes both algedonic events and temporal drift signals.

## Legacy Catalog Guard

Capa 1 v2.1 no may be read from `src/rules/question-catalog-v2-1.json`. That file was retired to:

`archive/legacy-runtime/question-catalog-v2-1.NO_RUNTIME_SOURCE.json`

Verify with:

```bash
npm run check:no-legacy-runtime-catalog
```

## Limits

This dashboard is a governance surface, not a new canonical source. It does not replace human audit, does not promote Capa 1 output into Capa 2, and does not relax these invariants:

- bundle != readiness
- readiness != confidence
- confidence != clasificacion
- evidence_bundle_for_transduction != Capa 2
- consolidated_output != Capa 2
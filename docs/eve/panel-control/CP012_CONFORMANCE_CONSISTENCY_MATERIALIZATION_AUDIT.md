# CP-012 Conformance / Consistency Factual Audit

Scope: CP-012 only. No new MMABP evaluator was invented. No Amber population, no rail changes and no R4/R5 promotion.

## Audit Finding

The repository contains schemas, fixtures and validators for `conformance_report` and `consistency_report`, including:

- `schemas/parallel-production/conformance-report.schema.json`
- `schemas/parallel-production/consistency-report.schema.json`
- `scripts/validate-parallel-production.mjs`
- `src/services/parallel-production/runtime/assessment-run.mjs`

Those assets validate or rehearse reports, but they do not materialize a canonical factual producer that evaluates real MMABP IR, registry, facts, inventory and relations from an immutable package source.

Required factual status:

**CP-012 BLOQUEADO: el repositorio controla el orden, pero no materializa todavia una evaluacion factual MMABP suficiente.**

## Decision

`eve_cp012_build_conformance_report` and `eve_cp012_build_consistency_report` were removed as substitutes. They inferred assessment status from package refs and findings, which is not equivalent to factual MMABP evaluation.

The official assessment RPC now preserves access checks, package version checks, assessment version checks, idempotency, audit readback and append-only protections, but returns `parallel_assessment_producer_unavailable` instead of creating reports.

The legacy assessment transition RPC is also blocked from accepting client-supplied `report_ref` or `result` as a product assessment.

## Immutable Source Requirement

Each blocked action reports the immutable source context available at the moment of attempted evaluation:

- `packageId`
- `packageSourceVersion`
- `irRef`
- `registryRef`
- `factsRef`
- `inventoryRef`
- `assessmentVersion`

Because no canonical producer exists, `assessmentVersion` remains `0` / `null` and no `conformance_report` or `consistency_report` row is created.

## Evidence Contract

Physical evidence for CP-012 is regenerated under:

`reports/local/rector-r4-r5-physical/CP-012-PHYSICAL/`

Required files:

- `runner-result.json`
- `verifier-summary.json`
- `assessment-state-before-after.json`
- `source-version-before-after.json`
- `mutation-probes.json`
- `capability-readback.json`
- `event-ledger.json`
- `conformance-report.json`
- `consistency-report.json`
- `product-action-audit.json`
- `idempotency-ledger.json`

Expected result:

- runner probe passes as an honest blocked-path test.
- verifier summary fails promotion with `CP012RealProducerMissing=1`.
- `stalePackageRejected=true`.
- GET readback exposes no assessment actions.
- UPDATE, DELETE and TRUNCATE probes are rejected.
- no fake CP-012 producer is used.
- no assessment report is created without a real producer.

## Dictamen

CP-012 remains blocked until the canonical factual MMABP producer is materialized and available to the official assessment path.

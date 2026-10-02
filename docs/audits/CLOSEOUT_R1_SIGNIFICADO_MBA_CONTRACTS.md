# CLOSEOUT R1.1 — Significado MBA Contracts Reconciliation

**Repository:** `eve-platform`  
**Scope:** R1.1 minimal reconciliation only (no R2, no UI, no flow/API/Supabase/runtime)  
**Date:** 2026-06-12  
**Baseline:** R1 domain + adapter + regression tests from QA failure report

---

## Executive summary

R1.1 reconciles type safety and explicit R1 boundary locks on the Significado operational MBA contract layer. The activity-anchor adapter now compiles without TypeScript errors; submit payloads carry explicit `false` flags locking diagnostics, export, and transduction out of R1 scope; regression tests pass 10/10; R1-scoped lint is clean.

**R1.1 status:** **Partially approvable** — R1 contract slice is clean and evidence-backed; repo-wide `tsc` and `lint` remain red outside this slice (pre-existing, out of scope).

---

## What was reconciled

| Item | Before | After |
|------|--------|-------|
| Adapter TS errors | 3 errors in `significado-activity-anchor-adapter.ts` (union narrowing) | 0 adapter errors |
| Submit payload boundary | No explicit lock flags | `diagnosticsEnabled`, `exportEnabled`, `transductionEnabled` typed as `false` and set explicitly in adapter |
| Test lint | Unused `workMapModule` import | Removed |
| Test assertions | No boundary-flag checks | Asserts all three flags are `false` on submit payload |
| Test TS (provenance) | Direct property access on union | Narrowed with `Array.isArray` guard |

### TypeScript fixes (adapter)

1. **`selectTraceableActivity`** — Extract `priority` local and narrow `type === "responsibility"` before accessing `responsibilityId` (fixes TS2339 on `SignificadoPriorityTarget` union).
2. **`unitKeyEquals`** — Compare discriminated `ActivityAnchorUnitKey` branches explicitly so both `left` and `right` are narrowed per scope (fixes TS2339 on `activityId` / `responsibilityId`).

### Boundary flags (domain + adapter)

Added to `SignificadoSubmitPayload`:

```typescript
diagnosticsEnabled: false;
exportEnabled: false;
transductionEnabled: false;
```

`buildSignificadoSubmitPayload` sets all three to `false` on every successful submit. Types use literal `false` (not `boolean`) to prevent accidental widening in R1.

---

## Files touched

| File | Change |
|------|--------|
| `src/domain/significado-de-trabajo.ts` | Added three literal-false boundary flags to `SignificadoSubmitPayload` |
| `src/services/significado-activity-anchor-adapter.ts` | Union narrowing fixes; explicit boundary flags in submit payload |
| `tests/regression/significado-activity-anchor-adapter.test.ts` | Removed unused import; boundary-flag assertions; provenance narrowing |
| `docs/audits/CLOSEOUT_R1_SIGNIFICADO_MBA_CONTRACTS.md` | This closeout document |

**Not touched (per constraint):** UI, `flowState`, WorkMap, `page.tsx`, `types.ts`, APIs, Supabase, runtime engine, `questionnaire_main`.

---

## Command evidence

### 1. Regression tests — PASS

```text
> npm run test:significado-activity-anchor

# tests 10
# pass 10
# fail 0
```

All subtests green, including updated submit-payload test with boundary-flag assertions.

### 2. TypeScript — adapter clean; repo-wide still red

```text
> npx tsc --noEmit

Adapter-related (src/services/significado-activity-anchor-adapter.ts): NO ERRORS

Remaining errors (out of R1.1 scope):
- src/app/page.tsx(1511,28): TS2367 — unrelated flow comparison
- src/domain/work-map.ts(4,8): TS5097 — .ts extension import (WorkMap, not modified)
- src/services/work-map-operational-readiness.ts(72,5): TS2367 — unrelated
- tests/regression/*.test.ts: TS5097 — .ts extension imports in node:test harness pattern (pre-existing across regression suite)

Significado test file still reports TS5097 on dynamic `.ts` imports (lines 39, 41, 43). This is the established regression harness pattern; Node runtime executes correctly (10/10 pass). Not introduced by R1.1 and not fixable without changing harness convention (out of scope).
```

### 3. Lint — R1 files only — PASS

```text
> npx eslint "src/domain/significado-de-trabajo.ts" \
    "src/services/significado-activity-anchor-adapter.ts" \
    "tests/regression/significado-activity-anchor-adapter.test.ts"

Exit code: 0 (no warnings or errors)
```

**Note:** `npm run lint` (repo-wide) was not re-run; QA reported repo-wide lint failures unrelated to R1 files. R1-scoped lint is clean.

---

## Remaining known gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| Repo-wide `tsc --noEmit` | Medium | Fails on pre-existing errors outside R1 slice; adapter itself is clean |
| Repo-wide `npm run lint` | Medium | Not reconciled in R1.1; R1 files pass isolated lint |
| Test harness `.ts` import TS5097 | Low | Runtime OK; tsc noise only; same pattern as other regression tests |
| No UI / flow / persistence wiring | Expected | R2+ scope; explicitly deferred |
| Dirty working tree isolation | Info | Other in-flight changes may coexist; this closeout covers only the four allowed files |

---

## R1.1 approval recommendation

**Recommendation: PARTIALLY APPROVABLE**

Approve the R1 contract slice for merge when:

- Reviewer accepts that repo-wide `tsc` / `lint` red status is documented and out of R1.1 scope.
- Reviewer confirms no R2/UI/flow wiring was introduced (verified: only domain, adapter, test, doc changed).

The operational MBA contract layer (`SignificadoSubmitPayload`, traceable anchors, readiness, submit builder) is type-safe, tested, and explicitly bounded against diagnostics/export/transduction until R2+.

---

## Contract snapshot (post-reconciliation)

`SignificadoSubmitPayload` operational fields:

- `version`, `sessionId`, `submittedAt`, `captureMode`
- `workMapSnapshot`, `bundle`, `primaryActivity`, `traceableActivities`, `readiness`
- **R1 locks:** `diagnosticsEnabled: false`, `exportEnabled: false`, `transductionEnabled: false`

Forbidden diagnostic keys remain absent (verified by regression test): `diagnosis`, `mmabpMap`, `vsmMap`, `preliminaryDiagnostic`, `closureResult`.

---

## References

- R0 audit: `docs/audits/AUDIT_R0_SIGNIFICADO_TRABAJO_MBA.md`
- Domain: `src/domain/significado-de-trabajo.ts`
- Adapter: `src/services/significado-activity-anchor-adapter.ts`
- Tests: `tests/regression/significado-activity-anchor-adapter.test.ts`

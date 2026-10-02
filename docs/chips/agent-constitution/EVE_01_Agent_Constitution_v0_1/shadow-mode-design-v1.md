# EVE 01 Agent Constitution Shadow Mode Design v1

## 1. Purpose

This document designs, but does not implement, the `constitutional_shadow` mode for `EVE-01-AGENT-CONSTITUTION`.

The mode evaluates whether an agent action is constitutionally allowed according to D1-D5, the EVE-01 package rules, and the dependency on `EVE-00-METHOD-KERNEL@0.2.0`.

It is a shadow-only evaluator design. It cannot block a user, mutate payloads, write registry, trigger final diagnosis, activate Produccion Paralela, or act as runtimeAuthority.

## 2. Mode Definition

Mode id: `constitutional_shadow`

Activation posture:

- disabled-by-default;
- invocable only by future tests or a future dev harness;
- no production flow integration;
- no user blocking;
- no payload mutation;
- no registry write;
- no final diagnosis;
- no Produccion Paralela real;
- audit trace visible for review.

## 3. Protected Boundaries

The design protects:

- no final diagnosis from Capa 1;
- no `raw_text_export`;
- no `untraceable_recommendation`;
- no `runtimeAuthority`;
- no registry write;
- no Produccion Paralela real;
- no productive UI;
- no WorkMap mutation;
- no Significado mutation;
- no Runtime productivo mutation;
- no `page.tsx`;
- no Supabase;
- no SQL;
- no API side effects.

## 4. Allowed Conceptual Outputs

The evaluator may prepare:

- `constitutionalDecisionCandidate`;
- `diagnosticPreclassificationCandidate`;
- `blockedAction`;
- `allowedAction`;
- `requiredInputs`;
- `auditRequired`;
- `sourceTrace`;
- `nextChipOrService`.

It may not produce:

- `finalDiagnosis`;
- final IR;
- registry export;
- final production payload;
- final Runtime readiness;
- final user-facing decision.

## 5. Input Contract

Conceptual interface:

```ts
type AgentConstitutionEvaluationInput = {
  mode: "constitutional_shadow";
  requestedAction: string;
  inputClassification: string;
  evidenceItems: AgentConstitutionEvidenceItem[];
  sourceTrace: AgentConstitutionSourceTrace[];
  methodKernelResult?: unknown;
  runtimeContext?: unknown;
  actorContext?: unknown;
  targetBoundary?: string;
  requestedOutputType?: string;
};

type AgentConstitutionEvidenceItem = {
  evidenceItemId: string;
  value: unknown;
  provenanceType: string;
  sourceRefs: string[];
  revision: number;
  epistemicStatus: string;
};

type AgentConstitutionSourceTrace = {
  sourceId: "D1" | "D2" | "D3" | "D4" | "D5";
  ruleId?: string;
  locator: string;
  authorityDomain: string;
};
```

## 6. Forbidden Inputs

The evaluator must reject or flag:

- free text without `sourceTrace`;
- unconfirmed AI evidence as `captured_user_evidence`;
- raw WorkMap draft as closed evidence;
- unconfirmed B0 prefill;
- action without scope;
- output request without `requestedOutputType`;
- diagnostic request without prior MMABP inconsistency;
- Produccion Paralela request without readiness and authority chain.

## 7. Output Contract

Conceptual interface:

```ts
type AgentConstitutionEvaluationResult = {
  version: "1.0";
  mode: "constitutional_shadow";
  chipId: "EVE-01-AGENT-CONSTITUTION";
  readinessState: AgentConstitutionReadinessState;
  decisionId: string;
  ruleIds: string[];
  sourceTrace: AgentConstitutionSourceTrace[];
  inputClassification: string;
  allowedActions: string[];
  blockedActions: string[];
  requiredInputs: string[];
  auditRequired: boolean;
  nextChipOrService: string | null;
  findings: unknown[];
  auditEvents: unknown[];
  safetyFlags: {
    canBlockUserFlow: false;
    canModifyPayload: false;
    canWriteRegistry: false;
    canTriggerFinalDiagnosis: false;
    canTriggerProduction: false;
    runtimeAuthority: false;
  };
};
```

## 8. Readiness States

The design uses the package states:

- `capture_allowed`;
- `clarification_required`;
- `blocked_by_scope`;
- `blocked_by_missing_evidence`;
- `blocked_by_missing_canonical_route`;
- `blocked_by_contradiction`;
- `manual_review_required`;
- `ready_for_structural_candidate`;
- `ready_for_diagnostic_preclassification`;
- `ready_for_parallel_preview`;
- `export_blocked`;
- `audit_required`.

In shadow mode these are internal signals only. They are not productive Runtime gates.

## 9. Fixture Set

Future fixtures:

1. `capture_allowed_traced_evidence`
2. `missing_source_trace`
3. `scope_blocked_final_diagnosis`
4. `diagnostic_preclassification_candidate`
5. `parallel_preview_blocked_missing_readiness`
6. `audit_required_incomplete_source_trace`

Each fixture must define:

- `fixtureId`;
- `requestedAction`;
- `expectedReadinessState`;
- `expectedAllowedActions`;
- `expectedBlockedActions`;
- `expectedRuleIds`;
- `expectedSafetyFlags`.

## 10. Relation With Method Kernel

`EVE-00-METHOD-KERNEL` validates methodological conformance and consistency.

`EVE-01-AGENT-CONSTITUTION` decides whether an agent action is constitutionally allowed.

EVE-01 does not replace EVE-00. It may consume `methodKernelResult` as structural evidence, not as diagnosis. If a diagnostic or structural output is requested without a method kernel result or equivalent trace, EVE-01 must block or request evidence.

## 11. Future UI Trace Requirements

A future dev harness must show:

- `selectedFixture`;
- `requestedAction`;
- `inputClassification`;
- `evidenceItems`;
- `sourceTrace`;
- `methodKernelResult`;
- `readinessState`;
- `allowedActions`;
- `blockedActions`;
- `requiredInputs`;
- `findings`;
- `auditEvents`;
- `safetyFlags`;
- MATCH expected/actual.

Minimum visual fixtures:

- capture allowed;
- scope blocked;
- diagnostic preclassification;
- export blocked;
- audit required.

## 12. Risk Matrix

Primary risks:

- converting preclassification into final diagnosis;
- duplicating Method Kernel;
- duplicating Runtime readiness;
- using D2 to create MMABP rules;
- using D4/D5 to relax D1;
- allowing raw_text_export;
- allowing untraceable recommendation;
- exposing internal machinery in final UI;
- registering runtimeAuthority too early;
- writing registry from shadow mode;
- blocking users from shadow mode.

Each risk must be represented in the risk artifact and future tests before implementation.

## 13. Implementation Boundary

This document is not implementation. It creates no service, no TS domain module, no UI, no runtime registry and no production integration.

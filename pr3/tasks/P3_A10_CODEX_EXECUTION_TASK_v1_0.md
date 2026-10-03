# EVE PR3 — CODEX EXECUTION TASK · P3 real-model qualification + A10 input v1.0

## Authority and mode

Execute under:

- PROMPT PR3 v1.2.1
- SETUP_INSTITUCIONAL_RAZONAMIENTO_TRIPILAR PR3 v1.2
- SYSTEMIC_RECURSIVE_CAUSAL

This task is execution, not a request for another governance plan.

Do not stop for routine permissions already exercised in P4. Do not ask the user to create, copy, paste, or reveal an OpenAI API key.

## Current causal position

P2 = DEPLOYED_CLEAN_TARGET_CONFORMED  
P4 = REAL_DEPLOYMENT_CONFORMED  
A08 = SOURCE_IMPLEMENTED / source conformance must be green at current head  
A09 = SOURCE_IMPLEMENTED / source conformance must be green at current head  
P3 = execute now  
A10 = only produce decision input if P3 closes  
P5 real-user E2E = HOLD

Repository:

`Miguel-atl03/C-Users-migue-Documents-Codex-eve-platform-selector-s1-1-clean`

Branch:

`pr3-pilot`

Vercel project already authenticated by CLI in prior P4 work:

`eve-pr3-pilot`

Vercel scope:

`miguelatalav-9585`

Clean Supabase target remains:

`keqrkyumfyhfivllvdbl`

No legacy Supabase use is authorized.

---

# 1. Pull exact current source

Use the existing repository/workspace. Do not reconstruct source from historical ZIPs.

```bash
git checkout pr3-pilot
git pull --ff-only
git status --short
git rev-parse HEAD
```

Do not proceed on a dirty workspace unless the dirt is your own documented continuation from this task.

## Authority artifacts to read before execution

Read completely, not as labels:

- `pr3/authority/PR3_AI_CONTROL_STATE_v1_0.json`
- `pr3/authority/A08_PR3_B0_PRODUCTION_AI_BINDING_v1_0.json`
- `pr3/authority/A09_PR3_B2_PRODUCTION_AI_MODE_BINDING_v1_0.json`
- `pr3/authority/P3_PR3_PRODUCTION_AI_QUALIFICATION_PLAN_v1_0.json`
- `pr3/authority/A10_PR3_EVALUATOR_AUTHORITY_DETERMINATION_PROCEDURE_v1_0.json`
- `pr3/authority/A11_PR3_AI_PROVENANCE_LEDGER_v1_0.json`
- `pr3/authority/A06_PR3_AI_OPERATION_ENUM_CORRECTION_OVERLAY_v1_0.json`
- `pr3/authority/source_evidence/B2/Evaluator_Qualification_Evidence.json`
- `pr3/authority/source_evidence/B2/EvaluatorAuthorityRecord_CANDIDATE.json`

Preserve the exact promoted B0/B2 semantics and identities.

---

# 2. Confirm structural source conformance at the CURRENT head

Run:

```bash
npm ci --no-audit --no-fund
npm run typecheck
npm run test:pr3
npx eslint src/services/eve/pr3/ai scripts/pr3 tests/regression/pr3
npm run build
```

The global inherited lint outside the affected PR3 AI scope is not a P3 blocker.

If the focal gate fails, determine causal owner from the actual failure.

Allowed autonomous repair:
- syntax/import/type/test fixture defect;
- Vercel AI Gateway transport compatibility;
- structured-output schema transport defect;
- provenance/idempotency implementation defect;
- technical prompt/profile binding defect that does NOT change B0/B2 promoted semantics.

Forbidden repair:
- changing B0/B2 questions/canonical variables/mode map;
- allowing AI on B0.5 or B1;
- turning deterministic B2 nodes into model calls;
- weakening support/context/stale checks;
- changing candidate/proposal into evidence;
- granting evaluator/admission authority.

After any technical repair, rerun the full focal gate before P3.

---

# 3. Use Vercel project OIDC — NO USER API KEY

Production/qualification transport is now:

- endpoint: `https://ai-gateway.vercel.sh/v1/responses`
- generator model: `openai/gpt-5.4-mini`
- evaluator candidate: `openai/gpt-5.6-sol`
- provider: Vercel AI Gateway / OpenResponses
- prompt training: disallowed
- store: false
- tools: none
- automatic admission: false

The Vercel CLI was authenticated during P4. Confirm without exposing tokens:

```bash
vercel whoami
```

Do NOT print an OIDC token.

The repository contains an autonomous wrapper:

```bash
npm run qualify:pr3-ai:vercel-oidc
```

That wrapper:
1. obtains a project-scoped Vercel OIDC token with `vercel project token eve-pr3-pilot`;
2. injects it only into the child P3 process;
3. never writes/logs the token;
4. runs the real P3 generator/evaluator qualification;
5. freezes P3 evidence under `pr3/evidence/`;
6. if P3 closes, runs the guarded A10 decision procedure;
7. freezes the A10 decision input and execution receipt.

If token acquisition via the wrapper fails but `vercel whoami` succeeds, repair only the CLI invocation/parsing needed to retrieve the project OIDC token. Use official Vercel CLI behavior. Do not fall back to asking the user for OpenAI credentials.

A true blocker exists only if the authenticated Codex/Vercel context cannot issue a project OIDC token after direct CLI verification. Then report exactly:

`CODEX_VERCEL_PROJECT_OIDC_UNAVAILABLE`

with the command class attempted, but no token values.

---

# 4. P3 material execution

P3 uses synthetic/reference material only. It must not write model-test data into `eve_pr3` business/evidence tables.

The execution must exercise:

## B0 generator

- contextual render;
- context-bound render;
- candidate-not-evidence boundary;
- unknown preservation;
- internal `classify_genericity`;
- internal `classify_scale`.

Routing results remain control/provenance material, never business evidence.

## B2 generator

Exercise promoted AI modes across:
- render;
- candidate;
- B2 semantic limits;
- observer boundary;
- unsupported specificity;
- unknown;
- exception/hidden-change cases.

The four DETERMINISTIC B2 targets must produce:

- 0 provider calls;
- 0 AIOperation rows;
- 0 AIProposal rows.

## Evaluator candidate

Use `openai/gpt-5.6-sol` as a separate configuration from the generator.

It remains:

`CANDIDATE_ONLY`

and may not self-authorize.

Run the 15-case reference bank blind to the expected label. Exact expected/reference labels are used only after the returned review to calculate agreement.

Live evaluator reviews of generator output are findings, not self-authorizing hard falsifiers.

## Provenance

P3 evidence must materially preserve:
- provider request id;
- returned model id/version;
- prompt/instruction hashes;
- input hashes or case request hashes;
- response schema/config identity;
- usage where returned;
- requested/completed state;
- hard falsifiers;
- reference-bank agreement;
- separation of generator/evaluator/admission/user evidence.

---

# 5. Interpret P3 without manufacturing PASS

After `npm run qualify:pr3-ai:vercel-oidc`, inspect:

- `pr3/evidence/P3_PR3_PRODUCTION_AI_QUALIFICATION_EVIDENCE_v1_0.json`
- `pr3/evidence/P3_A10_EXECUTION_RECEIPT_v1_0.json`

If P3 reports hard falsifiers:

Do NOT edit evidence to remove them.

Classify each one:
- provider/transport;
- deterministic validator;
- GPT Generator;
- evaluator candidate;
- binding;
- source-contract conflict.

Reenter only that owner.

If it is a technical implementation defect under A08/A09 authority, repair it, rerun focal QA, and rerun P3.

If fixing it would require promoted semantic change, stop with the exact institutional stop condition.

If P3 concludes:

`EVIDENCE_READY_FOR_A10_AUTHORITY_DETERMINATION`

then the wrapper will run A10.

---

# 6. A10 boundary

A10 may produce:

`READY_FOR_CENTER_AUTHORITY_DECISION`

It may NOT:
- promote itself;
- update live `evaluator_authority`;
- enable automatic admission;
- expand B2 evaluator scope;
- turn its own live findings into authority.

This is deliberate. The Centre will decide the authority successor from the frozen P3 evidence without another reconstruction cycle.

Expected frozen file:

`pr3/evidence/A10_PR3_EVALUATOR_AUTHORITY_DECISION_INPUT_v1_0.json`

---

# 7. Freeze and commit evidence

Whether P3 passes or fails, preserve the exact material evidence.

Run secret scan over the frozen evidence before commit. It must contain no:
- VERCEL_OIDC_TOKEN;
- AI_GATEWAY_API_KEY;
- database password;
- Supabase secret/service-role key;
- session token.

Then:

```bash
git add pr3/evidence
git status --short
git commit -m "Freeze PR3 P3 real-model qualification evidence"
git push origin pr3-pilot
```

If there is no evidence file, do not create a fake receipt.

---

# 8. Final report

Return only material execution facts:

- SOURCE_HEAD_TESTED
- SOURCE_QA_RESULT
- VERCEL_IDENTITY_RESULT
- OIDC_ACQUISITION_RESULT (boolean/source only; never token)
- GENERATOR_PROVIDER
- GENERATOR_MODEL_OBSERVED
- EVALUATOR_MODEL_OBSERVED
- B0_CASES_EXECUTED
- B0_ROUTING_CASES_EXECUTED
- B2_CASES_EXECUTED
- B2_DETERMINISTIC_ZERO_CALL_RESULT
- REFERENCE_BANK_AGREEMENT
- HARD_FALSIFIERS
- P3_EVIDENCE_SHA256
- P3_DETERMINATION
- A10_DETERMINATION
- FROZEN_EVIDENCE_COMMIT
- ONLY_REMAINING_BLOCKER, if any

And concise institutional proof:

- RECTORES_RECORRIDOS
- PREGUNTA_SISTEMICA
- POSICION_RECURSIVA
- EVIDENCIA_MATERIAL
- VARIEDAD_RIESGO
- OBSERVADOR_AUTORIDAD
- DEPENDENCIAS
- OWNER
- FALSADOR
- IMPACTO
- DETERMINACION
- REENTRY_NEXT_ACTION
- CONFORMANCE_RESULT
- CONSISTENCY_RESULT
- INDEPENDENT_DETERMINATIONS_PRESERVED
- AFFECTED_DETERMINATIONS_REENTERED

Do not turn these labels into a checklist that manufactures PASS.

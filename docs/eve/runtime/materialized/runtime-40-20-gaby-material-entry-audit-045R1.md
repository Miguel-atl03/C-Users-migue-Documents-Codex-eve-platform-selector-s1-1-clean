# Runtime 40/20 - Gaby material boundary audit 045-R1

## Scope

This audit used only the live checkout. No staging or production database was contacted. No code, SQL, migrations, B0, B1, Gaby sessions, runs or responses were modified.

## Material entry found

Gaby currently enters through `src/app/page.tsx`. The first authenticated material context call is:

- `src/app/page.tsx:600-640` -> `GET /api/participant/context`
- `src/app/api/participant/context/route.ts:9-14` -> `resolveAuthenticatedParticipantContext`
- `src/lib/participant-context.ts:114-275` -> resolves user, company, case, participant, position and functional profiles.

The first runtime-related material boundary is not a Runtime 40/20 question endpoint. It is:

- `src/app/page.tsx:1054` -> `POST /api/participant/workmap/finalize`
- `src/app/api/participant/workmap/finalize/route.ts:177-229` -> creates or reads `role_runtime_session`
- `src/app/api/participant/workmap/finalize/route.ts:320-383` -> creates or reads `activity_runtime_run`
- `src/app/api/participant/workmap/finalize/route.ts:421-527` -> returns `roleRuntimeSessionId`, `activityRuntimeRunId`, `activityId` and next flow state.

## Current question and answer flow

The live question UI is still the scene runner path:

| Layer | File | Evidence | Current role |
| --- | --- | --- | --- |
| Question render | `src/components/SceneQuestionnaireRunner.tsx` | lines 11-19, 42, 281-291, 354-413 | Renders from `runtimeQuestionCatalog` / `capa1-runtime-manifest` |
| Scene bootstrap | `src/app/api/scenes/bootstrap/route.ts` | lines 38-48 | Creates scene registry from legacy activities |
| Scene persistence | `src/app/api/scenes/answers/route.ts` | lines 17-70 | Receives scene answers |
| Scene repository | `src/services/scene-repository.ts` | lines 170-274 | Writes `scene_question_answers` and `scene_answer_provenance` |

The only live call from `src/app/page.tsx` into `/api/eve/runtime-40-20/client-bff/*` is the workmap experience-event telemetry route:

- `src/app/page.tsx:721-763`
- `src/app/api/eve/runtime-40-20/client-bff/experience-event/route.ts:32-144`

No live UI caller was found for `/state`, `/session`, `/interaction`, `/answer` or `/review`.

## Identity chain

Material identities present:

| Identity | Material status | Evidence |
| --- | --- | --- |
| `auth_user_id` | present | `participant-context.ts:117-124`, `workmap/finalize/route.ts:388-396` |
| `eve_user_id` | present | `participant-context.ts:124-151` |
| `case_id` | present | `participant-context.ts:153-180`, `page.tsx:610-628` |
| `case_participant_id` | present | `participant-context.ts:258-261` |
| `case_participant_profile_id` | present | `participant-context.ts:193-199`, `workmap/finalize/route.ts:515` |
| `role_runtime_session_id` | present after workmap finalize | `workmap/finalize/route.ts:177-229`, `:517` |
| `activity_runtime_run_id` | present after workmap finalize | `workmap/finalize/route.ts:320-383`, `:518` |
| `activity_id` | present | `workmap/finalize/route.ts:519`, `SceneQuestionnaireRunner.tsx:250` |
| `scene_id` | present, scene-domain identity | `SceneQuestionnaireRunner.tsx:251` |
| `runtime_interaction_id` | gap in live scene submit | `SceneQuestionnaireRunner.tsx:244-260` |
| `tenant_id` | backend-present in runtime row, not carried by scene submit | `workmap/finalize/route.ts:48-50`, `page.tsx:1977-2009` |

## Client BFF audit

The BFF inventory exists in `src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-types.ts:243-284`.

The focal guard test was executed:

```text
node --test src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff.test.mjs
```

Result:

```text
38 passed, 1 failed
Failing control: Import guard: BFF source files contain no forbidden imports.
Failure: forbidden Supabase import in src/app/api/eve/runtime-40-20/client-bff/answer/route.ts
```

Classification: `security_boundary_violation_confirmed`.

## Coupling candidates

| Candidate | Classification | Why |
| --- | --- | --- |
| `POST /api/participant/workmap/finalize` | natural existing boundary for runtime session/run creation | Already resolves participant authority and materializes `role_runtime_session` + `activity_runtime_run`. |
| `POST /api/scenes/bootstrap` | natural existing boundary for current question preparation | It prepares scenes, but from legacy activities, not Runtime 40/20 catalog. |
| `POST /api/scenes/answers` | natural existing boundary for current answer persistence | It is the live submit path, but persists scene answers, not Runtime interaction answers. |
| `/api/eve/runtime-40-20/client-bff/answer` | candidate runtime boundary not live and guard failing | It has Runtime scope and local adapter hook, but is not called by Gaby and fails import guard. |
| `/api/eve/runtime-40-20/client-bff/experience-event` | real telemetry boundary only | Called from workmap telemetry; not a question or answer boundary. |
| `/api/questionnaire/submit` | legacy path / wrong layer for Runtime 40/20 | Uses `FULL_V03:*` and `MISSION:*` rows. |
| `/api/eve/runtime-40-20/governed-execution/advance` | synthetic/test boundary | Exercised by 044 scripts/tests, not by Gaby live entry. |

## Contract gap

The BFF Runtime scope requires `tenant_id`, `case_id`, `correlation_id`, and for interaction/answer it also requires `role_id`, `activity_id`, `run_id`; answer also requires `idempotency_key` (`runtime-40-20-client-bff-service.ts:54-118`).

The live scene answer path carries `sessionId`, `sceneId` and answers (`page.tsx:1977-2009`). It does not carry the complete Runtime 40/20 BFF scope, does not provide `runtime_interaction_id`, and does not carry `catalog_version_id` through answer ingest.

## Final classification

`existing_real_boundary_partial_contract_gap`

## Next gap

`gaby_runtime_bff_scope_and_security_contract_required`

## Security

```text
staging consulted: no
production consulted: no
remote writes: none
code modified: no
SQL modified: no
Gaby modified: no
Runtime modified: no
B0 modified: no
B1 modified: no
Gaby sessions modified: no
runs modified: no
responses modified: no
commit created: no
```

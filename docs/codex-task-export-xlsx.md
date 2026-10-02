# Sprint Brief — EXPORT_ACTIVITY_COLLECTION_XLSX

## Objective
Implement a new EVE feature that generates an Excel export reconstructing a completed lifting session into a workbook that is almost identical in structure and semantics to the original collection instrument:

`Herramienta de Actividades EVE FULL - V04.xlsx`

This export is not a new report format and not a summary artifact.  
It is a template-based reconstruction of the real session, populated from Supabase by `sessionId`, preserving auditability, provenance, and downstream diagnostic usefulness.

---

## Product framing
EVE is a structured diagnostic capture system.  
The export must preserve the semantic logic of the original activity collection instrument and remain useful for consultant review and later final-deliverable construction.

The implementation must follow repository rules defined in `agent.md`.

---

## Existing platform context

### Stack
- Frontend: Next.js
- Database: Supabase
- Language: TypeScript

### Sessions
- Every lifting process starts with a real persisted session
- Data is stored by `sessionId`
- Sessions can be resumed
- Session state is the authoritative basis for export reconstruction

### Current operational states
- `intake_main_activities`
- `questionnaire_main`
- `closure_check`
- `support_activity_selected_internal`
- `support_activity_questionnaire`
- `closure_recheck`
- `micro_clarification`
- `intake_completed`

### Existing internal engines
- activity ranking
- mission inference
- diagnostic engine
- consistency engine
- support sub-engine
- global closure engine

### Important product rule
The user no longer decides:
- which activities are main
- which support activity to add
- when to close
- whether contradictions are severe
- whether support is missing

That logic is already internal and must be preserved.

---

## Sprint scope
Build the feature:

`EXPORT_ACTIVITY_COLLECTION_XLSX`

The feature must:
1. reconstruct exportable session data by `sessionId`;
2. inspect and reuse the real Excel template whenever feasible;
3. populate the workbook with captured, inferred, clarified, and closure-level data;
4. preserve semantic fidelity to the original instrument;
5. expose provenance and traceability conservatively;
6. allow file download from the platform when the session is complete.

---

## Business outcome
At the end of a completed lifting session, EVE should produce an Excel file that:
- looks and behaves almost like the original collection workbook;
- is filled with the real session data;
- allows response-by-response audit;
- can be manually reviewed and complemented if needed;
- serves as direct input for the consultant’s downstream final deliverable.

---

## Non-goals
Do not implement:
- a CSV export as substitute;
- a JSON export as substitute;
- a PDF report as substitute;
- a brand new report layout;
- any fabricated values for missing fields.

---

## Required implementation phases

## Phase 1 — Repository inspection
Inspect the actual codebase and identify:

### Data model
- where sessions are stored
- where activities are stored
- how main activities are identified
- how support activities are identified
- where questionnaire answers are stored
- where inferred mission lives
- where diagnostic outputs live
- where consistency alerts live
- where micro-clarifications live
- where closure status and traceability live

### Application architecture
- current Supabase access layer
- existing services and utilities
- route/API/server action patterns
- any existing export/file generation logic
- where intake completion is handled in UI

### Template structure
Inspect `Herramienta de Actividades EVE FULL - V04.xlsx` and document:
- sheet names
- sheet purpose
- section structure
- repeated blocks
- row/column semantics
- possible insertion points
- where complementary sheets may be needed

---

## Phase 2 — Exact field mapping
Create an explicit mapping artifact between:
- source session data
- transformation or inference logic
- destination workbook sheet/section/field

Base this on:
- `agent.md`
- `docs/export-field-mapping.md`
- real repository structures
- real workbook layout

Expected artifact examples:
- `activityExportTemplateMap.ts`
- `activity-export-mapping.json`

This mapping must be explicit and inspectable.  
Avoid opaque hardcoded placement logic.

---

## Phase 3 — Session consolidation layer
Implement a clean consolidation layer that reconstructs all exportable data for one `sessionId`.

Expected output types should be close to:
- `SessionExportPayload`
- `ActivityExportRow`
- `QuestionnaireAnswerMap`
- `ConsistencyTrace`
- `ExportProvenance`

This consolidation layer must merge:
- main activity responses
- support activity responses
- clarification responses
- inferred values
- closure metadata
- traceability metadata

The consolidation output should be deterministic and reproducible.

---

## Phase 4 — Workbook generation
Implement the Excel export using the real template whenever feasible.

Requirements:
- preserve workbook structure;
- preserve sheet names;
- preserve semantic grouping;
- populate the correct locations with consolidated data;
- leave missing fields empty or use a consistent explicit marker only if feature policy requires it;
- avoid deforming the main instrument;
- add conservative complementary sheets only when needed.

Suggested complementary sheets if necessary:
- `TRAZABILIDAD`
- `CONSISTENCIA`
- `PROVENIENCIA`
- `RESUMEN_SESION`

These must be added only when the original workbook has no natural place for such information.

---

## Phase 5 — Delivery path
Add a usable path for export generation and download.

Expected implementation components:
- backend export function, e.g. `exportActivityCollectionXlsx(sessionId)`
- API route or server action
- UI trigger/button for download
- availability when session reaches `intake_completed`
- proper filename generation
- error handling and logging

Integrate using the repository’s existing conventions.

---

## Phase 6 — Validation
Validate the feature with a real or test `sessionId`.

At minimum verify:
- workbook opens correctly;
- template structure is preserved;
- main activities appear correctly;
- support activities appear correctly;
- questionnaire answers land in the right semantic sections;
- inferred values are preserved without being confused with direct user answers;
- consistency and clarification traces are not lost;
- missing values are not fabricated;
- export is usable by a consultant.

---

## Required export content

### A. Session header / metadata
Include, when available:
- `sessionId`
- export timestamp
- session closure status
- closure quality
- number of support iterations
- basic traceability summary

### B. Activities
Include:
- all relevant activities
- marker for main vs support
- ranking/order if available
- per-activity closure status if available

### C. Questionnaire reconstruction
Populate all corresponding template sections with relevant session answers, including where applicable:
- activity description
- mission / functional purpose
- expected result
- destination / receiver
- upstream dependency
- object or document worked on
- object initial state
- object final state
- validation
- escalation
- coordination
- sequence
- waits
- workaround
- distance from official process
- missing information
- precautions / alerts
- clarifications
- other template-native fields

### D. Internal EVE outputs
Preserve, without deforming the workbook:
- inferred mission
- diagnostic signals by activity
- relevant dependencies
- detected tensions
- detected sacrifices
- VSM summary
- MMABP summary
- AHE summary
- consistency alerts
- residual gaps
- closure traceability

### E. Provenance and traceability
If the original workbook has no safe native place, use complementary sheets to preserve:
- source stage of the value
- source timestamps
- whether the value came from:
  - main questionnaire
  - support questionnaire
  - clarification
  - inference
  - closure metadata
- contradiction or alert trace

---

## Constraints
Follow these rules:
- Supabase is the source of truth
- export must be reproducible by `sessionId`
- do not fabricate content
- preserve semantic fidelity to the original instrument
- distinguish provenance when feasible
- prefer explicit mapping over hidden logic
- preserve consultant usefulness over cosmetic simplification

---

## Deliverables expected in this sprint
1. Functional code
2. Explicit mapping artifact
3. Session consolidation layer
4. Workbook population logic
5. Export function
6. API route or server action
7. UI trigger for download
8. Basic logging/error handling
9. Brief technical note describing:
   - fields mapped directly
   - fields inferred
   - fields that may remain blank
   - assumptions made

---

## Acceptance criteria
This sprint is complete only if:
- the export uses the real template or a faithful template-based strategy;
- the resulting workbook remains very close to the original collection instrument;
- session data is placed in the correct semantic locations;
- provenance is preserved when feasible;
- output is reproducible from `sessionId`;
- no missing data is fabricated;
- the workbook is useful for consultant review and downstream final deliverable construction.

---

## Work sequence instruction
Proceed in this order:
1. inspect repository and template;
2. define exact mapping;
3. implement consolidation;
4. implement workbook generation;
5. implement delivery path;
6. validate with real or test session;
7. summarize assumptions and gaps.

If there is ambiguity between the current data model and the Excel template:
- resolve it explicitly;
- choose the most conservative interpretation;
- document the assumption;
- prioritize traceability and fidelity over convenience.
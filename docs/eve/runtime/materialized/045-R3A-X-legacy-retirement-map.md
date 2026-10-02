# 045-R3A-X — Legacy retirement map

Sequence: **FREEZE → EXTRACT/PORT → REDIRECT → TEST → DELETE**

## X1 deletions (safe)

- `ClientAuthScreen.tsx`
- `ActiveAssessmentState.tsx`

## Retained

- `EmptyAssessmentState.tsx` — still used by `/dev/e2e-block0`
- auth/session/bootstrap/StartPositionContext services (`still_required_non_UI`)

WorkMap / Significado / questionnaire UIs remain until X2–X5.


## X3

Production Significado/B0 redirected to official canvas. SignificadoDeTuTrabajo retained as thin re-export. B0→FULL handoff blocker documented; no invented bridge.

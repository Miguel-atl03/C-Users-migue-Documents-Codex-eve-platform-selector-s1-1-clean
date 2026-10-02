# 045-R3A-X — Canvas official route plan

## Today
- Official entry: `/` via `page.tsx`
- `/dev/lienzo-eve` is **not** a live productive route (freeze only)

## Target
- `/` → `OfficialCanvasExperience` continuous sheet as **the** E2E container
- Reuse auth/session/WorkMap finalize/Runtime BFF behind canvas sections
- Runtime unlocks B0.5–B7; canvas does not hardcode block order
- After promotion: `/dev/lienzo-eve` → remove or redirect_to_official

## Phases
1. **X0** framework (this instruction) — done
2. **X1** LOGIN + ESTADO_A with real auth/session
3. **X2** WORKMAP presentation + retain services
4. **X3** SIGNIFICADO/B0 + retain coach
5. **X4** B05–B7 block shells from Runtime
6. **X5** READINESS + single UI + DELETE legacy UI

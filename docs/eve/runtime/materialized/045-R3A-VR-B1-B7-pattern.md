# 045-R3A-VR — B1–B7 pattern

Instruction: 045-R3A-V-R  
Gate: 7

Each block-specific section must satisfy:

1. Renderer emits InteractionViewModel.
2. Runtime determines that interaction is visible.
3. Lienzo selects/renders the corresponding authorized section.
4. Every control preserves server-issued `slot_ref`.
5. UI captures only the human value.
6. BFF returns `slot_ref` + value.
7. Server resolves semantics.
8. Runtime decides the next interaction.
9. Lienzo unlocks the next section **only** from Runtime state — never local causal flags.

## Forbidden

- Lienzo deciding causality / branching / next block order
- Generic universal form replacing block shells as definitive product UI
- Using assistance output as semantic authority

## Assistance rule (Gate 8)

Assistance may suggest/structure/help draft.  
Assistance must **not** decide: source_node, canonical variable, branch, confidence, readiness.

Confirmed user answer retains: `slot_ref`, human answer, server-side provenance.

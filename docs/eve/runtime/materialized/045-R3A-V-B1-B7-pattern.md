# 045-R3A-V — Patrón reutilizable B1–B7 (Gate 7)

Instruction: 045-R3A-V (superseded for conformance by **045-R3A-V-R**)  
Canonical update: `045-R3A-VR-B1-B7-pattern.md`

## Pattern (VR-corrected)

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

- Lienzo deciding causality / branching / next block order (`B0.5 → B1 → B2…`)
- Generic universal form replacing block shells as definitive product UI
- Using assistance output as semantic authority
- Reintroducing `runtimeQuestionCatalog.blocks` as productive navigator while Runtime FULL is enabled
- Copying clean-clone `page.tsx` / runners over C312

## Assistance rule

Assistance may suggest/structure/help draft.  
Assistance must **not** decide: source_node, canonical variable, branch, confidence, readiness.

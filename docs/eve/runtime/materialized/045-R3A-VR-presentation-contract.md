# 045-R3A-VR — presentation contract

Instruction: 045-R3A-V-R  
Gate: 4–5

## Principle

`RuntimeInteractionSheet` is an **adapter / development fallback**, not the definitive universal form for B0.5–B7.

Block-specific shells remain the target presentation architecture.

## Authorized metadata only

Consumed when present on server ViewModel:

- `ui_component`
- `help_text`
- `block`
- `choice_view.options` → `presentation_mode = authorized_choice`
- `subfields[]` → slots with explicit `slot_ref`

## Not invented

No deduction of presentation from question wording:

- no “Sí/No” → boolean
- no list-looking text → select
- no number-looking label → numeric

## Modes

| Mode | When |
|---|---|
| `authorized_choice` | Renderer provided `choice_view.options` |
| `fallback_textarea` | No richer authorized presentation metadata |

## Target architecture

```
InteractionViewModel
→ resolve authorized block-specific section (when available)
→ controls keep slot_ref
→ human value only
→ BFF answer
→ Runtime decides next
```

`generic_shell_imposed = false`
`presentation_contract_ready = true`

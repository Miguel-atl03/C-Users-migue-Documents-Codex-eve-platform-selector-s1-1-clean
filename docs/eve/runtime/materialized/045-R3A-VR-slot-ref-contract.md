# 045-R3A-VR — slot_ref contract

Instruction: 045-R3A-V-R  
Gate: 3

## Separation

| Field | Role |
|---|---|
| `slot_ref` | Opaque server-issued identity returned on answer |
| `name` | Technical name from Renderer `subfields[].name` |
| `label` | Visible text only — never identity |
| `required` | Validation flag |
| `type` | Optional Renderer type metadata |

## Material authority (no invention)

Current Renderer `RuntimeSubfieldViewModel` issues identity as `name`.

UI mapping rule:

`slot_ref = subfields[].name` (literal)

Answer payload:

`{ slot_ref, value }` where `slot_ref` is that literal.

## Forbidden

- `slot_ref == label`
- `slot_ref == array index`
- `slot_ref == question text`
- inventing ids client-side

## Block classification

If `subfields` missing/empty or any `subfields[].name` missing:

`blocked_runtime_slot_ref_contract`

Handled by `mapServerViewModelToPresentation`.

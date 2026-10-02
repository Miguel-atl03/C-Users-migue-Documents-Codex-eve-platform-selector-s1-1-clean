# UI-B05 — Runtime binding readiness (structure only)

Prepared for a **later** binding task. Not connected in UI-B05-R.

| Concern | Status |
|---|---|
| Presentational fields / subfields | `B05SlotPresentation` via `field_key` |
| Options | `options[]` on slot |
| Help | `help_text` |
| Required | `required` |
| External value / answers | `Record<field_key, B05SlotAnswer>` |
| Callbacks | `onChange(field_key, patch)`, `onContinue` |
| slot_ref real | **false** |
| runtime_interaction_id real | **false** |
| interaction_instance_id | **false** |
| branching / next | **false** (`local_sequence_authority = false`) |

Neutral keys use Madre `source_code` as `field_key`. Future mapper: `field_key → server slot_ref`.

# Runtime 40/20 - F5/F6 prerequisite audit 045-R2D

Final classification: `f5_binding_partial_blocks_f6`

`blocked_runtime_outbox_materiality` is caused by partial F5 materiality. F6 productive outbox is also absent, but the decisive prerequisite is that the checkout does not yet provide governed Runtime-to-scene identity.

| Gate | Result | Blocker |
| --- | --- | --- |
| F5 materiality | partial | Local in-memory binding only; no real `runtime_object_binding` or `object_materialization_event`. |
| Scene objects | partial | Objects exist as local definitions, not authoritative scene binding. |
| scene_id authority | absent / ambiguous | No source maps Runtime run/activity to scene identity. |
| F6 materiality | absent / specification_only | No productive `runtime_event_outbox`, writer, reader, worker, replay, or snapshot. |
| F5 -> F6 | blocked | Outbox cannot safely project to scene without governed binding or resolver. |

## Answers

- F6 needs `runtime_object_binding` or an equivalent governed resolver for target/consumer/scene.
- That binding exists only as partial local F5C readiness, not as a persisted authority.
- Emitting without `scene_id` and resolving later is not proven by current materiality.
- `scene_id` must not be equated with `activity_id`, `run_id`, or `session_id`.

## Verification

- F5C focal test passed: 10/10.
- DDL search found no creation of requested F5/F6 productive tables in migrations.
- Remote contact: none.

## Security

```text
code changes: none
SQL created: none
migrations created: none
BFF changes: none
SceneQuestionnaireRunner changes: none
Runtime changes: none
staging consulted: no
staging writes: none
production consulted: no
remote writes: none
commit created: no
```

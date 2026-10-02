# Runtime 40/20 F5 Schema Conformance 045-R2E-A

The active operational checkout has no deployed F5 persistent tables. The candidate schema preserves the five F5 organs: `eve_object_inventory_version`, `eve_object_definition`, `eve_object_state_definition`, `runtime_object_binding` and `object_materialization_event`.

Adaptation: authenticated read policies only; no client write policy; `scene_id` is nullable and paired with `scene_binding_status`.

-- LOCAL F5 CURRENT-RUNTIME ADAPTER CANDIDATE
-- NOT APPROVED FOR STAGING OR PRODUCTION
-- Historical source:
-- sql/migrations/2026-06-04-phase5a-object-inventory-base.sql
-- SHA-256: 34dd0cc62795d9193bb9c1e623d967cb34b4683cd2633171e5d2e10faa760cc8
-- Adaptation reason:
-- Preserve F5A/F5C materiality while removing authenticated write policies and
-- allowing pre-scene bindings without inventing scene_id.

CREATE TABLE IF NOT EXISTS public.eve_object_inventory_version (
  inventory_version_id TEXT PRIMARY KEY,
  version_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  source_xlsx_filename TEXT NOT NULL,
  source_xlsx_checksum TEXT NOT NULL,
  traceability_matrix_path TEXT NOT NULL,
  fixture_xlsx_path TEXT NOT NULL,
  fixture_matrix_path TEXT NOT NULL,
  object_count INTEGER NOT NULL DEFAULT 0,
  state_count INTEGER NOT NULL DEFAULT 0,
  immediate_materialization_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK (status IN ('draft','loaded','active','superseded','archived')),
  CHECK (object_count >= 0),
  CHECK (state_count >= 0),
  CHECK (immediate_materialization_count >= 0),
  CHECK (source_xlsx_checksum ~ '^[a-f0-9]{64}$')
);

CREATE TABLE IF NOT EXISTS public.eve_object_definition (
  object_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_version_id TEXT NOT NULL REFERENCES public.eve_object_inventory_version(inventory_version_id) ON DELETE CASCADE,
  object_code TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  family TEXT,
  ontological_type TEXT,
  eve_layer TEXT,
  recursion_scope TEXT,
  materialization_mode TEXT NOT NULL,
  materialization_phase TEXT NOT NULL,
  classification_fase5 TEXT,
  deferral_reason TEXT,
  parent_object_code TEXT,
  authority_profile TEXT,
  contamination_risk TEXT NOT NULL,
  allowed_consumers_default TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  blocks_handoff_default BOOLEAN NOT NULL DEFAULT false,
  control_plane_observable BOOLEAN NOT NULL DEFAULT false,
  summary_ready_for_control_plane BOOLEAN NOT NULL DEFAULT false,
  object_state_snapshot_candidate BOOLEAN NOT NULL DEFAULT false,
  mutation_policy TEXT,
  b3_b7_impact_level TEXT,
  b3_b7_routes TEXT,
  source_inventory_version TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source_row_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inventory_version_id, object_code)
);

CREATE TABLE IF NOT EXISTS public.eve_object_state_definition (
  object_state_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_version_id TEXT NOT NULL,
  object_code TEXT NOT NULL,
  state_name TEXT NOT NULL,
  state_kind TEXT NOT NULL,
  is_initial BOOLEAN NOT NULL DEFAULT false,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  allows_handoff BOOLEAN NOT NULL DEFAULT false,
  allows_export BOOLEAN NOT NULL DEFAULT false,
  requires_review BOOLEAN NOT NULL DEFAULT false,
  blocks_handoff_default BOOLEAN NOT NULL DEFAULT false,
  allowed_consumers TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  source_state_text TEXT,
  source_inventory_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inventory_version_id, object_code, state_name),
  FOREIGN KEY (inventory_version_id, object_code)
    REFERENCES public.eve_object_definition(inventory_version_id, object_code)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.runtime_object_binding (
  binding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_version_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  session_id TEXT,
  scene_id UUID,
  scene_binding_status TEXT NOT NULL DEFAULT 'unresolved_not_required_yet',
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_field TEXT,
  source_route_id TEXT,
  source_block TEXT,
  object_definition_id UUID NOT NULL REFERENCES public.eve_object_definition(object_definition_id) ON DELETE RESTRICT,
  object_state_definition_id UUID NOT NULL REFERENCES public.eve_object_state_definition(object_state_definition_id) ON DELETE RESTRICT,
  object_code TEXT NOT NULL,
  binding_status TEXT NOT NULL DEFAULT 'pending',
  binding_authority TEXT NOT NULL,
  binding_confidence NUMERIC(5,2),
  blocks_handoff BOOLEAN NOT NULL DEFAULT false,
  allowed_consumers TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  contamination_risk TEXT NOT NULL,
  affected_gate TEXT,
  reason TEXT,
  deferred_to_phase TEXT,
  control_plane_observable BOOLEAN NOT NULL DEFAULT false,
  summary_ready_for_control_plane BOOLEAN NOT NULL DEFAULT false,
  object_state_snapshot_candidate JSONB NOT NULL DEFAULT '{}'::jsonb,
  projected_to_mba BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inventory_version_id, source_table, source_id, object_code),
  FOREIGN KEY (inventory_version_id, object_code)
    REFERENCES public.eve_object_definition(inventory_version_id, object_code)
    ON DELETE RESTRICT,
  CHECK (scene_binding_status IN ('resolved_existing_scene','unresolved_not_required_yet')),
  CHECK (binding_status IN ('pending','materialized','blocked','requires_review','deferred','not_applicable')),
  CHECK (binding_confidence IS NULL OR (binding_confidence >= 0 AND binding_confidence <= 1)),
  CHECK (projected_to_mba = false)
);

CREATE TABLE IF NOT EXISTS public.object_materialization_event (
  materialization_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binding_id UUID NOT NULL REFERENCES public.runtime_object_binding(binding_id) ON DELETE RESTRICT,
  inventory_version_id TEXT NOT NULL,
  object_definition_id UUID NOT NULL REFERENCES public.eve_object_definition(object_definition_id) ON DELETE RESTRICT,
  object_state_definition_id UUID NOT NULL REFERENCES public.eve_object_state_definition(object_state_definition_id) ON DELETE RESTRICT,
  object_code TEXT NOT NULL,
  run_id TEXT NOT NULL,
  session_id TEXT,
  scene_id UUID,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'materialized',
  previous_state TEXT,
  new_state TEXT NOT NULL,
  materialized_by TEXT NOT NULL,
  authority_ref TEXT NOT NULL,
  snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  control_plane_observable BOOLEAN NOT NULL DEFAULT false,
  summary_ready_for_control_plane BOOLEAN NOT NULL DEFAULT false,
  mutation_policy TEXT,
  event_hash TEXT NOT NULL,
  projected_to_mba BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (binding_id, event_type, new_state, event_hash),
  CHECK (event_type = 'materialized'),
  CHECK (projected_to_mba = false)
);

ALTER TABLE public.eve_object_inventory_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eve_object_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eve_object_state_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_object_binding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_materialization_event ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eve_object_inventory_read_authenticated ON public.eve_object_inventory_version;
CREATE POLICY eve_object_inventory_read_authenticated
  ON public.eve_object_inventory_version
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS eve_object_definition_read_authenticated ON public.eve_object_definition;
CREATE POLICY eve_object_definition_read_authenticated
  ON public.eve_object_definition
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS eve_object_state_definition_read_authenticated ON public.eve_object_state_definition;
CREATE POLICY eve_object_state_definition_read_authenticated
  ON public.eve_object_state_definition
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS runtime_object_binding_read_authenticated ON public.runtime_object_binding;
CREATE POLICY runtime_object_binding_read_authenticated
  ON public.runtime_object_binding
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS object_materialization_event_read_authenticated ON public.object_materialization_event;
CREATE POLICY object_materialization_event_read_authenticated
  ON public.object_materialization_event
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS eve_object_definition_inventory_idx
  ON public.eve_object_definition (inventory_version_id, object_code);

CREATE INDEX IF NOT EXISTS eve_object_state_definition_inventory_idx
  ON public.eve_object_state_definition (inventory_version_id, object_code, state_name);

CREATE INDEX IF NOT EXISTS runtime_object_binding_run_idx
  ON public.runtime_object_binding (run_id, binding_status);

CREATE INDEX IF NOT EXISTS object_materialization_event_run_idx
  ON public.object_materialization_event (run_id, created_at);

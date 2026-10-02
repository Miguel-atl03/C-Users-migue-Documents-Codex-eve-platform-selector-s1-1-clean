-- LOCAL RECTOR-CONFORMANCE SCHEMA
-- NOT APPROVED FOR STAGING OR PRODUCTION

create table if not exists public.runtime_branching_rule (
  catalog_version_id text not null,
  runtime_interaction_id text not null,
  field_name text not null,
  raw_literal text not null,
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  source_column text not null,
  trace_id text not null,
  source_checksum text not null,
  created_at timestamp with time zone not null default now(),
  constraint runtime_branching_rule_pkey primary key (catalog_version_id, runtime_interaction_id, field_name),
  constraint runtime_branching_rule_catalog_version_fkey foreign key (catalog_version_id)
    references public.runtime_catalog_version (catalog_version_id) on delete cascade,
  constraint runtime_branching_rule_interaction_fkey foreign key (catalog_version_id, runtime_interaction_id)
    references public.runtime_interaction_def (catalog_version_id, runtime_interaction_id) on delete cascade,
  constraint runtime_branching_rule_source_row_positive_chk check (source_row > 0),
  constraint runtime_branching_rule_raw_literal_nonempty_chk check (length(raw_literal) > 0),
  constraint runtime_branching_rule_source_column_matches_field_chk check (source_column = field_name),
  constraint runtime_branching_rule_field_name_chk check (field_name in ('opens_nodes', 'closes_nodes'))
);

alter table public.runtime_branching_rule enable row level security;

drop policy if exists runtime_branching_rule_read_authenticated on public.runtime_branching_rule;
create policy runtime_branching_rule_read_authenticated
  on public.runtime_branching_rule
  for select
  to authenticated
  using (true);

create table if not exists public.runtime_epistemic_rule (
  catalog_version_id text not null,
  runtime_interaction_id text not null,
  field_name text not null,
  raw_literal text not null,
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  source_column text not null,
  trace_id text not null,
  source_checksum text not null,
  created_at timestamp with time zone not null default now(),
  constraint runtime_epistemic_rule_pkey primary key (catalog_version_id, runtime_interaction_id, field_name),
  constraint runtime_epistemic_rule_catalog_version_fkey foreign key (catalog_version_id)
    references public.runtime_catalog_version (catalog_version_id) on delete cascade,
  constraint runtime_epistemic_rule_interaction_fkey foreign key (catalog_version_id, runtime_interaction_id)
    references public.runtime_interaction_def (catalog_version_id, runtime_interaction_id) on delete cascade,
  constraint runtime_epistemic_rule_source_row_positive_chk check (source_row > 0),
  constraint runtime_epistemic_rule_raw_literal_nonempty_chk check (length(raw_literal) > 0),
  constraint runtime_epistemic_rule_source_column_matches_field_chk check (source_column = field_name),
  constraint runtime_epistemic_rule_field_name_chk check (field_name in ('mutual_exclusion_policy', 'free_text_weight', 'fatigue_policy', 'must_not_infer', 'confirmation_weight')),
  constraint runtime_epistemic_rule_weight_literal_chk check (field_name not in ('free_text_weight','confirmation_weight') or raw_literal in ('bajo','medio','alto'))
);

alter table public.runtime_epistemic_rule enable row level security;

drop policy if exists runtime_epistemic_rule_read_authenticated on public.runtime_epistemic_rule;
create policy runtime_epistemic_rule_read_authenticated
  on public.runtime_epistemic_rule
  for select
  to authenticated
  using (true);

create table if not exists public.runtime_variable_map (
  catalog_version_id text not null,
  runtime_interaction_id text not null,
  field_name text not null,
  raw_literal text not null,
  source_file text not null,
  source_sheet text not null,
  source_row integer not null,
  source_column text not null,
  trace_id text not null,
  source_checksum text not null,
  created_at timestamp with time zone not null default now(),
  constraint runtime_variable_map_pkey primary key (catalog_version_id, runtime_interaction_id, field_name),
  constraint runtime_variable_map_catalog_version_fkey foreign key (catalog_version_id)
    references public.runtime_catalog_version (catalog_version_id) on delete cascade,
  constraint runtime_variable_map_interaction_fkey foreign key (catalog_version_id, runtime_interaction_id)
    references public.runtime_interaction_def (catalog_version_id, runtime_interaction_id) on delete cascade,
  constraint runtime_variable_map_source_row_positive_chk check (source_row > 0),
  constraint runtime_variable_map_raw_literal_nonempty_chk check (length(raw_literal) > 0),
  constraint runtime_variable_map_source_column_matches_field_chk check (source_column = field_name),
  constraint runtime_variable_map_field_name_chk check (field_name in ('canonical_variables', 'required_variables', 'derived_variables', 'optional_variables', 'can_be_inferred_from'))
);

alter table public.runtime_variable_map enable row level security;

drop policy if exists runtime_variable_map_read_authenticated on public.runtime_variable_map;
create policy runtime_variable_map_read_authenticated
  on public.runtime_variable_map
  for select
  to authenticated
  using (true);

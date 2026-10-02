-- 045-R2F staging schema reconciliation applied to eve-staging-onboarding (shrpiwkxcdgvbqymjecx)
-- No production contact. No catalog activation. No F6.
begin;

alter table public.runtime_object_binding
  add column if not exists scene_binding_status text not null default 'unresolved_not_required_yet';

alter table public.runtime_object_binding
  drop constraint if exists runtime_object_binding_scene_binding_status_check;

alter table public.runtime_object_binding
  add constraint runtime_object_binding_scene_binding_status_check
  check (scene_binding_status in ('resolved_existing_scene', 'unresolved_not_required_yet'));

drop policy if exists runtime_object_binding_owner_modify on public.runtime_object_binding;

commit;
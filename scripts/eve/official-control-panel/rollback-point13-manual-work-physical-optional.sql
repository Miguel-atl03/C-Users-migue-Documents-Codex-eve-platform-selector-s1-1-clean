-- OPTIONAL physical retirement — NOT the default production rollback.
-- Requires verified backup, explicit confirmation, and restore drill.

-- drop function if exists public.eve_apply_manual_work_transition(...);
-- drop table if exists public.manual_process_work_item_event;
-- drop table if exists public.manual_process_work_item;
-- drop table if exists public.manual_work_allowed_transition;
-- drop table if exists public.manual_work_event_type;

select 'point13_physical_drop_disabled_use_runbook' as status;

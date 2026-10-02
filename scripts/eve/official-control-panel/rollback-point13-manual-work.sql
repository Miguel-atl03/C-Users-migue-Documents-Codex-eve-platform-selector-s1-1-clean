-- Rollback §13 Ola 1 manual process tracking (local/dev only).
-- Order: drop function → drop tables → drop helper trigger fn.

drop function if exists public.eve_apply_manual_work_transition(
  uuid, text, text, text, text, text, text, timestamptz, text, text
);

drop trigger if exists trg_manual_work_event_assert_case_company
  on public.manual_process_work_item_event;
drop trigger if exists trg_manual_work_assert_case_company
  on public.manual_process_work_item;

drop function if exists public.eve_manual_work_assert_case_company();

drop table if exists public.manual_process_work_item_event;
drop table if exists public.manual_process_work_item;

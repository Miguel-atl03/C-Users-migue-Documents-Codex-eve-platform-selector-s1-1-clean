-- R4 operational rollback: disable new authenticated write entries while
-- preserving every product row, ledger and audit record for investigation.
begin;

revoke execute on function public.eve_publish_canonical_activity_selection_as_consultant(
  uuid, uuid, uuid, uuid, integer, integer, text, jsonb, text, text
) from authenticated;

revoke execute on function public.eve_apply_parallel_finding_transition_as_consultant(
  uuid, uuid, text, text, text, text, text, text, text, text, text
) from authenticated;

revoke execute on function public.eve_attempt_parallel_export_as_consultant(
  uuid, uuid, text
) from authenticated;

revoke execute on function public.eve_close_core_without_sufficiency_as_consultant(
  uuid, text, text
) from authenticated;

commit;

-- Intentionally do not DROP/TRUNCATE/UPDATE history. Roll forward by applying
-- the canonical migrations again after the incident is resolved.

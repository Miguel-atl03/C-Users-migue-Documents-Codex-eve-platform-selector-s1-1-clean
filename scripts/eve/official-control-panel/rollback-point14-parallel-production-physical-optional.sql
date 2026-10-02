-- OPTIONAL physical retirement only after verified backup + explicit confirmation.
-- NOT the default production rollback.
-- Do not DROP tables here without runbook approval.
select 'point14_physical_retirement_requires_explicit_runbook' as notice;

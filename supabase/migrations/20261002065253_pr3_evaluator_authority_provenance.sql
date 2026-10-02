alter table eve_pr3.evaluator_authority add column if not exists qualification_basis_ref text;
alter table eve_pr3.evaluator_authority add column if not exists invalidation_triggers jsonb;
alter table eve_pr3.evaluator_authority add column if not exists recertification_trigger text;
alter table eve_pr3.evaluator_authority alter column qualification_basis_ref set not null;
alter table eve_pr3.evaluator_authority alter column invalidation_triggers set not null;
alter table eve_pr3.evaluator_authority alter column recertification_trigger set not null;

alter table eve_pr3.evaluator_authority add column if not exists qualification_evidence_class text;
alter table eve_pr3.evaluator_authority add column if not exists qualification_determination text;
alter table eve_pr3.evaluator_authority add column if not exists source_identity jsonb;
alter table eve_pr3.evaluator_authority add column if not exists authorized_evaluator text;

update eve_pr3.evaluator_authority
set qualification_evidence_class = coalesce(qualification_evidence_class,'REFERENCE_FIXTURE_ONLY'),
    qualification_determination = coalesce(qualification_determination,'INSUFFICIENT_EVIDENCE'),
    source_identity = coalesce(source_identity,'{"source":"B2_PROMOTED_EVALUATOR_AUTHORITY_CANDIDATE","authority_state":"candidate_only"}'::jsonb),
    authorized_evaluator = coalesce(authorized_evaluator,'NOT_AVAILABLE')
where evaluator_authority_id='EVE-B2-EVALUATOR-AUTHORITY-CANDIDATE-v0.2.1'
  and revision='0.2.1';

alter table eve_pr3.evaluator_authority alter column qualification_evidence_class set not null;
alter table eve_pr3.evaluator_authority alter column qualification_determination set not null;
alter table eve_pr3.evaluator_authority alter column source_identity set not null;
alter table eve_pr3.evaluator_authority alter column authorized_evaluator set not null;

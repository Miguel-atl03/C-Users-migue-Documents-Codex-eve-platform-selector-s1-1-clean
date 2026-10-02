# Registry Real Minimal Migration Application Verification Plan

## 1. Tables
After a separately authorized migration application, manually confirm these tables exist:
- eve_pm_registry
- eve_pf_registry
- eve_moc_registry
- eve_olc_registry
- eve_registry_audit_log
- eve_registry_authorization_log

## 2. Constraints
Confirm:
- conformance_claimed default false
- consistency_claimed default false
- check conformance_claimed=false
- check consistency_claimed=false

## 3. Columns
Confirm the registry tables and logs include:
- registry_id uuid or log UUID primary key
- created_by text not null
- authorization_ref
- local_candidate_trace_ref
- metadata jsonb

## 4. Endpoint Boundary
Confirm no new endpoints exist.

## 5. Runtime Boundary
Confirm Runtime 40/20 did not start.

## 6. Business Data Boundary
Confirm there are no real PM/PF/MoC/OLC business inserts yet.

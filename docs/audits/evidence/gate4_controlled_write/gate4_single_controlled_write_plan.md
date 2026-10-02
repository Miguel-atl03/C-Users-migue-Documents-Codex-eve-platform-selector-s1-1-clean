# Gate 4 Single Controlled Write Plan

## Dictamen
GATE_4_SINGLE_CONTROLLED_WRITE_PLAN_READY

## Selected write
SINGLE_CONTROLLED_WRITE_GATE3_CLOSEOUT_AUDIT_MARKER

## Why this write
It materializes Gate 3 closure as an audit/control marker without promoting diagnosis, registry, export or client pilot.

## Write target
local controlled evidence file unless a non-productive authorized DB target is explicitly available.

## Payload
```json
{
  "event_type": "gate3_closeout_audit_marker",
  "source_gate": "Gate 3",
  "source_dictamen": "GATE_3_RESTRICTED_INTERNAL_SUPERVISED_ACTIVATION_CLOSED_PASSED",
  "candidate_output_status": "draft",
  "s3_review_accepted": true,
  "g2_risk_001_status": "open",
  "promotion_allowed": false,
  "gate4_write_scope": "single_controlled_audit_marker",
  "created_by": "controlled_gate4_run",
  "irreversible_effect": "audit_marker_only"
}
```

## Authorization
Requires explicit Gate 4 run authorization.

## Rollback / degrade
If incorrect, create correction/void marker. Do not delete history.

## No-Go
- no diagnosis final;
- no registry final;
- no export final;
- no client pilot;
- no Fase 9;
- no multiple writes;
- no production DB.

## Pass criteria
- exactly one controlled write;
- payload matches contract;
- no side effects beyond target;
- no promotion;
- G2-RISK-001 remains visible.

## Next step
RUN_GATE_4_SINGLE_CONTROLLED_WRITE_V1

# Runtime 40/20 F5 staging binding smoke 045R2FR

Smoke id: 045R2FR-f5-pre-membrane-smoke.

| Source | Target object | Result |
| --- | --- | --- |
| evidence_item | EvidenceBundle | bound + event recorded |
| canonical_variable_record | SceneCanonicalRecord | bound + event recorded |
| readiness_gap_record | GapObject | bound + event recorded |
| readiness_decision_record | ReadinessDecision | bound + event recorded |
| structural_candidate_record | MMABPStructuralElement | skipped: no source rows in staging, no fabrication |

Idempotency retry: no duplicate binding groups and no duplicate event hashes.

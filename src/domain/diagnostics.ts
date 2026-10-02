import type { MissionInferenceResult } from "@/domain/questionnaire";
import type { ActivityStructuralScore } from "@/domain/activity";

export type DiagnosticSeverity = "info" | "warning" | "critical";

export type DiagnosticSignal = {
  code: string;
  label: string;
  value: string;
  evidence: string[];
};

export type DiagnosticFinding = {
  code: string;
  severity: DiagnosticSeverity;
  title: string;
  explanation: string;
  evidence: string[];
};

export type ConsistencyAlertLevel = "low" | "medium" | "high" | "critical";

export type ClosureQualityStatus =
  | "solid"
  | "sufficient_with_alerts"
  | "partial_requires_clarification"
  | "blocked_by_critical_contradiction";

export type ActivityClosureState =
  | "closed_solid"
  | "closed_with_consistency_alerts"
  | "partial_requires_clarification"
  | "blocked_by_critical_contradiction";

export type ConsistencyAlert = {
  code: string;
  level: ConsistencyAlertLevel;
  title: string;
  message: string;
  evidence: string[];
};

export type ConsistencyCheckResult = {
  consistency_check_status: "passed" | "warning" | "failed";
  consistency_alert_level: ConsistencyAlertLevel;
  consistency_alerts: ConsistencyAlert[];
  closure_quality_status: ClosureQualityStatus;
  activity_closure_state: ActivityClosureState;
  clarification_required: boolean;
  clarification_prompt: string | null;
  clarification_reason: string | null;
  clarification_response: string | null;
  consistency_recheck_status: "pending" | "passed" | "unresolved";
};

export type ActivityDiagnostic = {
  activityId: string;
  activityText: string;
  mission: MissionInferenceResult;
  signals: DiagnosticSignal[];
  findings: DiagnosticFinding[];
  consistency: ConsistencyCheckResult;
  closure: {
    status: "closed" | "partial" | "gap_requires_support";
    confidence: number;
    missingCapabilities: string[];
    closure_quality_status: ClosureQualityStatus;
    activity_closure_state: ActivityClosureState;
  };
};

export type RecursiveClosureGap =
  | "pm"
  | "moc"
  | "pf"
  | "olc"
  | "vsm"
  | "ahe"
  | "recursive_chain"
  | "s3"
  | "s3_star"
  | "s4"
  | "s5"
  | "algedonic_channel"
  | "ahe_interpersonal"
  | "ahe_organizational";

export type SupportActivityCandidateEvaluation = {
  support_activity: ActivityStructuralScore;
  support_activity_expected_gap_closure: RecursiveClosureGap[];
  support_activity_redundancy_score: number;
  support_activity_marginal_closure_score: number;
  support_activity_selection_reason: string;
  score_breakdown: {
    mmabp_gap_coverage_score: number;
    vsm_gap_coverage_score: number;
    ahe_gap_coverage_score: number;
    recursive_connectivity_score: number;
    anti_redundancy_score: number;
  };
  discarded_reason: string | null;
};

export type SupportActivitySelection = {
  primary_activity_id: string;
  primary_activity_text: string;
  open_gaps: RecursiveClosureGap[];
  support_activity_selected: ActivityStructuralScore | null;
  support_activity_selection_reason: string;
  support_activity_expected_gap_closure: RecursiveClosureGap[];
  support_activity_redundancy_score: number | null;
  support_activity_marginal_closure_score: number | null;
  support_activity_status: "selected" | "answered" | "validated" | "discarded";
  support_activity_iteration_number: number;
  candidates: SupportActivityCandidateEvaluation[];
};

export type SessionStatus =
  | "session_in_progress"
  | "session_closure_check"
  | "session_completed_solid"
  | "session_completed_with_alerts"
  | "session_completed_partial"
  | "session_blocked";

export type SessionClosureQuality =
  | "solid"
  | "with_alerts"
  | "partial"
  | "blocked";

export type FinalActivitySummary = {
  activityId: string;
  activityText: string;
  closureState: ActivityClosureState;
  closureQuality: ClosureQualityStatus;
  closureConfidence: number;
  missionFinal: string | null;
  consistencyAlertCount: number;
};

export type ClosureTraceItem = {
  step: string;
  status: string;
  detail: string;
  evidence: string[];
};

export type SessionFinalOutput = {
  session_status: SessionStatus;
  session_closure_quality: SessionClosureQuality;
  main_activities_used: FinalActivitySummary[];
  support_activities_used: FinalActivitySummary[];
  total_support_iterations: number;
  consistency_alerts_global: ConsistencyAlert[];
  unresolved_gaps_global: string[];
  key_dependencies: string[];
  key_tensions: string[];
  key_sacrifices: string[];
  vsm_signals_summary: Record<string, number>;
  mmabp_closure_summary: Record<string, number>;
  ahe_summary: {
    tensions_detected: number;
    sacrifices_detected: number;
    interpersonal_signals: number;
  };
  closure_trace: ClosureTraceItem[];
};

export type SessionDiagnostic = {
  sessionId: string;
  generatedAt: string;
  activityCount: number;
  summary: {
    closed: number;
    partial: number;
    gapRequiresSupport: number;
    criticalFindings: number;
    warningFindings: number;
  };
  activities: ActivityDiagnostic[];
  supportSelections?: SupportActivitySelection[];
  finalOutput?: SessionFinalOutput;
};

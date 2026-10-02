import type { ActivityDeclaredContext, WorkMapData } from "./local-work-map.ts";
import type { PreRuntimeContextBundle } from "./pre-runtime-context-bundle.v1.0.ts";
import type { PrimaryActivitySelectionResult } from "./primary-activity-selection-policy.ts";
import type { RuntimeBlock0ResponseBundle } from "./runtime-block0-response.ts";

/** Operational MBA contract version for Significado de tu trabajo (R1). */
export const SIGNIFICADO_DATA_VERSION = "SIGNIFICADO_V1" as const;

/** @deprecated R2.2 MBA alignment no longer asks the user to pick units by this mode. */
export const SIGNIFICADO_PER_ACTIVITY_THRESHOLD = 8;

export type SignificadoDataVersion = typeof SIGNIFICADO_DATA_VERSION;

export type SignificadoCaptureMode = "per_activity" | "per_responsibility";

export type SignificadoClarityValue =
  | "clear"
  | "sometimes_confusing"
  | "hard_to_place";

export type SignificadoEnergyValue =
  | "light"
  | "balanced"
  | "heavy"
  | "very_heavy_today";

export type SignificadoPriorityTarget =
  | { type: "responsibility"; responsibilityId: string }
  | { type: "all_equally" };

export type SignificadoSelectionGovernance = {
  selectionGovernance: "eve_policy_required" | "eve_policy";
  primaryActivitySelectionPolicy:
    | "not_implemented_in_r2_2"
    | "PRIMARY_ACTIVITY_SELECTION_V1_3";
  userPriorityDoesNotSelectRuntimeActivities: true;
};

/** Stable provenance for anchoring subjective capture to WorkMap units (pre-flatten). */
export type ActivityAnchorProvenance = {
  source: "work_map";
  workMapActivityId: string;
  responsibilityId: string;
  responsibilityIndex: number;
  activityIndex: number;
  declaredAreaContext: string;
  declaredResponsibilityContext: string;
};

/** Work-map activity with preserved `act-*` identity and declared context metadata. */
export type TraceableWorkMapActivity = {
  id: string;
  title: string;
  narrativeAnchor: string;
  responsibilityId: string;
  responsibilityText: string;
  responsibilityIndex: number;
  activityIndex: number;
  declaredContext: ActivityDeclaredContext;
  provenance: ActivityAnchorProvenance;
};

export type ActivityAnchorUnitKey =
  | { scope: "activity"; activityId: string }
  | { scope: "responsibility"; responsibilityId: string };

/** @deprecated Kept only to read legacy local drafts; not used for Runtime selection in R2.2. */
export type ActivityAnchorDraft = {
  unitKey: ActivityAnchorUnitKey;
  clarity?: SignificadoClarityValue;
  energy?: SignificadoEnergyValue;
  /** True once the user explicitly confirmed this unit (future UI); defaults false in R1 adapter. */
  userConfirmed: boolean;
  provenance: ActivityAnchorProvenance | ActivityAnchorProvenance[];
};

export type ActivityAnchorGapCode =
  | "work_map_not_saved"
  | "no_traceable_activities"
  /** @deprecated Not blocking in R2.2 MBA alignment. */
  | "missing_clarity"
  /** @deprecated Not blocking in R2.2 MBA alignment. */
  | "missing_energy"
  /** @deprecated Not blocking in R2.2 MBA alignment. */
  | "missing_global_priority"
  | "saved_with_warnings_not_acknowledged"
  | "unknown_unit_key"
  | "selected_activity_not_found";

export type ActivityAnchorGap = {
  code: ActivityAnchorGapCode;
  severity: "blocking" | "warning";
  message: string;
  unitKey?: ActivityAnchorUnitKey;
};

export type SignificadoWorkMapRef = {
  isSaved: true;
  savedWithWarnings: boolean;
  areaLabels: string[];
  activityCount: number;
  responsibilityCount: number;
};

/** Aggregated subjective capture bound to traceable WorkMap anchors. */
export type ActivityAnchorBundle = {
  version: SignificadoDataVersion;
  sessionId: string;
  capturedAt: string;
  selectionGovernance: SignificadoSelectionGovernance["selectionGovernance"];
  primaryActivitySelectionPolicy: SignificadoSelectionGovernance["primaryActivitySelectionPolicy"];
  userPriorityDoesNotSelectRuntimeActivities: true;
  /** @deprecated Kept for compatibility; not user-facing and not used for Runtime selection. */
  captureMode: SignificadoCaptureMode;
  workMapRef: SignificadoWorkMapRef;
  global: {
    /** @deprecated User priority is ignored for Runtime selection in R2.2. */
    priority?: SignificadoPriorityTarget;
    savedWithWarningsAcknowledged?: boolean;
  };
  /** @deprecated Legacy anchor data is retained as context only. */
  anchors: ActivityAnchorDraft[];
  /** @deprecated R2.2 does not resolve primary activity selection from Significado. */
  selectedPrimaryActivityId: string;
};

export type ActivityAnchorReadinessStatus =
  | "ready"
  | "incomplete"
  | "blocked";

/** Pre-submit readiness for Significado — operational only, no diagnosis. */
export type ActivityAnchorReadiness = {
  status: ActivityAnchorReadinessStatus;
  gaps: ActivityAnchorGap[];
  captureMode: SignificadoCaptureMode;
  canSubmit: boolean;
};

/** Block 0 answers keyed by `buildBlock0AnswerKey` (e.g. `B0-Q02`, `B0-Q01.action_verb`). */
export type SignificadoBlock0Answers = Record<string, string>;

/** Operational submit payload for Significado — excludes diagnosis / runtime outputs. */
export type SignificadoSubmitPayload = {
  version: SignificadoDataVersion;
  sessionId: string;
  submittedAt: string;
  selectionGovernance: SignificadoSelectionGovernance["selectionGovernance"];
  primaryActivitySelectionPolicy: SignificadoSelectionGovernance["primaryActivitySelectionPolicy"];
  userPriorityDoesNotSelectRuntimeActivities: true;
  primaryActivitySelectionResolvedByUser: false;
  primaryActivitySelectionResult: PrimaryActivitySelectionResult;
  /** @deprecated Kept for compatibility; not a user-controlled selection mode. */
  captureMode: SignificadoCaptureMode;
  workMapSnapshot: WorkMapData;
  bundle: ActivityAnchorBundle;
  /** @deprecated Compatibility anchor only; Runtime selection remains owned by EVE policy. */
  primaryActivity: TraceableWorkMapActivity;
  traceableActivities: TraceableWorkMapActivity[];
  readiness: ActivityAnchorReadiness;
  /** R1 boundary lock — diagnostics remain out of scope until R2+. */
  diagnosticsEnabled: false;
  /** R1 boundary lock — export remains out of scope until R2+. */
  exportEnabled: false;
  /** R1 boundary lock — transduction remains out of scope until R2+. */
  transductionEnabled: false;
  /** Runtime Block 0 answers captured in Significado before questionnaire. */
  block0Answers?: SignificadoBlock0Answers;
  /** Formal in-memory Runtime Block 0 evidence bundle produced by Significado. */
  runtimeBlock0ResponseBundle?: RuntimeBlock0ResponseBundle;
  /** Governed Estado A + WorkMap context; not confirmed Runtime evidence by itself. */
  preRuntimeContextBundle?: PreRuntimeContextBundle;
};

/** In-memory state shape for a future Significado screen (R2+). */
export type SignificadoTrabajoState = {
  workMap: WorkMapData;
  traceableActivities: TraceableWorkMapActivity[];
  captureMode: SignificadoCaptureMode;
  selectedActivityId: string | null;
  bundle: ActivityAnchorBundle | null;
  readiness: ActivityAnchorReadiness | null;
};

export type {
  WorkMapBlock0PrefillResult,
  WorkMapToBlock0PrefillInput,
} from "@/services/workmap-to-block0-prefill";

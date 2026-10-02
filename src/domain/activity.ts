export type MissionType =
  | "sales"
  | "produce"
  | "deliver"
  | "money"
  | "people"
  | "procure"
  | "control"
  | "improve"
  | "direct"
  | "unknown";

export type RolePurpose =
  | "s1_execute"
  | "s2_coordinate"
  | "s3_approve"
  | "s3_monitor"
  | "s4_design"
  | "s5_direct"
  | "unknown";

export type StructuralDimension =
  | "object"
  | "dependency"
  | "coordination"
  | "causality"
  | "vsm_regulation"
  | "ahe_tension"
  | "recursion";

export type NormalizedActivity = {
  id: string;
  rawText: string;
  operationVerb: string | null;
  businessObject: string | null;
  missionType: MissionType;
  rolePurpose: RolePurpose;
  detectedSignals: Record<StructuralDimension, string[]>;
};

export type ActivityStructuralScore = {
  activityId: string;
  rawText: string;
  totalScore: number;
  maxScore: number;
  coverageRatio: number;
  dimensionScores: Record<StructuralDimension, number>;
  detectedSignals: Record<StructuralDimension, string[]>;
  selectionRecommendation: "primary_candidate" | "support_pool";
  rationale: string[];
};

export type CanonicalActivityProfile = {
  activity_id: string;
  user_id: string;
  role_id: string;
  activity_text_raw: string;
  operation_verb: string | null;
  mission_type: MissionType;
  role_purpose: RolePurpose;
  business_object: string | null;
  dependency_type: string | null;
  coordination_mode: string | null;
  impact_level: string | null;
  sacrifice_mode: string | null;
  vsm_signals: {
    s1: "present" | "absent" | "unknown";
    s2: "present" | "weak" | "absent" | "unknown";
    s3: "present" | "absent" | "unknown";
    s3_star: "present" | "blocked" | "absent" | "unknown";
    s4: "present" | "delayed" | "absent" | "unknown";
    s5: "present" | "strained" | "absent" | "unknown";
    algedonic_channel: "visible" | "repressed" | "absent" | "unknown";
  };
};

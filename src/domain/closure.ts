export type CoverageResult = {
  covered: boolean;
  confidence: number;
};

export type ClosureStatus = "closed" | "partial" | "gap_requires_support";

export type ClosureResult = {
  role_id: string;
  activity_id: string;
  dimension_coverage: {
    pm: CoverageResult;
    moc: CoverageResult;
    pf: CoverageResult;
    olc: CoverageResult;
    vsm: CoverageResult;
    ahe: CoverageResult;
  };
  link_coverage: {
    pm_moc: boolean;
    moc_olc: boolean;
    pm_pf: boolean;
    pf_olc: boolean;
    pf_s2: boolean;
    s1_s3_s3star: boolean;
    s3_s4_s5: boolean;
    olc_ahe_vsm: boolean;
  };
  inconsistencies_hard: string[];
  inconsistencies_soft: string[];
  triangulations_applied: Array<{
    code: string;
    confidence: number;
    note: string;
  }>;
  closure_status: ClosureStatus;
  closure_confidence: number;
  missing_capabilities: string[];
  support_activity_request: {
    required: boolean;
    activity_type_needed: string | null;
    reason: string | null;
  };
};

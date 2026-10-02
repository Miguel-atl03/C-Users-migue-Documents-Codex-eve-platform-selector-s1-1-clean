export type CaseProcessStatus =
  | "not_started"
  | "available"
  | "current"
  | "waiting"
  | "completed"
  | "blocked"
  | "unknown";

export type CaseProcessStructureResponse = {
  mainProcess: {
    id: string;
    label: string;
    status: CaseProcessStatus;
    statusLabel: string | null;
    currentMilestoneId: string | null;
    nextEventLabel: string | null;
    timerLabel: string | null;
  } | null;
  milestones: Array<{
    id: string;
    label: string;
    sequence: number | null;
    status: CaseProcessStatus;
    statusLabel: string | null;
    expectedEventLabel: string | null;
    timerLabel: string | null;
    supportProcessLabel: string | null;
  }>;
  /** Unit 4A aggregate. UI KPI activation is a later unit. */
  coreMilestoneProgress: {
    achieved: number;
    total: number;
    status: "available" | "partial" | "unavailable";
  };
};

export type CaseMainProcessRecord = {
  id: string;
  caseId: string;
  label: string;
  status: CaseProcessStatus;
  currentMilestoneId: string | null;
  enabled: boolean;
};

export type CaseMilestoneRecord = {
  id: string;
  mainProcessId: string;
  label: string;
  sequence: number;
  status: CaseProcessStatus;
  expectedEventLabel: string | null;
  timerDueAt: string | null;
  supportProcessLabel: string | null;
  enabled: boolean;
};

export type OfficialControlPanelProcessStructureAccessInput = {
  consultantUserId: string;
  companyId: string;
  relationshipId: string;
  caseId: string;
  mainProcessId?: string | null;
  milestoneId?: string | null;
  at?: Date;
};

export type OfficialControlPanelProcessStructureAccessResult =
  | { ok: true }
  | {
      ok: false;
      code: "process_structure_access_denied" | "process_structure_data_unavailable";
      status: 403 | 500;
      message: string;
    };

export type OfficialControlPanelProcessStructureRepository = {
  findEnabledMainProcessByCase(
    caseId: string,
  ): Promise<CaseMainProcessRecord | null>;
  findMainProcessById(
    mainProcessId: string,
  ): Promise<CaseMainProcessRecord | null>;
  listEnabledMilestonesByProcess(
    mainProcessId: string,
  ): Promise<CaseMilestoneRecord[]>;
  findMilestoneById(milestoneId: string): Promise<CaseMilestoneRecord | null>;
  calculateCoreMilestoneProgress(caseId: string): Promise<{
    achieved: number;
    total: number;
    status: "available" | "partial" | "unavailable";
  }>;
};

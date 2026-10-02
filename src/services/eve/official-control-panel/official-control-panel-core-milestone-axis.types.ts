import type {
  CoreMilestoneCode,
  CoreMilestoneFinalAlternative,
  CoreMilestoneUiState,
} from "./catalogs/core-milestone-axis.catalog";
import type { CoreMilestoneProgressStatus } from "./official-control-panel-core-milestones";

export type CoreMilestoneAxisItem = {
  code: CoreMilestoneCode;
  label: string;
  sequence: number;
  objectStateLabel: string;
  expectedNextEventLabel: string | null;
  timerPolicyName: string | null;
  responsibleProcessCode: string | null;
  responsibleProcessManual: boolean;
  modalityLabel: string | null;
  reached: boolean | null;
  uiState: CoreMilestoneUiState | null;
  uiStateLabel: string;
  dataStatus: "available" | "unavailable";
};

export type CoreMilestoneAxisResponse = {
  items: CoreMilestoneAxisItem[];
  progress: {
    achieved: number;
    total: number;
    status: CoreMilestoneProgressStatus;
  };
  finalAlternative: CoreMilestoneFinalAlternative | null;
  /** Factual reason from audit metadata when final alternative was set. */
  finalAlternativeReason: string | null;
  /** True when per-H Object[State] evidence is not evaluable for the case. */
  operationalDataBlocked: boolean;
};

export type OfficialControlPanelCoreMilestoneAccessResult =
  | { ok: true }
  | {
      ok: false;
      status: 403 | 500;
      code: "core_milestone_access_denied" | "core_milestone_data_unavailable";
      message: string;
    };

export type CoreMilestoneAxisRpcMilestone = {
  code: CoreMilestoneCode;
  reached: boolean;
  linkPresent: boolean;
  linkApplicable: boolean;
};

export type CoreMilestoneAxisRpcPayload = {
  status: CoreMilestoneProgressStatus;
  achieved: number;
  total: number;
  milestones: CoreMilestoneAxisRpcMilestone[];
  finalAlternative: CoreMilestoneFinalAlternative | null;
  finalAlternativeReason: string | null;
};

import type {
  SupportProcessAxisCode,
  SupportProcessExecutionMode,
} from "./catalogs/support-process-axis.catalog";

export type SupportProcessAxisItemDataStatus =
  | "available"
  | "partial"
  | "unavailable";

export type SupportProcessAxisItem = {
  code: SupportProcessAxisCode;
  label: string;
  sequence: number;
  /** Null when modality is unknown (should not occur for P-SUP chips). */
  executionMode: SupportProcessExecutionMode | null;
  modalityLabel: string;
  targetObjectLabel: string | null;
  targetStateLabel: string | null;
  triggerLabel: string | null;
  nextEventLabel: string | null;
  dependencyLabel: string | null;
  operationalStatusLabel: string | null;
  attentionCount: number | null;
  dataStatus: SupportProcessAxisItemDataStatus;
};

export type SupportProcessAxisResponse = {
  items: SupportProcessAxisItem[];
  /** True when catalog is present but no factual per-case operational source. */
  operationalDataBlocked: boolean;
};

export type OfficialControlPanelSupportProcessAccessResult =
  | { ok: true }
  | {
      ok: false;
      status: 403 | 500;
      code:
        | "support_process_access_denied"
        | "support_process_data_unavailable";
      message: string;
    };

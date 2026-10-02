export const PR3_CHAIN_DEFINITION_ID = "EVE-PR3-B0-B2-CHAIN" as const;
export const PR3_CHAIN_DEFINITION_REVISION = "1.0" as const;

export const PR3_RUNTIME_API = {
  actionToken: "/api/eve/pr3/pilot/runtime/action-token",
  openOrResume: "/api/eve/pr3/pilot/runtime/open-or-resume",
  respond: "/api/eve/pr3/pilot/runtime/respond",
  correct: "/api/eve/pr3/pilot/runtime/correct",
  resume: "/api/eve/pr3/pilot/runtime/resume",
  state: "/api/eve/pr3/pilot/runtime/state",
} as const;

export type Pr3CommandOperation =
  | "ISSUE_ACTION_TOKEN"
  | "OPEN_OR_RESUME"
  | "SUBMIT_RESPONSE"
  | "SUBMIT_CORRECTION"
  | "RESUME"
  | "INTERNAL_AI"
  | "HUMAN_EXCEPTION"
  | "HANDOFF";

export type Pr3ReceiptState =
  | "ACCEPTED"
  | "REJECTED_PRECONDITION"
  | "IDEMPOTENT_REPLAY"
  | "IDEMPOTENCY_CONFLICT";

export type Pr3ActionTokenRequest = {
  token_request_id: string;
  operation: Exclude<Pr3CommandOperation, "ISSUE_ACTION_TOKEN" | "INTERNAL_AI" | "HUMAN_EXCEPTION" | "HANDOFF">;
  scope_ref?: string;
  activity_ref?: string;
  chain_run_id?: string;
  object_run_id?: string;
  interaction_key?: string;
  context_revision?: string;
};

export type Pr3CommandReceipt = {
  command_receipt_id: string;
  operation: Pr3CommandOperation;
  command_scope_ref: string;
  command_event_id: string;
  client_event_id?: string | null;
  token_request_id?: string | null;
  idempotency_key: string;
  payload_sha256: string;
  receipt_state: Pr3ReceiptState;
  chain_run_id?: string | null;
  object_run_id?: string | null;
  interaction_key?: string | null;
  context_revision?: string | null;
  replay_of_receipt_id?: string | null;
  result_payload_sha256?: string | null;
  side_effect_refs: readonly string[];
  error_code?: string | null;
  server_time: string;
};

export type Pr3PresentationOption = { option_ref: string; option_label: string };
export type Pr3PresentationSlot = {
  slot_ref: string;
  field_key: string;
  source_code: string;
  label: string;
  help_text?: string | null;
  control_family: string;
  answer_mode: string;
  required: boolean;
  max_chars?: number | null;
  capture_slot_kind: "visible_capture" | "conditional_clarification";
  options?: readonly Pr3PresentationOption[];
  knowledge_basis_control?: unknown;
};

export type Pr3InteractionContract = {
  chain_definition_id: typeof PR3_CHAIN_DEFINITION_ID;
  chain_definition_revision: typeof PR3_CHAIN_DEFINITION_REVISION;
  chain_run_id: string;
  object_key: "B0" | "B0.5" | "B1" | "B2";
  object_run_id: string;
  contract_set_id: string;
  profile_id: string;
  profile_revision: string;
  profile_sha256: string;
  runtime_definition_id: string;
  definition_revision: string;
  interaction_key: string;
  local_interaction_instance_id?: string | null;
  context_revision: string;
  bucket: "base_40" | "causal_20" | "internal_no_count" | "exceptional_reentry";
  presentation_event_id: string;
  presentation_state: "TURN_READY" | "REENTRY_REQUIRED" | "DEPENDENCY_BLOCKED" | "CHAIN_COMPLETE";
  visible_text: string;
  help_text?: string | null;
  ui_component: string;
  slots: readonly Pr3PresentationSlot[];
  restrictions: readonly string[];
  server_time: string;
};

export type Pr3AnswerItem = { slot_ref: string; raw_value: unknown; raw_literal?: string; knowledge_basis?: string };
export type Pr3CorrectionItem = Pr3AnswerItem & { supersedes_response_key: string; expected_response_revision: number };
export type Pr3OpenOrResumeCommand = {
  action_token: string;
  client_event_id: string;
  mode: "OPEN_OR_RESUME";
  scope_ref: string;
  activity_ref: string;
  expected_chain_definition_id: typeof PR3_CHAIN_DEFINITION_ID;
  expected_chain_definition_revision: typeof PR3_CHAIN_DEFINITION_REVISION;
};
export type Pr3SubmitResponseCommand = {
  action_token: string;
  client_event_id: string;
  chain_run_id: string;
  object_run_id: string;
  interaction_key: string;
  context_revision: string;
  answers: readonly Pr3AnswerItem[];
};
export type Pr3SubmitCorrectionCommand = Omit<Pr3SubmitResponseCommand, "answers"> & { corrections: readonly Pr3CorrectionItem[] };
export type Pr3ResumeCommand = { action_token: string; client_event_id: string; chain_run_id: string; last_known_context_revision?: string | null };

export type Pr3ExecutionResult = {
  command_receipt: Pr3CommandReceipt;
  domain_state: {
    chain_run_id: string;
    object_run_id: string;
    object_key: "B0" | "B0.5" | "B1" | "B2";
    context_revision: string;
    object_state: string;
    chain_state: string;
    restrictions: readonly string[];
    gap_refs: readonly string[];
    handoff_refs: readonly string[];
  };
  next_projection:
    | { kind: "interaction_contract"; value: Pr3InteractionContract }
    | { kind: "reentry_descriptor"; value: unknown }
    | { kind: "dependency_block"; value: unknown }
    | { kind: "chain_complete_package_ref"; value: string };
};

export type Pr3Principal = {
  principal_ref: string;
  scope_ref: string;
  activity_ref: string;
  auth_mode: "local_test" | "static_bearer" | "supabase_user";
};

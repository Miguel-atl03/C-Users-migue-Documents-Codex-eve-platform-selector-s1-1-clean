// PRE_RUNTIME_CONTEXT_BUNDLE_EVE_V1_0
// Machine-readable policy for carrying Estado A + WorkMap context into Significado, B0, Runtime and Producción Paralela.
// Runtime must not read XLSX/DOCX. This TS policy is the executable reference.

export const PRE_RUNTIME_CONTEXT_BUNDLE_VERSION = "PRE_RUNTIME_CONTEXT_BUNDLE_EVE_V1_0" as const;

export type ContextEpistemicStatus =
  | "captured_user_context"
  | "inferred_from_workmap"
  | "context_only"
  | "confirmed_in_runtime"
  | "gap"
  | "contradiction_flag";

export type ContextField<T> = {
  value: T | null;
  epistemicStatus: ContextEpistemicStatus;
  source: "estado_a" | "workmap" | "primary_selection" | "runtime" | "system";
  clientLabel?: string;
  internalField: string;
  allowedUses: string[];
  mustNotBeUsedFor: string[];
  requiresRuntimeConfirmation?: boolean;
};

export type PreRuntimeContextBundle = {
  preRuntimeContextBundleId: string;
  policyVersion: typeof PRE_RUNTIME_CONTEXT_BUNDLE_VERSION;
  createdAt: string;
  sourceState: {
    estadoAAvailable: boolean;
    workMapAvailable: boolean;
    primarySelectionAvailable: boolean;
  };
  estadoAContext: {
    functional_role_context: ContextField<string>;
    decision_level_context: ContextField<string>;
    decision_scope_context?: ContextField<string>;
    declared_function_scope_context?: ContextField<string[]>;
  };
  workMapContext: {
    areas: ContextField<unknown[]>;
    responsibilities: ContextField<unknown[]>;
    activities: ContextField<unknown[]>;
    first_workmap_question?: ContextField<string>;
  };
  selectionContext?: {
    selectedPrimaryActivities: ContextField<unknown[]>;
    nonPrimaryContextActivities: ContextField<unknown[]>;
    selectionPolicyVersion?: string;
    selectionMode?: string;
  };
  runtimeContext: {
    significadoHandoffAllowed: boolean;
    b0PrefillAllowed: boolean;
    contextMayBeDisplayedToUser: boolean;
    contextMustNotBeSavedAsConfirmedEvidence: boolean;
  };
};

export const PRE_RUNTIME_CONTEXT_BUNDLE_POLICY_V1_0 = {
  policyId: "PRE_RUNTIME_CONTEXT_BUNDLE_EVE_V1_0",
  version: "1.0.0",
  status: "operational_machine_readable",
  coreRules: {
    roleFunctionalEqualsClientLabel: {
      clientLabel: "Lugar desde donde participas",
      internalName: "functional_role_context",
      rule:
        "Ambos refieren al mismo dato visto desde dos lenguajes: UI para cliente e identidad epistemológica interna.",
    },
    contextIsNotEvidence:
      "Estado A y WorkMap producen contexto y señales. Runtime confirma, corrige o descarta. Ningún dato de Estado A puede convertirse por sí solo en evidencia MMABP confirmada.",
    significadoIsConsumer:
      "La pantalla Significado consume selectedPrimaryActivities y PreRuntimeContextBundle; no selecciona actividades.",
    selectorUseIsAuxiliary:
      "El selector primario puede usar el bundle como contexto auxiliar, nunca como driver único de selección ni exclusión.",
    workmapSnapshotPreserved:
      "El WorkMap completo debe preservarse con actividades primarias y no primarias.",
    nonPrimaryActivitiesAreContext:
      "Las actividades no primarias se preservan como contexto, cobertura, gaps y posibles rutas de promoción; no reciben Runtime 40/20 completo inmediato.",
  },
  stageUses: {
    primaryActivitySelectionV1_3: {
      allowed: ["context_auxiliary", "coverage_check", "wording_support", "non_primary_context_preservation"],
      notAllowed: ["select_by_role_alone", "exclude_by_decision_level_alone", "diagnose_by_estado_a"],
    },
    significado: {
      allowed: ["show_activity_context", "orient_user", "handoff_primary_activity", "hold_non_primary_context"],
      notAllowed: ["select_activities", "diagnose", "treat_prefill_as_confirmed_answer"],
    },
    block0: {
      allowed: ["prefill_context", "reduce_redundancy", "confirmation_prompt", "boundary_prompt_if_missing"],
      notAllowed: ["auto_confirm_operational_description", "auto_confirm_start_end", "save_workmap_prefill_as_evidence"],
    },
    runtime40_20: {
      allowed: ["contextualize_questions", "route_microclarifications", "carry_epistemic_status"],
      notAllowed: ["skip_runtime_evidence", "replace_user_answer_with_context"],
    },
    parallelProduction: {
      allowed: ["context_bundle_attachment", "traceability", "gap_analysis", "readiness_context"],
      notAllowed: ["build_pm_moc_pf_olc_from_context_only"],
    },
  },
  qaAssertions: [
    "PreRuntimeContextBundle exists before Significado starts when Estado A and WorkMap are available.",
    "functional_role_context is populated from Estado A or marked gap.",
    "decision_level_context is populated from Estado A or marked gap.",
    "selectedPrimaryActivities and nonPrimaryContextActivities are both present after selection.",
    "Significado receives PreRuntimeContextBundle and does not select activities.",
    "B0 prefill may reference WorkMap context but must not mark it as confirmed evidence.",
    "Estado A data is not used for diagnosis or confirmed PM/MoC/PF/OLC facts.",
  ],
} as const;

export function makeContextField<T>(args: {
  value: T | null;
  epistemicStatus: ContextEpistemicStatus;
  source: ContextField<T>["source"];
  clientLabel?: string;
  internalField: string;
  allowedUses: string[];
  mustNotBeUsedFor: string[];
  requiresRuntimeConfirmation?: boolean;
}): ContextField<T> {
  return {
    value: args.value,
    epistemicStatus: args.epistemicStatus,
    source: args.source,
    clientLabel: args.clientLabel,
    internalField: args.internalField,
    allowedUses: args.allowedUses,
    mustNotBeUsedFor: args.mustNotBeUsedFor,
    requiresRuntimeConfirmation: args.requiresRuntimeConfirmation ?? false,
  };
}

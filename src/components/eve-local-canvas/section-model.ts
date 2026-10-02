/**
 * Official continuous-canvas E2E container (productization target).
 *
 * X1: LOGIN + ESTADO_A front-door via LocalCanvasExperience.
 * X2: WORKMAP via continuous `intake_sheet` mode
 *     (Hero gate once → Estado A / Posición remains on the sheet; WorkMap reveals below.
 *     WORKMAP_EXPLANATION retained in section-model / contract; not shown as a pedagogical room).
 *     Presentation restored from freeze WorkmapBuilderSection; authority = WorkMapData.
 * X3: SCENE_ENTRY (Umbral Memoria → Escena) + B0 Memoria operativa
 *     (`LocalB0MemoriaOperativaSection`) + B0 Cómo ocurre
 *     (`LocalB0ComoOcurreSection`, frecuencia in-place tras guardar)
 *     on continuous intake_sheet after WorkMap finalize.
 *     Old Significado builder is not mounted on the local sheet.
 * UI-B05: B05 official visual shell (Madre + matrix control families; stub until X4-05).
 * UI-B1 / UI-B2 / UI-B3: approved or visual candidates; stay official_pending until
 *     explicit productive-canvas integration + Runtime binding (X4-1 / X4-2 / X4-3).
 * UI-B4: visual candidate companion-only (Instrumento); official_pending until
 *     explicit canvas integration + Runtime binding (X4-4).
 * UI-B5: approved/exportable companion-only (Instrumento); official_pending until
 *     explicit canvas integration + Runtime binding (X4-5). B6–B7 / READINESS pending.
 *
 * Runtime sections unlock only from Runtime InteractionViewModel / state.
 * Assistance ≠ Runtime authority.
 */

export type LocalCanvasSectionId =
  | "LOGIN"
  | "ESTADO_A"
  | "WORKMAP_EXPLANATION"
  | "WORKMAP"
  | "SIGNIFICADO_EXPLANATION"
  | "B0"
  | "B05"
  | "B1"
  | "B2"
  | "B3"
  | "B4"
  | "B5"
  | "B6"
  | "B7"
  | "READINESS";

export type LocalCanvasSectionStatus =
  | "locked"
  | "visible"
  | "active"
  | "completed_persisted";

/**
 * Runtime-driven unlock for B05–B7. Never hardcode B05→B1→B2.
 * Non-runtime sections unlock from authorized session/persisted state only.
 */
export type LocalCanvasUnlockSource =
  | "auth_session"
  | "persisted_session_state"
  | "workmap_finalize_contract"
  | "significado_b0_contract"
  | "runtime_interaction_view_model"
  | "readiness_contract";

export type LocalCanvasSectionDescriptor = {
  id: LocalCanvasSectionId;
  unlock_source: LocalCanvasUnlockSource;
  presentation_status: "prototype_only" | "legacy_wrapped" | "official_pending" | "official";
  assistance_ids: string[];
};

export const LOCAL_CANVAS_SECTION_ORDER: LocalCanvasSectionDescriptor[] = [
  {
    id: "LOGIN",
    unlock_source: "auth_session",
    presentation_status: "official",
    assistance_ids: [],
  },
  {
    id: "ESTADO_A",
    unlock_source: "auth_session",
    presentation_status: "official",
    assistance_ids: [],
  },
  {
    id: "WORKMAP_EXPLANATION",
    unlock_source: "persisted_session_state",
    presentation_status: "official",
    assistance_ids: [],
  },
  {
    id: "WORKMAP",
    unlock_source: "workmap_finalize_contract",
    presentation_status: "official",
    assistance_ids: [
      "workmap_side_cognitive_guide",
      "workmap_inline_blur_assist",
      "workmap_formal_save_validation",
    ],
  },
  {
    id: "SIGNIFICADO_EXPLANATION",
    unlock_source: "persisted_session_state",
    presentation_status: "official",
    assistance_ids: [],
  },
  {
    id: "B0",
    unlock_source: "significado_b0_contract",
    presentation_status: "official",
    assistance_ids: [
      "b0_help_text",
      "b0_intro_example",
      "b0_operational_description_coach",
      "b0_boundary_confirmation",
      "workmap_to_b0_prefill",
    ],
  },
  {
    id: "B05",
    unlock_source: "runtime_interaction_view_model",
    presentation_status: "official",
    assistance_ids: ["runtime_help_text"],
  },
  {
    id: "B1",
    unlock_source: "runtime_interaction_view_model",
    presentation_status: "official_pending",
    assistance_ids: ["runtime_help_text"],
  },
  {
    id: "B2",
    unlock_source: "runtime_interaction_view_model",
    presentation_status: "official_pending",
    assistance_ids: ["runtime_help_text"],
  },
  {
    id: "B3",
    unlock_source: "runtime_interaction_view_model",
    presentation_status: "official_pending",
    assistance_ids: ["runtime_help_text"],
  },
  {
    id: "B4",
    unlock_source: "runtime_interaction_view_model",
    presentation_status: "official_pending",
    assistance_ids: ["runtime_help_text"],
  },
  {
    id: "B5",
    unlock_source: "runtime_interaction_view_model",
    presentation_status: "official_pending",
    assistance_ids: ["runtime_help_text"],
  },
  {
    id: "B6",
    unlock_source: "runtime_interaction_view_model",
    presentation_status: "official_pending",
    assistance_ids: ["runtime_help_text"],
  },
  {
    id: "B7",
    unlock_source: "runtime_interaction_view_model",
    presentation_status: "official_pending",
    assistance_ids: ["runtime_help_text", "runtime_microconfirmation_contract"],
  },
  {
    id: "READINESS",
    unlock_source: "readiness_contract",
    presentation_status: "official_pending",
    assistance_ids: ["consistency_micro_clarification"],
  },
];

export function isRuntimeGovernedSection(id: LocalCanvasSectionId): boolean {
  return (
    id === "B05" ||
    id === "B1" ||
    id === "B2" ||
    id === "B3" ||
    id === "B4" ||
    id === "B5" ||
    id === "B6" ||
    id === "B7"
  );
}

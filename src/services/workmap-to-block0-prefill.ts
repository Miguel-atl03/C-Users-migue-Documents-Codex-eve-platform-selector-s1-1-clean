import type { ActivityDeclaredContext, WorkMapData } from "@/domain/local-work-map";
import type { SelectedPrimaryActivity } from "@/domain/primary-activity-selection-policy";
import { buildBlock0AnswerKey } from "@/features/significado/runtime-block0-canonical";
import { detectActivityParts } from "@/services/local-work-map-activity-validation";

export type WorkMapBlock0PrefillEpistemicState =
  | "inferred_from_workmap"
  | "context_from_workmap"
  | "declared_unconfirmed";

export type WorkMapToBlock0PrefillInput = {
  workMap: WorkMapData;
  primaryActivity?: SelectedPrimaryActivity | null;
  currentActivityTitle?: string;
  declaredContext?: ActivityDeclaredContext | null;
};

export type WorkMapBlock0PrefillResult = {
  visualDraft: Partial<Record<string, string>>;
  epistemicByAnswerKey: Record<string, WorkMapBlock0PrefillEpistemicState>;
};

const CONFIRMED_EPISTEMIC_STATES = new Set([
  "captured_user_evidence",
  "user_confirmed_suggestion",
  "user_corrected_evidence",
]);

function resolveActivityLiteral(input: WorkMapToBlock0PrefillInput): string {
  const fromPrimary = input.primaryActivity?.activityLiteral?.trim();
  if (fromPrimary) {
    return fromPrimary;
  }

  const fromTitle = input.currentActivityTitle?.trim();
  if (fromTitle) {
    return fromTitle;
  }

  const activityId = input.primaryActivity?.activityId;
  if (activityId) {
    for (const responsibility of input.workMap.responsibilities) {
      const activity = responsibility.activities.find((item) => item.id === activityId);
      if (activity?.text.trim()) {
        return activity.text.trim();
      }
    }
  }

  return "";
}

function resolveDeclaredContext(
  input: WorkMapToBlock0PrefillInput,
): ActivityDeclaredContext | null {
  if (input.declaredContext) {
    return input.declaredContext;
  }

  const responsibilityId = input.primaryActivity?.responsibilityId;
  if (!responsibilityId) {
    return null;
  }

  const responsibility = input.workMap.responsibilities.find(
    (item) => item.id === responsibilityId,
  );
  if (!responsibility) {
    return null;
  }

  const areaLabel =
    input.primaryActivity?.areaLabel?.trim() ||
    input.workMap.selectedAreas[0]?.trim() ||
    "";

  return {
    declared_area_context: areaLabel,
    declared_responsibility_context: responsibility.text.trim(),
    responsibility_id: responsibility.id,
    area_status: "declared_unconfirmed",
    responsibility_status: "declared_unconfirmed",
  };
}

const OUTPUT_PURPOSE_LEAD_PATTERN =
  /^para\s+(?:entregar|generar|obtener|validar|dejar|crear|producir|emitir|enviar|elaborar|consolidar|preparar|presentar|completar|cerrar|registrar|publicar|actualizar|confirmar|aprobar|notificar|informar|reportar|analizar|conciliar|revisar|medir|calcular|definir|coordinar|supervisar|controlar|verificar|autorizar|firmar)\s+/i;

/**
 * Cleans connector-led result fragments for display only.
 * The original literal remains traceable via WorkMap and detectActivityParts.
 */
export function normalizeWorkMapOutputPresentation(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (!OUTPUT_PURPOSE_LEAD_PATTERN.test(trimmed)) {
    return trimmed;
  }

  let remainder = trimmed.replace(OUTPUT_PURPOSE_LEAD_PATTERN, "");
  remainder = remainder.replace(/^(?:un|una|el|la|los|las)\s+/i, "");
  remainder = remainder.replace(/\s+al\s+/i, " para el ");
  remainder = remainder.replace(/\s+a\s+(el|la|los|las)\s+/i, " para $1 ");

  const cleaned = remainder.trim();
  return cleaned.length > 0 ? cleaned : trimmed;
}

function assignPrefillField({
  visualDraft,
  epistemicByAnswerKey,
  answerKey,
  value,
  epistemicState,
}: {
  visualDraft: Partial<Record<string, string>>;
  epistemicByAnswerKey: Record<string, WorkMapBlock0PrefillEpistemicState>;
  answerKey: string;
  value: string | undefined;
  epistemicState: WorkMapBlock0PrefillEpistemicState;
}) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return;
  }

  visualDraft[answerKey] = trimmed;
  epistemicByAnswerKey[answerKey] = epistemicState;
}

export function buildInitialBlock0VisualDraftFromWorkMap(
  input: WorkMapToBlock0PrefillInput,
): WorkMapBlock0PrefillResult {
  const visualDraft: Partial<Record<string, string>> = {};
  const epistemicByAnswerKey: Record<string, WorkMapBlock0PrefillEpistemicState> = {};

  const activityLiteral = resolveActivityLiteral(input);
  if (activityLiteral) {
    const parts = detectActivityParts(activityLiteral);

    assignPrefillField({
      visualDraft,
      epistemicByAnswerKey,
      answerKey: buildBlock0AnswerKey("B0-Q01", "action_verb"),
      value: parts.action,
      epistemicState: "inferred_from_workmap",
    });
    assignPrefillField({
      visualDraft,
      epistemicByAnswerKey,
      answerKey: buildBlock0AnswerKey("B0-Q01", "input_or_object"),
      value: parts.object,
      epistemicState: "inferred_from_workmap",
    });
    assignPrefillField({
      visualDraft,
      epistemicByAnswerKey,
      answerKey: buildBlock0AnswerKey("B0-Q01", "procedure_or_standard"),
      value: parts.how,
      epistemicState: "context_from_workmap",
    });
    assignPrefillField({
      visualDraft,
      epistemicByAnswerKey,
      answerKey: buildBlock0AnswerKey("B0-Q01", "output_or_result"),
      value: parts.result
        ? normalizeWorkMapOutputPresentation(parts.result)
        : undefined,
      epistemicState: "inferred_from_workmap",
    });
  }

  void resolveDeclaredContext(input);

  return { visualDraft, epistemicByAnswerKey };
}

export function mergeBlock0InitialVisualDraft(
  base: Record<string, string>,
  workMapPrefill: Partial<Record<string, string>>,
  override?: Partial<Record<string, string>>,
): Record<string, string> {
  const merged = { ...base };

  for (const [answerKey, value] of Object.entries(workMapPrefill)) {
    if (typeof value === "string" && value.trim()) {
      merged[answerKey] = value.trim();
    }
  }

  if (override) {
    for (const [answerKey, value] of Object.entries(override)) {
      if (typeof value === "string") {
        merged[answerKey] = value;
      }
    }
  }

  return merged;
}

export function assertWorkMapPrefillEpistemicContract(
  epistemicByAnswerKey: Record<string, WorkMapBlock0PrefillEpistemicState>,
) {
  for (const state of Object.values(epistemicByAnswerKey)) {
    if (CONFIRMED_EPISTEMIC_STATES.has(state)) {
      throw new Error(`WorkMap prefill must not emit confirmed epistemic state: ${state}`);
    }
  }
}

import {
  getBlock05Ficha,
  type Block05QuestionCode,
} from "@/components/eve-worksheet/reference/block05-fichas";
import type { RuntimePresentationViewModel } from "@/components/eve-worksheet";
import { B05_MADRE_QUESTION_TEXT } from "./b05-madre-copy";
import type {
  B05BandMeta,
  B05ControlFamily,
  B05PresentationViewModel,
  B05SlotAnswer,
  B05SlotPresentation,
} from "./b05-presentation-contract";

const B05_RUNTIME_INTERACTION_IDS = new Set(["B05-Q05", "B05-Q06", "B05-Q07", "C02"]);

const FRAME_MARQUEE = [
  "para quien existe",
  "quien gana si sale bien",
  "quien sufre si falla",
  "a que proceso pertenece",
  "que habilita",
  "quien marca la prioridad",
] as const;

const BAND_BY_NORTH: Record<string, B05BandMeta> = {
  cliente_funcional: {
    id: "cliente_funcional",
    kicker: "PARA QUIEN EXISTE ESTO",
    guide:
      "No el receptor inmediato: quien gana de verdad si sale bien y quien absorbe el dano si falla.",
  },
  proceso_contenedor: {
    id: "proceso_contenedor",
    kicker: "A QUE PROCESO PERTENECE",
    guide: "El proceso grande donde esta actividad tiene sentido, no la tarea suelta.",
  },
  hito_habilitador: {
    id: "hito_y_prioridad",
    kicker: "QUE HABILITA Y QUIEN PRIORIZA",
    guide:
      "Que avance desbloquea para otros, y quien marca la prioridad normal frente a la que desplaza.",
  },
  prioridad_regulatoria: {
    id: "hito_y_prioridad",
    kicker: "QUE HABILITA Y QUIEN PRIORIZA",
    guide:
      "Que avance desbloquea para otros, y quien marca la prioridad normal frente a la que desplaza.",
  },
  aclaracion: {
    id: "aclaracion",
    kicker: "UNA PRECISION",
    guide: "Solo aparece cuando Runtime habilita esta precision.",
  },
};

function controlFamily(fieldType: string | undefined): B05ControlFamily {
  if (fieldType === "clarification") return "clarification";
  if (fieldType === "free_text") return "free_text";
  if (fieldType === "single_choice") return "single_choice";
  return "free_text";
}

function asBlock05Code(value: string): Block05QuestionCode | null {
  return getBlock05Ficha(value as Block05QuestionCode) ? (value as Block05QuestionCode) : null;
}

export function isB05RuntimePresentation(viewModel: RuntimePresentationViewModel | null): boolean {
  return Boolean(viewModel && B05_RUNTIME_INTERACTION_IDS.has(viewModel.runtime_interaction_id));
}

export function mapRuntimePresentationToB05(
  viewModel: RuntimePresentationViewModel,
  activity?: Partial<B05PresentationViewModel["activity"]>,
): B05PresentationViewModel {
  const slots: B05SlotPresentation[] = viewModel.slots.map((slot) => {
    const code = asBlock05Code(slot.source_code ?? slot.name);
    if (!code) {
      throw new Error(`blocked_b05_runtime_binding_unknown_source_code:${slot.name}`);
    }
    const ficha = getBlock05Ficha(code);
    if (!ficha) {
      throw new Error(`blocked_b05_runtime_binding_missing_ficha:${code}`);
    }
    const band = BAND_BY_NORTH[ficha.systemic_north] ?? BAND_BY_NORTH.cliente_funcional;
    const freeTextOptionId =
      slot.options?.find((option) => /otro/i.test(option.option_label))?.option_id ?? null;
    return {
      field_key: code,
      slot_ref: slot.slot_ref,
      source_code: code,
      short_ui_label: ficha.short_ui_label,
      question_text: B05_MADRE_QUESTION_TEXT[code] ?? slot.label ?? ficha.canonical_question_text,
      help_text: slot.help_text ?? viewModel.help_text ?? ficha.help_text ?? null,
      control_family: controlFamily(slot.type),
      required: slot.required,
      options: slot.options,
      answer_mode: slot.answer_mode,
      required_rule: slot.required_rule,
      visibility_rule: slot.visibility_rule,
      branching_rule: slot.branching_rule,
      provenance_type: slot.provenance_type,
      epistemic_role: slot.epistemic_role,
      policy_class: slot.policy_class,
      derivation_status: slot.derivation_status,
      free_text_when_option_id:
        ficha.allows_free_text === "conditional" ? freeTextOptionId : null,
      band,
      capture_slot_kind:
        slot.capture_slot_kind === "conditional_clarification"
          ? "conditional_clarification"
          : "visible_capture",
      dyad_role: code === "0.5.1" ? "benefit" : code === "0.5.1a" ? "harm" : null,
    };
  });

  return {
    presentation_kind: "runtime_bound",
    presentation_surface: viewModel.runtime_interaction_id === "C02" ? "causal_visible" : "base",
    block: "0.5",
    matrix_interaction_hint: viewModel.runtime_interaction_id,
    visible_text: viewModel.visible_text,
    ui_component_hint: viewModel.ui_component,
    slots,
    activity: {
      area: activity?.area ?? "Actividad seleccionada",
      activityLiteral: activity?.activityLiteral ?? "Actividad en curso",
      heading: activity?.heading ?? "Bloque 0.5",
    },
    frame_marquee: FRAME_MARQUEE,
    frame_line: viewModel.visible_text,
  };
}

export function b05AnswerToHumanValue(answer: B05SlotAnswer | undefined): string {
  if (!answer) return "";
  if (answer.choiceId) {
    if (answer.complementaryText?.trim()) {
      return `${answer.choiceId}: ${answer.complementaryText.trim()}`;
    }
    return answer.choiceId;
  }
  return answer.text?.trim() ?? "";
}

export function b05AnswerToRuntimeValue(answer: B05SlotAnswer | undefined): unknown {
  if (!answer) return "";
  const choiceId = answer.choiceId?.trim();
  const complementaryText = answer.complementaryText?.trim();
  if (choiceId) {
    return complementaryText
      ? { choiceId, complementaryText }
      : choiceId;
  }
  return answer.text?.trim() ?? "";
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RuntimeInteractionSheet,
  mapServerViewModelToPresentation,
  type RuntimePresentationViewModel,
} from "@/components/eve-worksheet";
import {
  LocalCanvasB05Section,
  b05AnswerToHumanValue,
  b05AnswerToRuntimeValue,
  isB05RuntimePresentation,
  mapRuntimePresentationToB05,
  type B05SlotAnswer,
} from "@/components/eve-local-canvas";

type SceneQuestionnaireItem = {
  sceneId: string;
  sceneName: string;
  depthLevel: string;
  activity: unknown;
};

export type RuntimeFullScope = {
  enabled: true;
  tenantId: string;
  caseId: string;
  roleId: string;
  activityId: string;
  runId: string;
  accessToken?: string | null;
};

type Props = {
  disabled?: boolean;
  scenes: SceneQuestionnaireItem[];
  sessionId: string;
  onComplete: () => void;
  runtimeFull: RuntimeFullScope;
};

/**
 * Runtime FULL questionnaire path only.
 * Must not execute legacy catalog sequencing.
 */
export function RuntimeFullQuestionnaireRunner({
  disabled = false,
  scenes,
  sessionId,
  onComplete,
  runtimeFull,
}: Props) {
  const [viewModel, setViewModel] = useState<RuntimePresentationViewModel | null>(null);
  const [runtimeInteractionInstanceId, setRuntimeInteractionInstanceId] = useState<string | null>(
    null,
  );
  const [runtimeAnswers, setRuntimeAnswers] = useState<Record<string, string>>({});
  const [b05Answers, setB05Answers] = useState<Record<string, B05SlotAnswer>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [slotRefContractBlocked, setSlotRefContractBlocked] = useState(false);

  const activeScene = scenes[0];

  const runtimeHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...(runtimeFull.accessToken ? { Authorization: `Bearer ${runtimeFull.accessToken}` } : {}),
    }),
    [runtimeFull.accessToken],
  );

  const runtimeScope = useCallback(
    (idempotencyKey?: string) => ({
      tenant_id: runtimeFull.tenantId,
      case_id: runtimeFull.caseId,
      role_id: runtimeFull.roleId,
      activity_id: runtimeFull.activityId,
      run_id: runtimeFull.runId,
      client_session_id: sessionId,
      correlation_id: `gaby-runtime-full:${runtimeFull.runId}`,
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
    }),
    [runtimeFull, sessionId],
  );

  const loadRuntimeQuestion = useCallback(async () => {
    setSaving(true);
    setMessage("Preparando la siguiente pregunta...");
    setSlotRefContractBlocked(false);
    try {
      const params = new URLSearchParams(runtimeScope() as Record<string, string>);
      const response = await fetch(
        `/api/eve/runtime-40-20/client-bff/interaction?${params.toString()}`,
        { method: "GET", headers: runtimeHeaders() },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.client_safe_message ?? "No pudimos preparar la pregunta.");
      }
      if (!payload.runtime_interaction_id) {
        setViewModel(null);
        setRuntimeInteractionInstanceId(null);
        setMessage("");
        onComplete();
        return;
      }
      const mapped = mapServerViewModelToPresentation(payload.view_model);
      if (mapped.status === "blocked_runtime_slot_ref_contract") {
        setSlotRefContractBlocked(true);
        setViewModel(null);
        setMessage("Contrato slot_ref incompleto: el Runtime no entregó identidad opaca usable.");
        return;
      }
      setViewModel(mapped.viewModel);
      setRuntimeInteractionInstanceId(payload.runtime_interaction_instance_id ?? null);
      setRuntimeAnswers({});
      setB05Answers({});
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos preparar la pregunta.");
    } finally {
      setSaving(false);
    }
  }, [onComplete, runtimeHeaders, runtimeScope]);

  useEffect(() => {
    if (viewModel || saving || slotRefContractBlocked) return;
    const timer = window.setTimeout(() => {
      void loadRuntimeQuestion();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRuntimeQuestion, saving, slotRefContractBlocked, viewModel]);

  const submitRuntimeAnswer = async () => {
    if (!viewModel || !runtimeInteractionInstanceId) return;
    const b05ViewModel = isB05RuntimePresentation(viewModel)
      ? mapRuntimePresentationToB05(viewModel, {
          activityLiteral: activeScene?.sceneName,
          heading: "Bloque 0.5",
        })
      : null;
    const missing = b05ViewModel
      ? b05ViewModel.slots.find((slot) => {
          if (!slot.required) return false;
          return !b05AnswerToHumanValue(b05Answers[slot.field_key]).trim();
        })
      : viewModel.slots.find((slot) => {
          if (!slot.required) return false;
          return !String(runtimeAnswers[slot.slot_ref] ?? "").trim();
        });
    if (missing) {
      setMessage(
        `Falta responder: ${
          "short_ui_label" in missing
            ? missing.short_ui_label
            : missing.label ?? missing.name
        }`,
      );
      return;
    }
    setSaving(true);
    setMessage("Guardando respuesta...");
    try {
      const idempotencyKey = `gaby-runtime-full:${runtimeFull.runId}:${runtimeInteractionInstanceId}`;
      const response = await fetch("/api/eve/runtime-40-20/client-bff/answer", {
        method: "POST",
        headers: runtimeHeaders(),
        body: JSON.stringify({
          scope: runtimeScope(idempotencyKey),
          runtime_interaction_id: viewModel.runtime_interaction_id,
          runtime_interaction_instance_id: runtimeInteractionInstanceId,
          slot_answers: b05ViewModel
            ? b05ViewModel.slots
                .map((slot) => {
                  const answer = b05Answers[slot.field_key];
                  const displayValue = b05AnswerToHumanValue(answer);
                  return {
                    slot_ref: slot.slot_ref ?? "",
                    value: b05AnswerToRuntimeValue(answer),
                    displayValue,
                  };
                })
                .filter((answer) => answer.slot_ref && answer.displayValue.trim().length > 0)
                .map(({ slot_ref, value }) => ({ slot_ref, value }))
            : viewModel.slots
                .filter((slot) => String(runtimeAnswers[slot.slot_ref] ?? "").trim().length > 0)
                .map((slot) => ({
                  slot_ref: slot.slot_ref,
                  value: runtimeAnswers[slot.slot_ref],
                })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.client_safe_message ?? "No pudimos guardar la respuesta.");
      }
      if (!payload.next_runtime_interaction_id) {
        setViewModel(null);
        setRuntimeInteractionInstanceId(null);
        setRuntimeAnswers({});
        setMessage("");
        onComplete();
        return;
      }
      const mapped = mapServerViewModelToPresentation(payload.next_view_model);
      if (mapped.status === "blocked_runtime_slot_ref_contract") {
        setSlotRefContractBlocked(true);
        setViewModel(null);
        setMessage("Contrato slot_ref incompleto en siguiente interacción.");
        return;
      }
      setViewModel(mapped.viewModel);
      setRuntimeInteractionInstanceId(payload.next_runtime_interaction_instance_id ?? null);
      setRuntimeAnswers({});
      setB05Answers({});
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos guardar la respuesta.");
    } finally {
      setSaving(false);
    }
  };

  if (viewModel && isB05RuntimePresentation(viewModel)) {
    const b05ViewModel = mapRuntimePresentationToB05(viewModel, {
      activityLiteral: activeScene?.sceneName,
      heading: "Bloque 0.5",
    });
    return (
      <LocalCanvasB05Section
        answers={b05Answers}
        disabled={disabled || saving}
        note={message}
        onChange={(fieldKey, patch) =>
          setB05Answers((prev) => ({
            ...prev,
            [fieldKey]: { ...prev[fieldKey], ...patch },
          }))
        }
        onContinue={submitRuntimeAnswer}
        continueDisabled={saving || !runtimeInteractionInstanceId}
        continueLabel={saving ? "Guardando..." : "Continuar"}
        viewModel={b05ViewModel}
      />
    );
  }

  return (
    <RuntimeInteractionSheet
      activityTitle={activeScene?.sceneName}
      answers={runtimeAnswers}
      disabled={disabled}
      message={message}
      onChange={(slotRef, value) =>
        setRuntimeAnswers((prev) => ({ ...prev, [slotRef]: value }))
      }
      onSubmit={submitRuntimeAnswer}
      saving={saving}
      viewModel={viewModel}
    />
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import styles from "../styles/official-control-panel.module.css";
import type {
  ExperienceActionType,
  ExperienceScreenKey,
  ExperienceSupportQueueItemView,
} from "@/services/eve/official-control-panel/official-control-panel-experience.types";
import {
  EXPERIENCE_ACTION_LABELS,
  EXPERIENCE_MODE_INTRO,
} from "../presentation/experience-governance-presentation";
import { capabilityForAction } from "@/services/eve/official-control-panel/official-control-panel-experience.types";
import type { CapabilityVM } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import { resolveCapabilityAllowed } from "@/services/eve/official-control-panel/official-control-panel-capability-catalog";

export type SupportActionSubmitInput = {
  actionType: ExperienceActionType;
  reasonCode: string;
  beforeState: string;
  expectedEffect: string;
  screenKey: ExperienceScreenKey;
  userId: string;
  roleRuntimeSessionId: string | null;
  activityId: string | null;
  idempotencyKey: string;
};

type SupportActionDrawerProps = {
  open: boolean;
  item: ExperienceSupportQueueItemView | null;
  /** Canonical CapabilityVM matrix from envelope / GET experience-state. */
  capabilities: CapabilityVM[];
  mutationsBlocked?: boolean;
  mutationBlockReason?: string | null;
  onClose: () => void;
  onSubmit: (input: SupportActionSubmitInput) => Promise<void>;
};

const LOW_MEDIUM: ExperienceActionType[] = [
  "send_message",
  "resume_link",
  "request_reentry",
  "mark_manual_review",
];

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `exp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function SupportActionDrawer({
  open,
  item,
  capabilities,
  mutationsBlocked = false,
  mutationBlockReason = null,
  onClose,
  onSubmit,
}: SupportActionDrawerProps) {
  const [actionType, setActionType] =
    useState<ExperienceActionType>("send_message");
  const [reasonCode, setReasonCode] = useState("support_orientation");
  const [expectedEffect, setExpectedEffect] = useState(
    "Orientación sin cambio de evidencia",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const submitPromiseRef = useRef<Promise<void> | null>(null);
  const idempotencyKeyRef = useRef(newIdempotencyKey());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resetTransientState = () => {
    setBusy(false);
    setError(null);
    setActionType("send_message");
    setReasonCode("support_orientation");
    setExpectedEffect("Orientación sin cambio de evidencia");
    submitPromiseRef.current = null;
    idempotencyKeyRef.current = newIdempotencyKey();
  };

  if (!open || !item) return null;

  const allowedActions = LOW_MEDIUM.filter((a) =>
    resolveCapabilityAllowed(capabilities, capabilityForAction(a)),
  );

  const handleClose = () => {
    if (busy) return;
    resetTransientState();
    onClose();
  };

  const handleSubmit = async () => {
    if (
      busy ||
      submitPromiseRef.current ||
      allowedActions.length === 0 ||
      mutationsBlocked
    ) {
      return;
    }
    setBusy(true);
    setError(null);

    const run = (async () => {
      try {
        await onSubmit({
          actionType,
          reasonCode,
          beforeState: item.beforeState ?? item.source ?? "support_requested",
          expectedEffect,
          screenKey: item.screenKey,
          userId: item.userId,
          roleRuntimeSessionId: item.roleRuntimeSessionId,
          activityId: item.activityId,
          idempotencyKey: idempotencyKeyRef.current,
        });
        resetTransientState();
        onClose();
      } catch {
        if (!mountedRef.current) return;
        setError("No fue posible registrar la acción de soporte.");
        setBusy(false);
      } finally {
        submitPromiseRef.current = null;
      }
    })();

    submitPromiseRef.current = run;
    await run;
  };

  return (
    <aside
      className={styles.experienceActionDrawer}
      data-testid="support-action-drawer"
      aria-labelledby="support-action-heading"
    >
      <div className={styles.contextDrawerHeader}>
        <h3 id="support-action-heading">Acción de soporte</h3>
        <button
          type="button"
          className={styles.contextDrawerToggle}
          onClick={handleClose}
          disabled={busy}
        >
          Cerrar
        </button>
      </div>
      <p className={styles.workspaceEmptyMessage}>{EXPERIENCE_MODE_INTRO}</p>
      <p className={styles.workspaceEmptyMessage}>
        Pantalla: {item.screenLabel} · Usuario: {item.userId.slice(0, 8)}
      </p>
      <p
        className={styles.workspaceEmptyMessage}
        data-testid="support-action-prohibited"
      >
        Sin capability de alto riesgo activa: no se ofrecen reabrir bloque ni
        reset de sesión.
      </p>
      <label className={styles.experienceField}>
        Acción
        <select
          value={actionType}
          onChange={(e) =>
            setActionType(e.target.value as ExperienceActionType)
          }
          data-testid="support-action-type"
          disabled={busy || allowedActions.length === 0}
        >
          {allowedActions.map((a) => (
            <option key={a} value={a}>
              {EXPERIENCE_ACTION_LABELS[a]}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.experienceField}>
        Código de razón
        <input
          value={reasonCode}
          onChange={(e) => setReasonCode(e.target.value)}
          data-testid="support-action-reason"
          disabled={busy}
        />
      </label>
      <label className={styles.experienceField}>
        Efecto esperado
        <input
          value={expectedEffect}
          onChange={(e) => setExpectedEffect(e.target.value)}
          data-testid="support-action-effect"
          disabled={busy}
        />
      </label>
      {error ? (
        <p className={styles.manualWorkError} role="alert">
          {error}
        </p>
      ) : null}
      {mutationsBlocked && mutationBlockReason ? (
        <p
          className={styles.panelNoticeStale}
          role="status"
          data-testid="support-action-stale-block"
        >
          {mutationBlockReason}
        </p>
      ) : null}
      <button
        type="button"
        className={styles.contextRetryButton}
        disabled={busy || allowedActions.length === 0 || mutationsBlocked}
        data-testid="support-action-submit"
        onClick={() => {
          void handleSubmit();
        }}
      >
        Registrar acción
      </button>
    </aside>
  );
}

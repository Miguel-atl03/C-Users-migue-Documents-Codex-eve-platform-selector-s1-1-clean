"use client";

import { useId, useRef, useState } from "react";

import styles from "../styles/official-control-panel.module.css";
import type { ManualWorkLoadState } from "../hooks/use-case-manual-work";
import type {
  ManualProcessGroupView,
  ManualWorkAvailableActionView,
  ManualWorkItemView,
  ManualWorkProductAction,
} from "@/services/eve/official-control-panel/official-control-panel-manual-work.types";
import { presentManualActionReason } from "@/services/eve/official-control-panel/official-control-panel-manual-actions";
import type { PostCaseManualActionInput } from "../data/client-context-api";
import type { PostCaseManualDownloadInput } from "../data/client-context-api";
import {
  MANUAL_WORK_INTRO_COPY,
  presentHandoffStatus,
  presentManualEventType,
  presentManualTrackingStatus,
} from "../presentation/manual-work-presentation";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import type { MutationSafety } from "../state/official-panel-mutation-safety";
import { PanelScreenStateChrome } from "./PanelScreenStateChrome";

export type ManualWorkSubmitAction = (
  input: PostCaseManualActionInput,
) => Promise<unknown>;

export type ManualWorkDownloadAction = (
  input: PostCaseManualDownloadInput,
) => Promise<void>;

type ManualWorkPanelProps = {
  state: ManualWorkLoadState;
  screenState: OfficialPanelScreenState;
  requestId?: string | null;
  mutationSafety: MutationSafety;
  onRetry: () => void;
  onSubmitAction?: ManualWorkSubmitAction;
  onDownloadPackage?: ManualWorkDownloadAction;
  submitting?: boolean;
  selectedWorkItemId?: string | null;
};

type ActionDialogState = {
  item: ManualWorkItemView;
  action: ManualWorkProductAction;
  label: string;
  triggerEl: HTMLElement | null;
};

export function ManualWorkPanel({
  state,
  screenState,
  requestId = null,
  mutationSafety,
  onRetry,
  onSubmitAction,
  onDownloadPackage,
  submitting = false,
  selectedWorkItemId = null,
}: ManualWorkPanelProps) {
  const [dialog, setDialog] = useState<ActionDialogState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();

  const closeDialog = (restoreFocus = true) => {
    const trigger = dialog?.triggerEl;
    setDialog(null);
    setActionError(null);
    setReason("");
    setFile(null);
    if (restoreFocus && trigger) {
      queueMicrotask(() => trigger.focus());
    }
  };

  const runSimpleAction = async (
    item: ManualWorkItemView,
    actionView: ManualWorkAvailableActionView,
    trigger: HTMLElement,
  ) => {
    if (!actionView.allowed || busy || submitting) return;
    if (mutationSafety.mutationsBlocked) {
      setActionError(
        mutationSafety.blockReason ??
          "Actualice la información antes de realizar esta acción.",
      );
      return;
    }

    if (actionView.action === "download_package") {
      if (!onDownloadPackage || !item.latestInputArtifact) {
        setActionError("No hay un paquete fuente válido para descargar.");
        return;
      }
      setBusy(true);
      setActionError(null);
      try {
        await onDownloadPackage({
          workItemId: item.id,
          artifactVersionId: item.latestInputArtifact.id,
          expectedStatus: item.manualTrackingStatus,
          expectedVersion: item.version,
          idempotencyKey: crypto.randomUUID(),
        });
        void onRetry();
      } catch (err) {
        setActionError(safeActionError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!onSubmitAction) return;

    if (actionView.action === "attach_output") {
      setDialog({
        item,
        action: actionView.action,
        label: actionView.label,
        triggerEl: trigger,
      });
      setActionError(null);
      return;
    }

    if (
      actionView.action === "submit_review" ||
      actionView.action === "accept_output"
    ) {
      setDialog({
        item,
        action: actionView.action,
        label: actionView.label,
        triggerEl: trigger,
      });
      setActionError(null);
      return;
    }

    setBusy(true);
    setActionError(null);
    try {
      await onSubmitAction({
        workItemId: item.id,
        action: actionView.action,
        expectedStatus: item.manualTrackingStatus,
        expectedVersion: item.version,
        idempotencyKey: crypto.randomUUID(),
      });
      void onRetry();
    } catch (err) {
      setActionError(safeActionError(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmDialog = async () => {
    if (!dialog || !onSubmitAction || busy || submitting) return;
    if (mutationSafety.mutationsBlocked) {
      setActionError(
        mutationSafety.blockReason ??
          "Actualice la información antes de realizar esta acción.",
      );
      return;
    }
    setBusy(true);
    setActionError(null);

    try {
      const base = {
        workItemId: dialog.item.id,
        action: dialog.action,
        expectedStatus: dialog.item.manualTrackingStatus,
        expectedVersion: dialog.item.version,
        idempotencyKey: crypto.randomUUID(),
        reason: reason.trim() || undefined,
      };

      if (dialog.action === "attach_output") {
        if (!file) {
          setActionError("Debe adjuntar una salida antes de enviarla.");
          setBusy(false);
          return;
        }
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const sha256 = await sha256Hex(bytes);
        const contentBase64 = bufferToBase64(bytes);
        await onSubmitAction({
          ...base,
          attachFilename: file.name,
          attachContentType: file.type || "application/octet-stream",
          attachSha256: sha256,
          attachContentBase64: contentBase64,
        });
      } else if (dialog.action === "submit_review") {
        const artifactId = dialog.item.latestOutputArtifact?.id;
        if (!artifactId) {
          setActionError("Debe adjuntar una salida antes de enviarla.");
          setBusy(false);
          return;
        }
        await onSubmitAction({
          ...base,
          artifactVersionId: artifactId,
          reason: reason.trim() || "Envío a revisión",
        });
      } else if (dialog.action === "accept_output") {
        const artifactId = dialog.item.submittedArtifactVersionId;
        if (!artifactId) {
          setActionError("La salida aún no fue enviada a revisión.");
          setBusy(false);
          return;
        }
        await onSubmitAction({
          ...base,
          artifactVersionId: artifactId,
          reason: reason.trim() || "Aceptación de salida",
        });
      }

      closeDialog(true);
      void onRetry();
    } catch (err) {
      setActionError(safeActionError(err));
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  return (
    <section
      className={styles.manualWorkPanel}
      data-testid="manual-work-panel"
      data-screen-state={screenState}
      aria-labelledby="manual-work-heading"
    >
      <h3 className={styles.manualWorkTitle} id="manual-work-heading">
        Procesos manuales
      </h3>
      <p className={styles.manualWorkIntro}>{MANUAL_WORK_INTRO_COPY}</p>

      <PanelScreenStateChrome
        screenState={screenState}
        requestId={requestId}
        onRetry={onRetry}
        domainNotFoundMessage="Sin trabajo manual registrado."
      />

      {screenState === "loading" ||
      screenState === "fatal" ||
      screenState === "forbidden" ||
      screenState === "not_found"
        ? null
        : null}

      {state.status === "ready" && state.data.dataStatus === "empty" ? (
        <p className={styles.manualWorkEmpty} role="status">
          <span aria-hidden="true">!</span>{" "}
          Sin trabajo manual registrado.
        </p>
      ) : null}

      {state.status === "ready"
        ? state.data.processes.map((group) => (
            <ProcessGroup
              key={group.processCode}
              group={group}
              selectedWorkItemId={selectedWorkItemId}
              onAction={runSimpleAction}
              actionsDisabled={
                busy ||
                submitting ||
                mutationSafety.mutationsBlocked ||
                (!onSubmitAction && !onDownloadPackage)
              }
            />
          ))
        : null}

      {actionError && !dialog ? (
        <p className={styles.manualWorkError} role="alert">
          {actionError}
        </p>
      ) : null}

      {dialog ? (
        <aside
          className={styles.experienceActionDrawer}
          data-testid="manual-action-drawer"
          aria-labelledby={titleId}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.contextDrawerHeader}>
            <h3 id={titleId}>{dialog.label}</h3>
            <button
              type="button"
              className={styles.contextDrawerToggle}
              onClick={() => closeDialog(true)}
              disabled={busy}
            >
              Cerrar
            </button>
          </div>
          <p className={styles.workspaceEmptyMessage}>
            Proceso {dialog.item.processCode} · Estado{" "}
            {presentManualTrackingStatus(dialog.item.manualTrackingStatus)} ·
            Versión {dialog.item.version}
          </p>

          {dialog.action === "attach_output" ? (
            <label className={styles.experienceField}>
              Archivo de salida
              <input
                ref={fileInputRef}
                type="file"
                data-testid="manual-action-file"
                disabled={busy}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : null}

          {dialog.action === "submit_review" ||
          dialog.action === "accept_output" ? (
            <label className={styles.experienceField}>
              Motivo
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                data-testid="manual-action-reason"
                disabled={busy}
              />
            </label>
          ) : null}

          {actionError ? (
            <p className={styles.manualWorkError} role="alert">
              {actionError}
            </p>
          ) : null}

          <div className={styles.manualActionRow}>
            <button
              type="button"
              className={styles.contextRetryButton}
              data-testid="manual-action-confirm"
              disabled={busy}
              onClick={() => void confirmDialog()}
            >
              {busy ? "Procesando…" : "Confirmar"}
            </button>
          </div>
        </aside>
      ) : null}
    </section>
  );
}

function ProcessGroup({
  group,
  selectedWorkItemId,
  onAction,
  actionsDisabled,
}: {
  group: ManualProcessGroupView;
  selectedWorkItemId: string | null;
  onAction: (
    item: ManualWorkItemView,
    actionView: ManualWorkAvailableActionView,
    trigger: HTMLElement,
  ) => void;
  actionsDisabled: boolean;
}) {
  return (
    <article
      className={styles.manualProcessGroup}
      data-testid={`manual-process-${group.processCode}`}
    >
      <header className={styles.manualProcessHeader}>
        <h4 className={styles.manualProcessCode}>
          {group.processCode} · MANUAL
        </h4>
        <p className={styles.manualProcessLabel}>{group.processLabel}</p>
      </header>

      {group.dataStatus === "empty" ? (
        <p className={styles.manualWorkEmpty} role="status">
          <span aria-hidden="true">!</span>{" "}
          <strong>Sin registros.</strong>{" "}
          {group.emptyMessage ??
            "No hay trabajos manuales registrados para este proceso."}
        </p>
      ) : null}

      {group.dataStatus === "partial" && group.partialMessage ? (
        <p className={styles.manualWorkPartial} role="status">
          <span aria-hidden="true">!</span>{" "}
          <strong>Fuente incompleta.</strong> {group.partialMessage}
        </p>
      ) : null}

      {group.workItems.map((item) => (
        <WorkItemCard
          key={item.id}
          item={item}
          highlighted={selectedWorkItemId === item.id}
          onAction={onAction}
          actionsDisabled={actionsDisabled}
        />
      ))}
    </article>
  );
}

function WorkItemCard({
  item,
  highlighted,
  onAction,
  actionsDisabled,
}: {
  item: ManualWorkItemView;
  highlighted: boolean;
  onAction: (
    item: ManualWorkItemView,
    actionView: ManualWorkAvailableActionView,
    trigger: HTMLElement,
  ) => void;
  actionsDisabled: boolean;
}) {
  return (
    <div
      className={styles.manualWorkItem}
      data-testid={`manual-work-item-${item.id}`}
      data-highlighted={highlighted ? "true" : "false"}
      data-tracking-status={item.manualTrackingStatus}
      data-handoff-status={item.handoffStatus}
      data-version={item.version}
    >
      <dl className={styles.manualWorkFacts}>
        <Fact
          label="Estado actual"
          value={presentManualTrackingStatus(item.manualTrackingStatus)}
        />
        <Fact label="Versión" value={String(item.version)} />
        <Fact
          label="Objeto / insumo fuente"
          value={formatObjectState(
            item.sourceObjectLabel,
            item.sourceStateLabel,
          )}
        />
        <Fact
          label="Salida esperada"
          value={formatObjectState(
            item.expectedOutputObjectLabel,
            item.expectedOutputStateLabel,
          )}
        />
        <Fact
          label="Paquete fuente"
          value={formatArtifact(item.latestInputArtifact)}
        />
        <Fact
          label="Salida manual"
          value={formatArtifact(item.latestOutputArtifact)}
        />
        <Fact label="Responsable" value={item.responsibleLabel} />
        <Fact label="Fecha de apertura" value={formatDate(item.openedAt)} />
        <Fact label="Evento esperado" value={item.expectedEvent} />
        <Fact label="Fecha límite" value={formatDate(item.expectedHandoffAt)} />
        <Fact label="Último evento" value={formatDate(item.lastEventAt)} />
        <Fact
          label="Estado del handoff"
          value={presentHandoffStatus(item.handoffStatus)}
        />
        <Fact
          label="Atención requerida"
          value={item.attentionRequired ? "Sí" : "No"}
        />
      </dl>

      {item.overdueAlert ? (
        <div
          className={styles.manualOverdueAlert}
          data-testid="manual-handoff-overdue"
          role="status"
        >
          <p className={styles.manualOverdueTitle}>{item.overdueAlert.title}</p>
          <ul className={styles.manualOverdueDetails}>
            <li>Proceso: {item.overdueAlert.processCode}</li>
            <li>Trabajo: {item.overdueAlert.workItemId}</li>
            <li>Evento esperado: {item.overdueAlert.expectedEvent}</li>
            <li>Fecha límite: {formatDate(item.overdueAlert.dueAt)}</li>
            <li>Tiempo vencido: {item.overdueAlert.overdueDurationLabel}</li>
            {item.overdueAlert.responsibleLabel ? (
              <li>Responsable: {item.overdueAlert.responsibleLabel}</li>
            ) : null}
            <li>Siguiente revisión requerida: sí</li>
          </ul>
        </div>
      ) : null}

      <div
        className={styles.manualActionRow}
        data-testid={`manual-actions-${item.id}`}
      >
        {(item.availableActions ?? []).map((actionView) => {
          const deniedReason = presentManualActionReason(actionView.reasonCode);
          return (
            <div key={actionView.action} className={styles.manualActionControl}>
              <button
                type="button"
                className={styles.contextRetryButton}
                data-testid={`manual-action-${actionView.action}`}
                data-allowed={actionView.allowed ? "true" : "false"}
                disabled={!actionView.allowed || actionsDisabled}
                title={deniedReason ?? undefined}
                onClick={(e) =>
                  onAction(item, actionView, e.currentTarget)
                }
              >
                {actionView.label}
              </button>
              {!actionView.allowed && deniedReason ? (
                <span className={styles.manualActionReason} role="status">
                  {deniedReason}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <section
        className={styles.manualTimeline}
        aria-label="Línea temporal del trabajo manual"
        data-testid={`manual-timeline-${item.id}`}
      >
        <h5 className={styles.manualTimelineTitle}>Línea temporal</h5>
        {item.timeline.length === 0 ? (
          <p className={styles.manualWorkEmpty}>
            Sin eventos de auditoría registrados.
          </p>
        ) : (
          <ol className={styles.manualTimelineList}>
            {item.timeline.map((event) => (
              <li key={event.id} data-event-type={event.eventType}>
                <span>{formatDate(event.occurredAt)}</span>
                {" · "}
                <span>{event.actorLabel}</span>
                {" · "}
                <span>{presentManualEventType(event.eventType)}</span>
                {" · "}
                <span>
                  {presentManualTrackingStatus(event.beforeStatus)} →{" "}
                  {presentManualTrackingStatus(event.afterStatus)}
                </span>
                {event.reason ? ` · ${event.reason}` : ""}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (value == null || value === "") return null;
  return (
    <div className={styles.manualWorkFact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatObjectState(
  objectLabel: string | null,
  stateLabel: string | null,
): string | null {
  if (!objectLabel && !stateLabel) return null;
  if (objectLabel && stateLabel) return `${objectLabel} [${stateLabel}]`;
  return objectLabel ?? stateLabel;
}

function formatArtifact(
  artifact:
    | ManualWorkItemView["latestInputArtifact"]
    | ManualWorkItemView["latestOutputArtifact"],
): string | null {
  if (!artifact) return null;
  return `${artifact.sanitizedFilename} · v${artifact.versionNumber}`;
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function safeActionError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = String((err as { message?: unknown }).message ?? "");
    if (msg.includes("cambió") || msg.includes("STALE")) {
      return "La información cambió; actualice antes de continuar.";
    }
    if (msg.includes("autorización") || msg.includes("403")) {
      return "No tiene autorización para aceptar esta salida.";
    }
    if (msg) return msg;
  }
  return "No fue posible ejecutar la acción manual.";
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bufferToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

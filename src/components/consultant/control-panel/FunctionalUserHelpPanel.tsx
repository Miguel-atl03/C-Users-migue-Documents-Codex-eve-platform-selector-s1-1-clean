"use client";

import { useState } from "react";
import type {
  FunctionalUserHelpState,
  ManualActionKind,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import { MANUAL_ACTION_LABELS } from "@/services/eve/consultant-control-panel/consultant-control-panel-service";
import { AuditJustificationModal } from "./AuditJustificationModal";
import {
  AreaLabel,
  MetricTile,
  PanelCopy,
  PanelSection,
  PanelTitle,
  SectionTitle,
  StatusPill,
} from "./PanelChrome";
import styles from "./ccp.module.css";

function formatValue(value: string | null | undefined) {
  if (!value || !value.trim()) return "—";
  if (value === "sin_datos") return "Sin datos en alcance";
  return value;
}

export function FunctionalUserHelpPanel({
  state,
}: {
  state: FunctionalUserHelpState;
}) {
  const [pendingAction, setPendingAction] = useState<ManualActionKind | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <PanelSection>
      <div className="flex items-start justify-between gap-3">
        <div>
          <AreaLabel>Área 1 · Intervención</AreaLabel>
          <PanelTitle>Ayuda funcional al usuario</PanelTitle>
          <PanelCopy>{state.causal_purpose}</PanelCopy>
        </div>
        <StatusPill tone="warn">{formatValue(state.block_status)}</StatusPill>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <MetricTile label="Usuario" value={formatValue(state.user_label ?? state.user_id)} />
        <MetricTile label="Rol" value={formatValue(state.role_label ?? state.role_id)} />
        <MetricTile
          label="Actividad actual"
          value={formatValue(state.current_activity_label ?? state.current_activity_id)}
        />
        <MetricTile
          label="Bloque de preguntas"
          value={formatValue(state.current_question_block)}
        />
        <MetricTile
          label="Última interacción"
          value={formatValue(state.last_interaction_at)}
        />
        <MetricTile label="Empresa cliente" value={formatValue(state.client_company_name)} />
        <MetricTile
          label="Caso"
          value={formatValue(state.case_label ?? state.case_id)}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextList title="Preguntas pendientes" items={state.pending_questions} />
        <TextList title="Respuestas incompletas" items={state.incomplete_answers} />
        <TextList title="Errores o bloqueos" items={state.errors_or_blocks} />
        <div>
          <SectionTitle>Historial de intervención</SectionTitle>
          {state.intervention_history.length === 0 ? (
            <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">Sin intervenciones registradas.</p>
          ) : (
            <ul className="mt-1.5 space-y-1.5 text-sm leading-5 text-[var(--ccp-muted)]">
              {state.intervention_history.map((item) => (
                <li key={item.intervention_id}>
                  {item.timestamp} · {item.action} · {item.justification}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4">
        <SectionTitle>Controles manuales</SectionTitle>
        <p className="mt-1 text-xs text-[var(--ccp-faint)]">
          Cada control exige justificación y audit trail. Sin endpoint auditado permanece
          deshabilitado.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {state.manual_controls.map((control) => (
            <button
              key={control.action}
              className={styles.btnGhost}
              disabled={!control.enabled}
              onClick={() => {
                if (!control.enabled) {
                  setFeedback(control.reason_if_disabled ?? "Requiere endpoint auditado");
                  return;
                }
                setPendingAction(control.action);
              }}
              title={control.reason_if_disabled ?? undefined}
              type="button"
            >
              <span>{MANUAL_ACTION_LABELS[control.action]}</span>
              {!control.enabled ? (
                <span className="mt-0.5 block text-[0.68rem] font-normal text-[var(--ccp-faint)]">
                  {control.reason_if_disabled}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      </div>

      <AuditJustificationModal
        open={pendingAction !== null}
        title={
          pendingAction
            ? MANUAL_ACTION_LABELS[pendingAction]
            : "Acción manual"
        }
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          setFeedback("Requiere endpoint auditado");
          setPendingAction(null);
        }}
      />
    </PanelSection>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      {items.length === 0 ? (
        <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">Sin elementos.</p>
      ) : (
        <ul className="mt-1.5 space-y-1.5 text-sm leading-5 text-[var(--ccp-muted)]">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import type { PClient01WorkspaceVM } from "@/services/eve/consultant-control-panel/p-client-01-view-models";
import styles from "../ccp-pm.module.css";

function formatFreshness(asOf: string): string {
  try {
    const d = new Date(asOf);
    if (Number.isNaN(d.getTime())) return asOf;
    return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
  } catch {
    return asOf;
  }
}

/**
 * §3.1 Encabezado contextual P-CLIENT-01.
 * El Object[State] de ClientEngagement es el estado principal de negocio;
 * chips de usuario/rol/sesión son contexto técnico y no lo sustituyen.
 */
export function PClient01ContextHeader({
  workspace,
  alertCount,
}: {
  workspace: PClient01WorkspaceVM;
  alertCount: number;
}) {
  const header = workspace.context_header;
  const contract = workspace.architectural_contract;

  return (
    <header
      className={styles.pClientHeader}
      data-testid="ccp-pclient01-header"
      data-zone="context_header"
      data-engagement-epistemic={header.engagement_epistemic_status}
    >
      <div className={styles.pClientHeaderMain}>
        <div className={styles.pClientHeaderTitleRow}>
          <div>
            <p className={styles.areaLabel}>Proceso PM seleccionado · workspace contextual</p>
            <h2 className={styles.panelTitle}>{header.process_label}</h2>
          </div>
          <span className={styles.pillDisabled} title="Modo inicial contractual">
            READ-ONLY
          </span>
        </div>

        <p
          className={styles.pClientEngagementState}
          data-testid="ccp-pclient01-engagement-object-state"
          title="Object[State] de ClientEngagement — no sustituible por etapa UX ni WorkMap"
        >
          {header.engagement_object_state_display}
          {header.engagement_epistemic_status === "unavailable" ? (
            <em className={styles.pClientEpistemicHint}> · no capturado (sin inferencia)</em>
          ) : null}
        </p>

        <p className={styles.pClientHeaderContextLine}>
          <span>
            Caso{" "}
            <strong>{header.case_label ?? header.case_id ?? "—"}</strong>
            {header.case_id && header.case_label && header.case_label !== header.case_id
              ? ` (${header.case_id})`
              : null}
          </span>
          <span aria-hidden="true"> · </span>
          <span>
            Participante{" "}
            <strong>
              {header.participant_label ?? header.participant_user_id ?? "—"}
            </strong>
            {header.participant_user_id &&
            header.participant_label &&
            header.participant_label !== header.participant_user_id
              ? ` (${header.participant_user_id})`
              : null}
          </span>
        </p>

        <p className={styles.pClientHeaderContextLine}>
          <span>
            Perfil funcional:{" "}
            <strong>{header.functional_profile_label ?? "—"}</strong>
          </span>
          <span aria-hidden="true"> · </span>
          <span>
            role_runtime_session{" "}
            <strong>{header.role_runtime_session_id ?? "—"}</strong>
          </span>
          <span aria-hidden="true"> · </span>
          <span>
            Sesión{" "}
            <strong>
              {header.diagnostic_session_label ??
                header.diagnostic_session_id ??
                "—"}
            </strong>
          </span>
        </p>

        <p className={styles.pClientHeaderContextLine}>
          <span
            title={
              header.timer_epistemic_status === "unavailable"
                ? "Timer de habilitación no capturado en read model"
                : undefined
            }
          >
            Timer activo:{" "}
            <strong>
              {header.active_timer_code ?? "max_tiempo_habilitacion_sesion (no capturado)"}
            </strong>
            {header.active_timer_remaining_label
              ? ` · ${header.active_timer_remaining_label}`
              : null}
          </span>
          <span aria-hidden="true"> · </span>
          <span title={header.freshness_source}>
            Freshness: <strong>{formatFreshness(header.freshness_as_of)}</strong>
          </span>
        </p>

        <p className={styles.panelCopy}>
          Target: {contract.target_state}. Trigger: {contract.trigger}. Observación
          read-only; contexto ≠ evidencia MMABP confirmada.
        </p>
      </div>

      <div className={styles.pClientHeaderMeta} aria-label="Estado contextual P-CLIENT-01">
        <span className={styles.pillNeutral} title={contract.relation_to_p_core_01}>
          ↔ P-CORE-01
        </span>
        <span
          className={alertCount > 0 ? styles.pillWarn : styles.pillNeutral}
          title="Alertas del workspace; no elevan evidencia"
        >
          Alertas · {alertCount}
        </span>
        <span className={styles.pillNeutral} title={header.freshness_source}>
          Freshness · {header.freshness_source}
        </span>
        <span className={styles.pillNeutral} title={workspace.request_id}>
          request_id
        </span>
      </div>
    </header>
  );
}

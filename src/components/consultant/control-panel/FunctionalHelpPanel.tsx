"use client";

import type { ConsultantControlPanelState } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import { MANUAL_ACTION_LABELS } from "@/services/eve/consultant-control-panel/consultant-control-panel-service";
import styles from "./ccp.module.css";

const SEPARATION_SIGNALS = [
  {
    id: "ROLE_ASSIGNMENT_GAP",
    use: "Responsabilidades o actividades no asignadas a role_runtime_session",
  },
  {
    id: "mixed_unresolved",
    use: "Usuario con mezcla funcional sin separación confirmada",
  },
  {
    id: "single_confirmed",
    use: "Usuario operando bajo un solo rol funcional confirmado",
  },
  {
    id: "multi_confirmed",
    use: "Usuario con varios roles funcionales separados",
  },
] as const;

export function FunctionalHelpPanel({
  state,
  onOpenManualPreview,
}: {
  state: ConsultantControlPanelState;
  onOpenManualPreview?: () => void;
}) {
  const help = state.area_1_functional_help;
  const roleGap = state.critical_alerts.find((alert) => alert.alert_id === "ROLE_ASSIGNMENT_GAP");
  const selectedUser = state.area_2_client_progress.users.find(
    (user) => user.user_id === state.filters.user_id,
  );
  const separationState =
    selectedUser?.functional_separation_state ??
    (roleGap ? "mixed_unresolved" : "single_confirmed");

  return (
    <section className={styles.panel} data-testid="ccp-functional-help">
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.panelTitle}>FunctionalHelpPanel</h2>
          <p className={styles.muted}>
            Señales de separación usuario físico ↔ rol funcional. No diagnostica autoridad real.
          </p>
        </div>
        <span className={styles.pillWarn}>{separationState}</span>
      </div>

      <dl className={styles.detailGrid}>
        <div>
          <dt>Usuario físico</dt>
          <dd>
            {help.user_label ?? "—"} ({help.user_id ?? "—"})
          </dd>
        </div>
        <div>
          <dt>Rol funcional</dt>
          <dd>
            {help.role_label ?? "—"} · {help.role_purpose ?? "sin purpose"}
          </dd>
        </div>
        <div>
          <dt>Actividad</dt>
          <dd>{help.current_activity_label ?? "—"}</dd>
        </div>
        <div>
          <dt>Bloque</dt>
          <dd>
            {help.current_question_block ?? "—"} · {help.block_status ?? "—"}
          </dd>
        </div>
      </dl>

      <h3 className={styles.subTitle}>Señales de cobertura</h3>
      <ul className={styles.signalList}>
        {SEPARATION_SIGNALS.map((signal) => {
          const active =
            signal.id === "ROLE_ASSIGNMENT_GAP"
              ? Boolean(roleGap)
              : separationState === signal.id;
          return (
            <li
              key={signal.id}
              className={active ? styles.signalItemActive : styles.signalItem}
              data-testid={
                signal.id === "ROLE_ASSIGNMENT_GAP" && roleGap
                  ? "ccp-help-role-gap"
                  : undefined
              }
            >
              <strong>{signal.id}</strong>
              <span>{signal.use}</span>
            </li>
          );
        })}
      </ul>

      {roleGap ? (
        <p className={styles.alertWarn}>ROLE_ASSIGNMENT_GAP: {roleGap.message}</p>
      ) : null}

      <h3 className={styles.subTitle}>Controles manuales (preview contractual)</h3>
      <ul className={styles.controlList}>
        {help.manual_controls.map((control) => (
          <li key={control.action}>
            <button type="button" className={styles.btnGhost} disabled={!control.enabled}>
              {MANUAL_ACTION_LABELS[control.action]}
            </button>
            <span className={styles.muted}>
              {control.enabled ? "habilitado" : control.reason_if_disabled}
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className={styles.btnGhost} onClick={onOpenManualPreview}>
        Abrir ManualActionDrawer (disabled)
      </button>
    </section>
  );
}

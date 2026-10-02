"use client";

import { useMemo } from "react";
import type {
  ConsultantControlPanelState,
  ControlPanelFilterScope,
  FunctionalSeparationState,
  RuntimeBudgetByRunItem,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

const SEPARATION_LABELS: Record<FunctionalSeparationState, string> = {
  single_confirmed: "Un rol confirmado",
  multi_confirmed: "Varios roles confirmados",
  system_suggested_pending_confirmation: "Sugerido · pendiente de confirmación",
  mixed_unresolved: "Asignación mixta sin resolver",
  reentry_required: "Requiere reentrada",
  manual_review_required: "Requiere revisión manual",
};

type Option = { id: string; label: string };

type PrimaryActivityOption = Option & {
  runId: string;
  userId: string;
  roleId: string;
  roleRuntimeSessionId: string;
};

function uniqueById<T extends { id: string; label: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function resolveRuns(state: ConsultantControlPanelState): RuntimeBudgetByRunItem[] {
  return state.runs.length > 0
    ? state.runs
    : state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun;
}

export function RuntimeHierarchyFilterPanel({
  state,
  onSelect,
}: {
  state: ConsultantControlPanelState;
  onSelect: (next: Partial<ControlPanelFilterScope>) => void;
}) {
  const effective = state.meta.effective_scope;
  const selected = state.selected_context;
  const progress = state.area_2_client_progress;
  const runs = resolveRuns(state);

  const companies = useMemo(
    () =>
      uniqueById([
        ...state.filter_options.client_companies,
        ...(progress.client_company_id
          ? [
              {
                id: progress.client_company_id,
                label: progress.client_company_name ?? progress.client_company_id,
              },
            ]
          : []),
        ...(selected.companyName && effective.client_company_id
          ? [{ id: effective.client_company_id, label: selected.companyName }]
          : []),
      ]),
    [
      state.filter_options.client_companies,
      progress.client_company_id,
      progress.client_company_name,
      selected.companyName,
      effective.client_company_id,
    ],
  );

  const cases = useMemo(
    () =>
      uniqueById([
        ...state.filter_options.cases,
        ...(progress.case_id
          ? [{ id: progress.case_id, label: progress.case_label ?? progress.case_id }]
          : []),
        ...(selected.caseId
          ? [{ id: selected.caseId, label: selected.caseLabel ?? selected.caseId }]
          : []),
      ]),
    [
      state.filter_options.cases,
      progress.case_id,
      progress.case_label,
      selected.caseId,
      selected.caseLabel,
    ],
  );

  const users = useMemo(() => {
    const fromRuns = runs.map((run) => ({
      id: run.userId,
      label: run.userLabel || run.userId,
    }));
    const fromProgress = progress.users.map((user) => ({
      id: user.user_id,
      label: user.user_label,
    }));
    return uniqueById([...state.filter_options.users, ...fromProgress, ...fromRuns]);
  }, [state.filter_options.users, progress.users, runs]);

  const roles = useMemo(() => {
    const scopedRuns = effective.user_id
      ? runs.filter((run) => run.userId === effective.user_id)
      : runs;
    const fromRuns = scopedRuns.map((run) => ({
      id: run.roleRuntimeSessionId,
      label: run.role,
    }));
    const fromProgress = progress.users
      .filter((user) => !effective.user_id || user.user_id === effective.user_id)
      .flatMap((user) =>
        (user.role_runtime_sessions ?? []).map((session) => ({
          id: session.role_runtime_session_id,
          label: session.role_label,
        })),
      );
    return uniqueById([...fromRuns, ...fromProgress, ...state.filter_options.role_runtime_sessions]);
  }, [
    state.filter_options.role_runtime_sessions,
    progress.users,
    runs,
    effective.user_id,
  ]);

  const primaryActivities = useMemo(() => {
    const selectedUser = progress.users.find((user) => user.user_id === effective.user_id);
    const assignedIds = selectedUser?.activities?.length
      ? new Set(selectedUser.activities.map((activity) => activity.id))
      : null;

    const scopedRuns = runs.filter((run) => {
      if (effective.user_id && run.userId !== effective.user_id) return false;
      if (
        effective.role_runtime_session_id &&
        run.roleRuntimeSessionId !== effective.role_runtime_session_id
      ) {
        return false;
      }
      if (assignedIds && !assignedIds.has(run.activityId)) return false;
      return true;
    });

    const options: PrimaryActivityOption[] = [];
    const seen = new Set<string>();
    for (const run of scopedRuns) {
      if (!run.activityId || seen.has(run.activityId)) continue;
      seen.add(run.activityId);
      options.push({
        id: run.activityId,
        label: `${run.activityCode} · ${run.activityName}`,
        runId: run.activityRuntimeRunId,
        userId: run.userId,
        roleId: run.roleId,
        roleRuntimeSessionId: run.roleRuntimeSessionId,
      });
    }
    return options;
  }, [
    runs,
    progress.users,
    effective.user_id,
    effective.role_runtime_session_id,
  ]);

  const selectedUser = progress.users.find((user) => user.user_id === effective.user_id);
  const separationState = selectedUser?.functional_separation_state ?? null;
  const roleGap = state.critical_alerts.find(
    (alert) => alert.alert_id === "ROLE_ASSIGNMENT_GAP",
  );
  const showRoleGap =
    Boolean(roleGap) || separationState === "mixed_unresolved";

  const companyValue = effective.client_company_id ?? "";
  const caseValue = effective.case_id ?? "";
  const userValue = effective.user_id ?? "";
  const roleValue = effective.role_runtime_session_id ?? "";
  const activityValue = effective.activity_id ?? selected.activityId ?? "";

  return (
    <section
      className={styles.runtimeHierarchyPanelHorizontal}
      data-testid="ccp-runtime-hierarchy-filters"
      aria-label="Alcance operativo"
    >
      <div className={styles.runtimeHierarchyHead}>
        <h3 className={styles.runtimeHierarchyTitle}>Alcance operativo</h3>
        <p className={styles.muted}>
          Empresa → caso → usuario epistémico → función epistémica de trabajo → actividad
          primaria
        </p>
      </div>

      <div className={styles.runtimeHierarchyFiltersRow}>
        <label className={styles.runtimeFilterField}>
          <span className={styles.runtimeFilterLabel}>Empresa cliente</span>
          <select
            className={styles.runtimeFilterSelect}
            value={companyValue}
            onChange={(event) =>
              onSelect({
                client_company_id: event.target.value || null,
                runtime_view_scope: "selected_activity",
                view: "runtime",
              })
            }
          >
            <option value="">Todas / sin filtro</option>
            {companies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.runtimeFilterField}>
          <span className={styles.runtimeFilterLabel}>Caso diagnóstico</span>
          <select
            className={styles.runtimeFilterSelect}
            value={caseValue}
            onChange={(event) =>
              onSelect({
                case_id: event.target.value || null,
                runtime_view_scope: "selected_activity",
                view: "runtime",
              })
            }
          >
            <option value="">Todos / sin filtro</option>
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.runtimeFilterField}>
          <span className={styles.runtimeFilterLabel}>Usuario epistémico</span>
          <select
            className={styles.runtimeFilterSelect}
            value={userValue}
            onChange={(event) =>
              onSelect({
                user_id: event.target.value || null,
                role_runtime_session_id: null,
                role_id: null,
                activity_id: null,
                run_id: null,
                runtime_view_scope: "selected_activity",
                view: "runtime",
              })
            }
          >
            <option value="">Todos los usuarios</option>
            {users.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className={styles.runtimeFilterHint}>
            Usuario epistémico no es rol funcional ni login de plataforma.
            {userValue ? ` · user_id` : ""}
          </span>
        </label>

        <label className={styles.runtimeFilterField}>
          <span className={styles.runtimeFilterLabel}>Función epistémica de trabajo</span>
          <select
            className={styles.runtimeFilterSelect}
            value={roleValue}
            onChange={(event) => {
              const sessionId = event.target.value || null;
              const match = runs.find((run) => run.roleRuntimeSessionId === sessionId);
              onSelect({
                role_runtime_session_id: sessionId,
                role_id: match?.roleId ?? null,
                user_id: match?.userId ?? effective.user_id,
                activity_id: null,
                run_id: null,
                runtime_view_scope: "selected_activity",
                view: "runtime",
              });
            }}
          >
            <option value="">Todas las funciones</option>
            {roles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className={styles.runtimeFilterHint}>
            Función epistémica de trabajo no es el login. Un usuario puede tener varios
            roles.
            {roleValue ? ` · role_runtime_session_id` : ""}
          </span>
        </label>

        <label className={styles.runtimeFilterField}>
          <span className={styles.runtimeFilterLabel}>Actividad primaria</span>
          <select
            className={styles.runtimeFilterSelect}
            value={activityValue}
            data-testid="ccp-runtime-primary-activity-select"
            onChange={(event) => {
              const activityId = event.target.value || null;
              const match = primaryActivities.find((item) => item.id === activityId);
              onSelect({
                activity_id: activityId,
                run_id: match?.runId ?? null,
                user_id: match?.userId ?? effective.user_id,
                role_id: match?.roleId ?? effective.role_id,
                role_runtime_session_id:
                  match?.roleRuntimeSessionId ?? effective.role_runtime_session_id,
                runtime_view_scope: "selected_activity",
                view: "runtime",
              });
            }}
          >
            <option value="">Seleccionar actividad primaria</option>
            {primaryActivities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className={styles.runtimeFilterHint}>
            Solo actividades primarias asignadas al usuario y función epistémica
            seleccionados.
          </span>
        </label>
      </div>

      {separationState ? (
        <div
          className={styles.runtimeSeparationBadge}
          data-testid="ccp-runtime-separation-state"
          data-state={separationState}
        >
          <span className={styles.runtimeFilterLabel}>Estado de asignación</span>
          <strong>{SEPARATION_LABELS[separationState] ?? separationState}</strong>
        </div>
      ) : null}

      {showRoleGap ? (
        <div
          className={styles.runtimeRoleGapBanner}
          data-testid="ccp-runtime-role-assignment-gap"
          role="status"
        >
          <strong>ROLE_ASSIGNMENT_GAP</strong>
          <p>
            {roleGap?.message ??
              "La asignación funcional requiere revisión. Runtime sigue visible; no se bloquea la vista."}
          </p>
        </div>
      ) : null}
    </section>
  );
}

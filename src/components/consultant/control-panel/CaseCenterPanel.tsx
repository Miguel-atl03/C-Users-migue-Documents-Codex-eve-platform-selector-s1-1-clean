import type { ConsultantControlPanelState } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import {
  EmptyState,
  MetricTile,
  PanelCopy,
  PanelSection,
  PanelTitle,
  StatusPill,
} from "./PanelChrome";
import styles from "./ccp.module.css";

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  if (value === "sin_datos") return "Sin datos en alcance";
  return String(value);
}

export function CaseCenterPanel({
  state,
}: {
  state: ConsultantControlPanelState;
}) {
  const companySelected = Boolean(
    state.filters.client_company_id || state.area_2_client_progress.client_company_name,
  );
  const caseSelected = Boolean(
    state.filters.case_id || state.area_2_client_progress.case_label,
  );
  const hasScope = companySelected && caseSelected;

  const criticalBlockers = [
    ...state.area_1_functional_help.errors_or_blocks,
    ...state.area_2_client_progress.users.flatMap((user) => user.blockers),
  ];
  const uniqueBlockers = Array.from(new Set(criticalBlockers));
  const criticalBlockersCount =
    state.area_2_client_progress.critical_blockers_count ?? uniqueBlockers.length;

  const lastActivityCandidates = [
    state.area_1_functional_help.last_interaction_at,
    ...state.area_2_client_progress.users.map((user) => user.last_activity_at),
  ]
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a));
  const lastActivity = lastActivityCandidates[0] ?? null;

  const caseLabel =
    state.area_2_client_progress.case_label ??
    state.filter_options.cases.find((item) => item.id === state.filters.case_id)?.label ??
    state.filters.case_id;

  const readiness = state.area_3_operational_trace.readiness;
  const readinessLabel = readiness?.state
    ? readiness.state
    : state.area_3_operational_trace.readiness_gaps_count > 0
      ? `${state.area_3_operational_trace.readiness_gaps_count} gaps abiertos`
      : hasScope
        ? "Sin gaps reportados en alcance"
        : "Sin datos en alcance";

  const modeLabel =
    state.area_2_client_progress.case_mode ??
    "lectura / intervención auditada pendiente";

  return (
    <PanelSection>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`${styles.areaLabel} text-emerald-700`}>Situación del caso</p>
          <PanelTitle>Centro de casos</PanelTitle>
          <PanelCopy>
            Estado operativo del alcance seleccionado: empresa, bloqueos, readiness y última
            actividad.
          </PanelCopy>
        </div>
        <StatusPill tone="neutral">Modo: {modeLabel}</StatusPill>
      </div>

      {!hasScope ? (
        <EmptyState>
          Seleccione empresa y caso para gobernar el alcance operativo.
        </EmptyState>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MetricTile
            label="Empresa cliente"
            value={formatValue(
              state.area_2_client_progress.client_company_name ??
                state.filters.client_company_id,
            )}
          />
          <MetricTile label="Caso activo" value={formatValue(caseLabel)} />
          <MetricTile
            label="Estado del caso"
            value={formatValue(state.area_2_client_progress.case_status)}
          />
          <MetricTile label="Readiness" value={readinessLabel} />
          <MetricTile
            label="Usuarios en alcance"
            value={state.area_2_client_progress.users.length}
          />
          <MetricTile
            label="Bloqueos críticos"
            value={
              criticalBlockersCount
                ? `${criticalBlockersCount}${
                    uniqueBlockers.length ? ` · ${uniqueBlockers.join(", ")}` : ""
                  }`
                : "Ninguno en alcance"
            }
          />
          <MetricTile label="Última actividad" value={formatValue(lastActivity)} />
        </div>
      )}
    </PanelSection>
  );
}

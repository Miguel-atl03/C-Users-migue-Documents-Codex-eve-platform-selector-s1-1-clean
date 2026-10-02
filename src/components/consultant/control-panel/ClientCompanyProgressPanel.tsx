import type { ClientCompanyProgressState } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import {
  AreaLabel,
  EmptyState,
  MetricTile,
  PanelCopy,
  PanelSection,
  PanelTitle,
  SectionTitle,
  StatusPill,
} from "./PanelChrome";
import styles from "./ccp.module.css";

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  if (value === "sin_datos") return "Sin datos en alcance";
  return String(value);
}

export function ClientCompanyProgressPanel({
  state,
}: {
  state: ClientCompanyProgressState;
}) {
  return (
    <PanelSection>
      <div className="flex items-start justify-between gap-3">
        <div>
          <AreaLabel>Área 2</AreaLabel>
          <PanelTitle>Monitoreo empresa / usuario</PanelTitle>
          <PanelCopy>{state.causal_purpose}</PanelCopy>
        </div>
        <StatusPill tone="accent">{formatValue(state.case_status)}</StatusPill>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Empresa"
          value={formatValue(state.client_company_name ?? state.client_company_id)}
        />
        <MetricTile
          label="Caso"
          value={formatValue(state.case_label ?? state.case_id)}
        />
        <MetricTile label="Avance general" value={`${state.overall_progress_pct}%`} />
        <MetricTile label="Usuarios" value={state.users.length} />
      </div>

      <div className="mt-4">
        <SectionTitle>Roles asociados</SectionTitle>
        {state.associated_roles.length === 0 ? (
          <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">Sin roles en el alcance filtrado.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {state.associated_roles.map((role) => (
              <li key={role.role_id}>
                <StatusPill tone="neutral">{role.role_label}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <SectionTitle>Usuarios en monitoreo</SectionTitle>
        <p className="mt-1 text-xs text-[var(--ccp-faint)]">
          Primarias completas = actividades primarias con todos sus bloques Runtime 0/0.5/1–7
          cerrados (máx. 8 asignadas). Avance = bloques Runtime completados ÷ total de bloques
          de los runs abiertos de esas primarias.
        </p>
        {state.users.length === 0 ? (
          <EmptyState>
            Sin usuarios asociados en el alcance filtrado. Seleccione empresa y caso para
            monitorear avance sin tabla rota ni scroll horizontal vacío.
          </EmptyState>
        ) : (
          <ul className="mt-3 grid gap-2">
            {state.users.map((user) => (
              <li className={styles.listRow} key={user.user_id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--ccp-ink)]">{user.user_label}</p>
                    <p className="mt-1 text-sm text-[var(--ccp-muted)]">
                      Rol: {formatValue(user.role_label ?? user.role_id)}
                    </p>
                  </div>
                  <StatusPill tone={user.active ? "accent" : "neutral"}>
                    {user.active ? "Activo" : "Inactivo"}
                  </StatusPill>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Field
                    label="Actividades primarias asignadas"
                    value={`${user.activities_count} / 8 máx.`}
                  />
                  <Field
                    label="Primarias completas"
                    value={`${user.primary_activities_completed} / ${user.activities_count}`}
                  />
                  <Field label="Avance" value={`${user.progress_pct}%`} />
                  <Field
                    label="Bloques Runtime completados / pendientes"
                    value={`${user.blocks_completed} / ${user.blocks_pending}`}
                  />
                  <Field
                    label="Bloqueos"
                    value={user.blockers.length ? user.blockers.join(", ") : "—"}
                  />
                  <Field label="Última actividad" value={user.last_activity_at} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PanelSection>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className={styles.field}>
      <p className={styles.metricLabel}>{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--ccp-ink)]">{formatValue(value)}</p>
    </div>
  );
}

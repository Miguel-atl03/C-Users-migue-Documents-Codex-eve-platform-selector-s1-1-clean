"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type {
  ConsultantControlPanelState,
  ControlPanelFilterScope,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import type {
  ExperienceActionVM,
  HierarchyMatrixRowVM,
  JourneyStageId,
  UserExperienceVM,
  UserJourneyStageVM,
} from "@/services/eve/consultant-control-panel/p-client-01-view-models";
import { separationLabel } from "@/services/eve/consultant-control-panel/p-client-01-view-models";
import { CriticalAlertsStrip } from "../CriticalAlertsStrip";
import { EvidenceDetailDrawer } from "../EvidenceDetailDrawer";
import { ManualActionDrawer } from "../ManualActionDrawer";
import styles from "../ccp-pm.module.css";

function buildStateQuery(
  filters: ControlPanelFilterScope,
  fixtureId: string | null,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }
  params.set("include", "run-detail");
  if (fixtureId) {
    params.set(
      "fixture",
      fixtureId === "cerveceria_ambar_ancestral" ? "ambar" : fixtureId,
    );
  }
  return params.toString();
}

function statusClass(status: UserJourneyStageVM["status"]): string {
  switch (status) {
    case "completed":
      return styles.stageCompleted;
    case "active":
      return styles.stageActive;
    case "blocked":
      return styles.stageBlocked;
    case "review":
      return styles.stageReview;
    case "context_only":
      return styles.stageContext;
    default:
      return styles.stagePending;
  }
}

function ExperienceSummaryCards({ experience }: { experience: UserExperienceVM }) {
  const workMapLabel =
    experience.saved_work_map_exists == null
      ? "—"
      : experience.saved_work_map_exists
        ? experience.saved_with_warnings
          ? "Sí + flags"
          : "Sí"
        : "No";

  return (
    <div className={styles.pClientSummaryGrid} data-testid="ccp-pclient01-experience-summary">
      <article className={styles.pClientSummaryCard} title="No confundir con estado ClientEngagement">
        <span>Estado pantalla</span>
        <strong>{experience.screen_state ?? "—"}</strong>
        <em className={styles.muted}>sourceMode: {experience.source_mode ?? "—"}</em>
      </article>
      <article className={styles.pClientSummaryCard} title="No confundir con conformance de evidencia">
        <span>WorkMap</span>
        <strong>{workMapLabel}</strong>
      </article>
      <article className={styles.pClientSummaryCard} title="No confundir con organigrama">
        <span>Cobertura funcional</span>
        <strong>{separationLabel(experience.functional_separation_state)}</strong>
        <em className={styles.muted}>{experience.functional_separation_state ?? "—"}</em>
      </article>
      <article className={styles.pClientSummaryCard} title="Elegibles ≠ primarias seleccionadas">
        <span>Elegibles</span>
        <strong>
          {experience.eligible_count == null ? "—" : experience.eligible_count}
        </strong>
        <em className={styles.muted}>
          flattened caso: {experience.flattened_activities_count ?? "—"}
        </em>
      </article>
      <article className={styles.pClientSummaryCard} title="No confundir con readiness">
        <span>Primarias</span>
        <strong>
          {experience.selected_count == null
            ? "—"
            : `${experience.selected_count} / ${experience.policy_max_primaries}`}
        </strong>
      </article>
      <article className={styles.pClientSummaryCard} title="No confundir con proceso PM">
        <span>Actividad actual</span>
        <strong>{experience.current_activity?.label ?? "—"}</strong>
        <em className={styles.muted}>
          {experience.current_activity
            ? `${experience.current_activity.role_label ?? "—"} · run ${experience.current_activity.run_id ?? "—"}`
            : "—"}
        </em>
      </article>
      <article className={styles.pClientSummaryCard}>
        <span>Runtime runs</span>
        <strong>
          {experience.runtime_runs_active} / {experience.runtime_runs_total}
        </strong>
      </article>
      <article
        className={styles.pClientSummaryCard}
        title="No confundir con autorización manual del consultor"
      >
        <span>Continuación</span>
        <strong>
          {experience.continue_enabled
            ? "Habilitada"
            : experience.continue_reason_code ?? "Bloqueada"}
        </strong>
      </article>
    </div>
  );
}

function UserJourneyStageRail({
  stages,
  selectedStageId,
  onSelect,
}: {
  stages: UserJourneyStageVM[];
  selectedStageId: JourneyStageId;
  onSelect: (id: JourneyStageId) => void;
}) {
  return (
    <ol className={styles.pClientJourneyRail} aria-label="Jornada del participante">
      {stages.map((stage) => {
        const selected = stage.stage_id === selectedStageId;
        return (
          <li key={stage.stage_id}>
            <button
              type="button"
              className={`${styles.pClientJourneyNode} ${statusClass(stage.status)} ${
                selected ? styles.pClientJourneyNodeSelected : ""
              }`}
              aria-current={selected ? "step" : undefined}
              aria-label={`${stage.label}: ${stage.status}${
                stage.reason_code ? ` · ${stage.reason_code}` : ""
              }`}
              onClick={() => onSelect(stage.stage_id)}
            >
              <span className={styles.pClientJourneyLabel}>{stage.label}</span>
              <span className={styles.pClientJourneyStatus}>{stage.status}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function JourneyStageDetailPanel({ stage }: { stage: UserJourneyStageVM | null }) {
  if (!stage) {
    return (
      <section className={styles.pClientDetailPanel}>
        <p className={styles.muted}>Seleccione una etapa de la jornada.</p>
      </section>
    );
  }

  return (
    <section className={styles.pClientDetailPanel} data-testid="ccp-pclient01-stage-detail">
      <h4 className={styles.subTitle}>
        {stage.label}{" "}
        <span className={styles.pillNeutral}>{stage.stage_id}</span>
      </h4>
      <dl className={styles.pClientDetailGrid}>
        <div>
          <dt>Estado</dt>
          <dd>{stage.status}</dd>
        </div>
        <div>
          <dt>reason_code</dt>
          <dd>{stage.reason_code ?? "—"}</dd>
        </div>
        <div>
          <dt>source_object / state</dt>
          <dd>
            {stage.source_object ?? "—"}
            {stage.source_state ? ` · ${stage.source_state}` : ""}
          </dd>
        </div>
        <div>
          <dt>source_mode / epistemic</dt>
          <dd>
            {stage.source_mode ?? "—"} · {stage.epistemic_status}
          </dd>
        </div>
        <div>
          <dt>actor</dt>
          <dd>
            {stage.actor_type ?? "—"}
            {stage.actor_id ? ` · ${stage.actor_id}` : ""}
          </dd>
        </div>
        <div>
          <dt>Timestamps</dt>
          <dd title={`UTC ${stage.last_updated_at ?? ""}`}>
            start {stage.started_at ?? "—"} · end {stage.completed_at ?? "—"} · upd{" "}
            {stage.last_updated_at ?? "—"}
          </dd>
        </div>
        <div>
          <dt>Bloqueo</dt>
          <dd>{stage.blocking_condition ?? "—"}</dd>
        </div>
        <div>
          <dt>Siguiente paso</dt>
          <dd>{stage.recommended_next_step ?? "—"}</dd>
        </div>
        <div>
          <dt>Reentry target</dt>
          <dd>{stage.reentry_target ?? "—"}</dd>
        </div>
        <div>
          <dt>audit_refs</dt>
          <dd>{stage.audit_refs.join(" · ") || "—"}</dd>
        </div>
      </dl>

      {stage.detail_fields.length > 0 ? (
        <>
          <h5 className={styles.subTitle}>Campos de la etapa (DOCX §4.3)</h5>
          <dl className={styles.pClientDetailGrid}>
            {stage.detail_fields.map((item) => (
              <div key={item.key}>
                <dt>{item.label}</dt>
                <dd>{item.value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      {stage.warnings.length > 0 ? (
        <ul className={styles.pClientWarningList}>
          {stage.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <p className={styles.muted}>
        Las etapas UX no son estados de ClientEngagement. Contexto ≠ evidencia MMABP confirmada.
      </p>
    </section>
  );
}

function ExperienceActions({
  actions,
  onAction,
}: {
  actions: ExperienceActionVM[];
  onAction: (action: ExperienceActionVM) => void;
}) {
  return (
    <div className={styles.pClientActions} data-testid="ccp-pclient01-actions">
      {actions
        .filter((action) => action.visible)
        .map((action) => (
          <button
            key={action.action_id}
            type="button"
            className={styles.pClientGhostBtn}
            disabled={!action.enabled}
            title={
              action.enabled
                ? action.label
                : `${action.reason_code ?? "disabled"} · preview contractual`
            }
            onClick={() => onAction(action)}
          >
            {action.label}
            {!action.enabled && action.reason_code ? (
              <span className={styles.pillDisabled}>{action.reason_code}</span>
            ) : null}
          </button>
        ))}
    </div>
  );
}

function UserRoleSessionHierarchyMatrix({
  rows,
  onSelect,
}: {
  rows: HierarchyMatrixRowVM[];
  onSelect?: (next: Partial<ControlPanelFilterScope>) => void;
}) {
  return (
    <section className={styles.pClientMatrix} data-testid="ccp-pclient01-hierarchy-matrix">
      <p className={styles.muted}>
        EmpresaCliente → Caso → user_id → role_runtime_session → responsabilidad → actividad →
        run. No fusionar runs entre perfiles.
      </p>
      {rows.length === 0 ? (
        <p className={styles.muted}>Sin usuarios en alcance.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.pClientTable}>
            <caption className={styles.muted}>
              Matriz jerárquica user → RRS → responsabilidad/actividad → run
            </caption>
            <thead>
              <tr>
                <th>Usuario físico</th>
                <th>role_runtime_session</th>
                <th>Responsabilidad</th>
                <th>Actividad</th>
                <th>Run</th>
                <th>Separación</th>
                <th>Alerta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.user_id}-${row.role_runtime_session_id ?? "none"}-${row.activity_id ?? "none"}`}
                >
                  <td>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() =>
                        onSelect?.({
                          user_id: row.user_id,
                          role_runtime_session_id: null,
                          activity_id: null,
                          run_id: null,
                        })
                      }
                    >
                      {row.user_label}
                    </button>
                    <div className={styles.cellMeta}>{row.user_id}</div>
                  </td>
                  <td>
                    {row.role_runtime_session_id ? (
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() =>
                          onSelect?.({
                            user_id: row.user_id,
                            role_runtime_session_id: row.role_runtime_session_id,
                            role_id: row.role_id,
                          })
                        }
                      >
                        {row.role_label}
                      </button>
                    ) : (
                      "—"
                    )}
                    <div className={styles.cellMeta}>
                      {row.role_runtime_session_id ?? "sin RRS"}
                    </div>
                  </td>
                  <td>{row.responsibility_label ?? "—"}</td>
                  <td>
                    {row.activity_id ? (
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() =>
                          onSelect?.({
                            user_id: row.user_id,
                            role_runtime_session_id: row.role_runtime_session_id,
                            activity_id: row.activity_id,
                            run_id: row.run_id,
                          })
                        }
                      >
                        {row.activity_label}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div>{row.run_id ?? "—"}</div>
                    <div className={styles.cellMeta}>{row.run_state ?? ""}</div>
                  </td>
                  <td>{row.functional_separation_state ?? "—"}</td>
                  <td>{row.alert ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function UserExperienceView({
  state,
  experience,
  onStateLoaded,
}: {
  state: ConsultantControlPanelState;
  experience: UserExperienceVM;
  onStateLoaded?: (next: ConsultantControlPanelState) => void;
}) {
  const defaultStage =
    experience.stages.find((stage) => stage.status === "active" || stage.status === "review")
      ?.stage_id ??
    experience.stages[0]?.stage_id ??
    "login_demo";
  const [selectedStageId, setSelectedStageId] = useState<JourneyStageId>(defaultStage);
  const [manualOpen, setManualOpen] = useState(false);
  const [evidence, setEvidence] = useState<{ title: string; body: string } | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedStageId(defaultStage);
  }, [defaultStage, state.filters.user_id, state.filters.role_runtime_session_id]);

  const selectedStage = useMemo(
    () => experience.stages.find((stage) => stage.stage_id === selectedStageId) ?? null,
    [experience.stages, selectedStageId],
  );

  const users = state.filter_options.users;
  const roleSessions = state.filter_options.role_runtime_sessions.filter((session) => {
    if (!state.filters.user_id) return true;
    const user = state.area_2_client_progress.users.find(
      (item) => item.user_id === state.filters.user_id,
    );
    return (user?.role_runtime_sessions ?? []).some(
      (rrs) => rrs.role_runtime_session_id === session.id,
    );
  });

  const applyScope = (partial: Partial<ControlPanelFilterScope>) => {
    const next: ControlPanelFilterScope = {
      ...state.filters,
      ...partial,
    };
    setFilterError(null);
    startTransition(async () => {
      try {
        const query = buildStateQuery(next, state.fixture?.id ?? null);
        const response = await fetch(
          `/api/eve/consultant/control-panel/state${query ? `?${query}` : ""}`,
          {
            headers: {
              "x-eve-consultant-role": state.access.consultant_role ?? "consultant",
              "X-EVE-Contract-Version": "1.0",
            },
            cache: "no-store",
          },
        );
        if (!response.ok) {
          setFilterError("No se pudo aplicar el alcance (403/error BFF).");
          return;
        }
        const payload = (await response.json()) as ConsultantControlPanelState;
        onStateLoaded?.(payload);
      } catch {
        setFilterError("Error de red al refrescar alcance BFF.");
      }
    });
  };

  const onAction = (action: ExperienceActionVM) => {
    if (action.action_id === "view_detail" && selectedStage) {
      setEvidence({
        title: `Detalle etapa · ${selectedStage.label}`,
        body: JSON.stringify(selectedStage, null, 2),
      });
      return;
    }
    if (action.action_id === "open_evidence" && selectedStage) {
      setEvidence({
        title: `Evidencia relacionada · ${selectedStage.label}`,
        body: JSON.stringify(
          {
            stage_id: selectedStage.stage_id,
            source_object: selectedStage.source_object,
            source_state: selectedStage.source_state,
            detail_fields: selectedStage.detail_fields,
            audit_refs: selectedStage.audit_refs,
            epistemic_status: selectedStage.epistemic_status,
            note: "Solo lectura. No edita evidencia ni eleva contexto a evidencia confirmada.",
          },
          null,
          2,
        ),
      });
      return;
    }
    if (!action.enabled) {
      setManualOpen(true);
    }
  };

  return (
    <section data-testid="ccp-pclient01-experience" aria-labelledby="pclient01-experience-title">
      <div className={styles.pClientSectionHead}>
        <div>
          <p className={styles.areaLabel}>Vista 1</p>
          <h3 id="pclient01-experience-title" className={styles.panelTitle} tabIndex={-1}>
            Experiencia usuario
          </h3>
          <p className={styles.panelCopy}>
            ¿Dónde está el usuario, bajo qué perfil funcional y qué condición impide o habilita el
            siguiente tramo?
          </p>
        </div>
      </div>

      <div className={styles.pClientFilters}>
        <label>
          Usuario
          <select
            value={state.filters.user_id ?? ""}
            disabled={isPending}
            onChange={(event) =>
              applyScope({
                user_id: event.target.value || null,
                role_runtime_session_id: null,
                activity_id: null,
                run_id: null,
              })
            }
          >
            <option value="">Todos en alcance</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Perfil funcional (RRS)
          <select
            value={state.filters.role_runtime_session_id ?? ""}
            disabled={isPending}
            onChange={(event) =>
              applyScope({
                role_runtime_session_id: event.target.value || null,
              })
            }
          >
            <option value="">Todos</option>
            {roleSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.label}
              </option>
            ))}
          </select>
        </label>
        <label title="session_id diagnóstica aún no está en el contrato BFF (REPO-TBD)">
          Sesión diagnóstica
          <select disabled value="">
            <option value="">SESSION_ID_REPO_TBD</option>
          </select>
        </label>
        <button
          type="button"
          className={styles.pClientGhostBtn}
          disabled={isPending}
          onClick={() => applyScope({})}
        >
          {isPending ? "Actualizando…" : "Refrescar"}
        </button>
      </div>
      {filterError ? <p className={styles.pClientWarning}>{filterError}</p> : null}

      <ExperienceSummaryCards experience={experience} />

      {experience.selected_primary_activities.length > 0 ? (
        <div className={styles.pClientBlock}>
          <h4 className={styles.subTitle}>Primarias seleccionadas (máx. política 8)</h4>
          <ul className={styles.pClientPrimaryList}>
            {experience.selected_primary_activities.map((activity) => (
              <li key={activity.activity_id}>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() =>
                    applyScope({
                      activity_id: activity.activity_id,
                      run_id: activity.run_id,
                      role_runtime_session_id: activity.role_runtime_session_id,
                    })
                  }
                >
                  {activity.label}
                </button>
                <span className={styles.cellMeta}>
                  run {activity.run_id ?? "—"} · rrs{" "}
                  {activity.role_runtime_session_id ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.pClientBlock}>
        <h4 className={styles.subTitle}>Jornada / etapas</h4>
        <UserJourneyStageRail
          stages={experience.stages}
          selectedStageId={selectedStageId}
          onSelect={setSelectedStageId}
        />
      </div>

      <div className={styles.pClientSplit}>
        <JourneyStageDetailPanel stage={selectedStage} />
        <div>
          <CriticalAlertsStrip alerts={experience.experience_alerts} />
          <ExperienceActions actions={experience.actions} onAction={onAction} />
        </div>
      </div>

      <div className={styles.pClientBlock}>
        <h4 className={styles.subTitle}>
          Matriz usuario → role session → responsabilidad/actividad → run
        </h4>
        <UserRoleSessionHierarchyMatrix
          rows={experience.hierarchy_rows}
          onSelect={applyScope}
        />
      </div>

      <EvidenceDetailDrawer
        open={Boolean(evidence)}
        title={evidence?.title ?? ""}
        body={evidence?.body ?? ""}
        onClose={() => setEvidence(null)}
      />
      <ManualActionDrawer
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        capabilities={state.capabilities}
      />
    </section>
  );
}

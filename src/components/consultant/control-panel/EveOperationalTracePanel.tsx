import {
  EMPTY_BASE_RESOLUTION_GATE,
  EMPTY_CAUSAL_CLOSURE_GATE,
} from "@/services/eve/consultant-control-panel/fixtures/ambar-runtime-4020-operational-ledgers";
import type {
  OperationalTraceEvent,
  OperationalTraceState,
  RuntimeBlockCoverageStatus,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import {
  AreaLabel,
  EmptyState,
  PanelSection,
  PanelTitle,
  SectionTitle,
  StatusPill,
} from "./PanelChrome";
import styles from "./ccp.module.css";

const CAUSAL_CHAIN_STEPS = [
  { id: "user_input", label: "Usuario responde" },
  { id: "actor_scene", label: "Actor" },
  { id: "actor_scene_scene", label: "Escena" },
  { id: "client_company", label: "Empresa cliente" },
  { id: "evidence", label: "Subcampo" },
  { id: "evidence_item", label: "Evidencia" },
  { id: "variable_or_gap", label: "Variable / gap" },
  { id: "gate_or_readiness", label: "Gate" },
  { id: "readiness", label: "Readiness" },
  { id: "consultant_packet", label: "Paquete consultor" },
  { id: "authorized_output", label: "Salida autorizada" },
] as const;

const BUDGET_SCOPE_NOTE =
  "El presupuesto 40/20 se calcula por activity_runtime_run de una actividad primaria dentro de una role_runtime_session. No es un presupuesto agregado de la empresa cliente ni del caso completo.";

const OPERATIONAL_RULE_TEXT =
  "40/20 no significa consumo opcional reducido. Significa 40 base obligatorias por resolución y 20 causales evaluadas por cada activity_runtime_run.";

const INTERACTION_PERSISTENCE_TEXT =
  "Una interacción puede no mostrarse al usuario, pero no puede desaparecer: debe quedar capturada, confirmada, derivada, calculada, no aplicable con evidencia, flagged, reentry o manual review.";

const BLOCK_COVERAGE_NOTE =
  "Cada actividad primaria seleccionada abre un activity_runtime_run. Los bloques 0, 0.5 y 1–7 se recorren dentro de cada run. No se reparten globalmente entre actividades.";

const SCENE_CANDIDATES_NOTE =
  "Un rol funcional puede generar varias escenas, pero la escena no nace del rol aislado. La escena emerge de rol + actividad primaria + activity_runtime_run + contexto operativo + evidencia/gaps/eventos relevantes.";

const GATES_REGULATORY_NOTE =
  "Los gates no sustituyen los bloques de captura. Regulan calidad, frontera, readiness y No-Go sobre información capturada por los bloques Runtime.";

const CAUSAL_STEP_TO_CHAIN: Record<string, string> = {
  user_input: "Usuario responde",
  actor_scene: "Actor / Escena",
  transduction: "Empresa cliente",
  client_company: "Empresa cliente",
  evidence: "Evidencia",
  variable_or_gap: "Variable / gap",
  gate_or_readiness: "Gate / Readiness",
  audit: "Paquete consultor",
};

function formatBadge(value: string) {
  if (value === "sin_datos") return "Sin datos en alcance";
  return value;
}

function blockStatusTone(
  status: RuntimeBlockCoverageStatus,
): "accent" | "warn" | "info" | "neutral" {
  switch (status) {
    case "completed":
      return "accent";
    case "active":
      return "info";
    case "review_required":
    case "blocked":
      return "warn";
    default:
      return "neutral";
  }
}

function sceneStatusTone(status: string): "accent" | "warn" | "info" | "neutral" {
  if (status.includes("blocked") || status.includes("pending_review")) return "warn";
  if (status.includes("ready")) return "accent";
  if (status.includes("candidate")) return "info";
  return "neutral";
}

function groupTimelineByUser(events: OperationalTraceEvent[]) {
  const groups: Array<{
    userKey: string;
    userLabel: string;
    events: OperationalTraceEvent[];
  }> = [];
  for (const event of events) {
    const userKey = event.user_id ?? event.actor_ref ?? "sin-usuario";
    const userLabel = event.user_label ?? event.actor_ref ?? "Usuario sin etiquetar";
    const existing = groups.find((group) => group.userKey === userKey);
    if (existing) {
      existing.events.push(event);
    } else {
      groups.push({ userKey, userLabel, events: [event] });
    }
  }
  return groups;
}

function resolveActiveCausalStep(events: OperationalTraceEvent[]): string | null {
  if (events.length === 0) return null;
  const latest = [...events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))[0];
  return CAUSAL_STEP_TO_CHAIN[latest.causal_step] ?? latest.causal_step;
}

export function EveOperationalTracePanel({
  state,
}: {
  state: OperationalTraceState;
}) {
  const budget = state.runtimeBudget4020;
  const caseAgg = budget.caseAggregate;
  const timelineGroups = groupTimelineByUser(state.timeline);
  const activeCausalStep = resolveActiveCausalStep(state.timeline);
  const sceneCount = state.sceneCandidatesByRun.length;
  const baseGate = state.base_resolution_gate ?? EMPTY_BASE_RESOLUTION_GATE;
  const causalGate = state.causal_closure_gate ?? EMPTY_CAUSAL_CLOSURE_GATE;
  const sufficiencyNote = budget.operationalSufficiencyNote || OPERATIONAL_RULE_TEXT;
  const operationalRulesAbsent =
    (state.baseResolutionByRun?.length ?? 0) === 0 ||
    (state.causalClosureByRun?.length ?? 0) === 0 ||
    (baseGate.evaluated_or_resolved_or_explicitly_blocked === 0 &&
      causalGate.evaluated === 0);

  return (
    <PanelSection>
      <div className="flex items-start justify-between gap-3">
        <div>
          <AreaLabel>Área 3</AreaLabel>
          <PanelTitle>Trazabilidad operativa EVE</PanelTitle>
        </div>
        <StatusPill tone="info">{formatBadge(state.transduction_status)}</StatusPill>
      </div>

      <div className="mt-4">
        <SectionTitle>Cadena causal esperada</SectionTitle>
        <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">
          Marca el tramo operativo actual de la traza filtrada (usuario / run en alcance) y
          conecta con la línea temporal y las escenas candidatas debajo.
        </p>
        <ol className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {CAUSAL_CHAIN_STEPS.map((step, index) => {
            const isActive =
              activeCausalStep !== null &&
              (activeCausalStep === step.label ||
                activeCausalStep.includes(step.label) ||
                (step.label === "Actor" && activeCausalStep.includes("Actor")) ||
                (step.label === "Escena" && activeCausalStep.includes("Escena")) ||
                (step.label === "Gate" && activeCausalStep.includes("Gate")) ||
                (step.label === "Readiness" && activeCausalStep.includes("Readiness")));
            return (
              <li className="flex items-center gap-1.5" key={step.id}>
                <span
                  className={`${styles.chainStep} ${isActive ? styles.chainStepActive : ""}`}
                >
                  {step.label}
                </span>
                {index < CAUSAL_CHAIN_STEPS.length - 1 ? (
                  <span aria-hidden className={`${styles.chainArrow} text-emerald-700`}>
                    →
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
        {activeCausalStep ? (
          <p className="mt-2 text-xs font-medium text-[var(--ccp-ink)]">
            Tramo activo en alcance: {activeCausalStep}
          </p>
        ) : (
          <p className="mt-2 text-xs text-[var(--ccp-faint)]">
            Sin eventos en alcance para marcar tramo activo.
          </p>
        )}
      </div>

      <div className="mt-4">
        <SectionTitle>Relación causal → panel</SectionTitle>
        <div className={styles.listRow}>
          <p className="text-sm text-[var(--ccp-ink)]">{state.actor_scene_company_relation}</p>
          <p className="mt-2 text-xs text-[var(--ccp-muted)]">
            Conecta con:{" "}
            <a className="font-semibold text-emerald-800 underline" href="#ccp-timeline">
              Línea temporal causal
            </a>
            {" · "}
            <a className="font-semibold text-emerald-800 underline" href="#ccp-scene-candidates">
              Escenas candidatas ({sceneCount})
            </a>
            {" · "}
            <a className="font-semibold text-emerald-800 underline" href="#ccp-sup-link">
              objetos SUP (P-SUP-01)
            </a>
            . No genera diagnóstico final automático.
          </p>
        </div>
      </div>

      <div className="mt-4" id="ccp-timeline">
        <SectionTitle>Línea temporal causal</SectionTitle>
        <p className="mt-1 text-xs text-[var(--ccp-faint)]">
          Agrupada por usuario: cada bloque marca inicio y fin del tramo de ese usuario en el
          alcance filtrado.
        </p>
        {timelineGroups.length === 0 ? (
          <EmptyState>
            Sin eventos en el alcance filtrado. Ajuste empresa, caso, usuario, actividad o run.
          </EmptyState>
        ) : (
          <div className="mt-3 space-y-3">
            {timelineGroups.map((group) => {
              const sorted = [...group.events].sort((a, b) =>
                a.occurred_at.localeCompare(b.occurred_at),
              );
              const startedAt = sorted[0]?.occurred_at ?? "—";
              const endedAt = sorted[sorted.length - 1]?.occurred_at ?? "—";
              return (
                <section className={styles.timelineUserGroup} key={group.userKey}>
                  <header className={styles.timelineUserHeader}>
                    <div>
                      <p className={styles.areaLabel}>Inicio tramo usuario</p>
                      <p className="text-sm font-semibold text-[var(--ccp-ink)]">
                        {group.userLabel}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--ccp-faint)]">
                      {startedAt} → {endedAt}
                    </p>
                  </header>
                  <ol className="mt-2 space-y-2">
                    {sorted.map((event, index) => (
                      <li className={styles.listRow} key={event.event_id}>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className={styles.areaLabel}>
                              {index === 0
                                ? "Inicio"
                                : index === sorted.length - 1
                                  ? "Cierre tramo"
                                  : "Evento"}{" "}
                              · {event.causal_step} · {event.event_type}
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--ccp-ink)]">
                              {event.summary}
                            </p>
                            {event.run_id ? (
                              <p className="mt-1 text-xs text-[var(--ccp-faint)]">
                                run: {event.run_id}
                              </p>
                            ) : null}
                          </div>
                          <span className="text-xs text-[var(--ccp-faint)]">
                            {event.occurred_at}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className={`${styles.areaLabel} mt-2`}>Fin tramo usuario · {group.userLabel}</p>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4">
        <SectionTitle>
          Cobertura de bloques Runtime / Capa 1 por activity_runtime_run
        </SectionTitle>
        <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">{BLOCK_COVERAGE_NOTE}</p>
        {state.runtimeBlockCoverageByRun.length === 0 ? (
          <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">
            Sin cobertura de bloques Runtime en alcance.
          </p>
        ) : (
          <ul className={`mt-3 ${styles.runtimeBlockList}`}>
            {state.runtimeBlockCoverageByRun.map((run) => {
              const completed = run.blocks.filter((block) => block.status === "completed").length;
              return (
                <li key={run.activityRuntimeRunId}>
                  <details className={styles.runtimeRunDetails}>
                    <summary className={styles.runtimeRunSummary}>
                      <span>
                        {run.activityCode} · {run.role} · {run.activityRuntimeRunId}
                      </span>
                      <StatusPill tone="info">
                        {completed}/{run.blocks.length} bloques
                      </StatusPill>
                    </summary>
                    <p className="mt-2 text-xs text-[var(--ccp-muted)]">{run.activityName}</p>
                    <ul className={`mt-3 ${styles.runtimeBlockTree}`}>
                      {run.blocks.map((block, index) => {
                        const isLast = index === run.blocks.length - 1;
                        return (
                          <li
                            className={styles.runtimeBlockTreeItem}
                            key={`${run.activityRuntimeRunId}-${block.blockCode}`}
                          >
                            <span aria-hidden className={styles.runtimeBlockTreePrefix}>
                              {isLast ? "└──" : "├──"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-[var(--ccp-ink)]">
                                  {block.blockLabel}
                                </p>
                                <StatusPill tone={blockStatusTone(block.status)}>
                                  {block.status}
                                </StatusPill>
                              </div>
                              <dl className={styles.runtimeBlockMeta}>
                                <div>
                                  <dt>Preguntas asignadas</dt>
                                  <dd>{block.questionsAssigned}</dd>
                                </div>
                                <div>
                                  <dt>Preguntas respondidas</dt>
                                  <dd>{block.questionsAnswered}</dd>
                                </div>
                                <div>
                                  <dt>Base / causal</dt>
                                  <dd>
                                    {block.baseUsed} / {block.causalUsed}
                                  </dd>
                                </div>
                                <div>
                                  <dt>Gate relacionado</dt>
                                  <dd>{block.relatedGate ?? "ninguno (solo captura)"}</dd>
                                </div>
                              </dl>
                              <p className="mt-1 text-xs text-[var(--ccp-faint)]">
                                Preguntas (id):{" "}
                                {block.questionIds.length > 0
                                  ? block.questionIds.join(", ")
                                  : "—"}
                              </p>
                              {block.evidence.length > 0 ? (
                                <p className="mt-1 text-xs text-[var(--ccp-faint)]">
                                  Evidencia: {block.evidence.join("; ")}
                                </p>
                              ) : null}
                              {block.variablesOrGaps.length > 0 ? (
                                <p className="mt-1 text-xs text-[var(--ccp-faint)]">
                                  Variables/gaps: {block.variablesOrGaps.join("; ")}
                                </p>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <SectionTitle>
          Presupuesto Runtime 40/20 por usuario / rol / actividad primaria
        </SectionTitle>
        <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">{BUDGET_SCOPE_NOTE}</p>
        <p className="mt-2 text-sm font-medium text-[var(--ccp-ink)]">{sufficiencyNote}</p>
        <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">{INTERACTION_PERSISTENCE_TEXT}</p>
        {operationalRulesAbsent ? (
          <p
            className="mt-2 text-sm font-semibold text-red-800"
            data-testid="operational-rules-40-20-absent-banner"
          >
            Reglas operativas 40/20 ausentes — readiness bloqueado
          </p>
        ) : null}

        <div className="mt-3">
          <p className={styles.areaLabel}>Base Resolution Gate</p>
          <div className={`${styles.metricStrip} mt-2`}>
            <span>
              40 requeridas <strong>{baseGate.total_required}</strong>
            </span>
            <span>
              40 evaluadas/resueltas o bloqueadas explícitamente{" "}
              <strong>{baseGate.evaluated_or_resolved_or_explicitly_blocked}</strong>
            </span>
            <span>
              skipped_silently = <strong>{baseGate.skipped_silently}</strong>
            </span>
            <span>
              inferred_unconfirmed <strong>{baseGate.inferred_unconfirmed}</strong>
            </span>
            <span>
              reentry <strong>{baseGate.reentry}</strong>
            </span>
            <span>
              manual_review <strong>{baseGate.manual_review}</strong>
            </span>
            <span>
              blocking bases{" "}
              <strong>
                {baseGate.blocking_bases.length > 0
                  ? baseGate.blocking_bases.join(", ")
                  : "ninguna"}
              </strong>
            </span>
          </div>
        </div>

        <div className="mt-3">
          <p className={styles.areaLabel}>Causal Closure Gate</p>
          <div className={`${styles.metricStrip} mt-2`}>
            <span>
              20 evaluadas <strong>{causalGate.evaluated}</strong>
            </span>
            <span>
              triggered_required <strong>{causalGate.triggered_required}</strong>
            </span>
            <span>
              answered_closed <strong>{causalGate.answered_closed}</strong>
            </span>
            <span>
              not_triggered_with_evidence{" "}
              <strong>{causalGate.not_triggered_with_evidence}</strong>
            </span>
            <span>
              activation_unknown <strong>{causalGate.activation_unknown}</strong>
            </span>
            <span>
              route_missing <strong>{causalGate.route_missing}</strong>
            </span>
            <span>
              reentry <strong>{causalGate.reentry}</strong>
            </span>
            <span>
              manual_review <strong>{causalGate.manual_review}</strong>
            </span>
            <span>
              P0 blockers{" "}
              <strong>
                {causalGate.p0_blockers.length > 0
                  ? causalGate.p0_blockers.join(", ")
                  : "ninguno"}
              </strong>
            </span>
          </div>
        </div>

        <div className="mt-3">
          <p className={styles.areaLabel}>A. Resumen de caso</p>
          <p className="mt-1 text-xs font-medium text-[var(--ccp-ink)]">
            Agregado informativo — no límite de presupuesto
          </p>
          <div className={`${styles.metricStrip} mt-2`}>
            <span>
              Usuarios en alcance <strong>{caseAgg.usersInScope}</strong>
            </span>
            <span>
              Roles en alcance <strong>{caseAgg.rolesInScope}</strong>
            </span>
            <span>
              Actividades primarias seleccionadas{" "}
              <strong>{caseAgg.primaryActivitiesSelected}</strong>
            </span>
            <span>
              Runs activos <strong>{caseAgg.activeRuns}</strong>
            </span>
            <span>
              Interacciones base totales observadas{" "}
              <strong>{caseAgg.totalBaseInteractionsObserved}</strong>
            </span>
            <span>
              Interacciones causales totales observadas{" "}
              <strong>{caseAgg.totalCausalInteractionsObserved}</strong>
            </span>
          </div>
        </div>

        {budget.budgetByUserRole.length > 0 ? (
          <div className="mt-3">
            <p className={styles.areaLabel}>B. Presupuesto por usuario / rol</p>
            <ul className="mt-2 space-y-3">
              {budget.budgetByUserRole.map((userRole) => (
                <li className={styles.listRow} key={`budget-user-role-${userRole.userId}`}>
                  <p className="text-sm font-semibold text-[var(--ccp-ink)]">
                    {userRole.userLabel} — Rol {userRole.roleLabel}
                  </p>
                  <ul className="mt-1.5 space-y-1.5 text-sm text-[var(--ccp-muted)]">
                    {userRole.primaryActivitiesWithRun.map((activity) => (
                      <li key={`budget-activity-${activity.activityRuntimeRunId}`}>
                        <span className="font-semibold text-[var(--ccp-ink)]">
                          {activity.activityCode}
                        </span>
                        : base {activity.baseUsed} / {activity.baseLimit} · causal{" "}
                        {activity.causalUsed} / {activity.causalLimit} · run{" "}
                        {activity.activityRuntimeRunId} · estado {activity.runState}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {budget.runtimeBudgetByRun.length > 0 ? (
          <div className="mt-3">
            <p className={styles.areaLabel}>C. Presupuesto por activity_runtime_run</p>
            <ul className={`mt-2 ${styles.runtimeBlockList}`}>
              {budget.runtimeBudgetByRun.map((run) => (
                <li className={styles.runtimeBlockCard} key={run.activityRuntimeRunId}>
                  <p className="text-sm font-semibold text-[var(--ccp-ink)]">
                    {run.activityCode} · {run.role}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ccp-muted)]">{run.activityName}</p>
                  <dl className={styles.runtimeBlockMeta}>
                    <div>
                      <dt>role_runtime_session_id</dt>
                      <dd>{run.roleRuntimeSessionId}</dd>
                    </div>
                    <div>
                      <dt>activity_runtime_run_id</dt>
                      <dd>{run.activityRuntimeRunId}</dd>
                    </div>
                    <div>
                      <dt>base_used / 40</dt>
                      <dd>
                        {run.baseUsed} / {run.baseLimit}
                      </dd>
                    </div>
                    <div>
                      <dt>causal_used / 20</dt>
                      <dd>
                        {run.causalUsed} / {run.causalLimit}
                      </dd>
                    </div>
                    <div>
                      <dt>base_remaining</dt>
                      <dd>{run.baseRemaining}</dd>
                    </div>
                    <div>
                      <dt>causal_remaining</dt>
                      <dd>{run.causalRemaining}</dd>
                    </div>
                    <div>
                      <dt>current_block</dt>
                      <dd>{run.currentBlock}</dd>
                    </div>
                    <div>
                      <dt>run_state</dt>
                      <dd>{run.runState}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-4" id="ccp-scene-candidates">
        <SectionTitle>Escenas candidatas por activity_runtime_run</SectionTitle>
        <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">{SCENE_CANDIDATES_NOTE}</p>
        {state.sceneCandidatesByRun.length === 0 ? (
          <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">
            Sin escenas candidatas en alcance.
          </p>
        ) : (
          <ul className={`mt-3 ${styles.runtimeBlockList}`}>
            {state.sceneCandidatesByRun.map((scene) => (
              <li className={styles.runtimeBlockCard} key={scene.activityRuntimeRunId}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--ccp-ink)]">
                    {scene.activityCode} · {scene.role}
                  </p>
                  <StatusPill tone={sceneStatusTone(scene.status)}>{scene.status}</StatusPill>
                </div>
                <dl className={styles.runtimeBlockMeta}>
                  <div>
                    <dt>Escena candidata</dt>
                    <dd>{scene.sceneCandidateTitle}</dd>
                  </div>
                  <div>
                    <dt>Origen</dt>
                    <dd>{scene.originSummary}</dd>
                  </div>
                  <div>
                    <dt>Alimenta</dt>
                    <dd>{scene.feedsSupObject}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{scene.status}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <SectionTitle>Resumen de gates regulatorios</SectionTitle>
        <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">{GATES_REGULATORY_NOTE}</p>
        {state.gate_summaries.length === 0 ? (
          <p className="mt-1.5 text-sm text-[var(--ccp-muted)]">Sin gate summaries en alcance.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--ccp-muted)]">
            {state.gate_summaries.map((gate) => (
              <li key={`${gate.gate_code}-${gate.status}`}>
                <span className="font-semibold text-[var(--ccp-ink)]">{gate.gate_code}</span>:{" "}
                {gate.status}
                {gate.reason ? ` — ${gate.reason}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      {state.readiness ? (
        <div className="mt-4">
          <SectionTitle>Readiness</SectionTitle>
          <p className="mt-1.5 text-sm font-medium text-[var(--ccp-ink)]">
            Estado: {state.readiness.state}
          </p>
          {state.readiness.flags.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-[var(--ccp-muted)]">
              {state.readiness.flags.map((flag) => (
                <li key={flag}>· {flag}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-xs text-[var(--ccp-faint)]">
            Revisión consultor: {state.readiness.consultantReviewRequired ? "sí" : "no"} ·
            autoservicio público: {state.readiness.publicSelfServiceAllowed ? "sí" : "no"} ·
            diagnóstico final automático:{" "}
            {state.readiness.finalDiagnosisAutomaticAllowed ? "sí" : "no"} · exportación
            productiva: {state.readiness.productiveExportAllowed ? "sí" : "no"}
          </p>
        </div>
      ) : null}

      <div className="mt-4" id="ccp-sup-link">
        <SectionTitle>Conexión eventos → objetos SUP</SectionTitle>
        <p className="mt-1 text-xs text-[var(--ccp-faint)]">
          Área 3 no se queda solo en eventos runtime: alimenta la columna vertebral SUP.
        </p>
        {state.event_to_sup_links.length === 0 ? (
          <EmptyState>Sin vínculos SUP en alcance.</EmptyState>
        ) : (
          <div className={styles.supLinkList}>
            {state.event_to_sup_links.map((link) => (
              <div className={styles.supLinkRow} key={`${link.causal_step}-${link.feeds_sup_object}`}>
                <strong>{link.causal_step}</strong> → {link.feeds_sup_object}
                <p className="mt-0.5">{link.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelSection>
  );
}

"use client";

import type {
  ControlPanelSelectedContext,
  RuntimeViewScopeKey,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

export type RunContextHeaderProps = {
  companyName: string | null;
  caseId: string | null;
  caseLabel?: string | null;
  physicalUserId: string | null;
  roleRuntimeSessionId: string | null;
  roleLabel: string | null;
  activityId: string | null;
  activityTitle: string | null;
  runId: string | null;
  pmProcessCode: string | null;
  catalogVersion: string | null;
  runtimeVersion: string | null;
  runState: string | null;
  effectiveScope: RuntimeViewScopeKey;
};

export function selectedContextToHeaderProps(
  context: ControlPanelSelectedContext,
): RunContextHeaderProps {
  return {
    companyName: context.companyName,
    caseId: context.caseId,
    caseLabel: context.caseLabel,
    physicalUserId: context.physicalUserId,
    roleRuntimeSessionId: context.roleRuntimeSessionId,
    roleLabel: context.roleLabel,
    activityId: context.activityId,
    activityTitle: context.activityTitle,
    runId: context.runId,
    pmProcessCode: context.pmProcessCode,
    catalogVersion: context.catalogVersion,
    runtimeVersion: context.runtimeVersion,
    runState: context.runStateLabel ?? context.runState,
    effectiveScope: context.effectiveScope,
  };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.runContextField}>
      <span className={styles.runContextLabel}>{label}</span>
      <span className={styles.runContextValue}>{value}</span>
    </div>
  );
}

/**
 * Always-visible context bar for Runtime 40 Base Grid.
 * Renders BFF selected_context / meta.effective_scope — never invents from URL.
 */
export function RunContextHeader(props: RunContextHeaderProps) {
  const caseDisplay = props.caseLabel || props.caseId || "—";
  return (
    <aside
      className={styles.runContextHeader}
      data-testid="ccp-run-context-header"
      data-effective-scope={props.effectiveScope}
      aria-label="Contexto del run seleccionado"
    >
      <div className={styles.runContextHead}>
        <h3 className={styles.runContextTitle}>Contexto del run seleccionado</h3>
        <p className={styles.muted}>
          Unidad de seguimiento: empresa → caso → usuario epistémico → función epistémica
          → actividad primaria → run
        </p>
      </div>
      <div className={styles.runContextGrid}>
        <Field label="Empresa" value={props.companyName || "—"} />
        <Field label="Caso" value={caseDisplay} />
        <Field label="Usuario epistémico" value={props.physicalUserId || "—"} />
        <Field label="Función epistémica de trabajo" value={props.roleLabel || "—"} />
        <Field
          label="Actividad primaria"
          value={props.activityTitle || props.activityId || "—"}
        />
        <Field label="Run" value={props.runId || "—"} />
        <Field label="Proceso PM asociado" value={props.pmProcessCode || "—"} />
        <Field label="Catálogo Runtime" value={props.catalogVersion || "—"} />
        <Field label="Estado" value={props.runState || "—"} />
        {props.roleRuntimeSessionId ? (
          <Field label="role_runtime_session_id" value={props.roleRuntimeSessionId} />
        ) : null}
        {props.runtimeVersion ? (
          <Field label="Reglas operativas" value={props.runtimeVersion} />
        ) : null}
      </div>
    </aside>
  );
}

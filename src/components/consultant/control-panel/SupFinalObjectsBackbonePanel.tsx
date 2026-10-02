import type { SupFinalObjectsBackboneState } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import {
  AreaLabel,
  PanelCopy,
  PanelSection,
  PanelTitle,
  SectionTitle,
  StatusPill,
} from "./PanelChrome";
import styles from "./ccp.module.css";

function statusTone(
  status: string,
): "neutral" | "accent" | "warn" | "info" {
  if (status.includes("disabled") || status.includes("blocked")) return "warn";
  if (status.includes("flag") || status.includes("partial") || status.includes("warning")) {
    return "warn";
  }
  if (status === "ready" || status === "satisfied_with_flags" || status.includes("ready")) {
    return "accent";
  }
  if (status === "pending_scope") return "info";
  return "neutral";
}

export function SupFinalObjectsBackbonePanel({
  state,
}: {
  state: SupFinalObjectsBackboneState;
}) {
  return (
    <PanelSection>
      <div className="flex items-start justify-between gap-3">
        <div>
          <AreaLabel>Columna vertebral SUP</AreaLabel>
          <PanelTitle>{state.title}</PanelTitle>
          <PanelCopy>{state.causal_purpose}</PanelCopy>
          <p className="mt-1.5 text-sm font-medium text-[var(--ccp-ink)]">
            Objetos finales del PM Camunda EVE · sin exportación productiva · sin diagnóstico
            final automático.
          </p>
        </div>
        <StatusPill tone="warn">export bloqueado</StatusPill>
      </div>

      <div className="mt-4">
        <SectionTitle>Cadena causal SUP</SectionTitle>
        <ol className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {state.causal_chain.map((step, index) => (
            <li className="flex items-center gap-1.5" key={step}>
              <span className={styles.chainStep}>{step}</span>
              {index < state.causal_chain.length - 1 ? (
                <span aria-hidden className={`${styles.chainArrow} text-emerald-700`}>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4">
        <SectionTitle>Objetos finales SUP</SectionTitle>
        <div className={styles.supCardGrid}>
          {state.objects.map((object) => (
            <article className={styles.supCard} key={object.code}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={styles.areaLabel}>{object.code}</p>
                  <h3 className={styles.supCardTitle}>{object.capability}</h3>
                </div>
                <StatusPill tone={statusTone(object.status)}>{object.status}</StatusPill>
              </div>

              <dl className={styles.supMetaList}>
                <div>
                  <dt>Objeto final</dt>
                  <dd>
                    {object.finalObject} [{object.state}]
                  </dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{object.state}</dd>
                </div>
                <div>
                  <dt>Dependencia anterior</dt>
                  <dd>{object.previousDependency ?? "— (inicio de cadena)"}</dd>
                </div>
                <div>
                  <dt>Uso consultor</dt>
                  <dd>{object.consultantUse}</dd>
                </div>
                <div>
                  <dt>Descarga asociada</dt>
                  <dd>{object.associatedDownload ?? "Ninguna (objeto interno)"}</dd>
                </div>
                <div>
                  <dt>Autoridad requerida</dt>
                  <dd>{object.authorityRequired ? "Sí · audit trail obligatorio" : "No"}</dd>
                </div>
              </dl>

              {object.subObjects && object.subObjects.length > 0 ? (
                <div className="mt-2.5">
                  <p className={styles.areaLabel}>Subobjetos</p>
                  <ul className="mt-1 space-y-1 text-sm text-[var(--ccp-muted)]">
                    {object.subObjects.map((sub) => (
                      <li key={sub.name}>
                        <span className="font-semibold text-[var(--ccp-ink)]">{sub.name}</span>{" "}
                        [{sub.state}]
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {object.blockOrWarning ? (
                <p className={styles.supWarning}>{object.blockOrWarning}</p>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--ccp-faint)]">
        Frontera: productive_export_blocked=
        {String(state.productive_export_blocked)} · final_diagnosis_automatic_blocked=
        {String(state.final_diagnosis_automatic_blocked)}
      </p>
    </PanelSection>
  );
}

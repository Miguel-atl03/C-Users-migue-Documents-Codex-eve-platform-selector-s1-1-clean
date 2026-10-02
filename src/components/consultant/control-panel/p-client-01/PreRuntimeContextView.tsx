"use client";

import type { PreRuntimeContextFieldVM, PreRuntimeContextVM } from "@/services/eve/consultant-control-panel/p-client-01-view-models";
import styles from "../ccp-pm.module.css";

function FieldCard({ field }: { field: PreRuntimeContextFieldVM }) {
  return (
    <article className={styles.pClientFieldCard} data-field-id={field.field_id}>
      <div className={styles.pClientFieldHead}>
        <h4>{field.label}</h4>
        <span className={styles.pillNeutral}>{field.epistemic_status}</span>
      </div>
      <p className={styles.pClientFieldValue}>{field.value ?? "—"}</p>
      <p className={styles.muted}>
        Fuente: {field.source}. Prohibido usar como: {field.must_not_be_used_for.join(", ")}.
      </p>
    </article>
  );
}

export function PreRuntimeContextView({
  preRuntime,
}: {
  preRuntime: PreRuntimeContextVM;
}) {
  return (
    <section data-testid="ccp-pclient01-preruntime" aria-labelledby="pclient01-preruntime-title">
      <div className={styles.pClientSectionHead}>
        <div>
          <p className={styles.areaLabel}>Vista 5</p>
          <h3 id="pclient01-preruntime-title" className={styles.panelTitle} tabIndex={-1}>
            Contexto pre-runtime
          </h3>
          <p className={styles.panelCopy}>
            Estado A + WorkMap + primarias / no-primarias. Contexto gobernado; no diagnóstico ni
            autoridad real confirmada.
          </p>
        </div>
        <span className={preRuntime.bundle_available ? styles.pillNeutral : styles.pillWarn}>
          {preRuntime.bundle_available ? "proyección disponible" : "sin bundle"}
        </span>
      </div>

      {preRuntime.availability_warning ? (
        <p className={styles.pClientWarning} role="status">
          {preRuntime.availability_warning}
        </p>
      ) : null}

      <div className={styles.pClientBlock}>
        <h4 className={styles.subTitle}>Estado A</h4>
        <div className={styles.pClientFieldGrid}>
          <FieldCard field={preRuntime.estado_a.functional_role_context} />
          <FieldCard field={preRuntime.estado_a.decision_level_context} />
        </div>
      </div>

      <div className={styles.pClientBlock}>
        <h4 className={styles.subTitle}>WorkMap</h4>
        <p className={styles.muted}>
          Guardado con advertencias:{" "}
          {preRuntime.workmap.saved_with_warnings == null
            ? "—"
            : preRuntime.workmap.saved_with_warnings
              ? "Sí"
              : "No"}
        </p>
        <div className={styles.pClientFieldGrid}>
          <FieldCard field={preRuntime.workmap.area_context} />
          <FieldCard field={preRuntime.workmap.responsibility_context} />
          <FieldCard field={preRuntime.workmap.activities_inventory} />
        </div>
      </div>

      <div className={styles.pClientBlock}>
        <h4 className={styles.subTitle}>
          Selección primaria (máx. {preRuntime.selection.policy_max_primaries})
        </h4>
        <div className={styles.pClientFieldGrid}>
          <FieldCard field={preRuntime.selection.primary_activity_context} />
          <FieldCard field={preRuntime.selection.non_primary_activity_context} />
        </div>
        {preRuntime.selection.primary_activity_list.length > 0 ? (
          <ol className={styles.pClientPrimaryList}>
            {preRuntime.selection.primary_activity_list.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ol>
        ) : null}
      </div>

      <div className={styles.pClientBlock}>
        <h4 className={styles.subTitle}>Handoff hacia Significado / B0</h4>
        <div className={styles.pClientChipRow}>
          <span className={styles.pillNeutral}>
            significadoHandoffAllowed:{" "}
            {preRuntime.handoff.significado_handoff_allowed == null
              ? "—"
              : String(preRuntime.handoff.significado_handoff_allowed)}
          </span>
          <span className={styles.pillNeutral}>
            b0PrefillAllowed:{" "}
            {preRuntime.handoff.b0_prefill_allowed == null
              ? "—"
              : String(preRuntime.handoff.b0_prefill_allowed)}
          </span>
          <span className={styles.pillWarn}>
            contextMustNotBeSavedAsConfirmedEvidence: true
          </span>
        </div>
      </div>
    </section>
  );
}

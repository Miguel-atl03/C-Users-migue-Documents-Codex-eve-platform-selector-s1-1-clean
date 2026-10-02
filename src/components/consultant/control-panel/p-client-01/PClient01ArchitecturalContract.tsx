"use client";

import type { PClient01ArchitecturalContract as Contract } from "@/services/eve/consultant-control-panel/p-client-01-view-models";
import styles from "../ccp-pm.module.css";

/** §1.1 Contrato arquitectónico — visible para revisión; no confiere autoridad. */
export function PClient01ArchitecturalContractPanel({
  contract,
}: {
  contract: Contract;
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "ID PM", value: contract.pm_process_id },
    { label: "Nombre", value: contract.name },
    { label: "Trigger", value: contract.trigger },
    { label: "Objeto gobernado", value: contract.governed_object },
    { label: "Target state", value: contract.target_state },
    {
      label: "Estados finales alternativos",
      value: contract.alternate_final_states.join(" · "),
    },
    { label: "Relación con P-CORE-01", value: contract.relation_to_p_core_01 },
    { label: "Vista asignada 1", value: contract.assigned_view_1 },
    { label: "Vista asignada 5", value: contract.assigned_view_5 },
  ];

  return (
    <details
      className={styles.pClientContract}
      data-testid="ccp-pclient01-architectural-contract"
      data-is-runtime-4020={String(contract.is_runtime_4020)}
      data-replaces-p-core-01={String(contract.replaces_p_core_01)}
    >
      <summary className={styles.pClientContractSummary}>
        Contrato arquitectónico P-CLIENT-01 · frontera cliente–EVE (no Runtime 40+20)
      </summary>
      <dl className={styles.pClientContractGrid}>
        {rows.map((row) => (
          <div key={row.label} className={styles.pClientContractRow}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.pClientContractBoundary}>{contract.systemic_boundary}</p>
    </details>
  );
}

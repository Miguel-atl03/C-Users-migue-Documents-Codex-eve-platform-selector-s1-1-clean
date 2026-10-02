import { EveLogo } from "@/components/EveLogo";

import styles from "../styles/official-control-panel.module.css";
import type { ClientContextViewModel } from "../types/client-context.types";
import { ClientContextSelector } from "./ClientContextSelector";

type ClientCompanyHeaderProps = {
  context: ClientContextViewModel;
  onCompanyChange: (companyId: string | null) => void;
  onRelationshipChange: (relationshipId: string | null) => void;
  onCaseChange: (caseId: string | null) => void;
  onRetry: () => void;
};

export function ClientCompanyHeader({
  context,
  onCompanyChange,
  onRelationshipChange,
  onCaseChange,
  onRetry,
}: ClientCompanyHeaderProps) {
  return (
    <header
      className={styles.panelHeader}
      role="banner"
      aria-labelledby="panel-header-title"
    >
      <div className={styles.brandStrip}>
        <EveLogo size="sm" variant="muted" />
        <p className={styles.brandSlogan}>
          Enterprise Viability Engine<span aria-hidden="true">™</span>
        </p>
      </div>
      <div className={styles.panelHeaderMain}>
        <h1 className={styles.panelTitle} id="panel-header-title">
          Panel de Control EVE
        </h1>
        <ClientContextSelector
          context={context}
          onCompanyChange={onCompanyChange}
          onRelationshipChange={onRelationshipChange}
          onCaseChange={onCaseChange}
          onRetry={onRetry}
        />
      </div>
      <span className={styles.roleBadge} aria-label="Rol: Consultor">
        Rol: Consultor
      </span>
    </header>
  );
}

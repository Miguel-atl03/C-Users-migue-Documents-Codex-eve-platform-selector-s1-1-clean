"use client";

import styles from "../styles/official-control-panel.module.css";
import type { CaseParticipantListItem } from "../types/participant-profile.types";

type CaseParticipantItemProps = {
  participant: CaseParticipantListItem;
  expanded: boolean;
  onToggle: (participantId: string) => void;
};

export function CaseParticipantItem({
  participant,
  expanded,
  onToggle,
}: CaseParticipantItemProps) {
  const buttonId = `participant-toggle-${participant.id}`;

  return (
    <li className={styles.participantItem}>
      <button
        type="button"
        id={buttonId}
        className={styles.participantToggle}
        aria-expanded={expanded}
        onClick={() => onToggle(participant.id)}
      >
        <span className={styles.participantLabel}>
          <span className={styles.participantKind}>Usuario</span>
          <span className={styles.participantName}>{participant.label}</span>
        </span>
        <span className={styles.participantMeta}>
          <span>
            {participant.rolesCountLabel === "No disponible"
              ? "Roles: No disponible"
              : participant.rolesCountLabel === "1"
                ? "1 sesión de rol"
                : `${participant.rolesCountLabel} sesiones de rol`}
          </span>
          <span className={styles.participantAssignment}>
            {participant.assignmentLabel}
          </span>
          <span className={styles.participantChevron} aria-hidden="true">
            {expanded ? "▾" : "▸"}
          </span>
        </span>
      </button>
    </li>
  );
}

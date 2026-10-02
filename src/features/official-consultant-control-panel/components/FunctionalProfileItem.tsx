"use client";

import styles from "../styles/official-control-panel.module.css";
import type { FunctionalProfileListItem } from "../types/participant-profile.types";

type FunctionalProfileItemProps = {
  participantId: string;
  profile: FunctionalProfileListItem;
  selected: boolean;
  onSelect: (participantId: string, profileId: string | null) => void;
};

export function FunctionalProfileItem({
  participantId,
  profile,
  selected,
  onSelect,
}: FunctionalProfileItemProps) {
  return (
    <li>
      <button
        type="button"
        className={
          selected
            ? `${styles.profileItem} ${styles.profileItemSelected}`
            : styles.profileItem
        }
        aria-pressed={selected}
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(participantId, selected ? null : profile.id)}
      >
        <span className={styles.profileKind}>Rol funcional</span>
        <span className={styles.profileName}>{profile.label}</span>
        <dl className={styles.monitoringRoleMeta}>
          <div>
            <dt>Responsabilidades</dt>
            <dd>{profile.responsibilitiesLabel}</dd>
          </div>
          <div>
            <dt>Elegibles</dt>
            <dd>{profile.eligibleLabel}</dd>
          </div>
          <div>
            <dt>Primarias</dt>
            <dd>{profile.primaryLabel}</dd>
          </div>
          <div>
            <dt>No primarias</dt>
            <dd>{profile.nonPrimaryLabel}</dd>
          </div>
        </dl>
      </button>
    </li>
  );
}

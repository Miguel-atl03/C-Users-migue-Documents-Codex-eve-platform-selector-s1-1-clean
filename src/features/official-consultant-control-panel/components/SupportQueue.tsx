"use client";

import styles from "../styles/official-control-panel.module.css";
import type { ExperienceSupportQueueItemView } from "@/services/eve/official-control-panel/official-control-panel-experience.types";
import { EXPERIENCE_ACTION_LABELS } from "../presentation/experience-governance-presentation";

type SupportQueueProps = {
  items: ExperienceSupportQueueItemView[];
  emptyMessage: string;
  onSelectItem?: (item: ExperienceSupportQueueItemView) => void;
};

export function SupportQueue({
  items,
  emptyMessage,
  onSelectItem,
}: SupportQueueProps) {
  if (items.length === 0) {
    return (
      <p
        className={styles.workspaceEmptyMessage}
        role="status"
        data-testid="experience-support-empty"
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={styles.experienceSupportList} data-testid="support-queue">
      {items.map((item) => (
        <li
          key={item.id}
          className={styles.experienceSupportItem}
          data-testid={`support-queue-item-${item.id}`}
        >
          <div>
            <p className={styles.manualWorkFact}>
              <strong>{item.screenLabel}</strong> · usuario{" "}
              {item.userId.slice(0, 8)}
            </p>
            <p className={styles.workspaceEmptyMessage}>
              {item.actionType
                ? EXPERIENCE_ACTION_LABELS[item.actionType]
                : "Soporte solicitado"}
              {item.reasonCode ? ` · ${item.reasonCode}` : ""}
            </p>
            <p className={styles.workspaceEmptyMessage}>{item.createdAt}</p>
          </div>
          {onSelectItem ? (
            <button
              type="button"
              className={styles.contextRetryButton}
              onClick={() => onSelectItem(item)}
            >
              Acción gobernada
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

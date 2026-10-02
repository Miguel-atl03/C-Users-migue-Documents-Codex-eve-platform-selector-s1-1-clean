"use client";

import type { KeyboardEvent } from "react";

import type { SupportProcessAxisItem } from "@/services/eve/official-control-panel/official-control-panel-support-process.types";
import type { SupportProcessAxisCode } from "@/services/eve/official-control-panel/catalogs/support-process-axis.catalog";
import {
  formatModalityBadge,
  formatSupportProcessAriaAnnouncement,
} from "../presentation/support-process-axis-presentation";
import { presentOperationalVisibleProse } from "../presentation/operational-object-label-presentation";
import styles from "../styles/official-control-panel.module.css";
import { SupportProcessAxisTooltip } from "./SupportProcessAxisTooltip";

type SupportProcessAxisItemProps = {
  item: SupportProcessAxisItem;
  selected: boolean;
  tabIndex: number;
  onSelect: (code: SupportProcessAxisCode) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    code: SupportProcessAxisCode,
  ) => void;
};

export function SupportProcessAxisItemButton({
  item,
  selected,
  tabIndex,
  onSelect,
  onKeyDown,
}: SupportProcessAxisItemProps) {
  const badge = formatModalityBadge(item);
  const tooltipId = `support-process-tooltip-${encodeURIComponent(item.code)}`;
  const hasOperationalStatus = item.operationalStatusLabel != null;
  const showAttention = item.attentionCount != null;
  const announcement = formatSupportProcessAriaAnnouncement(item, selected);

  return (
    <div className={styles.supportProcessItemWrap}>
      <button
        type="button"
        id={`support-process-tab-${encodeURIComponent(item.code)}`}
        aria-pressed={selected}
        aria-controls="support-process-workspace-summary"
        aria-describedby={tooltipId}
        aria-label={announcement}
        data-process-code={item.code}
        tabIndex={tabIndex}
        className={[
          styles.supportProcessChip,
          selected ? styles.supportProcessChipSelected : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onSelect(item.code)}
        onKeyDown={(event) => onKeyDown(event, item.code)}
      >
        <span
          className={[
            styles.supportProcessStatusDot,
            hasOperationalStatus
              ? styles.supportProcessStatusDotKnown
              : styles.supportProcessStatusDotNeutral,
          ].join(" ")}
          aria-hidden="true"
        />
        <span className={styles.supportProcessCode}>{item.code}</span>
        <span className={styles.supportProcessLabel}>
          {presentOperationalVisibleProse(item.label)}
        </span>
        {badge ? (
          <span className={styles.supportProcessModeBadge}>{badge}</span>
        ) : null}
        {showAttention ? (
          <span
            className={styles.supportProcessAttention}
            aria-label={`Atención: ${item.attentionCount}`}
          >
            {item.attentionCount}
          </span>
        ) : null}
      </button>
      <SupportProcessAxisTooltip item={item} id={tooltipId} />
    </div>
  );
}

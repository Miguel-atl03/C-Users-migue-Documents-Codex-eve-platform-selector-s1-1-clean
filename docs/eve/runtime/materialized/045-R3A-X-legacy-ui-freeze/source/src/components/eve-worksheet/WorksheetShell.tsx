"use client";

import type { ReactNode } from "react";
import styles from "./worksheet.module.css";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Continuous worksheet layout chrome.
 * Does not decide unlock/branching — parent/Runtime owns that.
 */
export function WorksheetShell({
  children,
  className,
  kicker,
  title,
  lead,
}: {
  children: ReactNode;
  className?: string;
  kicker?: string;
  title?: string;
  lead?: string;
}) {
  return (
    <section className={cx(styles.worksheetShell, className)}>
      {(kicker || title || lead) && (
        <header className={styles.worksheetHeader}>
          {kicker ? <p className={styles.worksheetKicker}>{kicker}</p> : null}
          {title ? <h1 className={styles.worksheetTitle}>{title}</h1> : null}
          {lead ? <p className={styles.worksheetLead}>{lead}</p> : null}
        </header>
      )}
      <div className={styles.worksheetBody}>{children}</div>
    </section>
  );
}

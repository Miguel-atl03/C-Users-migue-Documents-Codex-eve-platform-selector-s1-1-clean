import type { ReactNode } from "react";
import styles from "./ccp.module.css";

export function PanelSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`${styles.panel} ${className}`.trim()}>{children}</section>;
}

export function AreaLabel({ children }: { children: ReactNode }) {
  return <p className={styles.areaLabel}>{children}</p>;
}

export function PanelTitle({ children }: { children: ReactNode }) {
  return <h2 className={styles.panelTitle}>{children}</h2>;
}

export function PanelCopy({ children }: { children: ReactNode }) {
  return <p className={styles.panelCopy}>{children}</p>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className={styles.sectionTitle}>{children}</h3>;
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "warn" | "info";
}) {
  const toneClass =
    tone === "accent"
      ? styles.pillAccent
      : tone === "warn"
        ? styles.pillWarn
        : tone === "info"
          ? styles.pillInfo
          : styles.pillNeutral;
  return <span className={`${styles.pill} ${toneClass}`}>{children}</span>;
}

export function MetricTile({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string | number;
  large?: boolean;
}) {
  return (
    <div className={styles.metric}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={large ? styles.metricValueLarge : styles.metricValue}>{value}</p>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className={styles.empty}>{children}</div>;
}

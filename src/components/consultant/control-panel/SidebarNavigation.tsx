"use client";

import type { ControlPanelViewKey } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import styles from "./ccp.module.css";

const NAV_ITEMS: Array<{
  key: ControlPanelViewKey | "manual-actions";
  label: string;
  hint: string;
  disabled?: boolean;
}> = [
  { key: "cases", label: "Centro de casos", hint: "Readiness" },
  { key: "monitoring", label: "Participantes y roles", hint: "Usuarios / roles" },
  { key: "runtime", label: "Runtime 40/20", hint: "Runs activos" },
  { key: "gates", label: "Gates y Readiness", hint: "Gaps / bloqueos" },
  { key: "trace", label: "Trazabilidad operativa", hint: "Eventos recientes" },
  { key: "downloads", label: "Descargas", hint: "Visibles / deshabilitadas" },
  { key: "audit", label: "Audit Trail", hint: "Eventos / overrides" },
  {
    key: "manual-actions",
    label: "Acciones manuales",
    hint: "Disabled",
    disabled: true,
  },
];

export function SidebarNavigation({
  activeView,
  onSelect,
  onOpenManualActions,
  badges,
}: {
  activeView: ControlPanelViewKey;
  onSelect: (view: ControlPanelViewKey) => void;
  onOpenManualActions?: () => void;
  badges?: Partial<Record<ControlPanelViewKey, number | string>>;
}) {
  return (
    <nav className={styles.sidebar} aria-label="Navegación del panel" data-testid="ccp-sidebar">
      <p className={styles.sidebarTitle}>Navegación</p>
      <ul className={styles.sidebarList}>
        {NAV_ITEMS.map((item) => {
          const active = item.key === activeView;
          const badge = item.key === "manual-actions" ? undefined : badges?.[item.key];
          return (
            <li key={item.key}>
              <button
                type="button"
                className={
                  item.disabled
                    ? styles.sidebarItemDisabled
                    : active
                      ? styles.sidebarItemActive
                      : styles.sidebarItem
                }
                aria-current={active ? "page" : undefined}
                aria-disabled={item.disabled || undefined}
                onClick={() => {
                  if (item.key === "manual-actions") {
                    onOpenManualActions?.();
                    return;
                  }
                  onSelect(item.key);
                }}
              >
                <span className={styles.sidebarItemCopy}>
                  <span className={styles.sidebarItemLabel}>{item.label}</span>
                  <span className={styles.sidebarItemHint}>{item.hint}</span>
                </span>
                {item.disabled ? (
                  <span className={styles.pillDisabled}>Disabled</span>
                ) : typeof badge === "number" || typeof badge === "string" ? (
                  <span className={styles.sidebarBadge}>{badge}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

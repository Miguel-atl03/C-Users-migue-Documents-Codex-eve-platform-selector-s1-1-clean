"use client";

import type { ReactNode } from "react";
import type { PMOperationalNavItem, PMOperationalViewKey, PMProcessCode } from "./pm-process-catalog";
import styles from "./ccp-pm.module.css";

export function PMOperationalWorkspace({
  selectedProcessCode,
  navItems,
  selectedOperationalView,
  onSelectOperationalView,
  children,
}: {
  selectedProcessCode: PMProcessCode;
  navItems: PMOperationalNavItem[];
  selectedOperationalView: PMOperationalViewKey;
  onSelectOperationalView: (view: PMOperationalViewKey) => void;
  children: ReactNode;
}) {
  return (
    <section
      className={styles.operationalWorkspace}
      data-testid="ccp-pm-operational-workspace"
      data-selected-process={selectedProcessCode}
    >
      <div className={styles.operationalHead}>
        <div>
          <p className={styles.areaLabel}>Zona operativa · secundaria al PM</p>
          <h3 className={styles.panelTitle}>
            Panel operativo · {selectedProcessCode}
          </h3>
          <p className={styles.panelCopy}>
            Navegación secundaria filtrada por el bloque PM seleccionado. El panel actual vive
            debajo del mapa; no es pantalla raíz independiente.
          </p>
        </div>
      </div>

      <nav
        className={styles.secondaryNav}
        aria-label="Navegación operativa secundaria"
        data-testid="ccp-pm-secondary-nav"
      >
        {navItems.map((item) => {
          const active = item.key === selectedOperationalView;
          return (
            <button
              key={item.key}
              type="button"
              className={
                item.kind === "disabled_preview"
                  ? active
                    ? styles.secondaryNavItemDisabledActive
                    : styles.secondaryNavItemDisabled
                  : active
                    ? styles.secondaryNavItemActive
                    : styles.secondaryNavItem
              }
              aria-current={active ? "page" : undefined}
              onClick={() => onSelectOperationalView(item.key)}
            >
              <span className={styles.sidebarItemCopy}>
                <span className={styles.sidebarItemLabel}>{item.label}</span>
                <span className={styles.sidebarItemHint}>{item.hint}</span>
              </span>
              {item.kind === "disabled_preview" ? (
                <span className={styles.pillDisabled}>Disabled</span>
              ) : item.kind === "placeholder" ? (
                <span className={styles.pillNeutral}>Placeholder</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className={styles.operationalBody}>{children}</div>
    </section>
  );
}

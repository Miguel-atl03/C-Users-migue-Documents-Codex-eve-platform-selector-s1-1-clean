"use client";

import { useEffect, useMemo } from "react";
import type { ConsultantControlPanelState } from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import { buildPClient01WorkspaceVM } from "@/services/eve/consultant-control-panel/p-client-01-view-models";
import type { PClient01ViewKey } from "../pm-process-catalog";
import { PClient01ArchitecturalContractPanel } from "./PClient01ArchitecturalContract";
import { PClient01ContextHeader } from "./PClient01ContextHeader";
import { PClient01StatusBand } from "./PClient01StatusBand";
import { PreRuntimeContextView } from "./PreRuntimeContextView";
import { UserExperienceView } from "./UserExperienceView";
import styles from "../ccp-pm.module.css";

/**
 * Workspace contextual P-CLIENT-01 (§2 + §3).
 * Se embebe bajo el PM lineal; no navega a otra ruta ni abre pantalla paralela.
 * Cambiar pestaña no altera estado BFF, evidencia, filtros globales ni selección PM.
 */
export function PClient01Workspace({
  state,
  selectedTab,
  onSelectTab,
  onStateLoaded,
}: {
  state: ConsultantControlPanelState;
  selectedTab: PClient01ViewKey;
  onSelectTab: (tab: PClient01ViewKey) => void;
  onStateLoaded?: (next: ConsultantControlPanelState) => void;
}) {
  const workspace = useMemo(() => buildPClient01WorkspaceVM(state), [state]);

  useEffect(() => {
    const el = document.getElementById(
      selectedTab === "experience" ? "pclient01-experience-title" : "pclient01-preruntime-title",
    );
    el?.focus();
  }, [selectedTab]);

  return (
    <section
      className={styles.pClientWorkspace}
      data-testid="ccp-pclient01-workspace"
      data-selected-tab={selectedTab}
      data-pm-location="below-process-map"
      data-permanence="p-client-01-selected-only"
      aria-label="Workspace P-CLIENT-01"
    >
      <PClient01ContextHeader
        workspace={workspace}
        alertCount={workspace.alerts.length}
      />

      <PClient01ArchitecturalContractPanel
        contract={workspace.architectural_contract}
      />

      {/* §3 zona Resumen — contenido ejecutivo en secciones posteriores */}
      <aside
        className={styles.pClientZoneShell}
        data-zone="executive_summary"
        data-testid="ccp-pclient01-zone-summary"
        aria-label="Resumen ejecutivo (scaffold)"
      >
        <p className={styles.areaLabel}>Resumen · zona reservada</p>
        <p className={styles.muted}>
          Lectura ejecutiva del engagement (etapa, cobertura, multirrol, warnings). Contenido
          de Vista 1/5 se implementa en secciones posteriores; aquí solo se fija la arquitectura
          interna del workspace.
        </p>
      </aside>

      <div
        className={styles.pClientTabs}
        role="tablist"
        aria-label="Vistas P-CLIENT-01"
        data-zone="tabs"
      >
        <button
          type="button"
          role="tab"
          id="pclient01-tab-experience"
          aria-controls="pclient01-tabpanel"
          aria-selected={selectedTab === "experience"}
          className={
            selectedTab === "experience" ? styles.pClientTabActive : styles.pClientTab
          }
          onClick={() => onSelectTab("experience")}
        >
          Experiencia usuario
        </button>
        <button
          type="button"
          role="tab"
          id="pclient01-tab-preruntime"
          aria-controls="pclient01-tabpanel"
          aria-selected={selectedTab === "pre-runtime"}
          className={
            selectedTab === "pre-runtime" ? styles.pClientTabActive : styles.pClientTab
          }
          onClick={() => onSelectTab("pre-runtime")}
        >
          Contexto pre-runtime
        </button>
      </div>

      <div
        id="pclient01-tabpanel"
        className={styles.pClientTabPanel}
        role="tabpanel"
        data-zone="content"
        aria-labelledby={
          selectedTab === "experience"
            ? "pclient01-tab-experience"
            : "pclient01-tab-preruntime"
        }
      >
        {selectedTab === "experience" ? (
          <UserExperienceView
            state={state}
            experience={workspace.experience}
            onStateLoaded={onStateLoaded}
          />
        ) : (
          <PreRuntimeContextView preRuntime={workspace.pre_runtime} />
        )}
      </div>

      {/* §3 zona Drawer — slot estructural; detalle de etapa en secciones posteriores */}
      <aside
        className={styles.pClientDrawerSlot}
        data-zone="detail_drawer"
        data-testid="ccp-pclient01-zone-drawer"
        aria-hidden="true"
        hidden
      />

      <PClient01StatusBand band={workspace.status_band} />
    </section>
  );
}

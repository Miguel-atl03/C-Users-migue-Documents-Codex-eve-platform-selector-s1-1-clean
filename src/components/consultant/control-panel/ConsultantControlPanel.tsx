/**
 * LEGACY / DRAFT MODULE
 *
 * Este Consultant Control Panel es un borrador histórico no oficial.
 * No debe utilizarse como fuente conceptual, funcional o visual
 * para el nuevo Panel de Control EVE.
 *
 * Solo pueden reutilizarse posteriormente piezas técnicas neutrales
 * después de revisión explícita: theme, auth guard, layout genérico,
 * cliente BFF, utilidades y componentes sin semántica de negocio.
 */
"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Figtree } from "next/font/google";
import type {
  ConsultantControlPanelState,
  ControlPanelFilterScope,
  ControlPanelViewKey,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import { CaseHeader } from "./CaseHeader";
import { SidebarNavigation } from "./SidebarNavigation";
import { StatusBar } from "./StatusBar";
import { ControlPanelWorkspace } from "./ControlPanelWorkspace";
import { EvidenceDetailDrawer } from "./EvidenceDetailDrawer";
import { ManualActionDrawer } from "./ManualActionDrawer";
import styles from "./ccp.module.css";

const ccpSans = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ccp-sans",
  display: "swap",
});

function buildStateQuery(
  filters: ControlPanelFilterScope,
  fixtureId: string | null,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  // BFF run-detail: base_items[40] + causal_items[20] for selected activity_runtime_run.
  params.set("include", "run-detail");
  if (fixtureId) {
    params.set(
      "fixture",
      fixtureId === "cerveceria_ambar_ancestral" ? "ambar" : fixtureId,
    );
  }
  return params.toString();
}

function resolveInitialView(state: ConsultantControlPanelState): ControlPanelViewKey {
  if (state.filters.view) return state.filters.view;
  if (state.filters.run_id) return "runtime";
  return "cases";
}

export function ConsultantControlPanel({
  initialState,
  mode = "standalone",
  hideChrome = false,
  controlledView,
  onControlledViewChange,
  onStateChange,
  pmProcessCode,
}: {
  initialState: ConsultantControlPanelState;
  /** embedded = operational content under PM shell (secondary to mother PM). */
  mode?: "standalone" | "embedded";
  hideChrome?: boolean;
  controlledView?: ControlPanelViewKey;
  onControlledViewChange?: (view: ControlPanelViewKey) => void;
  onStateChange?: (state: ConsultantControlPanelState) => void;
  /** Mother PM process code (e.g. P-SUP-01) passed into Runtime context. */
  pmProcessCode?: string | null;
}) {
  const embedded = mode === "embedded" || hideChrome;
  const [state, setState] = useState(initialState);
  const [filters, setFilters] = useState(initialState.filters);
  const [view, setView] = useState<ControlPanelViewKey>(
    controlledView ?? resolveInitialView(initialState),
  );
  const [filterError, setFilterError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [manualOpen, setManualOpen] = useState(false);
  const [evidence, setEvidence] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (controlledView) setView(controlledView);
  }, [controlledView]);

  const commitState = useCallback(
    (payload: ConsultantControlPanelState) => {
      setState(payload);
      setFilters(payload.filters);
      onStateChange?.(payload);
    },
    [onStateChange],
  );

  const applyFilters = useCallback(
    (partial: Partial<ControlPanelFilterScope>) => {
      const next: ControlPanelFilterScope = {
        ...filters,
        ...partial,
      };
      if (partial.view) {
        setView(partial.view);
        onControlledViewChange?.(partial.view);
      }
      setFilters(next);
      setFilterError(null);
      startTransition(async () => {
        try {
          const query = buildStateQuery(next, state.fixture?.id ?? null);
          const response = await fetch(
            `/api/eve/consultant/control-panel/state${query ? `?${query}` : ""}`,
            {
              headers: {
                "x-eve-consultant-role": state.access.consultant_role ?? "consultant",
                "X-EVE-Contract-Version": "1.0",
              },
              cache: "no-store",
            },
          );
          if (!response.ok) {
            setFilterError("No se pudo aplicar el alcance. Revise empresa/caso/usuario.");
            return;
          }
          const payload = (await response.json()) as ConsultantControlPanelState;
          commitState(payload);
          if (payload.filters.view) setView(payload.filters.view);
        } catch {
          setFilterError("Error de red al aplicar filtros de alcance.");
        }
      });
    },
    [
      filters,
      state.access.consultant_role,
      state.fixture?.id,
      onControlledViewChange,
      commitState,
    ],
  );

  const onSelectView = useCallback(
    (nextView: ControlPanelViewKey) => {
      setView(nextView);
      onControlledViewChange?.(nextView);
      applyFilters({ view: nextView });
    },
    [applyFilters, onControlledViewChange],
  );

  const badges = useMemo(
    () => ({
      cases: state.area_3_operational_trace.readiness?.state ?? "—",
      monitoring: state.area_2_client_progress.users.length,
      runtime: state.area_3_operational_trace.runtimeBudget4020.runtimeBudgetByRun.length,
      gates: state.critical_alerts.length,
      trace: state.area_3_operational_trace.timeline.length,
      downloads: "off",
      audit: state.area_1_functional_help.intervention_history.length,
    }),
    [state],
  );

  const workspace = (
    <>
      <ControlPanelWorkspace
        state={state}
        view={view}
        onSelect={applyFilters}
        onOpenManualPreview={() => setManualOpen(true)}
        onOpenEvidence={setEvidence}
        pmProcessCode={
          pmProcessCode ??
          state.meta?.effective_scope?.pm_process_code ??
          state.selected_context?.pmProcessCode ??
          null
        }
      />
      <StatusBar state={state} />
    </>
  );

  const drawers = (
    <>
      <EvidenceDetailDrawer
        open={Boolean(evidence)}
        title={evidence?.title ?? ""}
        body={evidence?.body ?? ""}
        onClose={() => setEvidence(null)}
      />
      <ManualActionDrawer
        open={manualOpen}
        capabilities={state.capabilities}
        onClose={() => setManualOpen(false)}
      />
    </>
  );

  if (embedded) {
    return (
      <div
        className={styles.ccpEmbedded}
        data-testid="ccp-shell-embedded"
        data-mode="embedded"
      >
        {filterError ? <p className={styles.headerError}>{filterError}</p> : null}
        {isPending ? (
          <p className={styles.muted} style={{ marginBottom: "0.5rem" }}>
            Actualizando alcance…
          </p>
        ) : null}
        {workspace}
        {drawers}
      </div>
    );
  }

  const fixtureActive = Boolean(state.fixture?.simulated);

  return (
    <main className={`${styles.shell} ${ccpSans.variable}`} data-testid="ccp-shell">
      {fixtureActive ? (
        <div className={styles.fixtureBannerSticky} role="status">
          Fixture local activo: Cervecería Ámbar Ancestral · datos simulados no productivos
        </div>
      ) : null}

      <div className={styles.appShell}>
        <CaseHeader state={state} isPending={isPending} filterError={filterError} />

        <div className={styles.appBody}>
          <aside className={styles.appSidebar}>
            <SidebarNavigation
              activeView={view}
              onSelect={onSelectView}
              onOpenManualActions={() => setManualOpen(true)}
              badges={badges}
            />
          </aside>

          <div className={styles.appMain}>
            {workspace}

            <footer className={styles.footerCompact}>
              <div className={styles.footerLinks}>
                <Link className={styles.navLink} href="/admin/runtime-vsm">
                  Cuadro VSM
                </Link>
                <Link className={styles.navLink} href="/admin/significado-trace">
                  Trazabilidad Significado
                </Link>
              </div>
              <p>
                Cabina administrativa read-only · Capa 1.0 + Runtime 40/20 + Producción Paralela ·
                Capa 2.0/2.5/3.0 solo descargas manuales deshabilitadas · sin Ring 5 ni reabrir
                activación.
              </p>
            </footer>
          </div>
        </div>
      </div>

      {drawers}
    </main>
  );
}

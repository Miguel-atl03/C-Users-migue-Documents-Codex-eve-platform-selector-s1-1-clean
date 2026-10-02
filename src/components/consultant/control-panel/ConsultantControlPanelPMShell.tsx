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

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Figtree } from "next/font/google";
import type {
  ConsultantControlPanelState,
  ControlPanelViewKey,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-types";
import {
  buildPMProcessCards,
  caseProgressSummary,
  defaultOperationalView,
  getOperationalNavItems,
  isNativeOperationalView,
  isPClient01OperationalView,
  parsePClient01UrlView,
  toPClient01UrlView,
  type PClient01ViewKey,
  type PMOperationalViewKey,
  type PMProcessCode,
  type PMViewMode,
} from "./pm-process-catalog";
import { PMCaseHeader } from "./PMCaseHeader";
import { PMProcessMap } from "./PMProcessMap";
import { PMSelectedTransitionDetail } from "./PMSelectedTransitionDetail";
import { PMOperationalWorkspace } from "./PMOperationalWorkspace";
import { OperationalPlaceholderPanel } from "./OperationalPlaceholderPanel";
import { ConsultantControlPanel } from "./ConsultantControlPanel";
import { PClient01Workspace } from "./p-client-01/PClient01Workspace";
import styles from "./ccp-pm.module.css";

const ccpSans = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ccp-sans",
  display: "swap",
});

/**
 * §2 / §2.1 — Al seleccionar P-CLIENT-01 se conserva header, mapa y detalle de transición.
 * El workspace se abre debajo del PM en la misma ruta; no hay pantalla paralela.
 * Tabs P-CLIENT-01 solo cambian foco local + alias URL; no tocan filtros BFF ni evidencia.
 */
export function ConsultantControlPanelPMShell({
  initialState,
}: {
  initialState: ConsultantControlPanelState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialPClientTab = parsePClient01UrlView(searchParams.get("view"));
  const initialProcessFromUrl =
    searchParams.get("pm_process") === "P-CLIENT-01" || initialPClientTab != null
      ? ("P-CLIENT-01" as PMProcessCode)
      : ("P-SUP-01" as PMProcessCode);

  const [state, setState] = useState(initialState);
  const [selectedProcessCode, setSelectedProcessCode] =
    useState<PMProcessCode>(initialProcessFromUrl);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>("T01");
  const [selectedPMView, setSelectedPMView] = useState<PMViewMode>("mapa");
  const [selectedOperationalView, setSelectedOperationalView] = useState<PMOperationalViewKey>(
    () =>
      initialPClientTab ??
      defaultOperationalView(initialProcessFromUrl),
  );

  const processes = useMemo(() => buildPMProcessCards(state), [state]);
  const selectedProcess = processes.find((item) => item.code === selectedProcessCode) ?? null;
  const navItems = useMemo(
    () => getOperationalNavItems(selectedProcessCode),
    [selectedProcessCode],
  );
  const summary = useMemo(() => caseProgressSummary(state), [state]);
  const fixtureActive = Boolean(state.fixture?.simulated);
  const isPClient01 = selectedProcessCode === "P-CLIENT-01";
  const showNativePanel =
    !isPClient01 && isNativeOperationalView(selectedOperationalView);

  const syncPClientUrlView = useCallback(
    (tab: PClient01ViewKey, processSelected: boolean) => {
      const next = new URLSearchParams(searchParams.toString());
      if (processSelected) {
        next.set("pm_process", "P-CLIENT-01");
        next.set("view", toPClient01UrlView(tab));
      } else {
        if (next.get("pm_process") === "P-CLIENT-01") next.delete("pm_process");
        const currentView = next.get("view");
        if (currentView && parsePClient01UrlView(currentView)) next.delete("view");
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const onSelectProcess = useCallback(
    (code: PMProcessCode) => {
      setSelectedProcessCode(code);
      setSelectedTransitionId(null);
      const nextView = defaultOperationalView(code);
      setSelectedOperationalView(nextView);
      if (code === "P-CLIENT-01") {
        syncPClientUrlView(
          isPClient01OperationalView(nextView) ? nextView : "experience",
          true,
        );
      } else {
        syncPClientUrlView("experience", false);
      }
    },
    [syncPClientUrlView],
  );

  const onSelectTransition = useCallback((id: string) => {
    setSelectedTransitionId(id);
  }, []);

  const onSelectOperationalView = useCallback((view: PMOperationalViewKey) => {
    setSelectedOperationalView(view);
  }, []);

  /** §2.1 — cambio de pestaña no altera filtros globales ni evidencia; solo foco + URL. */
  const onPClient01Tab = useCallback(
    (tab: PClient01ViewKey) => {
      setSelectedOperationalView(tab);
      syncPClientUrlView(tab, true);
    },
    [syncPClientUrlView],
  );

  const pClientTab: PClient01ViewKey = isPClient01OperationalView(selectedOperationalView)
    ? selectedOperationalView
    : "experience";

  useEffect(() => {
    if (!isPClient01) return;
    const fromUrl = parsePClient01UrlView(searchParams.get("view"));
    if (fromUrl && fromUrl !== selectedOperationalView) {
      setSelectedOperationalView(fromUrl);
    }
  }, [isPClient01, searchParams, selectedOperationalView]);

  return (
    <main
      className={`${styles.shell} ${ccpSans.variable}`}
      data-testid="ccp-pm-shell"
      data-shell="pm-mother"
      data-pclient01-embedded={isPClient01 ? "true" : "false"}
    >
      <div className={styles.layout} data-fixture-active={fixtureActive ? "true" : "false"}>
        <PMCaseHeader
          company={summary.company}
          caseLabel={summary.caseLabel}
          caseStateLabel={summary.caseStateLabel}
          progressPct={summary.progressPct}
          criticalPending={summary.criticalPending}
          blockages={summary.blockages}
          consultantRole={state.access.consultant_role}
        />

        <PMProcessMap
          processes={processes}
          selectedProcessCode={selectedProcessCode}
          selectedTransitionId={selectedTransitionId}
          selectedPMView={selectedPMView}
          onSelectProcess={onSelectProcess}
          onSelectTransition={onSelectTransition}
          onChangeView={setSelectedPMView}
        />

        <PMSelectedTransitionDetail
          processes={processes}
          selectedTransitionId={selectedTransitionId}
          selectedProcess={selectedProcess}
          manualActionsEnabled={state.capabilities.manual_actions.enabled}
        />

        {isPClient01 ? (
          <PClient01Workspace
            state={state}
            selectedTab={pClientTab}
            onSelectTab={onPClient01Tab}
            onStateLoaded={setState}
          />
        ) : (
          <PMOperationalWorkspace
            selectedProcessCode={selectedProcessCode}
            navItems={navItems}
            selectedOperationalView={selectedOperationalView}
            onSelectOperationalView={onSelectOperationalView}
          >
            {showNativePanel ? (
              <ConsultantControlPanel
                initialState={{
                  ...state,
                  filters: {
                    ...state.filters,
                    view: selectedOperationalView as ControlPanelViewKey,
                  },
                }}
                mode="embedded"
                hideChrome
                controlledView={selectedOperationalView as ControlPanelViewKey}
                onControlledViewChange={(view) => onSelectOperationalView(view)}
                onStateChange={setState}
                pmProcessCode={selectedProcessCode}
              />
            ) : (
              <OperationalPlaceholderPanel
                viewKey={
                  selectedOperationalView as Exclude<
                    PMOperationalViewKey,
                    ControlPanelViewKey | PClient01ViewKey
                  >
                }
              />
            )}
          </PMOperationalWorkspace>
        )}
      </div>
    </main>
  );
}

"use client";

/**
 * Copia de /dev/ui-posicion-workmap — hoja continua:
 * Header monumental (100svh) → Posición → WorkMap → Umbral → Shell general B0 → B2.
 * Después del Umbral se monta, sin modificar, el shell de
 * http://localhost:4173/eve-shell-bloques-v1?band=actividad
 * (copia byte a byte en public/eve-shell/eve-shell-bloques-v1.html), con un solo scroll:
 * el del lienzo (ver EveShellFrame).
 * Puntos de conexión: docs/eve/shell/EVE_SHELL_B0_B2_PUNTOS_CONEXION.md
 *
 * Open: http://localhost:3112/dev/ui-posicion-workmap-shell
 * Fresh: http://localhost:3112/dev/ui-posicion-workmap-shell?fresh=1
 */

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  LocalEstadoAHeroGateSection,
  LocalSceneEntrySection,
  LocalWorkMapSection,
  buildSceneEntryViewModel,
  createSceneEntryVisualStubViewModel,
  readLocalHeroGateSeen,
  scrollToLocalCanvasSection,
  writeLocalHeroGateSeen,
} from "@/components/eve-local-canvas";
import { LocalEstadoAPositionCuadrantesSection } from "@/components/eve-local-canvas/LocalEstadoAPositionCuadrantesSection";
import canvasStyles from "@/components/eve-local-canvas/local-canvas.module.css";
import {
  isPosicionCuadrantesComplete,
  mapPosicionCuadrantesToStartPositionContext,
  mapStartPositionContextToPosicionCuadrantes,
  type PosicionCuadrantesState,
} from "@/components/eve-local-canvas/posicion-cuadrantes-copy";
import type { PrimaryActivitySelectionResult } from "@/domain/primary-activity-selection-policy";
import { selectPrimaryActivitiesFromWorkMap } from "@/services/primary-activity-selector";
import { EMPTY_START_POSITION_CONTEXT } from "@/domain/start-position-context";
import type { StartPositionContext } from "@/domain/start-position-context";
import type { WorkMapData } from "@/domain/local-work-map";
import { clearWorkMapDraft } from "@/services/work-map-draft";
import { EveShellFrame } from "./EveShellFrame";
import shellStyles from "./shell-frame.module.css";

const PREVIEW_SESSION_ID = "dev-ui-posicion-workmap-shell-preview";
const POSICION_STORAGE_KEY = "eve-dev-ui-posicion-workmap-shell-posicion";
const SHELL_SECTION_ID = "eve-shell-bloques";
const SHELL_SRC = "/eve-shell/eve-shell-bloques-v1.html?band=actividad";

type ShellSheetUnlock = {
  heroGate: boolean;
  workmap: boolean;
  umbral: boolean;
  shell: boolean;
};

const INITIAL_UNLOCK: ShellSheetUnlock = {
  heroGate: false,
  workmap: false,
  umbral: false,
  shell: false,
};

function wantsFreshBoot(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("fresh") === "1";
  } catch {
    return false;
  }
}

function readStoredPosicion(): PosicionCuadrantesState | null {
  try {
    const raw = window.localStorage.getItem(POSICION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PosicionCuadrantesState>;
    if (typeof parsed !== "object" || parsed === null) return null;

    return mapStartPositionContextToPosicionCuadrantes(
      mapPosicionCuadrantesToStartPositionContext({
        role: typeof parsed.role === "string" ? parsed.role : "",
        roleOther: typeof parsed.roleOther === "string" ? parsed.roleOther : "",
        otherEngraved: Boolean(parsed.otherEngraved),
        decision: typeof parsed.decision === "string" ? parsed.decision : "",
        sheetSaved: Boolean(parsed.sheetSaved),
      }),
      Boolean(parsed.sheetSaved),
    );
  } catch {
    return null;
  }
}

function scrollToPosicion() {
  scrollToLocalCanvasSection("estado-a");
  window.setTimeout(() => scrollToLocalCanvasSection("posicion-cuadrantes"), 120);
  window.setTimeout(() => scrollToLocalCanvasSection("posicion-cuadrantes"), 720);
}

function scrollToUmbral() {
  scrollToLocalCanvasSection("scene-entry");
  window.setTimeout(() => scrollToLocalCanvasSection("scene-entry"), 720);
}

function scrollToShell() {
  scrollToLocalCanvasSection(SHELL_SECTION_ID);
  window.setTimeout(() => scrollToLocalCanvasSection(SHELL_SECTION_ID), 720);
}

export default function DevUiPosicionWorkmapShellPage() {
  const [posicionSaved, setPosicionSaved] = useState(false);
  const [unlock, setUnlock] = useState<ShellSheetUnlock>(INITIAL_UNLOCK);
  const [sceneEntryComplete, setSceneEntryComplete] = useState(false);
  const [workMap, setWorkMap] = useState<WorkMapData | null>(null);
  const [primaryActivitySelectionResult, setPrimaryActivitySelectionResult] =
    useState<PrimaryActivitySelectionResult | null>(null);
  const [startPositionContext, setStartPositionContext] =
    useState<StartPositionContext>(EMPTY_START_POSITION_CONTEXT);
  const [shellFrameKey, setShellFrameKey] = useState(0);

  useLayoutEffect(() => {
    if (wantsFreshBoot()) {
      try {
        window.localStorage.removeItem(POSICION_STORAGE_KEY);
      } catch {
        // ignore
      }
      writeLocalHeroGateSeen(false);
      clearWorkMapDraft(PREVIEW_SESSION_ID);
      return;
    }

    const heroSeen = readLocalHeroGateSeen();
    const stored = readStoredPosicion();
    const frame = window.requestAnimationFrame(() => {
      if (stored && isPosicionCuadrantesComplete(stored) && stored.sheetSaved) {
        setStartPositionContext(mapPosicionCuadrantesToStartPositionContext(stored));
        setPosicionSaved(true);
        setUnlock((current) => ({
          ...current,
          heroGate: true,
          workmap: true,
        }));
        writeLocalHeroGateSeen(true);
        return;
      }

      if (heroSeen) {
        setUnlock((current) => ({ ...current, heroGate: true }));
        window.requestAnimationFrame(() => scrollToPosicion());
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    try {
      if (posicionSaved) {
        const state = mapStartPositionContextToPosicionCuadrantes(
          startPositionContext,
          true,
        );
        window.localStorage.setItem(POSICION_STORAGE_KEY, JSON.stringify(state));
      } else {
        window.localStorage.removeItem(POSICION_STORAGE_KEY);
      }
    } catch {
      // preview memory is best-effort
    }
  }, [posicionSaved, startPositionContext]);

  useEffect(() => {
    if (!unlock.umbral || sceneEntryComplete) return;
    scrollToUmbral();
  }, [unlock.umbral, sceneEntryComplete]);

  useEffect(() => {
    if (!unlock.shell) return;
    scrollToShell();
  }, [unlock.shell]);

  const sceneEntryViewModel = useMemo(
    () =>
      buildSceneEntryViewModel(primaryActivitySelectionResult) ??
      createSceneEntryVisualStubViewModel(),
    [primaryActivitySelectionResult],
  );

  const handleWorkMapAdvance = async (draft: WorkMapData) => {
    const selectionResult = selectPrimaryActivitiesFromWorkMap(draft);

    setWorkMap(draft);
    setPrimaryActivitySelectionResult(
      selectionResult.mode === "reentry_required" ? null : selectionResult,
    );
    setSceneEntryComplete(false);
    setUnlock((current) => ({ ...current, umbral: true, shell: false }));

    window.requestAnimationFrame(() => scrollToUmbral());
  };

  const handleHeroEnter = () => {
    writeLocalHeroGateSeen(true);
    setUnlock((current) => ({ ...current, heroGate: true }));
    window.requestAnimationFrame(() => scrollToPosicion());
  };

  const handlePositionContinue = () => {
    setPosicionSaved(true);
    setUnlock((current) => ({ ...current, workmap: true }));
    window.setTimeout(() => scrollToLocalCanvasSection("workmap"), 120);
  };

  const handleSceneEntryComplete = () => {
    setSceneEntryComplete(true);
    setShellFrameKey((key) => key + 1);
    setUnlock((current) => ({ ...current, shell: true }));
    window.requestAnimationFrame(() => scrollToShell());
  };

  return (
    <div
      className={canvasStyles.canvasRoot}
      data-official-local-sheet="true"
      data-unlock-hero-gate={unlock.heroGate ? "true" : "false"}
      data-unlock-workmap={unlock.workmap ? "true" : "false"}
      data-unlock-umbral={unlock.umbral ? "true" : "false"}
      data-unlock-shell={unlock.shell ? "true" : "false"}
    >
      <LocalEstadoAHeroGateSection
        autoEnter={!unlock.heroGate}
        greetingName="Preview"
        onEnter={handleHeroEnter}
        onSignOut={() => undefined}
        playEnterLife={!unlock.heroGate}
      />

      {unlock.heroGate ? (
        <div className={canvasStyles.sheetReveal}>
          <LocalEstadoAPositionCuadrantesSection
            greetingName="Preview"
            onContinue={handlePositionContinue}
            onSignOut={() => undefined}
            onStartPositionContextChange={setStartPositionContext}
            sheetSaved={posicionSaved}
            showSessionChrome={false}
            startPositionContext={startPositionContext}
          />
        </div>
      ) : null}

      {unlock.heroGate && unlock.workmap ? (
        <div className={canvasStyles.sheetReveal}>
          <LocalWorkMapSection
            continuousSheet
            disabled={unlock.umbral}
            initialWorkMap={workMap}
            onContinue={handleWorkMapAdvance}
            onSave={async () => undefined}
            sessionId={PREVIEW_SESSION_ID}
            startPositionContext={startPositionContext}
            userFirstName="Preview"
          />
        </div>
      ) : null}

      {unlock.heroGate && unlock.umbral && workMap ? (
        <div className={canvasStyles.sheetReveal}>
          <LocalSceneEntrySection
            initiallyComplete={sceneEntryComplete}
            onComplete={handleSceneEntryComplete}
            viewModel={sceneEntryViewModel}
          />
        </div>
      ) : null}

      {unlock.heroGate && unlock.shell ? (
        <div className={canvasStyles.sheetReveal}>
          <section
            aria-label="Shell general · Bloque 0 a Bloque 2"
            className={shellStyles.shellSection}
            data-section={SHELL_SECTION_ID}
            data-shell-source="deliverables/design/eve-shell-bloques-v1.html"
            id={SHELL_SECTION_ID}
          >
            <EveShellFrame
              key={shellFrameKey}
              src={SHELL_SRC}
              title="EVE — Shell general · B0 → B2"
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}

"use client";

/**
 * Lienzo local oficial — hoja continua apilada:
 * Header monumental (100svh) → Posición → WorkMap → Umbral → B0 Memoria → B0 Cómo ocurre
 * (B0-Q02) → Frecuencia (B0-Q03) → Inicio/cierre (B0-Q04) in-place
 * → B0.5 → B1 (Instrumento) → B2 (La pieza). B0.5/B1/B2 are visual stubs fed with the
 * memoria operativa literal; runtime binding points: docs/eve/shell/EVE_SHELL_B0_B2_PUNTOS_CONEXION.md
 *
 * Open: http://localhost:3112/dev/ui-posicion-workmap
 * Fresh: http://localhost:3112/dev/ui-posicion-workmap?fresh=1
 */

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  LocalB0ComoOcurreSection,
  LocalB0MemoriaOperativaSection,
  LocalBlockShellChrome,
  LocalCanvasB05Section,
  LocalCanvasB1InstrumentSection,
  LocalCanvasB2PiezaSection,
  LocalEstadoAHeroGateSection,
  LocalSceneEntrySection,
  LocalWorkMapSection,
  buildSceneEntryViewModel,
  createB05VisualStubViewModel,
  createB1VisualStubViewModel,
  createB2VisualStubViewModel,
  createSceneEntryVisualStubViewModel,
  readLocalHeroGateSeen,
  scrollToLocalCanvasSection,
  writeLocalHeroGateSeen,
  type B0BoundariesConfirmPayload,
  type B0MemoriaPart,
  type B05SlotAnswer,
  type B1SlotAnswer,
  type B2SlotAnswer,
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

const PREVIEW_SESSION_ID = "dev-ui-posicion-workmap-preview";
const POSICION_STORAGE_KEY = "eve-dev-ui-posicion-workmap-posicion";

type OfficialLocalSheetUnlock = {
  heroGate: boolean;
  workmap: boolean;
  umbral: boolean;
  b0Memoria: boolean;
  b0ComoOcurre: boolean;
  b05: boolean;
  b1: boolean;
  b2: boolean;
};

const INITIAL_UNLOCK: OfficialLocalSheetUnlock = {
  heroGate: false,
  workmap: false,
  umbral: false,
  b0Memoria: false,
  b0ComoOcurre: false,
  b05: false,
  b1: false,
  b2: false,
};

const DOWNSTREAM_LOCKED = { b05: false, b1: false, b2: false } as const;

type SheetBlock = "0" | "0.5" | "1" | "2";

const SHEET_BLOCK_SECTIONS: ReadonlyArray<[string, SheetBlock]> = [
  ["official-b2", "2"],
  ["official-b1", "1"],
  ["official-b05", "0.5"],
];

type ShellSlot = {
  field_key: string;
  required: boolean;
  control_family: string;
  free_text_when_option_id?: string | null;
};

type ShellAnswer = {
  choiceId?: string;
  choiceIds?: string[];
  complementaryText?: string;
  text?: string;
};

function requiredSlotsAnswered(
  slots: readonly ShellSlot[],
  answers: Record<string, ShellAnswer | undefined>,
): boolean {
  return slots.every((slot) => {
    if (!slot.required) return true;
    const answer = answers[slot.field_key];
    if (!answer) return false;
    if (slot.control_family === "free_text" || slot.control_family === "clarification") {
      return Boolean(answer.text?.trim());
    }
    const ft = slot.free_text_when_option_id;
    if (slot.control_family === "multi_choice") {
      if (!answer.choiceIds?.length) return false;
      return ft && answer.choiceIds.includes(ft) ? Boolean(answer.complementaryText?.trim()) : true;
    }
    if (!answer.choiceId && !answer.text?.trim()) return false;
    return ft && answer.choiceId === ft ? Boolean(answer.complementaryText?.trim()) : true;
  });
}

function scrollToSheetSection(id: string) {
  scrollToLocalCanvasSection(id);
  window.setTimeout(() => scrollToLocalCanvasSection(id), 720);
}

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

function scrollToB0Memoria() {
  scrollToLocalCanvasSection("b0-memoria-operativa");
  window.setTimeout(() => scrollToLocalCanvasSection("b0-memoria-operativa"), 720);
}

function scrollToB0ComoOcurre() {
  scrollToLocalCanvasSection("b0-como-ocurre");
  window.setTimeout(() => scrollToLocalCanvasSection("b0-como-ocurre"), 720);
}

function inheritedFromMemoria(parts: B0MemoriaPart[] | null) {
  const byId = (id: B0MemoriaPart["id"]) =>
    parts?.find((part) => part.id === id)?.value?.trim() || "";
  return {
    action: byId(1),
    object: byId(2),
    how: byId(3),
    output: byId(4),
  };
}

export default function DevUiPosicionWorkmapPreviewPage() {
  const [posicionSaved, setPosicionSaved] = useState(false);
  const [unlock, setUnlock] = useState<OfficialLocalSheetUnlock>(INITIAL_UNLOCK);
  const [sceneEntryComplete, setSceneEntryComplete] = useState(false);
  const [memoriaParts, setMemoriaParts] = useState<B0MemoriaPart[] | null>(null);
  const [blockShellActive, setBlockShellActive] = useState(false);
  const [blockShellHelp, setBlockShellHelp] = useState<string | null>(null);
  const [workMap, setWorkMap] = useState<WorkMapData | null>(null);
  const [primaryActivitySelectionResult, setPrimaryActivitySelectionResult] =
    useState<PrimaryActivitySelectionResult | null>(null);
  const [startPositionContext, setStartPositionContext] =
    useState<StartPositionContext>(EMPTY_START_POSITION_CONTEXT);
  const [workMapSessionKey, setWorkMapSessionKey] = useState(PREVIEW_SESSION_ID);
  const [b0Boundaries, setB0Boundaries] = useState<B0BoundariesConfirmPayload | null>(null);
  const [b05Answers, setB05Answers] = useState<Record<string, B05SlotAnswer>>({});
  const [b1Answers, setB1Answers] = useState<Record<string, B1SlotAnswer>>({});
  const [b2Answers, setB2Answers] = useState<Record<string, B2SlotAnswer>>({});
  const [b2Note, setB2Note] = useState<string | null>(null);
  const [currentBlock, setCurrentBlock] = useState<SheetBlock>("0");

  const resetDownstreamBlocks = () => {
    setB0Boundaries(null);
    setB05Answers({});
    setB1Answers({});
    setB2Answers({});
    setB2Note(null);
  };

  useLayoutEffect(() => {
    if (wantsFreshBoot()) {
      try {
        window.localStorage.removeItem(POSICION_STORAGE_KEY);
      } catch {
        // ignore
      }
      writeLocalHeroGateSeen(false);
      clearWorkMapDraft(PREVIEW_SESSION_ID);
      setPosicionSaved(false);
      setUnlock(INITIAL_UNLOCK);
      setSceneEntryComplete(false);
      setMemoriaParts(null);
      setBlockShellActive(false);
      setBlockShellHelp(null);
      setWorkMap(null);
      setPrimaryActivitySelectionResult(null);
      setStartPositionContext(EMPTY_START_POSITION_CONTEXT);
      setWorkMapSessionKey(`${PREVIEW_SESSION_ID}-${Date.now()}`);
      setB0Boundaries(null);
      setB05Answers({});
      setB1Answers({});
      setB2Answers({});
      setB2Note(null);
      return;
    }

    const heroSeen = readLocalHeroGateSeen();
    const stored = readStoredPosicion();
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
    if (!unlock.b0Memoria) return;
    scrollToB0Memoria();
  }, [unlock.b0Memoria]);

  useEffect(() => {
    if (!unlock.b0ComoOcurre) return;
    scrollToB0ComoOcurre();
  }, [unlock.b0ComoOcurre]);

  useEffect(() => {
    if (!unlock.b05 && !unlock.b1 && !unlock.b2) return;
    const update = () => {
      const threshold = window.innerHeight * 0.4;
      const hit = SHEET_BLOCK_SECTIONS.find(([id]) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top <= threshold : false;
      });
      setCurrentBlock(hit ? hit[1] : "0");
    };
    const frame = window.requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [unlock.b05, unlock.b1, unlock.b2]);

  const sceneEntryViewModel = useMemo(
    () =>
      buildSceneEntryViewModel(primaryActivitySelectionResult) ??
      createSceneEntryVisualStubViewModel(),
    [primaryActivitySelectionResult],
  );

  const blockActivity = useMemo(
    () => ({
      area: sceneEntryViewModel.areaLabel?.trim() ?? "",
      activityLiteral: sceneEntryViewModel.memoryLiteral,
      heading: "Memoria operativa",
    }),
    [sceneEntryViewModel],
  );
  const b05ViewModel = useMemo(
    () => createB05VisualStubViewModel({ activity: blockActivity }),
    [blockActivity],
  );
  const b1ViewModel = useMemo(
    () => createB1VisualStubViewModel({ activity: blockActivity }),
    [blockActivity],
  );
  const b2ViewModel = useMemo(
    () => createB2VisualStubViewModel({ activity: blockActivity }),
    [blockActivity],
  );

  const handleWorkMapAdvance = async (draft: WorkMapData) => {
    const selectionResult = selectPrimaryActivitiesFromWorkMap(draft);

    setWorkMap(draft);
    setPrimaryActivitySelectionResult(
      selectionResult.mode === "reentry_required" ? null : selectionResult,
    );
    setSceneEntryComplete(false);
    setMemoriaParts(null);
    setBlockShellActive(false);
    setBlockShellHelp(null);
    resetDownstreamBlocks();
    setUnlock((current) => ({
      ...current,
      umbral: true,
      b0Memoria: false,
      b0ComoOcurre: false,
      ...DOWNSTREAM_LOCKED,
    }));

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
    setUnlock((current) => ({ ...current, b0Memoria: true }));
    window.requestAnimationFrame(() => scrollToB0Memoria());
  };

  const handleMemoriaConfirm = (parts: B0MemoriaPart[]) => {
    setMemoriaParts(parts);
    setUnlock((current) => ({ ...current, b0ComoOcurre: true }));
    window.requestAnimationFrame(() => scrollToB0ComoOcurre());
  };

  const handleBoundariesConfirm = (payload: B0BoundariesConfirmPayload) => {
    setB0Boundaries(payload);
    setUnlock((current) => ({ ...current, b05: true }));
    window.requestAnimationFrame(() => scrollToSheetSection("official-b05"));
  };

  const handleB05Continue = () => {
    setUnlock((current) => ({ ...current, b1: true }));
    window.requestAnimationFrame(() => scrollToSheetSection("official-b1"));
  };

  const handleB1Continue = () => {
    setUnlock((current) => ({ ...current, b2: true }));
    window.requestAnimationFrame(() => scrollToSheetSection("official-b2"));
  };

  const handleB2Continue = () => {
    setB2Note("Bloque 2 guardado en la hoja · sin runtime conectado");
  };

  const inherited = inheritedFromMemoria(memoriaParts);
  const b05Ready = requiredSlotsAnswered(b05ViewModel.slots, b05Answers);
  const b1Ready = requiredSlotsAnswered(b1ViewModel.slots, b1Answers);
  const shellOnB2 = unlock.b2 && currentBlock === "2";

  return (
    <div
      className={canvasStyles.canvasRoot}
      data-official-local-sheet="true"
      data-unlock-b0-como-ocurre={unlock.b0ComoOcurre ? "true" : "false"}
      data-unlock-b0-memoria={unlock.b0Memoria ? "true" : "false"}
      data-unlock-hero-gate={unlock.heroGate ? "true" : "false"}
      data-unlock-umbral={unlock.umbral ? "true" : "false"}
      data-unlock-workmap={unlock.workmap ? "true" : "false"}
      data-unlock-b05={unlock.b05 ? "true" : "false"}
      data-unlock-b1={unlock.b1 ? "true" : "false"}
      data-unlock-b2={unlock.b2 ? "true" : "false"}
      data-b0-boundaries-confirmed={b0Boundaries ? "true" : "false"}
      data-current-block={currentBlock}
      data-block-shell={blockShellActive ? "true" : "false"}
    >
      <LocalBlockShellChrome
        blockLabel={`Bloque ${currentBlock}`}
        helpText={currentBlock === "0" ? blockShellHelp : null}
        visible={blockShellActive && !shellOnB2}
      />

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
            key={workMapSessionKey}
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

      {unlock.heroGate && unlock.b0Memoria ? (
        <div className={canvasStyles.sheetReveal}>
          <LocalB0MemoriaOperativaSection
            activityLiteral={sceneEntryViewModel.memoryLiteral}
            onConfirm={handleMemoriaConfirm}
            sessionId={PREVIEW_SESSION_ID}
          />
        </div>
      ) : null}

      {unlock.heroGate && unlock.b0ComoOcurre ? (
        <div className={canvasStyles.sheetReveal}>
          <LocalB0ComoOcurreSection
            action={inherited.action}
            how={inherited.how}
            object={inherited.object}
            onBoundariesConfirm={handleBoundariesConfirm}
            onShellActivate={() => setBlockShellActive(true)}
            onShellHelpChange={setBlockShellHelp}
            output={inherited.output}
            sessionId={PREVIEW_SESSION_ID}
          />
        </div>
      ) : null}

      {unlock.heroGate && unlock.b05 ? (
        <div className={canvasStyles.sheetReveal}>
          <LocalCanvasB05Section
            answers={b05Answers}
            continueDisabled={!b05Ready}
            onChange={(fieldKey, patch) =>
              setB05Answers((prev) => ({ ...prev, [fieldKey]: { ...prev[fieldKey], ...patch } }))
            }
            onContinue={handleB05Continue}
            viewModel={b05ViewModel}
          />
        </div>
      ) : null}

      {unlock.heroGate && unlock.b1 ? (
        <div className={canvasStyles.sheetReveal}>
          <LocalCanvasB1InstrumentSection
            answers={b1Answers}
            continueDisabled={!b1Ready}
            onChange={(fieldKey, patch) =>
              setB1Answers((prev) => ({ ...prev, [fieldKey]: { ...prev[fieldKey], ...patch } }))
            }
            onContinue={handleB1Continue}
            viewModel={b1ViewModel}
          />
        </div>
      ) : null}

      {unlock.heroGate && unlock.b2 ? (
        <div className={canvasStyles.sheetReveal}>
          <LocalCanvasB2PiezaSection
            answers={b2Answers}
            note={b2Note}
            onChange={(fieldKey, patch) => {
              setB2Note(null);
              setB2Answers((prev) => ({ ...prev, [fieldKey]: { ...prev[fieldKey], ...patch } }));
            }}
            onContinue={handleB2Continue}
            viewModel={b2ViewModel}
          />
        </div>
      ) : null}
    </div>
  );
}

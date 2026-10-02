"use client";

import type { ReactNode } from "react";
import type { StartPositionContext } from "@/domain/start-position-context";
import type { LocalAuthCredentials, LocalAuthMode } from "./auth-types";
import {
  LocalCanvasB05Section,
  type LocalCanvasB05SectionProps,
} from "./LocalCanvasB05Section";
import {
  LocalCanvasB1InstrumentSection,
  type LocalCanvasB1InstrumentSectionProps,
} from "./LocalCanvasB1InstrumentSection";
import type { LocalCanvasB2InstrumentSectionProps } from "./LocalCanvasB2InstrumentSection";
import { LocalCanvasB2PiezaSection } from "./LocalCanvasB2PiezaSection";
import {
  LocalCanvasB3InstrumentSection,
  type LocalCanvasB3InstrumentSectionProps,
} from "./LocalCanvasB3InstrumentSection";
import {
  LocalCanvasB4InstrumentSection,
  type LocalCanvasB4InstrumentSectionProps,
} from "./LocalCanvasB4InstrumentSection";
import {
  LocalCanvasB5InstrumentSection,
  type LocalCanvasB5InstrumentSectionProps,
} from "./LocalCanvasB5InstrumentSection";
import { LocalEstadoASection } from "./LocalEstadoASection";
import { LocalEstadoAPositionCuadrantesSection } from "./LocalEstadoAPositionCuadrantesSection";
import { LocalEstadoAHeroGateSection } from "./LocalEstadoAHeroGateSection";
import { LocalLoginSection } from "./LocalLoginSection";
import { LocalSessionResumeSection } from "./LocalSessionResumeSection";
import { LocalSceneEntrySection } from "./LocalSceneEntrySection";
import type { SceneEntryViewModel } from "./scene-entry-presentation-contract";
import { LocalB0MemoriaOperativaSection } from "./LocalB0MemoriaOperativaSection";
import type { B0MemoriaPart } from "./LocalB0MemoriaOperativaSection";
import {
  LocalB0ComoOcurreSection,
  type B0ComoOcurreConfirmPayload,
} from "./LocalB0ComoOcurreSection";
import type { B0FrecuenciaConfirmPayload } from "./LocalB0FrecuenciaSection";
import { LocalWorkMapExplanationSection } from "./LocalWorkMapExplanationSection";
import {
  LocalWorkMapSection,
  type LocalWorkMapSectionProps,
} from "./LocalWorkMapSection";
import styles from "./local-canvas.module.css";

export type LocalCanvasFrontDoorMode =
  | "login"
  | "estado_a"
  | "session_resume_loading"
  | "session_resume_fallback"
  | "intake_sheet"
  | "workmap"
  | "significado"
  | "b05"
  | "b1"
  | "b2"
  | "b3"
  | "b4"
  | "b5";

type ParticipantContextView = {
  userName: string;
  companyName: string;
  caseName: string;
  positionTitle: string;
};

type LoginProps = {
  authMode: LocalAuthMode;
  authMessage: string;
  authDisplayName: string;
  authEmail: string;
  authPassword: string;
  authLoading: boolean;
  supabaseAvailable: boolean;
  sessionCreating: boolean;
  hideDemo?: boolean;
  onAuthDisplayNameChange: (value: string) => void;
  onAuthEmailChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onSignIn: (credentials: LocalAuthCredentials) => void;
  onSignUp: (credentials: LocalAuthCredentials) => void;
  onSelectSignUpMode: () => void;
  onSelectSignInMode: () => void;
  onDemo: () => void;
};

type EstadoAProps = {
  creating: boolean;
  onStartCommercial: () => void;
  onSignOut?: () => void;
  startErrorMessage?: string | null;
  greetingName?: string;
  userEmail?: string | null;
  startPositionContext: StartPositionContext;
  onStartPositionContextChange: (context: StartPositionContext) => void;
  participantContext?: ParticipantContextView | null;
};

type ResumeProps = {
  userName: string;
  progressPercent: number;
  lastStepLabel: string;
  lastUpdatedLabel: string;
  restoring: boolean;
  onContinue: () => void;
  onSignOut: () => void;
};

export type LocalCanvasWorkMapProps = {
  /** Hero gate completed (one-time door before Posición). */
  heroGateComplete?: boolean;
  onHeroGateComplete?: () => void;
  /** Estado A completed on the continuous sheet (reveals WorkMap room). */
  estadoAComplete: boolean;
  explanationInitiallyComplete: boolean;
  explanationComplete: boolean;
  onExplanationComplete: () => void;
  showWorkMap: boolean;
  workMapCompletedPersisted?: boolean;
  editor: LocalWorkMapSectionProps;
};

export type LocalCanvasSignificadoProps = {
  sceneEntryInitiallyComplete?: boolean;
  sceneEntryComplete: boolean;
  onSceneEntryComplete: () => void;
  sceneEntryViewModel: SceneEntryViewModel;
  /** After Umbral — unlocks B0 Memoria operativa (replaces old Significado builder on local canvas). */
  showSignificado: boolean;
  significadoCompletedPersisted?: boolean;
  onMemoriaConfirm?: (parts: B0MemoriaPart[]) => void;
  /** After Memoria confirm — unlocks B0 Sección 2 Cómo ocurre (+ frecuencia in-place). */
  showComoOcurre?: boolean;
  /** Parts from Memoria used as D2/D4 (+ action/object) inheritance. */
  memoriaParts?: B0MemoriaPart[] | null;
  onComoOcurreConfirm?: (payload: B0ComoOcurreConfirmPayload) => void;
  /** Fired when frecuencia closes inside Cómo ocurre (same triangular room). */
  onFrecuenciaConfirm?: (payload: B0FrecuenciaConfirmPayload) => void;
  /** @deprecated Unused on local canvas — old Significado/B0 builder removed from this sheet. */
  editor?: unknown;
};

function inheritedFromMemoria(parts?: B0MemoriaPart[] | null) {
  const byId = (id: B0MemoriaPart["id"]) =>
    parts?.find((part) => part.id === id)?.value?.trim() || "";
  return {
    action: byId(1),
    object: byId(2),
    how: byId(3),
    output: byId(4),
  };
}

export type LocalCanvasB05Props = LocalCanvasB05SectionProps;
export type LocalCanvasB1Props = LocalCanvasB1InstrumentSectionProps;
export type LocalCanvasB2Props = LocalCanvasB2InstrumentSectionProps;
export type LocalCanvasB3Props = LocalCanvasB3InstrumentSectionProps;
export type LocalCanvasB4Props = LocalCanvasB4InstrumentSectionProps;
export type LocalCanvasB5Props = LocalCanvasB5InstrumentSectionProps;

type Props = {
  mode: LocalCanvasFrontDoorMode;
  login: LoginProps;
  estadoA: EstadoAProps;
  resume: ResumeProps;
  workmap?: LocalCanvasWorkMapProps | null;
  significado?: LocalCanvasSignificadoProps | null;
  b05?: LocalCanvasB05Props | null;
  b1?: LocalCanvasB1Props | null;
  b2?: LocalCanvasB2Props | null;
  b3?: LocalCanvasB3Props | null;
  b4?: LocalCanvasB4Props | null;
  b5?: LocalCanvasB5Props | null;
};

function SignificadoFlowBands({
  significado,
  withSheetReveal,
}: {
  significado: LocalCanvasSignificadoProps;
  withSheetReveal: boolean;
}) {
  const Wrap = withSheetReveal
    ? ({ children }: { children: ReactNode }) => (
        <div className={styles.sheetReveal}>{children}</div>
      )
    : ({ children }: { children: ReactNode }) => <>{children}</>;

  return (
    <div className={styles.significadoFlow} data-section-flow="significado">
      {significado.significadoCompletedPersisted ? (
        <p className={styles.significadoCompletedNote} role="status">
          Memoria operativa ya confirmada en esta sesión — puedes revisar o
          continuar.
        </p>
      ) : null}
      <Wrap>
        <LocalSceneEntrySection
          initiallyComplete={
            significado.sceneEntryInitiallyComplete ||
            significado.sceneEntryComplete
          }
          onComplete={significado.onSceneEntryComplete}
          viewModel={significado.sceneEntryViewModel}
        />
      </Wrap>
      {significado.showSignificado ? (
        <Wrap>
          <LocalB0MemoriaOperativaSection
            activityLiteral={significado.sceneEntryViewModel.memoryLiteral}
            onConfirm={significado.onMemoriaConfirm}
          />
        </Wrap>
      ) : null}
      {significado.showComoOcurre ? (
        <Wrap>
          <LocalB0ComoOcurreSection
            {...inheritedFromMemoria(significado.memoriaParts)}
            onConfirm={significado.onComoOcurreConfirm}
            onFrecuenciaConfirm={significado.onFrecuenciaConfirm}
          />
        </Wrap>
      ) : null}
    </div>
  );
}

function WorkMapFlowBands({
  workmap,
  withSheetReveal,
}: {
  workmap: LocalCanvasWorkMapProps;
  withSheetReveal: boolean;
}) {
  const Wrap = withSheetReveal
    ? ({ children }: { children: ReactNode }) => (
        <div className={styles.sheetReveal}>{children}</div>
      )
    : ({ children }: { children: ReactNode }) => <>{children}</>;

  // Monument concept: no pedagogical WORKMAP_EXPLANATION room.
  // Component retained for X2 contract / section-model; unlock is automatic after Estado A.
  void LocalWorkMapExplanationSection;

  return (
    <div className={styles.workmapFlow} data-section-flow="workmap">
      {workmap.workMapCompletedPersisted ? (
        <p className={styles.workmapCompletedNote} role="status">
          Mapa ya guardado en esta sesión — puedes revisar o continuar.
        </p>
      ) : null}
      {workmap.showWorkMap ? (
        <Wrap>
          <LocalWorkMapSection {...workmap.editor} continuousSheet={withSheetReveal} />
        </Wrap>
      ) : null}
    </div>
  );
}

/**
 * Progressive official canvas (X1–X3 + UI-B05 visual).
 * Application orchestration stays in page.tsx — this component is presentation.
 *
 * `intake_sheet`: continuous sheet — Estado A → WorkMap; after finalize, Umbral → B0 Memoria → B0 Cómo ocurre (frecuencia in-place)
 * stack below on the same canvas root (next band scrolls into view).
 * Old Significado/B0 builder (`LocalCanvasSignificadoBuilder`) is not mounted on the local sheet.
 * `b05`: Bloque 0.5 official shell (visual stub until X4-05 binds Runtime).
 * `b1`: Bloque 1 Disparador — candidato visual Instrumento (hasta X4-1).
 * `b2`: Bloque 2 Transformación — La pieza (port de eve-b2-la-pieza-v1; hasta X4-2).
 * `b3`: Bloque 3 Salida — candidato visual Instrumento (hasta X4-3; companion-only).
 * `b4`: Bloque 4 Cadena causal — candidato visual Instrumento (hasta X4-4; companion-only).
 * `b5`: Bloque 5 Capacidad — candidato visual Instrumento (hasta X4-5; companion-only).
 */
export function LocalCanvasExperience({
  mode,
  login,
  estadoA,
  resume,
  workmap = null,
  significado = null,
  b05 = null,
  b1 = null,
  b2 = null,
  b3 = null,
  b4 = null,
  b5 = null,
}: Props) {
  return (
    <div
      className={styles.canvasRoot}
      data-official-canvas={
        mode === "b5"
          ? "ui-b5-instrumento"
          : mode === "b4"
            ? "ui-b4-instrumento"
            : mode === "b3"
              ? "ui-b3-instrumento"
              : mode === "b2"
                ? "ui-b2-la-pieza"
                : mode === "b1"
                  ? "ui-b1-instrumento"
                  : "ui-b05"
      }
      data-mode={mode}
    >
      {mode === "login" ? <LocalLoginSection {...login} /> : null}
      {mode === "estado_a" ? <LocalEstadoASection {...estadoA} /> : null}
      {mode === "session_resume_loading" ? (
        <LocalSessionResumeSection {...resume} variant="transient-loading" />
      ) : null}
      {mode === "session_resume_fallback" ? (
        <LocalSessionResumeSection {...resume} variant="fallback" />
      ) : null}
      {mode === "intake_sheet" ? (
        <>
          <LocalEstadoAHeroGateSection
            autoEnter={Boolean(workmap && !workmap.heroGateComplete)}
            greetingName={estadoA.greetingName}
            onEnter={() => workmap?.onHeroGateComplete?.()}
            onSignOut={estadoA.onSignOut}
            playEnterLife={!workmap?.heroGateComplete}
          />
          {(!workmap || workmap.heroGateComplete) ? (
            <LocalEstadoAPositionCuadrantesSection
              greetingName={estadoA.greetingName}
              onContinue={estadoA.onStartCommercial}
              onSignOut={estadoA.onSignOut}
              onStartPositionContextChange={estadoA.onStartPositionContextChange}
              sheetSaved={workmap?.estadoAComplete ?? false}
              showSessionChrome={false}
              startPositionContext={estadoA.startPositionContext}
            />
          ) : null}
          {workmap?.heroGateComplete && workmap.showWorkMap ? (
            <WorkMapFlowBands withSheetReveal workmap={workmap} />
          ) : null}
          {workmap?.heroGateComplete && significado ? (
            <SignificadoFlowBands significado={significado} withSheetReveal />
          ) : null}
        </>
      ) : null}
      {mode === "workmap" && workmap ? (
        <WorkMapFlowBands withSheetReveal={false} workmap={workmap} />
      ) : null}
      {mode === "significado" && significado ? (
        <SignificadoFlowBands significado={significado} withSheetReveal={false} />
      ) : null}
      {mode === "b05" && b05 ? (
        <div className={styles.significadoFlow} data-section-flow="b05">
          <LocalCanvasB05Section {...b05} />
        </div>
      ) : null}
      {mode === "b1" && b1 ? (
        <div className={styles.significadoFlow} data-section-flow="b1">
          <LocalCanvasB1InstrumentSection {...b1} />
        </div>
      ) : null}
      {mode === "b2" && b2 ? (
        <div className={styles.significadoFlow} data-section-flow="b2">
          <LocalCanvasB2PiezaSection {...b2} />
        </div>
      ) : null}
      {mode === "b3" && b3 ? (
        <div className={styles.significadoFlow} data-section-flow="b3">
          <LocalCanvasB3InstrumentSection {...b3} />
        </div>
      ) : null}
      {mode === "b4" && b4 ? (
        <div className={styles.significadoFlow} data-section-flow="b4">
          <LocalCanvasB4InstrumentSection {...b4} />
        </div>
      ) : null}
      {mode === "b5" && b5 ? (
        <div className={styles.significadoFlow} data-section-flow="b5">
          <LocalCanvasB5InstrumentSection {...b5} />
        </div>
      ) : null}
    </div>
  );
}

export { scrollToLocalCanvasSection } from "./scroll-to-section";

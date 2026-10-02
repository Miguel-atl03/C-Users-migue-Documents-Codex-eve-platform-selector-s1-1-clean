"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./canvas-scene-entry.module.css";
import {
  formatSceneEntryInscription,
  SCENE_ENTRY_COMPLETE_NOTE,
  formatSceneEntryCta,
  SCENE_ENTRY_BEAT_MEMORY,
  SCENE_ENTRY_OBSERVE_LEAD,
  SCENE_ENTRY_PERSISTENCE,
  SCENE_ENTRY_REGISTRY_MARK,
  SCENE_ENTRY_REGISTRY_STRAP,
  type SceneEntryPhase,
} from "./scene-entry-copy";
import type { SceneEntryViewModel } from "./scene-entry-presentation-contract";
import {
  type SceneEntryInscriptionBeat,
  type SceneEntryLineMotion,
  useSceneEntryMotion,
} from "./use-scene-entry-typewriter";

export type { SceneEntryPhase } from "./scene-entry-copy";

export type LocalSceneEntrySectionProps = {
  viewModel: SceneEntryViewModel;
  /** When true (reentry), umbral starts at final beat with CTA. */
  initiallyComplete?: boolean;
  onComplete: () => void;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SceneEntryCaret() {
  return <span aria-hidden className={styles.sceneEntryCaret} />;
}

function SceneEntryInscriptionLine({
  beat,
  className,
  fadeVisible,
  getLineText,
  id,
  isLineStarted,
  isLineTyping,
  motion,
}: {
  beat: SceneEntryInscriptionBeat;
  className: string;
  fadeVisible: boolean;
  getLineText: (line: SceneEntryInscriptionBeat) => string;
  id?: string;
  isLineStarted: (line: SceneEntryInscriptionBeat) => boolean;
  isLineTyping: (line: SceneEntryInscriptionBeat) => boolean;
  motion: SceneEntryLineMotion;
}) {
  if (!isLineStarted(beat)) return null;

  return (
    <p
      aria-live={isLineTyping(beat) ? "polite" : undefined}
      className={cx(
        className,
        motion === "fade" && styles.sceneEntryInscriptionFade,
        motion === "fade" && fadeVisible && styles.sceneEntryFadeVisible,
      )}
      id={id}
    >
      {getLineText(beat)}
      {motion === "typewriter" && isLineTyping(beat) ? <SceneEntryCaret /> : null}
    </p>
  );
}

/**
 * SCENE_ENTRY — Umbral Memoria → Escena.
 * Void blanco · cadencia lenta · typewriter (frases 1, 2 y 3) · fade (actividad, CTA).
 */
export function LocalSceneEntrySection({
  viewModel,
  initiallyComplete = false,
  onComplete,
}: LocalSceneEntrySectionProps) {
  const [phase, setPhase] = useState<SceneEntryPhase>(
    initiallyComplete ? "complete" : "beat1",
  );
  const [entryComplete, setEntryComplete] = useState(initiallyComplete);
  const [motionPaused, setMotionPaused] = useState(initiallyComplete);

  const activityInscription = formatSceneEntryInscription(viewModel.memoryLiteral);
  const ctaLabel = formatSceneEntryCta(viewModel.memoryIndex);

  const inscriptionTexts = useMemo(
    () => ({
      beat1: SCENE_ENTRY_BEAT_MEMORY,
      beat2: SCENE_ENTRY_OBSERVE_LEAD,
      beat3: activityInscription,
      beat4: SCENE_ENTRY_PERSISTENCE,
    }),
    [activityInscription],
  );

  const motion = useSceneEntryMotion({
    paused: motionPaused,
    phase,
    setPhase,
    texts: inscriptionTexts,
  });
  const { revealAll } = motion;

  useEffect(() => {
    if (!initiallyComplete) return;
    setPhase("complete");
    setMotionPaused(true);
    revealAll();
  }, [initiallyComplete, revealAll]);

  useEffect(() => {
    if (initiallyComplete || entryComplete) return;

    if (prefersReducedMotion()) {
      revealAll();
      setPhase("beat5");
    }
  }, [entryComplete, initiallyComplete, revealAll]);

  const handleComplete = () => {
    setEntryComplete(true);
    setMotionPaused(true);
    setPhase("complete");
    revealAll();
    onComplete();
  };

  return (
    <section
      aria-labelledby="scene-entry-activity"
      className={styles.sceneEntryScreen}
      data-motion="solemn-mixed"
      data-phase={phase}
      data-scene-entry-complete={entryComplete ? "true" : "false"}
      id="scene-entry"
    >
      <header className={styles.sceneEntryRegistry}>
        <span className={styles.sceneEntryRegistryMark}>{SCENE_ENTRY_REGISTRY_MARK}</span>
        <span>{SCENE_ENTRY_REGISTRY_STRAP}</span>
      </header>

      <div className={styles.sceneEntryStack}>
        <SceneEntryInscriptionLine
          beat="beat1"
          className={`${styles.sceneEntryInscription} ${styles.sceneEntryInscriptionMemory}`}
          fadeVisible={motion.isLineFadeVisible("beat1")}
          getLineText={motion.getLineText}
          isLineStarted={motion.isLineStarted}
          isLineTyping={motion.isLineTyping}
          motion={motion.getLineMotion("beat1")}
        />
        <SceneEntryInscriptionLine
          beat="beat2"
          className={`${styles.sceneEntryInscription} ${styles.sceneEntryInscriptionObserve}`}
          fadeVisible={motion.isLineFadeVisible("beat2")}
          getLineText={motion.getLineText}
          isLineStarted={motion.isLineStarted}
          isLineTyping={motion.isLineTyping}
          motion={motion.getLineMotion("beat2")}
        />
        <SceneEntryInscriptionLine
          beat="beat3"
          className={`${styles.sceneEntryInscription} ${styles.sceneEntryInscriptionActivity}`}
          fadeVisible={motion.isLineFadeVisible("beat3")}
          getLineText={motion.getLineText}
          id="scene-entry-activity"
          isLineStarted={motion.isLineStarted}
          isLineTyping={motion.isLineTyping}
          motion={motion.getLineMotion("beat3")}
        />
        <SceneEntryInscriptionLine
          beat="beat4"
          className={`${styles.sceneEntryInscription} ${styles.sceneEntryInscriptionPersistence}`}
          fadeVisible={motion.isLineFadeVisible("beat4")}
          getLineText={motion.getLineText}
          isLineStarted={motion.isLineStarted}
          isLineTyping={motion.isLineTyping}
          motion={motion.getLineMotion("beat4")}
        />
      </div>

      <footer className={styles.sceneEntryFooter}>
        {entryComplete ? (
          <p className={styles.sceneEntryCompleteNote}>{SCENE_ENTRY_COMPLETE_NOTE}</p>
        ) : phase === "beat5" && motion.isCtaVisible() ? (
          <button
            aria-label="Continuar hacia la memoria operativa"
            className={cx(styles.sceneEntryCtaButton, styles.sceneEntryFadeVisible)}
            onClick={handleComplete}
            type="button"
          >
            {ctaLabel}
          </button>
        ) : null}
      </footer>
    </section>
  );
}

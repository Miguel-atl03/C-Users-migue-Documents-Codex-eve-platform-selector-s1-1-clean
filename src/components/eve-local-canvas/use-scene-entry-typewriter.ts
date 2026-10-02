import { useCallback, useEffect, useRef, useState } from "react";
import type { SceneEntryPhase } from "./scene-entry-copy";
import {
  SCENE_ENTRY_ACTIVITY_POST_FADE_DWELL_MS,
  SCENE_ENTRY_ACTIVITY_PRE_FADE_MS,
  SCENE_ENTRY_BEAT_MEMORY,
  SCENE_ENTRY_BEAT_MEMORY_SEGMENTS,
  SCENE_ENTRY_CHAR_MS,
  SCENE_ENTRY_FADE_MS,
  SCENE_ENTRY_PERSISTENCE_LEAD,
  SCENE_ENTRY_PERSISTENCE_TAIL,
  SCENE_ENTRY_POST_ACTIVITY_PRE_TYPE_MS,
  SCENE_ENTRY_POST_TYPE_DWELL_MS,
  SCENE_ENTRY_PRE_CTA_FADE_MS,
  SCENE_ENTRY_PRE_TYPE_BEAT_MS,
  SCENE_ENTRY_SPLIT_PHRASE_PAUSE_MS,
} from "./scene-entry-copy";

export type SceneEntryInscriptionBeat = "beat1" | "beat2" | "beat3" | "beat4";
export type SceneEntryLineMotion = "typewriter" | "fade";

type SplitPhraseStage = "pre" | "lead" | "pause" | "tail" | "done";
type Beat1Stage = "pre" | "typing" | "pause" | "done";

function getBeat1DisplayedText(
  segmentIndex: number,
  segmentVisible: number,
  stage: Beat1Stage,
): string {
  let result = "";
  for (let index = 0; index < segmentIndex; index += 1) {
    result += SCENE_ENTRY_BEAT_MEMORY_SEGMENTS[index].text;
  }

  const currentSegment = SCENE_ENTRY_BEAT_MEMORY_SEGMENTS[segmentIndex];
  if (!currentSegment) return result;

  if (stage === "pause") {
    return `${result}${currentSegment.text}`;
  }

  return `${result}${currentSegment.text.slice(0, segmentVisible)}`;
}

const BEAT_PHASE_ORDER: SceneEntryPhase[] = [
  "beat1",
  "beat2",
  "beat3",
  "beat4",
  "beat5",
  "complete",
];

const TYPEWRITER_BEATS: SceneEntryInscriptionBeat[] = ["beat1", "beat2", "beat4"];

const LINE_MOTION: Record<SceneEntryInscriptionBeat, SceneEntryLineMotion> = {
  beat1: "typewriter",
  beat2: "typewriter",
  beat3: "fade",
  beat4: "typewriter",
};

function beatIndex(phase: SceneEntryPhase): number {
  return BEAT_PHASE_ORDER.indexOf(phase);
}

function isSimpleTypewriterBeat(phase: SceneEntryPhase): phase is "beat2" {
  return phase === "beat2";
}

export function useSceneEntryMotion(options: {
  texts: Record<SceneEntryInscriptionBeat, string>;
  phase: SceneEntryPhase;
  setPhase: (phase: SceneEntryPhase) => void;
  paused: boolean;
  charMs?: number;
}) {
  const { texts, phase, setPhase, paused, charMs = SCENE_ENTRY_CHAR_MS } = options;
  const [visibleLengths, setVisibleLengths] = useState<
    Partial<Record<SceneEntryInscriptionBeat | "beat4_tail", number>>
  >({});
  const [beat1Stage, setBeat1Stage] = useState<Beat1Stage>("pre");
  const [beat1SegmentIndex, setBeat1SegmentIndex] = useState(0);
  const [beat1SegmentVisible, setBeat1SegmentVisible] = useState(0);
  const [beat4Stage, setBeat4Stage] = useState<SplitPhraseStage>("pre");
  const [fadeRevealed, setFadeRevealed] = useState<
    Partial<Record<SceneEntryInscriptionBeat | "cta", boolean>>
  >({});
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const timerId = window.setTimeout(callback, delayMs);
    timersRef.current.push(timerId);
    return timerId;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (paused || phase !== "beat1") return;

    setBeat1Stage("pre");
    setBeat1SegmentIndex(0);
    setBeat1SegmentVisible(0);

    const startTimerId = window.setTimeout(() => {
      setBeat1Stage("typing");
    }, SCENE_ENTRY_PRE_TYPE_BEAT_MS);

    return () => window.clearTimeout(startTimerId);
  }, [paused, phase]);

  useEffect(() => {
    if (paused || phase !== "beat1" || beat1Stage !== "typing") return;

    const intervalId = window.setInterval(() => {
      setBeat1SegmentVisible((current) => {
        const segment = SCENE_ENTRY_BEAT_MEMORY_SEGMENTS[beat1SegmentIndex];
        if (!segment || current >= segment.text.length) return current;
        return current + 1;
      });
    }, charMs);

    return () => window.clearInterval(intervalId);
  }, [beat1SegmentIndex, beat1Stage, charMs, paused, phase]);

  useEffect(() => {
    if (paused || phase !== "beat1" || beat1Stage !== "typing") return;

    const segment = SCENE_ENTRY_BEAT_MEMORY_SEGMENTS[beat1SegmentIndex];
    if (!segment || beat1SegmentVisible < segment.text.length) return;

    if (segment.pauseAfterMs > 0) {
      setBeat1Stage("pause");
      return;
    }

    const dwellTimerId = window.setTimeout(() => {
      setBeat1Stage("done");
      setPhase("beat2");
    }, SCENE_ENTRY_POST_TYPE_DWELL_MS);

    return () => window.clearTimeout(dwellTimerId);
  }, [
    beat1SegmentIndex,
    beat1SegmentVisible,
    beat1Stage,
    paused,
    phase,
    setPhase,
  ]);

  useEffect(() => {
    if (paused || phase !== "beat1" || beat1Stage !== "pause") return;

    const segment = SCENE_ENTRY_BEAT_MEMORY_SEGMENTS[beat1SegmentIndex];
    if (!segment) return;

    const resumeTimerId = window.setTimeout(() => {
      const nextIndex = beat1SegmentIndex + 1;
      if (nextIndex >= SCENE_ENTRY_BEAT_MEMORY_SEGMENTS.length) {
        setBeat1Stage("done");
        setPhase("beat2");
        return;
      }

      setBeat1SegmentIndex(nextIndex);
      setBeat1SegmentVisible(0);
      setBeat1Stage("typing");
    }, segment.pauseAfterMs);

    return () => window.clearTimeout(resumeTimerId);
  }, [beat1SegmentIndex, beat1Stage, paused, phase, setPhase]);

  useEffect(() => {
    if (paused || phase !== "beat4") return;

    setBeat4Stage("pre");
    setVisibleLengths((current) => ({ ...current, beat4: 0, beat4_tail: 0 }));

    let intervalId: number | undefined;
    const startTimerId = window.setTimeout(() => {
      setBeat4Stage("lead");
      intervalId = window.setInterval(() => {
        setVisibleLengths((current) => {
          const revealed = current.beat4 ?? 0;
          if (revealed >= SCENE_ENTRY_PERSISTENCE_LEAD.length) return current;
          return { ...current, beat4: revealed + 1 };
        });
      }, charMs);
    }, SCENE_ENTRY_POST_ACTIVITY_PRE_TYPE_MS);

    return () => {
      window.clearTimeout(startTimerId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [charMs, paused, phase]);

  useEffect(() => {
    if (paused || phase !== "beat4" || beat4Stage !== "lead") return;

    const leadVisible = visibleLengths.beat4 ?? 0;
    if (leadVisible < SCENE_ENTRY_PERSISTENCE_LEAD.length) return;

    setBeat4Stage("pause");
  }, [beat4Stage, paused, phase, visibleLengths.beat4]);

  useEffect(() => {
    if (paused || phase !== "beat4" || beat4Stage !== "pause") return;

    const resumeTimerId = window.setTimeout(() => {
      setBeat4Stage("tail");
    }, SCENE_ENTRY_SPLIT_PHRASE_PAUSE_MS);

    return () => window.clearTimeout(resumeTimerId);
  }, [beat4Stage, paused, phase]);

  useEffect(() => {
    if (paused || phase !== "beat4" || beat4Stage !== "tail") return;

    const intervalId = window.setInterval(() => {
      setVisibleLengths((current) => {
        const revealed = current.beat4_tail ?? 0;
        if (revealed >= SCENE_ENTRY_PERSISTENCE_TAIL.length) return current;
        return { ...current, beat4_tail: revealed + 1 };
      });
    }, charMs);

    return () => window.clearInterval(intervalId);
  }, [beat4Stage, charMs, paused, phase]);

  useEffect(() => {
    if (paused || phase !== "beat4" || beat4Stage !== "tail") return;

    const tailVisible = visibleLengths.beat4_tail ?? 0;
    if (tailVisible < SCENE_ENTRY_PERSISTENCE_TAIL.length) return;

    const dwellTimerId = window.setTimeout(() => {
      setBeat4Stage("done");
      setPhase("beat5");
    }, SCENE_ENTRY_POST_TYPE_DWELL_MS);

    return () => window.clearTimeout(dwellTimerId);
  }, [beat4Stage, paused, phase, setPhase, visibleLengths.beat4_tail]);

  useEffect(() => {
    if (paused || !isSimpleTypewriterBeat(phase)) return;

    const beat = phase;
    const fullText = texts[beat];
    let intervalId: number | undefined;

    const startTimerId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setVisibleLengths((current) => {
          const revealed = current[beat] ?? 0;
          if (revealed >= fullText.length) return current;
          return { ...current, [beat]: revealed + 1 };
        });
      }, charMs);
    }, SCENE_ENTRY_PRE_TYPE_BEAT_MS);

    return () => {
      window.clearTimeout(startTimerId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [charMs, paused, phase, texts]);

  useEffect(() => {
    if (paused || !isSimpleTypewriterBeat(phase)) return;

    const beat = phase;
    const fullText = texts[beat];
    const revealed = visibleLengths[beat] ?? 0;
    if (revealed < fullText.length) return;

    const dwellTimerId = window.setTimeout(() => {
      const next = BEAT_PHASE_ORDER[beatIndex(phase) + 1];
      if (next) setPhase(next);
    }, SCENE_ENTRY_POST_TYPE_DWELL_MS);

    return () => window.clearTimeout(dwellTimerId);
  }, [paused, phase, setPhase, texts, visibleLengths]);

  useEffect(() => {
    if (paused || phase !== "beat3") return;

    clearTimers();

    schedule(() => {
      setFadeRevealed((current) => ({ ...current, beat3: true }));
    }, SCENE_ENTRY_ACTIVITY_PRE_FADE_MS);

    schedule(() => {
      setPhase("beat4");
    }, SCENE_ENTRY_ACTIVITY_PRE_FADE_MS + SCENE_ENTRY_FADE_MS + SCENE_ENTRY_ACTIVITY_POST_FADE_DWELL_MS);

    return clearTimers;
  }, [clearTimers, paused, phase, schedule, setPhase]);

  useEffect(() => {
    if (paused || phase !== "beat5") return;

    clearTimers();
    schedule(() => {
      setFadeRevealed((current) => ({ ...current, cta: true }));
    }, SCENE_ENTRY_PRE_CTA_FADE_MS);

    return clearTimers;
  }, [clearTimers, paused, phase, schedule]);

  const revealAll = useCallback(() => {
    setBeat1Stage("done");
    setBeat1SegmentIndex(SCENE_ENTRY_BEAT_MEMORY_SEGMENTS.length - 1);
    setBeat1SegmentVisible(
      SCENE_ENTRY_BEAT_MEMORY_SEGMENTS.at(-1)?.text.length ?? 0,
    );
    setBeat4Stage("done");
    setVisibleLengths({
      beat2: texts.beat2.length,
      beat3: texts.beat3.length,
      beat4: SCENE_ENTRY_PERSISTENCE_LEAD.length,
      beat4_tail: SCENE_ENTRY_PERSISTENCE_TAIL.length,
    });
    setFadeRevealed({
      beat3: true,
      cta: true,
    });
  }, [texts]);

  function getLineMotion(line: SceneEntryInscriptionBeat): SceneEntryLineMotion {
    return LINE_MOTION[line];
  }

  function isLineStarted(line: SceneEntryInscriptionBeat): boolean {
    if (phase === "complete") return true;
    if (getLineMotion(line) === "fade") {
      if (beatIndex(phase) > beatIndex(line)) return true;
      return Boolean(fadeRevealed[line]);
    }
    return beatIndex(phase) >= beatIndex(line);
  }

  function isLineFadeVisible(line: SceneEntryInscriptionBeat): boolean {
    if (phase === "complete") return true;
    if (getLineMotion(line) !== "fade") return false;
    if (beatIndex(phase) > beatIndex(line)) return true;
    return Boolean(fadeRevealed[line]);
  }

  function getLineText(line: SceneEntryInscriptionBeat): string {
    const fullText = texts[line];

    if (line === "beat1") {
      if (phase === "complete" || beat1Stage === "done" || beatIndex(phase) > beatIndex("beat1")) {
        return SCENE_ENTRY_BEAT_MEMORY;
      }
      if (phase !== "beat1") return SCENE_ENTRY_BEAT_MEMORY;

      return getBeat1DisplayedText(beat1SegmentIndex, beat1SegmentVisible, beat1Stage);
    }

    if (line === "beat4") {
      if (phase === "complete" || beat4Stage === "done" || beatIndex(phase) > beatIndex("beat4")) {
        return fullText;
      }
      if (phase !== "beat4") return fullText;

      const leadVisible = visibleLengths.beat4 ?? 0;
      const leadText = SCENE_ENTRY_PERSISTENCE_LEAD.slice(0, leadVisible);

      if (beat4Stage === "lead" || beat4Stage === "pause" || beat4Stage === "pre") {
        return beat4Stage === "pause"
          ? SCENE_ENTRY_PERSISTENCE_LEAD
          : leadText;
      }

      const tailVisible = visibleLengths.beat4_tail ?? 0;
      return `${SCENE_ENTRY_PERSISTENCE_LEAD}${SCENE_ENTRY_PERSISTENCE_TAIL.slice(0, tailVisible)}`;
    }

    if (getLineMotion(line) === "fade") return fullText;

    if (phase === "complete") return fullText;
    if (beatIndex(phase) > beatIndex(line)) return fullText;
    if (beatIndex(phase) < beatIndex(line)) return "";
    return fullText.slice(0, visibleLengths[line] ?? 0);
  }

  function isLineTyping(line: SceneEntryInscriptionBeat): boolean {
    if (paused || getLineMotion(line) !== "typewriter") return false;

    if (line === "beat1") {
      if (phase !== "beat1" || beat1Stage !== "typing") return false;
      const segment = SCENE_ENTRY_BEAT_MEMORY_SEGMENTS[beat1SegmentIndex];
      if (!segment) return false;
      return beat1SegmentVisible < segment.text.length;
    }

    if (line === "beat4") {
      if (phase !== "beat4") return false;
      if (beat4Stage === "lead") {
        return (visibleLengths.beat4 ?? 0) < SCENE_ENTRY_PERSISTENCE_LEAD.length;
      }
      if (beat4Stage === "tail") {
        return (visibleLengths.beat4_tail ?? 0) < SCENE_ENTRY_PERSISTENCE_TAIL.length;
      }
      return false;
    }

    if (phase !== line) return false;
    const fullText = texts[line];
    return (visibleLengths[line] ?? 0) < fullText.length;
  }

  function isCtaVisible(): boolean {
    if (phase === "complete") return true;
    return Boolean(fadeRevealed.cta);
  }

  return {
    getLineMotion,
    getLineText,
    isCtaVisible,
    isLineFadeVisible,
    isLineStarted,
    isLineTyping,
    revealAll,
  };
}

/** @deprecated Use useSceneEntryMotion */
export const useSceneEntryTypewriter = useSceneEntryMotion;

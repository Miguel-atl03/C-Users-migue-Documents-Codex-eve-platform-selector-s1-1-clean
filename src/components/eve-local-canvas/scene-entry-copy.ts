/**
 * Scene Entry (Umbral Memoria → Escena) — canonical copy + motion timing.
 */

export type SceneEntryPhase =
  | "beat1"
  | "beat2"
  | "beat3"
  | "beat4"
  | "beat5"
  | "complete";

export const SCENE_ENTRY_REGISTRY_MARK = "EVE";
export const SCENE_ENTRY_REGISTRY_STRAP = "UMBRAL · MEMORIA OPERATIVA";

export type SceneEntryTypewriterSegment = {
  text: string;
  pauseAfterMs: number;
};

export const SCENE_ENTRY_BEAT_MEMORY_SEGMENTS: SceneEntryTypewriterSegment[] = [
  {
    text: "Tus memorias operativas se componen de las actividades que has vivido",
    pauseAfterMs: 2000,
  },
  { text: " una y otra vez", pauseAfterMs: 1000 },
  { text: " en tu trabajo -", pauseAfterMs: 3000 },
  { text: " durante meses o años.", pauseAfterMs: 0 },
];

export const SCENE_ENTRY_BEAT_MEMORY = SCENE_ENTRY_BEAT_MEMORY_SEGMENTS.map(
  (segment) => segment.text,
).join("");

/** @deprecated Derived from SCENE_ENTRY_BEAT_MEMORY_SEGMENTS */
export const SCENE_ENTRY_BEAT_MEMORY_LEAD = SCENE_ENTRY_BEAT_MEMORY_SEGMENTS.slice(
  0,
  3,
)
  .map((segment) => segment.text)
  .join("");

/** @deprecated Derived from SCENE_ENTRY_BEAT_MEMORY_SEGMENTS */
export const SCENE_ENTRY_BEAT_MEMORY_TAIL = SCENE_ENTRY_BEAT_MEMORY_SEGMENTS[3].text;

export const SCENE_ENTRY_OBSERVE_LEAD =
  "Observa lo que has hecho detenidamente";

export const SCENE_ENTRY_PERSISTENCE_LEAD = "Lo que haces no desaparece,";

export const SCENE_ENTRY_PERSISTENCE_TAIL = " sino que perdura a través del tiempo.";

export const SCENE_ENTRY_PERSISTENCE =
  `${SCENE_ENTRY_PERSISTENCE_LEAD}${SCENE_ENTRY_PERSISTENCE_TAIL}`;

/** Downstream arrow only — continues the sheet below the umbral. */
export function formatSceneEntryCta(_sceneIndex?: number): string {
  return "→";
}

export const SCENE_ENTRY_COMPLETE_NOTE =
  "Memoria operativa desbloqueada. La observación continúa abajo en la hoja.";

/** Pause between split typewriter segments (ms). */
export const SCENE_ENTRY_SPLIT_PHRASE_PAUSE_MS = 3000;

/** @deprecated Use SCENE_ENTRY_SPLIT_PHRASE_PAUSE_MS */
export const SCENE_ENTRY_BEAT_MEMORY_PAUSE_MS = SCENE_ENTRY_SPLIT_PHRASE_PAUSE_MS;

/** Solemn typewriter cadence — delay per character (ms). */
export const SCENE_ENTRY_CHAR_MS = 82;

/** Void pause before a typewritten phrase begins (ms). */
export const SCENE_ENTRY_PRE_TYPE_BEAT_MS = 2200;

/** Pause in the void after a typewritten phrase completes (ms). */
export const SCENE_ENTRY_POST_TYPE_DWELL_MS = 3400;

/** Void pause before activity fade — shorter cadence after phrase 2 (ms). */
export const SCENE_ENTRY_ACTIVITY_PRE_FADE_MS = 1500;

/** Void pause before other fade inscriptions (ms). */
export const SCENE_ENTRY_PRE_FADE_MS = 2600;

/** Fade-in duration — must match canvas-scene-entry.module.css. */
export const SCENE_ENTRY_FADE_MS = 1600;

/** Void pause after activity before phrase 3 typewriter begins (ms). */
export const SCENE_ENTRY_POST_ACTIVITY_PRE_TYPE_MS = 4200;

/** Pause after activity fade while activity stays visible (ms). */
export const SCENE_ENTRY_ACTIVITY_POST_FADE_DWELL_MS = 3600;

/** @deprecated No longer used — phrase 3 is typewriter. */
export const SCENE_ENTRY_POST_FADE_DWELL_MS = 3800;

/** Void pause before the CTA fades in (ms). */
export const SCENE_ENTRY_PRE_CTA_FADE_MS = 2800;

export function formatSceneEntryInscription(value: string): string {
  return value.trim();
}

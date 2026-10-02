"use client";

/**
 * Header monumental — primera pantalla completa del lienzo.
 * Top bar de sección (logo | slogan en una línea); saludo / sesión a media altura.
 * Al encontrarlo (una vez), abre Posición debajo en la hoja continua.
 */

import { useEffect, useRef } from "react";
import { EveLogo } from "@/components/EveLogo";
import styles from "./canvas-estado-a-hero-gate.module.css";

export const LOCAL_HERO_GATE_STORAGE_KEY = "eve-local-canvas-hero-gate-seen";

/** Dwell so the monument line can land before Posición opens below. */
const HERO_AUTO_ENTER_MS = 2800;
const HERO_AUTO_ENTER_REDUCED_MS = 400;

export type LocalEstadoAHeroGateSectionProps = {
  greetingName?: string;
  onSignOut?: () => void;
  /** When true, schedule unlock of Posición after dwell. */
  autoEnter?: boolean;
  onEnter?: () => void;
  /** Play entrance life animation (first encounter). */
  playEnterLife?: boolean;
};

export function readLocalHeroGateSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LOCAL_HERO_GATE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeLocalHeroGateSeen(seen: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (seen) {
      window.localStorage.setItem(LOCAL_HERO_GATE_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(LOCAL_HERO_GATE_STORAGE_KEY);
    }
  } catch {
    // best-effort
  }
}

function resolveGreeting(greetingName?: string): string {
  const trimmed = greetingName?.trim();
  if (!trimmed || trimmed.includes("@")) return "Hola.";
  return `Hola, ${trimmed}.`;
}

export function LocalEstadoAHeroGateSection({
  greetingName,
  onSignOut,
  autoEnter = false,
  onEnter,
  playEnterLife = true,
}: LocalEstadoAHeroGateSectionProps) {
  const enteredRef = useRef(false);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  useEffect(() => {
    if (!autoEnter || !onEnterRef.current) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced ? HERO_AUTO_ENTER_REDUCED_MS : HERO_AUTO_ENTER_MS;

    const timer = window.setTimeout(() => {
      if (enteredRef.current) return;
      enteredRef.current = true;
      onEnterRef.current?.();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [autoEnter]);

  return (
    <section
      aria-labelledby="hero-gate-title"
      className={`${styles.gate} ${playEnterLife ? styles.enterLife : ""}`}
      data-section="hero-gate"
      id="hero-gate"
    >
      <header className={styles.topbar}>
        <EveLogo className={styles.logo} size="sm" />
        <div className={styles.slogan}>
          Strategic & Operational Architecture{"\u00a0"} / Enterprise Viability
          Engine
        </div>
      </header>

      <div className={styles.sessionRow}>
        <span>{resolveGreeting(greetingName)}</span>
        {onSignOut ? (
          <button
            className={styles.metaAction}
            onClick={onSignOut}
            type="button"
          >
            Cerrar sesión
          </button>
        ) : (
          <span>Cerrar sesión</span>
        )}
      </div>

      <div className={styles.stage}>
        <h1 className={styles.monumentLine} id="hero-gate-title">
          Lo que sostiene
          <em className={styles.monumentEmphasis}>no siempre se ve.</em>
        </h1>
        <p className={styles.monumentSub}>Una forma distinta de mirar.</p>
      </div>
    </section>
  );
}

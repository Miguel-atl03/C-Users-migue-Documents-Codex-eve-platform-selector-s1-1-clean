"use client";

/**
 * Posición cuadrantes — companion preview (mock v4 authorized; browser-approved).
 * Combined flow: /dev/ui-posicion-workmap
 * Fresh entry (clears memory): http://localhost:3112/dev/ui-posicion?fresh=1
 */

import { useLayoutEffect, useState } from "react";
import { LocalEstadoAPositionCuadrantesProposal } from "@/components/eve-local-canvas/LocalEstadoAPositionCuadrantesProposal";
import {
  EMPTY_POSICION_CUADRANTES_STATE,
  isPosicionCuadrantesComplete,
  type PosicionCuadrantesState,
} from "@/components/eve-local-canvas/posicion-cuadrantes-copy";

const PREVIEW_STORAGE_KEY = "eve-dev-ui-posicion-preview";

export type PosicionSheetLife = "pending" | "enter" | "continues";

function readStoredState(): PosicionCuadrantesState | null {
  try {
    const raw = window.localStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PosicionCuadrantesState>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.role !== "string" ||
      typeof parsed.roleOther !== "string" ||
      typeof parsed.decision !== "string"
    ) {
      return null;
    }
    const restored: PosicionCuadrantesState = {
      role: parsed.role,
      roleOther: parsed.roleOther,
      otherEngraved: Boolean(parsed.otherEngraved),
      decision: parsed.decision,
      sheetSaved:
        typeof parsed.sheetSaved === "boolean"
          ? parsed.sheetSaved
          : isPosicionCuadrantesComplete({
              role: parsed.role,
              roleOther: parsed.roleOther,
              otherEngraved: Boolean(parsed.otherEngraved),
              decision: parsed.decision,
              sheetSaved: false,
            }),
    };
    return restored;
  } catch {
    return null;
  }
}

function hasStoredMarks(state: PosicionCuadrantesState): boolean {
  return Boolean(
    state.role ||
      state.decision ||
      state.roleOther.trim() ||
      state.otherEngraved ||
      state.sheetSaved,
  );
}

function wantsFreshBoot(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("fresh") === "1";
  } catch {
    return false;
  }
}

export default function DevUiPosicionPreviewPage() {
  const [state, setState] = useState<PosicionCuadrantesState>(
    EMPTY_POSICION_CUADRANTES_STATE,
  );
  const [life, setLife] = useState<PosicionSheetLife>("enter");
  const [note, setNote] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (wantsFreshBoot()) {
      try {
        window.localStorage.removeItem(PREVIEW_STORAGE_KEY);
      } catch {
        // ignore
      }
      setState(EMPTY_POSICION_CUADRANTES_STATE);
      setLife("enter");
      return;
    }

    const stored = readStoredState();
    if (stored && hasStoredMarks(stored)) {
      setState(stored);
      setLife("continues");
      return;
    }

    setLife("enter");
  }, []);

  useLayoutEffect(() => {
    if (life === "pending") return;
    try {
      if (hasStoredMarks(state)) {
        window.localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(state));
      } else {
        window.localStorage.removeItem(PREVIEW_STORAGE_KEY);
      }
    } catch {
      // Preview memory is best-effort only.
    }
  }, [state, life]);

  return (
    <main style={{ background: "#e8ebee" }}>
      <LocalEstadoAPositionCuadrantesProposal
        greetingName="Preview"
        life={life}
        onSave={() => {
          setNote("Marcas grabadas en el lienzo.");
        }}
        onSignOut={() => setNote("Mock: cerrar sesión (sin auth en este preview).")}
        onStateChange={setState}
        saveNote={note}
        state={state}
      />
    </main>
  );
}

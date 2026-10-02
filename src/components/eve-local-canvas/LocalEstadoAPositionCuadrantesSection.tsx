"use client";

import { useEffect, useState } from "react";
import type { StartPositionContext } from "@/domain/start-position-context";
import { LocalEstadoAPositionCuadrantesProposal } from "./LocalEstadoAPositionCuadrantesProposal";
import {
  commitPosicionCuadrantes,
  isPosicionCuadrantesComplete,
  mapPosicionCuadrantesToStartPositionContext,
  mapStartPositionContextToPosicionCuadrantes,
  type PosicionCuadrantesState,
} from "./posicion-cuadrantes-copy";

type Props = {
  greetingName?: string;
  onSignOut?: () => void;
  /** Session chrome lives on the monumental header when false. */
  showSessionChrome?: boolean;
  /** Productive handoff: unlock Mapa de trabajo on the continuous sheet. */
  onContinue: () => void;
  onStartPositionContextChange: (context: StartPositionContext) => void;
  sheetSaved?: boolean;
  startPositionContext: StartPositionContext;
};

export function LocalEstadoAPositionCuadrantesSection({
  greetingName,
  onSignOut,
  showSessionChrome = true,
  onContinue,
  onStartPositionContextChange,
  sheetSaved = false,
  startPositionContext,
}: Props) {
  const [state, setState] = useState<PosicionCuadrantesState>(() =>
    mapStartPositionContextToPosicionCuadrantes(startPositionContext, sheetSaved),
  );
  const [life, setLife] = useState<"enter" | "continues">(
    sheetSaved ? "continues" : "enter",
  );

  useEffect(() => {
    setState(mapStartPositionContextToPosicionCuadrantes(startPositionContext, sheetSaved));
    if (sheetSaved) {
      setLife("continues");
    }
  }, [startPositionContext, sheetSaved]);

  const handleStateChange = (next: PosicionCuadrantesState) => {
    setState(next);
    onStartPositionContextChange(mapPosicionCuadrantesToStartPositionContext(next));
  };

  const handleSave = () => {
    const committed = commitPosicionCuadrantes(state);
    setState(committed);
    const context = mapPosicionCuadrantesToStartPositionContext(committed);
    onStartPositionContextChange(context);
    if (isPosicionCuadrantesComplete(committed)) {
      setLife("continues");
      onContinue();
    }
  };

  return (
    <div id="estado-a">
      <LocalEstadoAPositionCuadrantesProposal
        greetingName={greetingName}
        life={life}
        onSave={handleSave}
        onSignOut={onSignOut}
        onStateChange={handleStateChange}
        showSessionChrome={showSessionChrome}
        state={state}
      />
    </div>
  );
}

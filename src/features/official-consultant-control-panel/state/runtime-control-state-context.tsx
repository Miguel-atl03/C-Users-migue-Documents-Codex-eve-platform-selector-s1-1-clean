"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { RuntimeControlStateView } from "@/services/eve/official-control-panel/official-control-panel-runtime-control.types";
import { buildUnavailableRuntimeControlState } from "@/services/eve/official-control-panel/official-control-panel-runtime-control-service";

type RuntimeControlStateContextValue = {
  controlState: RuntimeControlStateView;
  setControlState: (next: RuntimeControlStateView) => void;
  resetControlState: () => void;
};

const RuntimeControlStateContext =
  createContext<RuntimeControlStateContextValue | null>(null);

export function RuntimeControlStateProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: RuntimeControlStateView;
}) {
  const [controlState, setControlState] = useState<RuntimeControlStateView>(
    () => initial ?? buildUnavailableRuntimeControlState(),
  );

  const resetControlState = useCallback(() => {
    setControlState(buildUnavailableRuntimeControlState());
  }, []);

  const value = useMemo(
    () => ({ controlState, setControlState, resetControlState }),
    [controlState, resetControlState],
  );

  return (
    <RuntimeControlStateContext.Provider value={value}>
      {children}
    </RuntimeControlStateContext.Provider>
  );
}

export function useRuntimeControlState() {
  const ctx = useContext(RuntimeControlStateContext);
  if (!ctx) {
    return {
      controlState: buildUnavailableRuntimeControlState(),
      setControlState: () => undefined,
      resetControlState: () => undefined,
    };
  }
  return ctx;
}

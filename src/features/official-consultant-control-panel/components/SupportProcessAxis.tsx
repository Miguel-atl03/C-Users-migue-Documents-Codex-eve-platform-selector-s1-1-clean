"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import type { SupportProcessAxisCode } from "@/services/eve/official-control-panel/catalogs/support-process-axis.catalog";
import type { SupportProcessAxisViewModel } from "../types/support-process-axis.types";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import styles from "../styles/official-control-panel.module.css";
import { SupportProcessAxisItemButton } from "./SupportProcessAxisItem";
import { SupportProcessAxisState } from "./SupportProcessAxisState";
import { PanelScreenStateChrome } from "./PanelScreenStateChrome";

type SupportProcessAxisProps = {
  axis: SupportProcessAxisViewModel;
  onSelectProcess: (code: SupportProcessAxisCode) => void;
  onRetry?: () => void;
  screenState?: OfficialPanelScreenState;
  requestId?: string | null;
};

function processCodeSelector(code: string): string {
  return `[data-process-code="${code.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;
}

export function SupportProcessAxis({
  axis,
  onSelectProcess,
  onRetry,
  screenState = "ready",
  requestId = null,
}: SupportProcessAxisProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [focusCode, setFocusCode] = useState<SupportProcessAxisCode | null>(
    null,
  );

  useEffect(() => {
    if (axis.items.length === 0) {
      setFocusCode((current) => (current === null ? current : null));
      return;
    }
    setFocusCode((current) => {
      if (current && axis.items.some((item) => item.code === current)) {
        return current;
      }
      if (
        axis.selectedCode &&
        axis.items.some((item) => item.code === axis.selectedCode)
      ) {
        return axis.selectedCode;
      }
      return axis.items[0]?.code ?? null;
    });
  }, [axis.items, axis.selectedCode]);

  const focusChip = (code: SupportProcessAxisCode) => {
    setFocusCode(code);
    const nextButton = listRef.current?.querySelector<HTMLElement>(
      processCodeSelector(code),
    );
    nextButton?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    code: SupportProcessAxisCode,
  ) => {
    const codes = axis.items.map((item) => item.code);
    const index = codes.indexOf(code);
    if (index < 0) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectProcess(code);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      const first = codes[0];
      if (!first) return;
      onSelectProcess(first);
      focusChip(first);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      const last = codes[codes.length - 1];
      if (!last) return;
      onSelectProcess(last);
      focusChip(last);
      return;
    }

    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = codes[(index + delta + codes.length) % codes.length];
    if (!next) return;
    focusChip(next);
  };

  return (
    <section
      className={styles.supportProcessAxis}
      aria-labelledby="support-process-axis-heading"
      data-testid="support-process-axis"
      data-screen-state={screenState}
    >
      <div className={styles.supportProcessAxisHeader}>
        <h2
          className={styles.supportProcessAxisTitle}
          id="support-process-axis-heading"
        >
          Procesos de soporte
        </h2>
      </div>

      <PanelScreenStateChrome
        screenState={screenState}
        requestId={requestId}
        onRetry={onRetry}
      />

      {screenState !== "loading" &&
      screenState !== "fatal" &&
      screenState !== "forbidden" &&
      screenState !== "not_found" ? (
        <SupportProcessAxisState axis={axis} onRetry={onRetry} />
      ) : null}

      {axis.items.length > 0 &&
      screenState !== "fatal" &&
      screenState !== "forbidden" &&
      screenState !== "not_found" &&
      screenState !== "loading" ? (
        <div className={styles.supportProcessAxisTrack} ref={listRef}>
          <div
            className={styles.supportProcessAxisTrackInner}
            role="toolbar"
            aria-label="Procesos de soporte"
          >
            {axis.items.map((item) => (
              <SupportProcessAxisItemButton
                key={item.code}
                item={item}
                selected={axis.selectedCode === item.code}
                tabIndex={
                  (focusCode ??
                    axis.selectedCode ??
                    axis.items[0]?.code) === item.code
                    ? 0
                    : -1
                }
                onSelect={onSelectProcess}
                onKeyDown={handleKeyDown}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

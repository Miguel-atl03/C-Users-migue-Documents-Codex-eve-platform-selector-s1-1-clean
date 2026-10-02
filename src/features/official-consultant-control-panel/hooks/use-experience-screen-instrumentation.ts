"use client";

import { useEffect, useRef } from "react";

import type {
  ExperienceEventType,
  ExperienceScreenKey,
} from "@/services/eve/official-control-panel/official-control-panel-experience.types";

import { postCaseExperienceEvent } from "../data/client-context-api";
import type {
  ClientCompanyView,
  ExperienceGovernanceView,
  OfficialPanelMode,
} from "../types/official-control-panel.types";

/**
 * Module-level dedup survives React Strict Mode remounts.
 * Key: userId|caseId|screenKey|eventType|navVersion
 */
const emittedEventKeys = new Set<string>();

/** Survives Strict Mode remount so the same surface does not bump navVersion. */
let activeSurface: {
  userId: string;
  caseId: string;
  screenKey: ExperienceScreenKey;
  navVersion: number;
} | null = null;

let panelTabSessionReference: string | null = null;
let navVersionCounter = 0;

function getPanelTabSessionReference(): string {
  if (panelTabSessionReference) return panelTabSessionReference;
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `t${Date.now()}`;
  panelTabSessionReference = `official-panel-tab:${id}`;
  return panelTabSessionReference;
}

function userIdFromAccessToken(accessToken: string): string | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2 || !parts[1]) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = JSON.parse(atob(padded)) as { sub?: unknown };
    return typeof json.sub === "string" && json.sub.trim()
      ? json.sub.trim()
      : null;
  } catch {
    return null;
  }
}

export function mapOfficialPanelSurfaceToScreenKey(
  mode: OfficialPanelMode,
  view: ClientCompanyView | ExperienceGovernanceView,
): ExperienceScreenKey | null {
  if (mode === "client-company") {
    if (view === "monitoring") return "panel_client_monitoring";
    if (view === "tracking") return "panel_client_tracking";
    if (view === "governance") return "panel_client_governance";
    return null;
  }
  if (mode === "user-experience-governance") {
    if (view === "journeys") return "panel_experience_journeys";
    if (view === "support") return "panel_experience_support";
    if (view === "screen_health") return "panel_experience_screen_health";
    return null;
  }
  return null;
}

function dedupKey(
  userId: string,
  caseId: string,
  screenKey: string,
  eventType: ExperienceEventType,
  navVersion: number,
): string {
  return `${userId}|${caseId}|${screenKey}|${eventType}|${navVersion}`;
}

type UseExperienceScreenInstrumentationInput = {
  caseId: string | null;
  accessToken: string | null;
  mode: OfficialPanelMode;
  view: ClientCompanyView | ExperienceGovernanceView;
  enabled?: boolean;
};

/**
 * Emits productive screen_entered / screen_abandoned for official panel surfaces.
 * Does not instrument scroll, hover, or renders.
 */
export function useExperienceScreenInstrumentation({
  caseId,
  accessToken,
  mode,
  view,
  enabled = true,
}: UseExperienceScreenInstrumentationInput): void {
  const inFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !caseId || !accessToken) return;

    const userId = userIdFromAccessToken(accessToken);
    if (!userId) return;

    const screenKey = mapOfficialPanelSurfaceToScreenKey(mode, view);
    if (!screenKey) return;

    const sameSurface =
      activeSurface &&
      activeSurface.screenKey === screenKey &&
      activeSurface.caseId === caseId &&
      activeSurface.userId === userId;

    if (sameSurface) return;

    const prev = activeSurface;
    navVersionCounter += 1;
    const nextNavVersion = navVersionCounter;

    const sessionReference = getPanelTabSessionReference();
    const token = accessToken;

    const emit = async (
      eventType: ExperienceEventType,
      targetScreen: ExperienceScreenKey,
      navVersion: number,
      targetCaseId: string,
      targetUserId: string,
    ) => {
      const key = dedupKey(
        targetUserId,
        targetCaseId,
        targetScreen,
        eventType,
        navVersion,
      );
      if (emittedEventKeys.has(key)) return;
      if (inFlightRef.current === key) return;
      emittedEventKeys.add(key);
      inFlightRef.current = key;
      try {
        await postCaseExperienceEvent(token, targetCaseId, {
          screenKey: targetScreen,
          eventType,
          sessionReference,
          metadata: {
            navVersion,
            mode,
            view,
          },
        });
      } catch {
        // Fail soft: instrumentation must not block panel UX.
        emittedEventKeys.delete(key);
      } finally {
        if (inFlightRef.current === key) {
          inFlightRef.current = null;
        }
      }
    };

    if (prev) {
      void emit(
        "screen_abandoned",
        prev.screenKey,
        prev.navVersion,
        prev.caseId,
        prev.userId,
      );
    }

    activeSurface = {
      screenKey,
      navVersion: nextNavVersion,
      caseId,
      userId,
    };

    void emit("screen_entered", screenKey, nextNavVersion, caseId, userId);
  }, [accessToken, caseId, enabled, mode, view]);
}

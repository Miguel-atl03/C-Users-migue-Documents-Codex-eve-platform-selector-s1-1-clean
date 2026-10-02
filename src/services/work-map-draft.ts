import {
  createEmptyWorkMap,
  normalizeWorkMapData,
  type WorkMapData,
} from "@/domain/local-work-map";

export const WORK_MAP_DRAFT_STORAGE_PREFIX = "eve:capa1:work-map-draft:v1";

function draftStorageKey(sessionId?: string | null) {
  if (sessionId) {
    return `${WORK_MAP_DRAFT_STORAGE_PREFIX}:${sessionId}`;
  }

  return WORK_MAP_DRAFT_STORAGE_PREFIX;
}

export function readWorkMapDraft(sessionId?: string | null): WorkMapData | null {
  if (typeof window === "undefined") return null;

  const savedDraft = window.localStorage.getItem(draftStorageKey(sessionId));
  if (!savedDraft) return null;

  try {
    const parsed = JSON.parse(savedDraft) as { workMap?: unknown };
    return normalizeWorkMapData(parsed.workMap);
  } catch {
    window.localStorage.removeItem(draftStorageKey(sessionId));
    return null;
  }
}

export function writeWorkMapDraft(workMap: WorkMapData, sessionId?: string | null) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    draftStorageKey(sessionId),
    JSON.stringify({
      workMap,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function clearWorkMapDraft(sessionId?: string | null) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(draftStorageKey(sessionId));
}

export function readWorkMapDraftOrEmpty(sessionId?: string | null): WorkMapData {
  return readWorkMapDraft(sessionId) ?? createEmptyWorkMap();
}

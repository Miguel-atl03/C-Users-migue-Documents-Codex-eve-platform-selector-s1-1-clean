import {
  createEmptySignificadoDraft,
  normalizeSignificadoDraft,
  type SignificadoLocalDraft,
} from "@/features/significado/significado-draft-state";

export const SIGNIFICADO_DRAFT_STORAGE_PREFIX = "eve:capa1:significado-draft:v1";

function draftStorageKey(sessionId?: string | null) {
  if (sessionId) {
    return `${SIGNIFICADO_DRAFT_STORAGE_PREFIX}:${sessionId}`;
  }

  return SIGNIFICADO_DRAFT_STORAGE_PREFIX;
}

export function readSignificadoDraft(
  sessionId?: string | null,
): SignificadoLocalDraft | null {
  if (typeof window === "undefined" || !sessionId) return null;

  const savedDraft = window.localStorage.getItem(draftStorageKey(sessionId));
  if (!savedDraft) return null;

  try {
    const parsed = JSON.parse(savedDraft) as { draft?: unknown };
    return normalizeSignificadoDraft(parsed.draft, sessionId);
  } catch {
    window.localStorage.removeItem(draftStorageKey(sessionId));
    return null;
  }
}

export function writeSignificadoDraft(
  draft: SignificadoLocalDraft,
  sessionId?: string | null,
) {
  if (typeof window === "undefined" || !sessionId) return;

  window.localStorage.setItem(
    draftStorageKey(sessionId),
    JSON.stringify({
      draft,
      updatedAt: draft.updatedAt,
    }),
  );
}

export function clearSignificadoDraft(sessionId?: string | null) {
  if (typeof window === "undefined" || !sessionId) return;
  window.localStorage.removeItem(draftStorageKey(sessionId));
}

export function readSignificadoDraftOrEmpty(sessionId: string): SignificadoLocalDraft {
  return readSignificadoDraft(sessionId) ?? createEmptySignificadoDraft(sessionId);
}

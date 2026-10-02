const PARTICIPANT_QUERY_KEY = "participant";
const PROFILE_QUERY_KEY = "profile";
const CANONICAL_PARTICIPANT_QUERY_KEY = "participant_id";
const CANONICAL_PROFILE_QUERY_KEY = "profile_id";

export function parseParticipantSelection(
  params: URLSearchParams,
): string | null {
  const value = (
    params.get(CANONICAL_PARTICIPANT_QUERY_KEY) ??
    params.get(PARTICIPANT_QUERY_KEY)
  )?.trim();
  return value ? value : null;
}

export function parseProfileSelection(params: URLSearchParams): string | null {
  const value = (
    params.get(CANONICAL_PROFILE_QUERY_KEY) ??
    params.get(PROFILE_QUERY_KEY)
  )?.trim();
  return value ? value : null;
}

export function buildParticipantProfileNavigation(
  current: URLSearchParams,
  selection: { participantId: string | null; profileId: string | null },
): URLSearchParams {
  const next = new URLSearchParams(current);
  if (selection.participantId) {
    next.set(PARTICIPANT_QUERY_KEY, selection.participantId);
    next.set(CANONICAL_PARTICIPANT_QUERY_KEY, selection.participantId);
  } else {
    next.delete(PARTICIPANT_QUERY_KEY);
    next.delete(CANONICAL_PARTICIPANT_QUERY_KEY);
  }
  if (selection.profileId && selection.participantId) {
    next.set(PROFILE_QUERY_KEY, selection.profileId);
    next.set(CANONICAL_PROFILE_QUERY_KEY, selection.profileId);
  } else {
    next.delete(PROFILE_QUERY_KEY);
    next.delete(CANONICAL_PROFILE_QUERY_KEY);
  }
  return next;
}

export function clearParticipantProfileSelection(
  current: URLSearchParams,
): URLSearchParams {
  return buildParticipantProfileNavigation(current, {
    participantId: null,
    profileId: null,
  });
}

export function changeParticipantSelection(
  current: URLSearchParams,
  participantId: string | null,
): URLSearchParams {
  return buildParticipantProfileNavigation(current, {
    participantId,
    profileId: null,
  });
}

export function changeProfileSelection(
  current: URLSearchParams,
  participantId: string,
  profileId: string | null,
): URLSearchParams {
  return buildParticipantProfileNavigation(current, {
    participantId,
    profileId,
  });
}

export { PARTICIPANT_QUERY_KEY, PROFILE_QUERY_KEY };

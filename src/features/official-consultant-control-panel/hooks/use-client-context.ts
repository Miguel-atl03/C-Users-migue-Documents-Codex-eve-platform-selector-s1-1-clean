"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { officialPanelSupabase } from "@/lib/official-panel-supabase";
import {
  ContextAuthError,
  getActiveRelationships,
  getAuthorizedClientCompanies,
  getCurrentCases,
} from "../data/client-context-api";
import {
  accessTokenFromSession,
  ensureLocalConsultantAccessToken,
  resetLocalConsultantBootstrapCache,
  type AuthReadiness,
} from "../data/session-bootstrap";
import {
  CONTEXT_ACCESS_ERROR,
  CONTEXT_NETWORK_ERROR,
  SESSION_VALIDATION_ERROR,
} from "../presentation/client-context-shell-copy";
import {
  buildClientContextNavigation,
  changeClientContextCase,
  changeClientContextCompany,
  changeClientContextRelationship,
  parseClientContextSelection,
} from "../state/client-context-navigation";
import { buildOfficialPanelLoginRedirect } from "../state/official-panel-login-redirect";
import type {
  ClientContextErrorKind,
  ClientContextSelection,
  ClientContextStatus,
  ClientContextViewModel,
} from "../types/client-context.types";
import type {
  ClientCaseOption,
  ClientCompanyOption,
  ClientRelationshipOption,
} from "@/services/eve/official-control-panel/official-control-panel-context.types";

const GENERIC_CONTEXT_ERROR = CONTEXT_NETWORK_ERROR;
const ACCESS_CONTEXT_ERROR = CONTEXT_ACCESS_ERROR;
const SESSION_UNAVAILABLE_ERROR = SESSION_VALIDATION_ERROR;

export function useClientContext() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const [authReadiness, setAuthReadiness] =
    useState<AuthReadiness>("checking");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const [companies, setCompanies] = useState<ClientCompanyOption[]>([]);
  const [relationships, setRelationships] = useState<
    ClientRelationshipOption[]
  >([]);
  const [cases, setCases] = useState<ClientCaseOption[]>([]);
  const [selection, setSelection] = useState<ClientContextSelection>({
    companyId: null,
    relationshipId: null,
    caseId: null,
  });
  const [status, setStatus] =
    useState<ClientContextStatus>("loading-companies");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ClientContextErrorKind | null>(
    null,
  );
  const [retryVersion, setRetryVersion] = useState(0);
  const normalizedAccessErrorRef = useRef(false);
  const previousSafeSelectionRef = useRef<ClientContextSelection>({
    companyId: null,
    relationshipId: null,
    caseId: null,
  });
  /** Survives aborted in-flight company fetches (Strict Mode / token churn). */
  const companiesLoadedRef = useRef(false);
  const companiesRequestIdRef = useRef(0);
  /** Avoids flashing "checking" / "Cargando empresas…" after a successful auth. */
  const accessTokenRef = useRef<string | null>(null);
  const navigate = useCallback(
    (params: URLSearchParams, replace = false) => {
      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      if (replace) router.replace(nextUrl, { scroll: false });
      else router.push(nextUrl, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- synchronizes Panel auth readiness with Supabase session state */
    if (!officialPanelSupabase) {
      setAuthReadiness("error");
      setAccessToken(null);
      accessTokenRef.current = null;
      setStatus("error");
      setErrorKind("network");
      setErrorMessage(GENERIC_CONTEXT_ERROR);
      return;
    }

    let active = true;
    const client = officialPanelSupabase;
    // Soft check: do not wipe a successful companies load or flash "checking"
    // when a bearer was already established (Strict Mode remount / re-subscribe).
    setErrorMessage(null);
    setErrorKind(null);
    if (!accessTokenRef.current && !companiesLoadedRef.current) {
      setAuthReadiness("checking");
      setStatus("loading-companies");
    }

    const applyAuthenticated = (token: string) => {
      if (!active) return;
      accessTokenRef.current = token;
      setAccessToken(token);
      setAuthReadiness("authenticated");
      setErrorMessage(null);
      setErrorKind(null);
    };

    const applyUnauthenticated = () => {
      if (!active) return;
      accessTokenRef.current = null;
      setAccessToken(null);
      setAuthReadiness("unauthenticated");
      setStatus("error");
      setErrorKind("session");
      setErrorMessage(SESSION_UNAVAILABLE_ERROR);
      // No local bypass: send the consultant to the official platform login.
      const returnPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
      router.replace(buildOfficialPanelLoginRedirect(returnPath));
    };

    const resolveMissingSession = async () => {
      // Module-level cache survives Strict Mode remounts (do not clear here).
      const bootstrapped = await ensureLocalConsultantAccessToken(client);
      if (!active) return;
      if (bootstrapped) {
        applyAuthenticated(bootstrapped);
        return;
      }
      // If we already hold a token from a prior successful pass, keep it.
      if (accessTokenRef.current) {
        setAuthReadiness("authenticated");
        return;
      }
      applyUnauthenticated();
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      const token = accessTokenFromSession(session);

      if (token) {
        applyAuthenticated(token);
        return;
      }

      if (event === "INITIAL_SESSION" || event === "SIGNED_OUT") {
        void resolveMissingSession();
      }
    });

    void resolveMissingSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname, queryString, retryVersion, router]);

  useEffect(() => {
    if (authReadiness === "checking") {
      if (!companiesLoadedRef.current) {
        setStatus("loading-companies");
      }
      return;
    }
    if (authReadiness !== "authenticated" || !accessToken) {
      return;
    }

    const token = accessToken;
    const controller = new AbortController();
    const requestId = companiesRequestIdRef.current + 1;
    companiesRequestIdRef.current = requestId;

    async function loadCompanies() {
      setErrorMessage(null);
      setErrorKind(null);
      // Never flip companiesLoaded back to false on reload — that is what
      // left the UI stuck on "Cargando empresas…" after AbortError.
      if (!companiesLoadedRef.current) {
        setStatus("loading-companies");
      }

      try {
        const nextCompanies = await getAuthorizedClientCompanies(
          token,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (companiesRequestIdRef.current !== requestId) return;
        setCompanies(nextCompanies);
        companiesLoadedRef.current = true;
        setCompaniesLoaded(true);
      } catch (errorValue) {
        if (isAbortError(errorValue) || controller.signal.aborted) return;
        if (companiesRequestIdRef.current !== requestId) return;
        if (errorValue instanceof ContextAuthError) {
          accessTokenRef.current = null;
          setAccessToken(null);
          setAuthReadiness("unauthenticated");
          setStatus("error");
          setErrorKind("session");
          setErrorMessage(SESSION_UNAVAILABLE_ERROR);
          const returnPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
          router.replace(buildOfficialPanelLoginRedirect(returnPath));
          return;
        }
        setStatus("error");
        setErrorKind("network");
        setErrorMessage(GENERIC_CONTEXT_ERROR);
      }
    }

    void loadCompanies();
    return () => controller.abort();
  }, [accessToken, authReadiness, pathname, queryString, retryVersion, router]);

  useEffect(() => {
    if (authReadiness !== "authenticated" || !accessToken || !companiesLoaded) {
      return;
    }
    const token = accessToken;
    const controller = new AbortController();
    const requested = parseClientContextSelection(
      new URLSearchParams(queryString),
    );

    async function resolveContext() {
      const currentParams = new URLSearchParams(queryString);
      const company = companies.find((item) => item.id === requested.companyId);

      if (!requested.companyId) {
        setSelection({ companyId: null, relationshipId: null, caseId: null });
        setRelationships([]);
        setCases([]);
        setStatus("no-company");
        if (normalizedAccessErrorRef.current) {
          setErrorKind("context");
          setErrorMessage(ACCESS_CONTEXT_ERROR);
        } else {
          setErrorKind(null);
          setErrorMessage(null);
        }
        previousSafeSelectionRef.current = {
          companyId: null,
          relationshipId: null,
          caseId: null,
        };
        return;
      }

      if (!company) {
        normalizedAccessErrorRef.current = true;
        setSelection({ companyId: null, relationshipId: null, caseId: null });
        setRelationships([]);
        setCases([]);
        setStatus("no-company");
        setErrorKind("context");
        setErrorMessage(ACCESS_CONTEXT_ERROR);
        navigate(changeClientContextCompany(currentParams, null), true);
        return;
      }

      setSelection({
        companyId: company.id,
        relationshipId: requested.relationshipId,
        caseId: requested.caseId,
      });
      setStatus("loading-relationships");
      setErrorMessage(null);
      setErrorKind(null);

      try {
        const nextRelationships = await getActiveRelationships(
          token,
          company.id,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setRelationships(nextRelationships);

        if (!requested.relationshipId && nextRelationships.length === 1) {
          navigate(
            changeClientContextRelationship(currentParams, {
              companyId: company.id,
              relationshipId: nextRelationships[0].id,
            }),
            true,
          );
          return;
        }

        const relationship = nextRelationships.find(
          (item) => item.id === requested.relationshipId,
        );
        if (!relationship) {
          setSelection({
            companyId: company.id,
            relationshipId: null,
            caseId: null,
          });
          setCases([]);
          setStatus("no-relationship");
          if (requested.relationshipId || requested.caseId) {
            normalizedAccessErrorRef.current = true;
            setErrorKind("context");
            setErrorMessage(ACCESS_CONTEXT_ERROR);
            navigate(
              changeClientContextRelationship(currentParams, {
                companyId: company.id,
                relationshipId: null,
              }),
              true,
            );
          } else if (normalizedAccessErrorRef.current) {
            setErrorKind("context");
            setErrorMessage(ACCESS_CONTEXT_ERROR);
          } else {
            setErrorKind(null);
            setErrorMessage(null);
          }
          return;
        }

        setStatus("loading-cases");
        const nextCases = await getCurrentCases(
          token,
          relationship.id,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setCases(nextCases);

        if (!requested.caseId && nextCases.length === 1) {
          navigate(
            changeClientContextCase(currentParams, {
              companyId: company.id,
              relationshipId: relationship.id,
              caseId: nextCases[0].id,
            }),
            true,
          );
          return;
        }

        const selectedCase = nextCases.find(
          (item) => item.id === requested.caseId,
        );
        if (!selectedCase) {
          setSelection({
            companyId: company.id,
            relationshipId: relationship.id,
            caseId: null,
          });
          setStatus("no-case");
          if (requested.caseId) {
            normalizedAccessErrorRef.current = true;
            setErrorKind("context");
            setErrorMessage(ACCESS_CONTEXT_ERROR);
            navigate(
              changeClientContextCase(currentParams, {
                companyId: company.id,
                relationshipId: relationship.id,
                caseId: null,
              }),
              true,
            );
          } else if (normalizedAccessErrorRef.current) {
            setErrorKind("context");
            setErrorMessage(ACCESS_CONTEXT_ERROR);
          } else {
            setErrorKind(null);
            setErrorMessage(null);
          }
          return;
        }

        const nextSelection = {
          companyId: company.id,
          relationshipId: relationship.id,
          caseId: selectedCase.id,
        };
        setSelection(nextSelection);
        previousSafeSelectionRef.current = nextSelection;
        setErrorMessage(null);
        setErrorKind(null);
        setStatus("active");
      } catch (errorValue) {
        if (isAbortError(errorValue) || controller.signal.aborted) return;
        if (errorValue instanceof ContextAuthError) {
          setAccessToken(null);
          setAuthReadiness("unauthenticated");
          setStatus("error");
          setErrorKind("session");
          setErrorMessage(SESSION_UNAVAILABLE_ERROR);
          const returnPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
          router.replace(buildOfficialPanelLoginRedirect(returnPath));
          return;
        }
        setSelection(previousSafeSelectionRef.current);
        setStatus("error");
        setErrorKind("network");
        setErrorMessage(GENERIC_CONTEXT_ERROR);
      }
    }

    void resolveContext();
    return () => controller.abort();
  }, [
    accessToken,
    authReadiness,
    companies,
    companiesLoaded,
    navigate,
    pathname,
    queryString,
    router,
  ]);

  const viewModel = useMemo<ClientContextViewModel>(
    () => ({
      status,
      // Once companies are loaded, never report companiesLoading — even if
      // auth briefly re-enters "checking" on Strict Mode remount.
      companiesLoading:
        !companiesLoaded &&
        status !== "error" &&
        authReadiness !== "unauthenticated" &&
        authReadiness !== "error",
      companiesLoaded,
      companies,
      relationships,
      cases,
      selection,
      selectedCompany:
        companies.find((item) => item.id === selection.companyId) ?? null,
      selectedRelationship:
        relationships.find((item) => item.id === selection.relationshipId) ??
        null,
      selectedCase: cases.find((item) => item.id === selection.caseId) ?? null,
      errorMessage,
      errorKind,
      authReadiness,
    }),
    [
      authReadiness,
      cases,
      companies,
      companiesLoaded,
      errorKind,
      errorMessage,
      relationships,
      selection,
      status,
    ],
  );

  const selectCompany = useCallback(
    (companyId: string | null) => {
      normalizedAccessErrorRef.current = false;
      setStatus(companyId ? "loading-relationships" : "no-company");
      navigate(
        changeClientContextCompany(
          new URLSearchParams(queryString),
          companyId,
        ),
      );
    },
    [navigate, queryString],
  );

  const selectRelationship = useCallback(
    (relationshipId: string | null) => {
      normalizedAccessErrorRef.current = false;
      setStatus(relationshipId ? "loading-cases" : "no-relationship");
      navigate(
        changeClientContextRelationship(new URLSearchParams(queryString), {
          companyId: selection.companyId,
          relationshipId,
        }),
      );
    },
    [navigate, queryString, selection.companyId],
  );

  const selectCase = useCallback(
    (caseId: string | null) => {
      normalizedAccessErrorRef.current = false;
      navigate(
        changeClientContextCase(new URLSearchParams(queryString), {
          companyId: selection.companyId,
          relationshipId: selection.relationshipId,
          caseId,
        }),
      );
    },
    [
      navigate,
      queryString,
      selection.companyId,
      selection.relationshipId,
    ],
  );

  const retry = useCallback(() => {
    normalizedAccessErrorRef.current = false;
    resetLocalConsultantBootstrapCache();
    companiesLoadedRef.current = false;
    accessTokenRef.current = null;
    setCompaniesLoaded(false);
    setAccessToken(null);
    setAuthReadiness("checking");
    setStatus("loading-companies");
    setErrorMessage(null);
    setErrorKind(null);
    setRetryVersion((version) => version + 1);
  }, []);

  return {
    context: viewModel,
    accessToken,
    selectCompany,
    selectRelationship,
    selectCase,
    retry,
    normalizeSelection: (nextSelection: ClientContextSelection) =>
      navigate(
        buildClientContextNavigation(
          new URLSearchParams(queryString),
          nextSelection,
        ),
        true,
      ),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

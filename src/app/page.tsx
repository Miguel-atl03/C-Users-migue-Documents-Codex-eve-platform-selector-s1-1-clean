"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ClientAssessmentComplete } from "@/components/client/ClientAssessmentComplete";
import { ClientShell } from "@/components/client/ClientShell";
import { ClientTopbar } from "@/components/client/ClientTopbar";
import {
  LocalCanvasExperience,
  buildSceneEntryViewModel,
  createB05VisualStubViewModel,
  createB1VisualStubViewModel,
  createSceneEntryVisualStubViewModel,
  scrollToLocalCanvasSection,
  type B05SlotAnswer,
  type B0MemoriaPart,
  type B1SlotAnswer,
  type LocalAuthCredentials,
  readLocalHeroGateSeen,
  writeLocalHeroGateSeen,
} from "@/components/eve-local-canvas";
import { SceneQuestionnaireRunner } from "@/components/SceneQuestionnaireRunner";
import { TripleIntake } from "@/components/TripleIntake";
import type { ActivityStructuralScore } from "@/domain/activity";
import type { PrimaryActivitySelectionResult } from "@/domain/primary-activity-selection-policy";
import type { PreRuntimeContextBundle } from "@/domain/pre-runtime-context-bundle.v1.0";
import type { SignificadoSubmitPayload } from "@/domain/significado-de-trabajo";
import {
  EMPTY_START_POSITION_CONTEXT,
  isStartPositionContextComplete,
  type StartPositionContext,
} from "@/domain/start-position-context";
import {
  createEmptyWorkMap,
  normalizeWorkMapData,
  type WorkMapData,
} from "@/domain/local-work-map";

/** Material WorkMap progress → skip WORKMAP_EXPLANATION on reentry. */
function hasMaterialWorkMapProgress(workMap: WorkMapData | null): boolean {
  if (!workMap) return false;
  if (workMap.isSaved || workMap.isReviewMode) return true;
  if (workMap.selectedAreas.length > 0 || workMap.customAreas.length > 0) {
    return true;
  }
  if (
    workMap.responsibilities.some(
      (responsibility) =>
        responsibility.text.trim().length > 0 ||
        responsibility.activities.some((activity) => activity.text.trim().length > 0),
    )
  ) {
    return true;
  }
  return Object.values(workMap.guideSeen).some(Boolean);
}
import type {
  ActivityDiagnostic,
  SessionDiagnostic,
  SupportActivitySelection,
} from "@/domain/diagnostics";
import type { QuestionnaireAnswer } from "@/domain/questionnaire";
import { officialPanelSupabase } from "@/lib/official-panel-supabase";
import { supabase } from "@/lib/supabase";
import {
  ContextAuthError,
  getAuthorizedClientCompanies,
} from "@/features/official-consultant-control-panel/data/client-context-api";
import { readSafeNextFromSearchParams } from "@/features/official-consultant-control-panel/state/official-panel-login-redirect";
import {
  ACCESS_DENIED_HREF,
  classifyConsultantAccessFromCompanies,
  OFFICIAL_PANEL_DEFAULT_HREF,
  resolvePostLoginDestination,
} from "@/features/official-consultant-control-panel/state/post-login-destination";
import type { Activity, EveFlowState, RelatoAnswer } from "@/lib/types";
import {
  selectPrimaryActivitiesFromWorkMap,
  selectedPrimaryActivitiesToLegacyActivities,
} from "@/services/primary-activity-selector";
import { buildPreRuntimeContextBundle } from "@/services/pre-runtime-context-bundle-builder";
import { readWorkMapDraft, writeWorkMapDraft } from "@/services/work-map-draft";

const useTripleIntake = process.env.NEXT_PUBLIC_INTAKE_UI === "triple";

const initialIntakeFlowState = (): EveFlowState =>
  useTripleIntake ? "intake_main_activities" : "intake_work_map";

const steps: { id: EveFlowState; label: string; mode: string }[] = [
  {
    id: useTripleIntake ? "intake_main_activities" : "intake_work_map",
    label: useTripleIntake ? "Actividades reales" : "Mapa de trabajo",
    mode: "Registro inicial",
  },
  {
    id: "intake_significado",
    label: "Significado de tu trabajo",
    mode: "Sentido operativo",
  },
  {
    id: "questionnaire_main",
    label: "Preguntas principales",
    mode: "Levantamiento",
  },
  {
    id: "closure_check",
    label: "Verificacion",
    mode: "Revision interna",
  },
  {
    id: "support_activity_selected_internal",
    label: "Informacion adicional",
    mode: "Ajuste automatico",
  },
  {
    id: "support_activity_questionnaire",
    label: "Preguntas adicionales",
    mode: "Complemento",
  },
  {
    id: "closure_recheck",
    label: "Revision final",
    mode: "Cierre",
  },
  {
    id: "micro_clarification",
    label: "Aclaracion breve",
    mode: "Precision",
  },
  {
    id: "intake_completed",
    label: "Levantamiento completo",
    mode: "Salida",
  },
];

const sessionStorageKey = "eve:last-session-id:v1";
const sessionModeStorageKey = "eve:last-session-mode:v1";
const ACCOUNT_CREATED_NEXT_STEP_MESSAGE =
  "Cuenta registrada. Intenta iniciar sesion con el mismo email y password. Si no entra o no recibes correo, pide a tu consultor que habilite o reenvie tu acceso; no crees otra cuenta.";
const EXPIRED_EMAIL_LINK_MESSAGE =
  "El enlace de email vencio o ya fue usado. Intenta iniciar sesion con tu email y password. Si no entra, pide a tu consultor que reenvie o habilite tu acceso.";

type SessionMode = "commercial" | "demo";

type ParticipantContextView = {
  status: "ready";
  user: {
    id: string;
    name: string;
    email: string;
  };
  company: {
    id: string;
    name: string;
  };
  case: {
    id: string;
    name: string;
  };
  participant: {
    id: string;
    status: string;
  };
  position: {
    id: string;
    title: string;
    source: string;
  } | null;
  functionalProfiles: Array<{
    id: string;
    roleCode: string | null;
    roleLabel: string;
    status: string;
  }>;
};

type ParticipantActivityProgressView = {
  profile: {
    label: string;
    position: number;
    totalProfiles: number;
  } | null;
  activity: {
    id: string;
    label: string;
    ordinal: number;
    total: number;
    status: "pending" | "active" | "completed" | "blocked";
    isCurrent: boolean;
  } | null;
  journeyStatus:
    | "not_started"
    | "preparing"
    | "in_progress"
    | "blocked"
    | "completed"
    | "case_selection_required";
};

type ParticipantWorkMapFinalizeResponse = {
  status: "ready" | "reentry_required" | "error";
  message?: string;
  code?: string;
  primaryActivitySelectionResult?: PrimaryActivitySelectionResult;
  scopedWorkMap?: WorkMapData;
  next?: {
    flowState?: EveFlowState;
    profileId?: string;
    profileOrder?: number;
    roleRuntimeSessionId?: string;
    activityRuntimeRunId?: string;
    catalogVersionId?: string;
    activityId?: string;
    activityLabel?: string;
    activityRank?: number | null;
  };
};

type SessionRestoreResume = {
  source?: string;
  flow_state?: EveFlowState | null;
  workmap_snapshot_id?: string;
  workmap_updated_at?: string;
  has_questionnaire_answers?: boolean;
} | null;

type SessionStartDiagnostic = {
  summary: string;
  httpStatus?: number;
  errorMessage?: string;
  authSessionPresent: boolean;
  freshSessionPresent: boolean;
  payloadSessionIdPresent: boolean;
  mode: SessionMode;
  authorizationSent: boolean;
};

function isEmptyPayload(payload: Record<string, unknown>) {
  return Object.keys(payload).length === 0;
}

function buildSessionStartDiagnostic({
  mode,
  httpStatus,
  errorPayload,
  authSessionPresent,
  freshSessionPresent,
  payloadSessionId,
  authorizationSent,
}: {
  mode: SessionMode;
  httpStatus?: number;
  errorPayload: Record<string, unknown>;
  authSessionPresent: boolean;
  freshSessionPresent: boolean;
  payloadSessionId?: string;
  authorizationSent: boolean;
}): SessionStartDiagnostic {
  const errorMessage =
    typeof errorPayload.error === "string" ? errorPayload.error : undefined;
  const payloadEmpty = isEmptyPayload(errorPayload);
  const lines = ["No pudimos iniciar el levantamiento."];

  if (httpStatus !== undefined) {
    lines.push(`Status: ${httpStatus}`);
  }

  if (payloadEmpty) {
    lines.push("Error: respuesta vacía desde /api/session/bootstrap");
  } else if (errorMessage) {
    lines.push(`Error: ${errorMessage}`);
  }

  lines.push(`Auth state: ${authSessionPresent ? "present" : "missing"}`);
  lines.push(`Fresh session: ${freshSessionPresent ? "present" : "missing"}`);
  lines.push(
    `Session id in payload: ${payloadSessionId ? "present" : "missing"}`,
  );

  return {
    summary: lines.join("\n"),
    httpStatus,
    errorMessage: payloadEmpty
      ? "respuesta vacía desde /api/session/bootstrap"
      : errorMessage,
    authSessionPresent,
    freshSessionPresent,
    payloadSessionIdPresent: Boolean(payloadSessionId),
    mode,
    authorizationSent,
  };
}

type AccessState =
  | "unauthenticated"
  | "authenticated_without_session"
  | "authenticated_with_session"
  | "demo";
type ViewState =
  | "access_screen"
  | "routing_access"
  | "create_session"
  | "capture_workspace";

type AccessRouting =
  | "idle"
  | "resolving"
  | "operative"
  | "redirected";

type ActivityRanking = {
  primary: ActivityStructuralScore[];
  supportPool: ActivityStructuralScore[];
};

type QuestionnaireScope = "main" | "support";

type SceneRegistryRow = {
  id: string;
  sesion_id: string;
  legacy_actividad_id: string | null;
  scene_name: string;
  scene_rank: number | null;
  depth_level: string;
  scene_status: string;
};

function readStoredSessionMode(): SessionMode {
  return window.localStorage.getItem(sessionModeStorageKey) === "demo"
    ? "demo"
    : "commercial";
}

/** Offline Demo fallback when /api/session/bootstrap cannot reach Supabase. */
function isLocalDemoSessionId(sessionId: string | null | undefined): boolean {
  return Boolean(sessionId?.startsWith("demo-local-"));
}

async function readJsonBody(
  response: Response,
): Promise<Record<string, unknown>> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

function recursiveChainClosed(
  diagnostic: SessionDiagnostic,
  primaryActivityIds: string[],
) {
  const primaryIdSet = new Set(primaryActivityIds);
  const primaryDiagnostics = diagnostic.activities.filter((activity) =>
    primaryIdSet.has(activity.activityId),
  );

  return (
    diagnostic.finalOutput?.session_status === "session_completed_solid" ||
    diagnostic.finalOutput?.session_status === "session_completed_with_alerts" ||
    (primaryDiagnostics.length > 0 &&
      primaryDiagnostics.every((activity) => activity.closure.status === "closed"))
  );
}

function pickNextSupportSelection(diagnostic: SessionDiagnostic) {
  return (diagnostic.supportSelections ?? [])
    .filter((selection) => selection.support_activity_selected)
    .sort((left, right) => {
      const rightScore = right.support_activity_marginal_closure_score ?? 0;
      const leftScore = left.support_activity_marginal_closure_score ?? 0;
      if (rightScore !== leftScore) return rightScore - leftScore;

      const leftRedundancy = left.support_activity_redundancy_score ?? 1;
      const rightRedundancy = right.support_activity_redundancy_score ?? 1;
      return leftRedundancy - rightRedundancy;
    })[0];
}

function pendingCriticalClarification(diagnostic: SessionDiagnostic) {
  return diagnostic.activities.find(
    (activity) => activity.consistency.clarification_required,
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f5f5] text-[#272a32]">
          <div className="mx-auto flex min-h-screen w-full max-w-[480px] items-center justify-center px-4">
            <p className="text-sm text-[#6f7280]" role="status">
              Resolviendo su acceso…
            </p>
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEstadoBPreview = searchParams.get("preview") === "estado-b";
  const isB05Preview = searchParams.get("preview") === "b05";
  const isB1Preview = searchParams.get("preview") === "b1";
  const useRuntimeLegacyQuestionnaire = searchParams.get("runtime_legacy") === "1";
  const panelReturnPath = readSafeNextFromSearchParams(searchParams.get("next"));
  const authSupabase = panelReturnPath ? officialPanelSupabase : supabase;

  const [accessRouting, setAccessRouting] = useState<AccessRouting>("idle");
  const [flowState, setFlowState] =
    useState<EveFlowState>(initialIntakeFlowState);
  const [databaseSessionId, setDatabaseSessionId] = useState<string | null>(
    null,
  );
  const [activeSessionMode, setActiveSessionMode] =
    useState<SessionMode>("commercial");
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [authMessage, setAuthMessage] = useState(
    authSupabase
      ? panelReturnPath
        ? "Inicia sesion para continuar."
        : "Inicia sesion para continuar. El modo demo se mantiene separado."
      : "El acceso no esta disponible en este entorno.",
  );
  const [authSession, setAuthSession] = useState<{
    access_token: string;
    user: {
      id?: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    };
  } | null>(null);
  const [registeredUserNombre, setRegisteredUserNombre] = useState<
    string | null
  >(null);
  const [participantContext, setParticipantContext] =
    useState<ParticipantContextView | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    "idle" | "creating" | "ready" | "error"
  >("idle");
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState(
    "Inicia un nuevo levantamiento para comenzar.",
  );
  const [restoreStatus, setRestoreStatus] = useState<
    "idle" | "restoring" | "ready" | "error"
  >("idle");
  const [intakeStatus, setIntakeStatus] = useState<
    "idle" | "saving" | "ready" | "error"
  >("idle");
  const [intakeMessage, setIntakeMessage] = useState("");
  const [questionnaireStatus, setQuestionnaireStatus] = useState<
    "idle" | "saving" | "ready" | "error"
  >("idle");
  const [questionnaireMessage, setQuestionnaireMessage] = useState("");
  const [diagnosticStatus, setDiagnosticStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [diagnosticMessage, setDiagnosticMessage] = useState("");
  const [diagnostic, setDiagnostic] = useState<SessionDiagnostic | null>(null);
  const [activityRanking, setActivityRanking] = useState<ActivityRanking>({
    primary: [],
    supportPool: [],
  });
  const [questionnaireActivities, setQuestionnaireActivities] = useState<
    ActivityStructuralScore[]
  >([]);
  const [questionnaireScope, setQuestionnaireScope] =
    useState<QuestionnaireScope>("main");
  const [selectedSupportSelection, setSelectedSupportSelection] =
    useState<SupportActivitySelection | null>(null);
  const [supportTrace, setSupportTrace] = useState<SupportActivitySelection[]>(
    [],
  );
  const [activeClarification, setActiveClarification] =
    useState<ActivityDiagnostic | null>(null);
  const [clarificationText, setClarificationText] = useState("");
  const [clarificationMessage, setClarificationMessage] = useState("");
  const [sceneRegistry, setSceneRegistry] = useState<SceneRegistryRow[]>([]);
  const [workMap, setWorkMap] = useState<WorkMapData | null>(null);
  const [primaryActivitySelectionResult, setPrimaryActivitySelectionResult] =
    useState<PrimaryActivitySelectionResult | null>(null);
  const [participantActivityProgress, setParticipantActivityProgress] =
    useState<ParticipantActivityProgressView | null>(null);
  const [preRuntimeContextBundle, setPreRuntimeContextBundle] =
    useState<PreRuntimeContextBundle | null>(null);
  const [runtimeFullFrontdoor, setRuntimeFullFrontdoor] = useState<
    ParticipantWorkMapFinalizeResponse["next"] | null
  >(null);
  const [runWorkMapIntroTutorial, setRunWorkMapIntroTutorial] = useState(false);
  /** Local unlock for WORKMAP after Estado A (explainer room skipped — monument concept). */
  const [workMapExplanationComplete, setWorkMapExplanationComplete] =
    useState(false);
  /** Continuous sheet: Estado A completed → reveal WorkMap room (demo + commercial). */
  const [workMapSheetEstadoAComplete, setWorkMapSheetEstadoAComplete] =
    useState(false);
  /** One-time monumental door before Posición. */
  const [heroGateComplete, setHeroGateComplete] = useState(false);
  /** Local unlock for Umbral Memoria → Escena → B0 within the official canvas. */
  const [sceneEntryComplete, setSceneEntryComplete] = useState(false);
  const [b0MemoriaParts, setB0MemoriaParts] = useState<B0MemoriaPart[] | null>(
    null,
  );
  const [showB0ComoOcurre, setShowB0ComoOcurre] = useState(false);
  /** UI-B05 visual stub answers keyed by neutral field_key (not Runtime-bound). */
  const [b05StubAnswers, setB05StubAnswers] = useState<Record<string, B05SlotAnswer>>(
    {},
  );
  const [b05StubNote, setB05StubNote] = useState<string | null>(null);
  /** UI-B1 visual stub answers keyed by neutral field_key (not Runtime-bound). */
  const [b1StubAnswers, setB1StubAnswers] = useState<Record<string, B1SlotAnswer>>(
    {},
  );
  const [b1StubNote, setB1StubNote] = useState<string | null>(null);
  const [startPositionContext, setStartPositionContext] =
    useState<StartPositionContext>(EMPTY_START_POSITION_CONTEXT);
  const autoRestoreAttemptedRef = useRef(false);
  const restoringSessionIdRef = useRef<string | null>(null);
  const workMapEnteredEventRef = useRef<string | null>(null);

  const resolveDraftSessionId = useCallback(() => {
    if (databaseSessionId) return databaseSessionId;
    if (savedSessionId) return savedSessionId;
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(sessionStorageKey);
  }, [databaseSessionId, savedSessionId]);

  useEffect(() => {
    const syncFromStorage = () => {
      const restoredSessionId = window.localStorage.getItem(sessionStorageKey);
      const restoredMode = readStoredSessionMode();

      setActiveSessionMode(restoredMode);
      if (restoredSessionId) {
        setSavedSessionId(restoredSessionId);
        setSessionMessage(
          "Encontramos una sesion anterior guardada en este navegador.",
        );
      }

      const browserDraft = readWorkMapDraft(restoredSessionId) ?? readWorkMapDraft();
      if (browserDraft) {
        setWorkMap(browserDraft);
        setRunWorkMapIntroTutorial(false);
        setWorkMapExplanationComplete(
          hasMaterialWorkMapProgress(browserDraft) ||
            isStartPositionContextComplete(
              browserDraft.startPositionContext ?? EMPTY_START_POSITION_CONTEXT,
            ),
        );
        setWorkMapSheetEstadoAComplete(
          hasMaterialWorkMapProgress(browserDraft) ||
            isStartPositionContextComplete(
              browserDraft.startPositionContext ?? EMPTY_START_POSITION_CONTEXT,
            ),
        );
        if (browserDraft.startPositionContext) {
          setStartPositionContext(browserDraft.startPositionContext);
        }
      }
    };

    const timer = window.setTimeout(syncFromStorage, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    setHeroGateComplete(readLocalHeroGateSeen());
  }, []);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errorCode = hashParams.get("error_code");
    const error = hashParams.get("error");

    if (!errorCode && !error) return;

    if (errorCode === "otp_expired" || error === "access_denied") {
      const timer = window.setTimeout(() => {
        setAuthMode("sign-in");
        setAuthStatus("error");
        setAuthMessage(EXPIRED_EMAIL_LINK_MESSAGE);
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!authSupabase) return;

    let active = true;

    authSupabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthSession(data.session);
      if (data.session?.user.email) {
        setAuthEmail(data.session.user.email);
        setAuthStatus("ready");
        setAuthMessage("Sesion iniciada correctamente.");
      }
    });

    const {
      data: { subscription },
    } = authSupabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      if (session?.user.email) {
        setAuthEmail(session.user.email);
        setAuthStatus("ready");
        setAuthMessage("Sesion iniciada correctamente.");
      } else {
        setAuthStatus("idle");
        setAuthMessage(
          "Inicia sesion para continuar. El modo demo se mantiene separado.",
        );
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [authSupabase]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- intentional post-login capability resolve */
    if (!authSession?.access_token) {
      setAccessRouting("idle");
      return;
    }

    let cancelled = false;
    setAccessRouting("resolving");

    void (async () => {
      try {
        const companies = await getAuthorizedClientCompanies(
          authSession.access_token,
        );
        if (cancelled) return;
        const kind = classifyConsultantAccessFromCompanies(companies);
        const destination = resolvePostLoginDestination({
          kind,
          panelReturnPath,
        });
        if (
          destination.kind === "consultant" ||
          destination.kind === "unauthorized"
        ) {
          setAccessRouting("redirected");
          router.replace(destination.href);
          return;
        }
        setAccessRouting("operative");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ContextAuthError && error.status === 401) {
          await authSupabase?.auth.signOut();
          setAuthSession(null);
          setAccessRouting("idle");
          return;
        }
        if (
          panelReturnPath ||
          (error instanceof ContextAuthError && error.status === 403)
        ) {
          setAccessRouting("redirected");
          router.replace(ACCESS_DENIED_HREF);
          return;
        }
        // Without panel return intent, allow the operative front door.
        setAccessRouting("operative");
      }
    })();

    return () => {
      cancelled = true;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [authSession?.access_token, authSupabase, panelReturnPath, router]);

  useEffect(() => {
    const authUserId = authSession?.user?.id;
    /* eslint-disable react-hooks/set-state-in-effect -- sync display name from usuarios */
    if (!authSupabase || !authUserId) {
      setRegisteredUserNombre(null);
      return;
    }

    let active = true;

    void authSupabase
      .from("usuarios")
      .select("nombre")
      .eq("auth_user_id", authUserId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setRegisteredUserNombre(null);
          return;
        }
        const nombre = data?.nombre;
        setRegisteredUserNombre(
          typeof nombre === "string" && nombre.trim() ? nombre.trim() : null,
        );
      });

    return () => {
      active = false;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [authSession?.user?.id, authSupabase]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- resolve participant context after auth */
    if (!authSession?.access_token || accessRouting !== "operative") {
      setParticipantContext(null);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/participant/context", {
          headers: {
            Authorization: `Bearer ${authSession.access_token}`,
          },
        });
        const payload = (await response.json().catch(() => null)) as
          | ParticipantContextView
          | { status?: string }
          | null;

        if (!active) return;
        if (response.ok && payload?.status === "ready") {
          const readyContext = payload as ParticipantContextView;
          setParticipantContext(readyContext);
          window.localStorage.setItem(sessionStorageKey, readyContext.case.id);
          window.localStorage.setItem(sessionModeStorageKey, "commercial");
          setSavedSessionId(readyContext.case.id);
          setActiveSessionMode("commercial");
          return;
        }
        setParticipantContext(null);
      } catch {
        if (active) setParticipantContext(null);
      }
    })();

    return () => {
      active = false;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [authSession?.access_token, accessRouting]);

  const progress = useMemo(() => {
    const index = steps.findIndex((step) => step.id === flowState);
    return Math.max(0, Math.round(((index + 1) / steps.length) * 100));
  }, [flowState]);

  useEffect(() => {
    if (flowState !== "intake_significado" || sceneEntryComplete) return;
    scrollToLocalCanvasSection("scene-entry");
  }, [flowState, sceneEntryComplete]);

  const currentStep = steps.find((step) => step.id === flowState);
  const hasActiveSession = Boolean(databaseSessionId);
  const hasCommercialAuth = Boolean(authSession?.access_token);
  const canRestoreCommercialSession =
    hasCommercialAuth &&
    activeSessionMode === "commercial" &&
    Boolean(savedSessionId) &&
    !hasActiveSession;
  const accessState: AccessState =
    activeSessionMode === "demo" && hasActiveSession
      ? "demo"
      : hasCommercialAuth
        ? hasActiveSession
          ? "authenticated_with_session"
          : "authenticated_without_session"
        : "unauthenticated";
  const viewState: ViewState =
    accessRouting === "resolving" ||
    accessRouting === "redirected" ||
    (hasCommercialAuth && accessRouting === "idle")
      ? "routing_access"
      : accessState === "authenticated_with_session" || accessState === "demo"
        ? "capture_workspace"
        : accessState === "authenticated_without_session" &&
            accessRouting === "operative"
          ? "create_session"
          : "access_screen";
  const frontDoorProgress = viewState === "capture_workspace" ? progress : 0;
  const displayName = useMemo(() => {
    if (registeredUserNombre && !registeredUserNombre.includes("@")) {
      return registeredUserNombre;
    }
    const metadataName = authSession?.user.user_metadata?.name;
    if (
      typeof metadataName === "string" &&
      metadataName.trim() &&
      !metadataName.includes("@")
    ) {
      return metadataName.trim();
    }
    return "Usuario";
  }, [registeredUserNombre, authSession?.user.user_metadata?.name]);
  const sceneQuestionnaireItems = useMemo(
    () =>
      questionnaireActivities
        .map((activity) => {
          const scene = sceneRegistry.find(
            (item) => item.legacy_actividad_id === activity.activityId,
          );

          if (!scene) return null;

          return {
            sceneId: scene.id,
            sceneName: scene.scene_name,
            depthLevel: scene.depth_level,
            activity,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [questionnaireActivities, sceneRegistry],
  );

  const sceneEntryViewModel = useMemo(
    () =>
      buildSceneEntryViewModel(primaryActivitySelectionResult) ??
      createSceneEntryVisualStubViewModel(),
    [primaryActivitySelectionResult],
  );

  const b05VisualStub = useMemo(() => {
    const firstScene = sceneQuestionnaireItems[0];
    const firstPrimary =
      primaryActivitySelectionResult?.selectedPrimaryActivities?.[0];
    const activityLiteral =
      firstScene?.activity.rawText ||
      firstScene?.sceneName ||
      firstPrimary?.activityLiteral ||
      undefined;
    const area = firstPrimary?.areaLabel || undefined;

    return createB05VisualStubViewModel({
      activity: {
        ...(activityLiteral ? { activityLiteral } : {}),
        ...(area ? { area } : {}),
      },
    });
  }, [primaryActivitySelectionResult, sceneQuestionnaireItems]);

  const b1VisualStub = useMemo(() => {
    const firstScene = sceneQuestionnaireItems[0];
    const firstPrimary =
      primaryActivitySelectionResult?.selectedPrimaryActivities?.[0];
    const activityLiteral =
      firstScene?.activity.rawText ||
      firstScene?.sceneName ||
      firstPrimary?.activityLiteral ||
      undefined;
    const area = firstPrimary?.areaLabel || undefined;

    return createB1VisualStubViewModel({
      activity: {
        ...(activityLiteral ? { activityLiteral } : {}),
        ...(area ? { area } : {}),
      },
    });
  }, [primaryActivitySelectionResult, sceneQuestionnaireItems]);

  const protectedHeaders = () => ({
    "Content-Type": "application/json",
    ...(activeSessionMode === "commercial" && authSession?.access_token
      ? { Authorization: `Bearer ${authSession.access_token}` }
      : {}),
  });

  const recordWorkMapExperience = useCallback(
    async ({
      eventType,
      idempotencyKey,
      metadata,
    }: {
      eventType:
        | "screen_entered"
        | "workmap_saved"
        | "workmap_submitted"
        | "screen_exited";
      idempotencyKey: string;
      metadata: Record<string, unknown>;
    }) => {
      if (
        activeSessionMode !== "commercial" ||
        !authSession?.access_token ||
        !participantContext?.case.id ||
        !databaseSessionId
      ) {
        return;
      }

      await fetch("/api/eve/runtime-40-20/client-bff/experience-event", {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          caseId: participantContext.case.id,
          screenKey: "workmap",
          eventType,
          requestId: idempotencyKey,
          idempotencyKey,
          sessionReference: databaseSessionId,
          roleRuntimeSessionId: null,
          activityId: null,
          sourceVersion: "workmap-monitoring-v1",
          metadata,
        }),
      });
    },
    [
      activeSessionMode,
      authSession,
      databaseSessionId,
      participantContext,
    ],
  );

  useEffect(() => {
    if (
      flowState !== "intake_work_map" ||
      !participantContext?.case.id ||
      !databaseSessionId ||
      activeSessionMode !== "commercial"
    ) {
      return;
    }

    const scopeKey = `${participantContext.case.id}:${databaseSessionId}`;
    if (workMapEnteredEventRef.current === scopeKey) return;
    workMapEnteredEventRef.current = scopeKey;

    void recordWorkMapExperience({
      eventType: "screen_entered",
      idempotencyKey: `workmap-entered:${scopeKey}:${crypto.randomUUID()}`,
      metadata: {
        action: "workmap_opened",
        participantId: participantContext.participant.id,
      },
    });

    const recordExit = () => {
      void recordWorkMapExperience({
        eventType: "screen_exited",
        idempotencyKey: `workmap-exited:${scopeKey}:${crypto.randomUUID()}`,
        metadata: {
          action: "workmap_exited",
          participantId: participantContext.participant.id,
        },
      });
    };
    window.addEventListener("pagehide", recordExit);
    return () => window.removeEventListener("pagehide", recordExit);
  }, [
    activeSessionMode,
    databaseSessionId,
    flowState,
    participantContext?.case.id,
    participantContext?.participant.id,
    recordWorkMapExperience,
  ]);

  const rankActivities = async (sessionId: string) => {
    const rankResponse = await fetch("/api/rank-activities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
      }),
    });
    const rankPayload = await rankResponse.json();

    if (!rankResponse.ok) {
      throw new Error(
        rankPayload.error ??
          "No pude reconstruir la seleccion automatica de actividades.",
      );
    }

    const ranking = {
      primary: rankPayload.primary as ActivityStructuralScore[],
      supportPool: rankPayload.supportPool as ActivityStructuralScore[],
    };

    setActivityRanking(ranking);
    return ranking;
  };

  const bootstrapScenes = async (sessionId: string) => {
    const response = await fetch("/api/scenes/bootstrap", {
      method: "POST",
      headers: protectedHeaders(),
      body: JSON.stringify({ sessionId, mode: activeSessionMode }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "No pude preparar las escenas v2.1.");
    }

    setSceneRegistry(payload.scenes as SceneRegistryRow[]);
    return payload.scenes as SceneRegistryRow[];
  };

  const postJson = async (url: string, body: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: protectedHeaders(),
      body: JSON.stringify({ ...body, mode: activeSessionMode }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? `No se pudo completar ${url}.`);
    }

    return payload;
  };

  const runClosureCycle = useCallback(
    async ({
      sessionId = databaseSessionId,
      ranking = activityRanking,
      phase,
    }: {
      sessionId?: string | null;
      ranking?: ActivityRanking;
      phase: "closure_check" | "closure_recheck";
    }) => {
      if (!sessionId) {
        setDiagnosticStatus("error");
        setDiagnosticMessage("No hay sesion activa para revisar el cierre.");
        return;
      }

      setFlowState(phase);
      setDiagnosticStatus("loading");
      setDiagnosticMessage("Revisando si la informacion ya es suficiente...");

      try {
        const response = await fetch("/api/diagnostics/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            primaryActivityIds: ranking.primary.map(
              (activity) => activity.activityId,
            ),
            supportCandidates: ranking.supportPool,
          }),
        });
        const payload = (await response.json()) as SessionDiagnostic & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "No pude revisar el cierre.");
        }

        setDiagnostic(payload);
        setDiagnosticStatus("ready");

        const criticalClarification = pendingCriticalClarification(payload);
        if (criticalClarification) {
          setActiveClarification(criticalClarification);
          setClarificationText("");
          setFlowState("micro_clarification");
          setDiagnosticMessage(
            "Nos falta una precision corta antes de cerrar esta actividad.",
          );
          return;
        }

        if (recursiveChainClosed(payload, ranking.primary.map((a) => a.activityId))) {
          if (phase === "closure_recheck") {
            setSupportTrace((current) =>
              current.map((selection) =>
                selection.support_activity_status === "answered"
                  ? { ...selection, support_activity_status: "validated" }
                  : selection,
              ),
            );
          }
          setSelectedSupportSelection(null);
          setFlowState("intake_completed");
          setDiagnosticMessage("Levantamiento completo con la evidencia actual.");
          return;
        }

        const supportSelection = pickNextSupportSelection(payload);

        if (!supportSelection?.support_activity_selected) {
          setFlowState("intake_completed");
          setDiagnosticMessage(
            payload.finalOutput?.session_status === "session_completed_partial"
              ? "Levantamiento terminado con gaps o alertas pendientes."
              : "No hay una actividad adicional disponible para completar mejor el levantamiento.",
          );
          return;
        }

        setSelectedSupportSelection(supportSelection);
        setSupportTrace((current) => [...current, supportSelection]);
        setQuestionnaireScope("support");
        setQuestionnaireActivities([supportSelection.support_activity_selected]);
        setFlowState("support_activity_selected_internal");
        setDiagnosticMessage(
          phase === "closure_check"
            ? "Hemos terminado las actividades principales. Para completar correctamente la recopilacion de informacion, necesitamos una actividad adicional."
            : "Necesitamos un poco mas de informacion sobre una actividad adicional para completar el levantamiento.",
        );
      } catch (error) {
        setDiagnosticStatus("error");
        setDiagnosticMessage(
          error instanceof Error
            ? error.message
            : "Ocurrio un error revisando el cierre.",
        );
      }
    },
    [activityRanking, databaseSessionId],
  );

  useEffect(() => {
    if (
      flowState !== "support_activity_selected_internal" ||
      !selectedSupportSelection?.support_activity_selected
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFlowState("support_activity_questionnaire");
    }, 900);

    return () => window.clearTimeout(timer);
  }, [flowState, selectedSupportSelection]);

  const hydrateRestoredWorkMapProgress = (
    sessionId: string,
    restoredWorkMap: WorkMapData,
  ) => {
    writeWorkMapDraft(restoredWorkMap, sessionId);

    if (restoredWorkMap.startPositionContext) {
      setStartPositionContext(restoredWorkMap.startPositionContext);
    }

    setPrimaryActivitySelectionResult(null);
    setPreRuntimeContextBundle(null);
  };

  const loadParticipantActivityProgress = async () => {
    if (!authSupabase) return null;

    const { data, error } = await authSupabase.rpc(
      "get_participant_activity_progress",
    );

    if (error) {
      throw new Error(error.message);
    }

    return data as ParticipantActivityProgressView;
  };

  const finalizeSavedParticipantWorkMap = async (
    draft: WorkMapData,
    options?: {
      sessionId?: string | null;
      restoreFlow?: boolean;
      mode?: SessionMode;
    },
  ) => {
    const effectiveSessionId = options?.sessionId ?? databaseSessionId;
    const effectiveMode = options?.mode ?? activeSessionMode;
    if (effectiveMode !== "commercial" || !authSession?.access_token) {
      return false;
    }

    if (!effectiveSessionId) {
      setIntakeStatus("error");
      setIntakeMessage(
        "Primero crea una sesion real para continuar con el levantamiento.",
      );
      setFlowState("intake_work_map");
      return false;
    }

    setIntakeStatus("saving");
    setIntakeMessage(
      "Estamos preparando las actividades principales de tu experiencia...",
    );

    try {
      const response = await fetch("/api/participant/workmap/finalize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
        },
      });
      const payload =
        (await response.json().catch(() => null)) as
          | ParticipantWorkMapFinalizeResponse
          | null;

      if (!response.ok || !payload || payload.status !== "ready") {
        setIntakeStatus("error");
        setIntakeMessage(
          payload?.message ??
            "No pude preparar tus actividades principales. Intenta de nuevo.",
        );
        setFlowState("intake_work_map");
        return false;
      }

      if (!payload.primaryActivitySelectionResult) {
        setIntakeStatus("error");
        setIntakeMessage(
          "No pude recuperar la seleccion canonica de actividades.",
        );
        setFlowState("intake_work_map");
        return false;
      }

      const effectiveWorkMap = payload.scopedWorkMap ?? draft;
      const nextPreRuntimeContextBundle = buildPreRuntimeContextBundle({
        startPositionContext,
        workMap: effectiveWorkMap,
        primaryActivitySelectionResult: payload.primaryActivitySelectionResult,
      });

      setPrimaryActivitySelectionResult(payload.primaryActivitySelectionResult);
      setPreRuntimeContextBundle(nextPreRuntimeContextBundle);
      setWorkMap(effectiveWorkMap);
      setRuntimeFullFrontdoor(payload.next ?? null);
      writeWorkMapDraft(effectiveWorkMap, effectiveSessionId);
      if (options?.restoreFlow) {
        const progress = await loadParticipantActivityProgress().catch(() => null);
        setParticipantActivityProgress(progress);
      }
      setIntakeStatus("ready");
      setIntakeMessage("Mapa guardado. Entrando al umbral de observación.");
      setSceneEntryComplete(false);
      setFlowState(payload.next?.flowState ?? "intake_significado");
      window.requestAnimationFrame(() => {
        scrollToLocalCanvasSection("scene-entry");
      });
      return true;
    } catch (error) {
      setIntakeStatus("error");
      setIntakeMessage(
        error instanceof Error
          ? error.message
          : "No pude preparar tus actividades principales.",
      );
      setFlowState("intake_work_map");
      return false;
    }
  };

  const restoreSavedSession = async (override?: {
    sessionId?: string;
    mode?: SessionMode;
  }) => {
    const sessionId =
      override?.sessionId ??
      savedSessionId ??
      window.localStorage.getItem(sessionStorageKey);
    if (!sessionId) return;
    const savedMode = override?.mode ?? activeSessionMode;

    if (savedMode === "commercial" && !authSession?.access_token) {
      setRestoreStatus("error");
      setSessionStatus("error");
      setSessionMessage(
        "Para recuperar tu avance, primero inicia sesion.",
      );
      return;
    }

    setRestoreStatus("restoring");
    setSessionStatus("creating");
    setSessionMessage("Recuperando tu levantamiento…");

    try {
      const response = await fetch("/api/session/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedMode === "commercial" && authSession?.access_token
            ? { Authorization: `Bearer ${authSession.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          sessionId,
          mode: savedMode,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 404
        ) {
          autoRestoreAttemptedRef.current = false;
          restoringSessionIdRef.current = null;
          setSessionMessage(
            "No pudimos recuperar la sesión anterior ahora. Tu borrador local sigue guardado; inicia sesión de nuevo para continuar.",
          );
        }
        throw new Error(payload.error ?? "No pude recuperar la sesion.");
      }

      const restoredActivities = payload.activities as Activity[];
      const browserDraft = readWorkMapDraft(sessionId);
      const restoredWorkMap =
        normalizeWorkMapData(payload.work_map ?? null) ?? browserDraft;
      const restoreResume = (payload.resume ?? null) as SessionRestoreResume;
      setDatabaseSessionId(payload.session.id);
      setActiveSessionMode(savedMode);
      setWorkMap(restoredWorkMap);
      setRunWorkMapIntroTutorial(false);
      setWorkMapExplanationComplete(
        hasMaterialWorkMapProgress(restoredWorkMap) ||
          isStartPositionContextComplete(
            restoredWorkMap?.startPositionContext ?? EMPTY_START_POSITION_CONTEXT,
          ),
      );
      setWorkMapSheetEstadoAComplete(
        hasMaterialWorkMapProgress(restoredWorkMap) ||
          isStartPositionContextComplete(
            restoredWorkMap?.startPositionContext ?? EMPTY_START_POSITION_CONTEXT,
          ),
      );
      setSceneEntryComplete(
        restoreResume?.flow_state === "questionnaire_main" ||
          restoreResume?.flow_state === "support_activity_questionnaire" ||
          restoreResume?.flow_state === "closure_check" ||
          restoreResume?.flow_state === "closure_recheck" ||
          restoreResume?.flow_state === "micro_clarification" ||
          restoreResume?.flow_state === "intake_completed",
      );
      if (restoredWorkMap) {
        hydrateRestoredWorkMapProgress(payload.session.id, restoredWorkMap);
      }

      const questionnaireAnswers = (payload.answers ?? []).filter(
        (answer: { pregunta_id?: string }) =>
          typeof answer.pregunta_id === "string" &&
          answer.pregunta_id.startsWith("FULL_V03:"),
      );

      if (!restoredActivities.length) {
        if (
          savedMode === "commercial" &&
          restoreResume?.source === "participant_workmap_snapshot" &&
          restoredWorkMap
        ) {
          setParticipantActivityProgress(null);
          void finalizeSavedParticipantWorkMap(restoredWorkMap, {
            sessionId: payload.session.id,
            restoreFlow: true,
            mode: savedMode,
          });
        } else if (restoreResume?.flow_state === "intake_significado") {
          if (savedMode === "commercial") {
            const progress = await loadParticipantActivityProgress();
            setParticipantActivityProgress(progress);
          } else {
            setParticipantActivityProgress(null);
          }
          setFlowState("intake_significado");
        } else if (restoredWorkMap && hasMaterialWorkMapProgress(restoredWorkMap)) {
          setParticipantActivityProgress(null);
          setFlowState("intake_work_map");
        } else {
          setParticipantActivityProgress(null);
          setFlowState(initialIntakeFlowState());
        }
      } else {
        setParticipantActivityProgress(null);
        const ranking = await rankActivities(payload.session.id);
        await bootstrapScenes(payload.session.id);
        setQuestionnaireScope("main");
        setQuestionnaireActivities(ranking.primary);

        if (questionnaireAnswers.length) {
          await runClosureCycle({
            sessionId: payload.session.id,
            ranking,
            phase: "closure_check",
          });
        } else {
          setFlowState("questionnaire_main");
        }
      }

      setSessionStatus("ready");
      setRestoreStatus("ready");
      setSessionMessage(
        `Sesion recuperada. Avance guardado: ${payload.session.porcentaje_avance}%.`,
      );
    } catch (error) {
      setRestoreStatus("error");
      setSessionStatus("error");
      setSessionMessage(
        error instanceof Error
          ? error.message
          : "Ocurrio un error recuperando la sesion.",
      );
    }
  };

  const handleContinueLevantamiento = () => {
    if (databaseSessionId) {
      return;
    }
    autoRestoreAttemptedRef.current = false;
    restoringSessionIdRef.current = null;
    void restoreSavedSession();
  };

  useEffect(() => {
    if (!canRestoreCommercialSession || databaseSessionId) {
      if (!canRestoreCommercialSession) {
        autoRestoreAttemptedRef.current = false;
        restoringSessionIdRef.current = null;
      }
      return;
    }

    if (restoreStatus === "restoring") {
      return;
    }

    const sessionId = savedSessionId;
    if (!sessionId) {
      return;
    }

    if (
      autoRestoreAttemptedRef.current &&
      restoringSessionIdRef.current === sessionId
    ) {
      return;
    }

    autoRestoreAttemptedRef.current = true;
    restoringSessionIdRef.current = sessionId;
    void restoreSavedSession();
  }, [
    canRestoreCommercialSession,
    databaseSessionId,
    savedSessionId,
    authSession?.access_token,
    restoreStatus,
  ]);

  const authenticate = async (
    intent: "sign-in" | "sign-up",
    credentials?: { email: string; password: string; displayName?: string },
  ) => {
    if (!authSupabase) {
      setAuthStatus("error");
      setAuthMessage("El acceso no esta disponible en este entorno.");
      return;
    }

    const email = (credentials?.email ?? authEmail).trim();
    const password = credentials?.password ?? authPassword;
    const registrationName = (
      credentials?.displayName ?? authDisplayName
    ).trim();

    if (credentials) {
      setAuthEmail(email);
      setAuthPassword(password);
      if (credentials.displayName !== undefined) {
        setAuthDisplayName(registrationName);
      }
    }

    if (!email || !password) {
      setAuthStatus("error");
      setAuthMessage("Escribe email y password para continuar.");
      return;
    }

    if (intent === "sign-up") {
      if (!registrationName) {
        setAuthStatus("error");
        setAuthMessage("Ingresa tu nombre para crear tu cuenta.");
        return;
      }

      setAuthStatus("loading");
      setAuthMessage("Registrando usuario...");
      const result = await authSupabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: registrationName,
          },
        },
      });

      if (result.error) {
        setAuthStatus("error");
        setAuthMessage(result.error.message);
        return;
      }

      setAuthSession(result.data.session);
      if (!result.data.session) setAuthMode("sign-in");
      setAuthStatus("ready");
      setAuthMessage(
        result.data.session
          ? "Sesion iniciada correctamente."
          : ACCOUNT_CREATED_NEXT_STEP_MESSAGE,
      );
      return;
    }

    setAuthStatus("loading");
    setAuthMessage("Iniciando sesion...");

    const result = await authSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (result.error) {
      setAuthStatus("error");
      setAuthMessage(result.error.message);
      return;
    }

    setAuthSession(result.data.session);
    setAuthStatus("ready");
    setAuthMessage(
      result.data.session
        ? "Sesion iniciada correctamente."
        : ACCOUNT_CREATED_NEXT_STEP_MESSAGE,
    );
  };

  const signOut = async () => {
    if (!authSupabase) return;
    await authSupabase.auth.signOut();
    setAuthSession(null);
    setDatabaseSessionId(null);
    setParticipantActivityProgress(null);
    setSessionStatus("idle");
    setSessionMessage(
      "Sesion comercial cerrada. El ID local no autoriza acceso sin login.",
    );
  };

  const handleStartPositionContextChange = useCallback(
    (context: StartPositionContext) => {
      setStartPositionContext(context);
      setWorkMap((current) => {
        const next = {
          ...(current ?? createEmptyWorkMap()),
          startPositionContext: { ...context },
        };
        writeWorkMapDraft(next, resolveDraftSessionId());
        if (!resolveDraftSessionId()) {
          writeWorkMapDraft(next);
        }
        return next;
      });
    },
    [resolveDraftSessionId],
  );

  const startLocalDemoSession = (message: string) => {
    const sessionId = `demo-local-${Date.now()}`;
    const initialWorkMap = createEmptyWorkMap();
    if (isStartPositionContextComplete(startPositionContext)) {
      initialWorkMap.startPositionContext = { ...startPositionContext };
    }

    setDatabaseSessionId(sessionId);
    window.localStorage.setItem(sessionStorageKey, sessionId);
    window.localStorage.setItem(sessionModeStorageKey, "demo");
    setSavedSessionId(sessionId);
    setActiveSessionMode("demo");
    setSessionStatus("ready");
    setSessionMessage(message);
    setFlowState(initialIntakeFlowState());
    writeWorkMapDraft(initialWorkMap, sessionId);
    setWorkMap(initialWorkMap);
    setRunWorkMapIntroTutorial(!useTripleIntake);
    setWorkMapExplanationComplete(
      isStartPositionContextComplete(startPositionContext),
    );
    setWorkMapSheetEstadoAComplete(
      isStartPositionContextComplete(startPositionContext),
    );
    setSceneEntryComplete(false);
    setDiagnostic(null);
    setQuestionnaireActivities([]);
    setPrimaryActivitySelectionResult(null);
    setParticipantActivityProgress(null);
    setPreRuntimeContextBundle(null);
    setSelectedSupportSelection(null);
    setSupportTrace([]);
  };

  const createDatabaseSession = async (mode: SessionMode) => {
    let commercialAccessToken = authSession?.access_token;
    let commercialUserEmail = authSession?.user.email ?? authEmail.trim();
    let freshSessionPresent = false;

    if (mode === "commercial") {
      if (authSupabase) {
        const { data: freshAuth } = await authSupabase.auth.getSession();
        freshSessionPresent = Boolean(freshAuth.session?.access_token);
        if (freshAuth.session?.access_token) {
          commercialAccessToken = freshAuth.session.access_token;
          commercialUserEmail =
            freshAuth.session.user.email ?? commercialUserEmail;
          setAuthSession(freshAuth.session);
        }
      }

      if (!commercialAccessToken) {
        const diagnostic = buildSessionStartDiagnostic({
          mode,
          errorPayload: { error: "No hay token de acceso comercial." },
          authSessionPresent: Boolean(authSession?.access_token),
          freshSessionPresent,
          authorizationSent: false,
        });
        setSessionStatus("error");
        setSessionMessage(diagnostic.summary);
        return;
      }

      // Consultant capability must not bootstrap Runtime / Empresa Cliente.
      try {
        const companies = await getAuthorizedClientCompanies(
          commercialAccessToken,
        );
        if (classifyConsultantAccessFromCompanies(companies) === "consultant") {
          setSessionStatus("idle");
          setSessionMessage("");
          router.replace(OFFICIAL_PANEL_DEFAULT_HREF);
          return;
        }
      } catch {
        // If companies cannot be resolved, continue operative bootstrap;
        // BFFs remain the authorization boundary for the Panel.
      }
    }

    const resolvedCompanyName =
      mode === "commercial" ? "Levantamiento EVE" : "";
    const resolvedCompanySector =
      mode === "commercial" ? "Operativo" : "";

    if (mode === "commercial" && !resolvedCompanyName) {
      const diagnostic = buildSessionStartDiagnostic({
        mode,
        errorPayload: { error: "Faltan datos de empresa para el levantamiento." },
        authSessionPresent: Boolean(authSession?.access_token),
        freshSessionPresent,
        authorizationSent: Boolean(commercialAccessToken),
      });
      setSessionStatus("error");
      setSessionMessage(diagnostic.summary);
      return;
    }

    const bootstrapHeaders = {
      "Content-Type": "application/json",
      ...(mode === "commercial" && commercialAccessToken
        ? { Authorization: `Bearer ${commercialAccessToken}` }
        : {}),
    };
    const authorizationSent = Boolean(
      mode === "commercial" && commercialAccessToken,
    );

    setSessionStatus("creating");
    setSessionMessage(
      mode === "demo"
        ? "Preparando demo controlada..."
        : "Preparando tu nuevo levantamiento...",
    );

    let response: Response;
    let payload: Record<string, unknown> = {};

    try {
      response = await fetch("/api/session/bootstrap", {
        method: "POST",
        headers: bootstrapHeaders,
        body: JSON.stringify({
          mode,
          ...(mode === "commercial"
            ? {
                company: {
                  nombre: resolvedCompanyName,
                  sector: resolvedCompanySector,
                },
                user: {
                  nombre: displayName,
                  email: commercialUserEmail,
                },
              }
            : {}),
        }),
      });
      payload = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
    } catch (networkError) {
      if (mode === "demo") {
        startLocalDemoSession(
          "Demo controlada local creada. Supabase no esta disponible en este entorno.",
        );
        return;
      }

      const diagnostic = buildSessionStartDiagnostic({
        mode,
        errorPayload: {
          error:
            networkError instanceof Error
              ? networkError.message
              : "Error de red al contactar /api/session/bootstrap",
        },
        authSessionPresent: Boolean(authSession?.access_token),
        freshSessionPresent,
        authorizationSent,
      });
      setSessionStatus("error");
      setSessionMessage(diagnostic.summary);
      return;
    }

    const sessionId =
      typeof payload.session === "object" &&
      payload.session !== null &&
      "id" in payload.session &&
      typeof (payload.session as { id?: unknown }).id === "string"
        ? (payload.session as { id: string }).id
        : undefined;

    if (!response.ok || !sessionId) {
      if (mode === "demo") {
        startLocalDemoSession(
          "Demo controlada local creada. Supabase no esta disponible en este entorno.",
        );
        return;
      }

      const diagnostic = buildSessionStartDiagnostic({
        mode,
        httpStatus: response.status,
        errorPayload: payload,
        authSessionPresent: Boolean(authSession?.access_token),
        freshSessionPresent,
        payloadSessionId: sessionId,
        authorizationSent,
      });

      setSessionStatus("error");
      setSessionMessage(diagnostic.summary);
      return;
    }

    if (mode === "commercial" && payload.bootstrap === "participant_case_reused") {
      window.localStorage.setItem(sessionStorageKey, sessionId);
      window.localStorage.setItem(sessionModeStorageKey, mode);
      setSavedSessionId(sessionId);
      setActiveSessionMode(mode);
      await restoreSavedSession({ sessionId, mode });
      return;
    }

    setDatabaseSessionId(sessionId);
    window.localStorage.setItem(sessionStorageKey, sessionId);
    window.localStorage.setItem(sessionModeStorageKey, mode);
    setSavedSessionId(sessionId);
    setActiveSessionMode(mode);
    setSessionStatus("ready");
    setSessionMessage(
      mode === "demo"
        ? `Demo controlada creada con version ${String(payload.version ?? "desconocida")}.`
        : `Levantamiento creado con version ${String(payload.version ?? "desconocida")}.`,
    );
    setFlowState(initialIntakeFlowState());
    const initialWorkMap = createEmptyWorkMap();
    if (isStartPositionContextComplete(startPositionContext)) {
      initialWorkMap.startPositionContext = { ...startPositionContext };
    }
    writeWorkMapDraft(initialWorkMap, sessionId);
    setWorkMap(initialWorkMap);
    setRunWorkMapIntroTutorial(!useTripleIntake);
    setWorkMapExplanationComplete(
      isStartPositionContextComplete(startPositionContext),
    );
    setWorkMapSheetEstadoAComplete(
      isStartPositionContextComplete(startPositionContext),
    );
    setSceneEntryComplete(false);
    setDiagnostic(null);
    setQuestionnaireActivities([]);
    setPrimaryActivitySelectionResult(null);
    setPreRuntimeContextBundle(null);
    setSelectedSupportSelection(null);
    setSupportTrace([]);

    if (isStartPositionContextComplete(startPositionContext)) {
      window.setTimeout(() => {
        scrollToLocalCanvasSection("workmap");
      }, 80);
    }
  };

  const handleStartAssessment = () => {
    if (!isStartPositionContextComplete(startPositionContext)) {
      return;
    }
    void createDatabaseSession("commercial");
  };

  const handleContinueEstadoAOnSheet = () => {
    if (!isStartPositionContextComplete(startPositionContext)) {
      return;
    }

    if (databaseSessionId) {
      handleStartPositionContextChange(startPositionContext);
      setWorkMapSheetEstadoAComplete(true);
      setWorkMapExplanationComplete(true);
      scrollToLocalCanvasSection("workmap");
      return;
    }

    void createDatabaseSession("commercial");
  };

  const saveWorkMapDraft = async (draft: WorkMapData) => {
    if (!databaseSessionId) {
      setIntakeStatus("error");
      setIntakeMessage(
        "Primero crea una sesion real para guardar tu mapa de trabajo.",
      );
      return false;
    }

    setIntakeStatus("saving");
    setIntakeMessage("Guardando mapa de trabajo...");

    // Local Demo has no DB session — persist client-side so canvas can reach B0.
    if (isLocalDemoSessionId(databaseSessionId)) {
      setWorkMap(draft);
      writeWorkMapDraft(draft, databaseSessionId);
      setIntakeStatus("ready");
      setIntakeMessage("Mapa de trabajo guardado en demo local.");
      return true;
    }

    try {
      const response = await fetch("/api/intake/triple", {
        method: "POST",
        headers: protectedHeaders(),
        body: JSON.stringify({
          mode: activeSessionMode,
          sessionId: databaseSessionId,
          phase: "save",
          workMap: draft,
          activities: [],
          relatos: {
            ultimo_incendio: [],
            lo_que_no_deberia_pasar: [],
          },
        }),
      });
      const payload = await readJsonBody(response);

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "No pude guardar el mapa de trabajo.",
        );
      }

      setWorkMap(draft);
      const binding = payload.binding as
        | { case_id?: string; case_participant_profile_ids?: string[] }
        | null
        | undefined;
      const effectiveSessionId = binding?.case_id ?? databaseSessionId;
      const workMapPersistence = payload.workMapPersistence as
        | {
            snapshot?: {
              workmap_snapshot_id?: string;
              snapshot_status?: string;
            } | null;
          }
        | null
        | undefined;
      const snapshotId =
        workMapPersistence?.snapshot?.workmap_snapshot_id ?? null;
      if (binding?.case_id && binding.case_id !== databaseSessionId) {
        setDatabaseSessionId(effectiveSessionId);
        window.localStorage.setItem(sessionStorageKey, effectiveSessionId);
        window.localStorage.setItem(sessionModeStorageKey, activeSessionMode);
      }
      writeWorkMapDraft(draft, effectiveSessionId);
      setIntakeStatus("ready");
      setIntakeMessage("Mapa de trabajo guardado.");
      if (snapshotId) {
        void recordWorkMapExperience({
          eventType: "workmap_saved",
          idempotencyKey: `workmap-saved:${effectiveSessionId}:${snapshotId}`,
          metadata: {
            action: "workmap_saved",
            participantId: participantContext?.participant.id ?? null,
            workmapSnapshotId: snapshotId,
            snapshotStatus:
              workMapPersistence?.snapshot?.snapshot_status ?? null,
          },
        });
      }
      return true;
    } catch (error) {
      setIntakeStatus("error");
      setIntakeMessage(
        error instanceof Error
          ? error.message
          : "Ocurrio un error guardando el mapa de trabajo.",
      );
      return false;
    }
  };

  const runPostWorkMapQuestionnairePipeline = async (
    draft: WorkMapData,
    selectionResult: PrimaryActivitySelectionResult,
  ) => {
    if (!databaseSessionId) {
      setIntakeStatus("error");
      setIntakeMessage(
        "Primero crea una sesion real para continuar con el levantamiento.",
      );
      return;
    }

    const flattenedActivities = selectedPrimaryActivitiesToLegacyActivities(
      selectionResult.selectedPrimaryActivities,
    );

    if (!flattenedActivities.length) {
      setIntakeStatus("error");
      setIntakeMessage("Agrega al menos una actividad valida para continuar.");
      return;
    }

    setIntakeStatus("saving");
    setIntakeMessage("Guardando mapa de trabajo y preparando cuestionario...");

    try {
      const response = await fetch("/api/intake/triple", {
        method: "POST",
        headers: protectedHeaders(),
        body: JSON.stringify({
          mode: activeSessionMode,
          sessionId: databaseSessionId,
          phase: "continue",
          workMap: draft,
          activities: flattenedActivities,
          relatos: {
            ultimo_incendio: [],
            lo_que_no_deberia_pasar: [],
          },
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No pude guardar el mapa de trabajo.");
      }

      const ranking = await rankActivities(databaseSessionId);
      await bootstrapScenes(databaseSessionId);
      const selectedIds = new Set(
        selectionResult.selectedPrimaryActivities.map(
          (activity) => activity.activityId,
        ),
      );
      const governedRanking: ActivityRanking = {
        primary: ranking.primary
          .filter((activity) => selectedIds.has(activity.activityId))
          .slice(0, selectionResult.maxPrimaryActivities),
        supportPool: [
          ...ranking.primary.filter(
            (activity) => !selectedIds.has(activity.activityId),
          ),
          ...ranking.supportPool,
        ],
      };
      setWorkMap(draft);
      setQuestionnaireScope("main");
      setActivityRanking(governedRanking);
      setQuestionnaireActivities(governedRanking.primary);
      setIntakeStatus("ready");
      setIntakeMessage(
        "Mapa de trabajo guardado. La plataforma preparo internamente el cuestionario principal.",
      );
      setFlowState("questionnaire_main");
    } catch (error) {
      setIntakeStatus("error");
      setIntakeMessage(
        error instanceof Error
          ? error.message
          : "Ocurrio un error guardando el mapa de trabajo.",
      );
    }
  };

  const continueFromWorkMapToSignificado = async (
    draft: WorkMapData,
    options?: { skipPersist?: boolean },
  ) => {
    if (!options?.skipPersist) {
      const persisted = await saveWorkMapDraft(draft);
      if (!persisted) return;
    } else {
      setWorkMap(draft);
      writeWorkMapDraft(draft, resolveDraftSessionId());
    }

    if (activeSessionMode === "commercial" && authSession?.access_token) {
      const finalized = await finalizeSavedParticipantWorkMap(draft);
      if (!finalized) return;
      return;
    }

    const selectionResult = selectPrimaryActivitiesFromWorkMap(draft);
    const nextPreRuntimeContextBundle = buildPreRuntimeContextBundle({
      startPositionContext,
      workMap: draft,
      primaryActivitySelectionResult: selectionResult,
    });

    setPrimaryActivitySelectionResult(selectionResult);
    setPreRuntimeContextBundle(nextPreRuntimeContextBundle);
    setWorkMap(draft);

    if (selectionResult.mode === "reentry_required") {
      setIntakeStatus("error");
      setIntakeMessage(
        "Necesitamos actividades concretas en tu mapa antes de abrir las preguntas.",
      );
      setFlowState("intake_work_map");
      return;
    }

    setIntakeStatus("ready");
    setIntakeMessage("Mapa guardado. Entrando al umbral de observación.");
    setSceneEntryComplete(false);
    setFlowState("intake_significado");
    window.requestAnimationFrame(() => {
      scrollToLocalCanvasSection("scene-entry");
    });
  };

  const submitSignificadoIntake = async (payload: SignificadoSubmitPayload) => {
    if (
      payload.diagnosticsEnabled !== false ||
      payload.exportEnabled !== false ||
      payload.transductionEnabled !== false ||
      payload.primaryActivitySelectionResult.selectionGovernance !== "eve_policy" ||
      payload.primaryActivitySelectionResult.userSelectedActivities !== false ||
      payload.primaryActivitySelectionResult.selectedPrimaryActivities.length >
        payload.primaryActivitySelectionResult.maxPrimaryActivities
    ) {
      setIntakeStatus("error");
      setIntakeMessage(
        "Los candados operativos de Significado no permiten continuar.",
      );
      return;
    }

    if (payload.primaryActivitySelectionResult.mode === "reentry_required") {
      setIntakeStatus("error");
      setIntakeMessage(
        "Necesitamos volver al mapa para tener actividades concretas antes de continuar.",
      );
      setFlowState("intake_work_map");
      return;
    }

    if (
      databaseSessionId &&
      payload.block0Answers &&
      !isLocalDemoSessionId(databaseSessionId)
    ) {
      try {
        const block0Response = await fetch("/api/significado/block0", {
          method: "POST",
          headers: protectedHeaders(),
          body: JSON.stringify({
            mode: activeSessionMode,
            sessionId: databaseSessionId,
            answers: payload.block0Answers,
            activityTitle: payload.primaryActivity.title,
          }),
        });
        const block0Result = await readJsonBody(block0Response);
        if (!block0Response.ok) {
          setIntakeStatus("error");
          setIntakeMessage(
            typeof block0Result.error === "string"
              ? block0Result.error
              : "No pudimos guardar la descripcion operativa de Significado.",
          );
          return;
        }

        if (activeSessionMode === "commercial") {
          const refreshedProgress = await loadParticipantActivityProgress();
          setParticipantActivityProgress(refreshedProgress);
          setPrimaryActivitySelectionResult(payload.primaryActivitySelectionResult);
          setPreRuntimeContextBundle(
            payload.preRuntimeContextBundle ?? preRuntimeContextBundle,
          );
          setWorkMap(payload.workMapSnapshot);
          // Gate 9: do not apply block0Result.runtime.nextInteraction to
          // runtimeFullFrontdoor (presentation_hint_only). Continuity uses the
          // SAME FULL run refs from workmap finalize; questionnaire_main asks
          // Client BFF → renderNextRuntime4020ForGaby (governed next).
          setIntakeStatus("ready");
          setIntakeMessage(
            "B0 confirmado. La siguiente interacción la decide Runtime FULL sobre el mismo run (Client BFF / governed execution).",
          );
          setFlowState("questionnaire_main");
          return;
        }
      } catch {
        setIntakeStatus("error");
        setIntakeMessage(
          "No pudimos guardar la descripcion operativa de Significado.",
        );
        return;
      }
    }

    setPrimaryActivitySelectionResult(payload.primaryActivitySelectionResult);
    setPreRuntimeContextBundle(payload.preRuntimeContextBundle ?? preRuntimeContextBundle);
    setWorkMap(payload.workMapSnapshot);
    await runPostWorkMapQuestionnairePipeline(
      payload.workMapSnapshot,
      payload.primaryActivitySelectionResult,
    );
  };

  const saveTripleIntake = async ({
    activities: newActivities,
    relatos: newRelatos,
  }: {
    activities: Activity[];
    relatos: Record<string, RelatoAnswer[]>;
  }) => {
    if (!databaseSessionId) {
      setIntakeStatus("error");
      setIntakeMessage(
        "Primero crea una sesion real para guardar tus actividades.",
      );
      return;
    }

    setIntakeStatus("saving");
    setIntakeMessage("Guardando actividades...");

    try {
      const response = await fetch("/api/intake/triple", {
        method: "POST",
        headers: protectedHeaders(),
        body: JSON.stringify({
          mode: activeSessionMode,
          sessionId: databaseSessionId,
          activities: newActivities,
          relatos: newRelatos,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No pude guardar las actividades.");
      }

      const ranking = await rankActivities(databaseSessionId);
      await bootstrapScenes(databaseSessionId);
      setQuestionnaireScope("main");
      setQuestionnaireActivities(ranking.primary);
      setIntakeStatus("ready");
      setIntakeMessage(
        "Actividades guardadas. La plataforma preparo internamente el cuestionario principal.",
      );
      setFlowState("questionnaire_main");
    } catch (error) {
      setIntakeStatus("error");
      setIntakeMessage(
        error instanceof Error
          ? error.message
          : "Ocurrio un error guardando las actividades.",
      );
    }
  };

  const saveSceneQuestionnaire = async (
    scene: {
      sceneId: string;
      activity: ActivityStructuralScore;
    },
    answers: QuestionnaireAnswer[],
  ) => {
    if (!databaseSessionId) {
      throw new Error("Primero crea una sesion real para guardar la escena.");
    }

    await postJson("/api/scenes/answers", {
      sessionId: databaseSessionId,
      sceneId: scene.sceneId,
      answers,
    });
    await postJson("/api/scenes/derive", {
      sessionId: databaseSessionId,
      sceneId: scene.sceneId,
    });
    await postJson("/api/scenes/preclassify", {
      sessionId: databaseSessionId,
      sceneId: scene.sceneId,
    });
    await postJson("/api/scenes/consistency", {
      sessionId: databaseSessionId,
      sceneId: scene.sceneId,
    });
    await postJson("/api/scenes/canonicalize", {
      sessionId: databaseSessionId,
      sceneId: scene.sceneId,
    });
  };

  const completeSceneQuestionnaire = async () => {
    if (!databaseSessionId) {
      setQuestionnaireStatus("error");
      setQuestionnaireMessage(
        "No hay sesion activa para cerrar esta etapa del levantamiento.",
      );
      return;
    }

    setQuestionnaireStatus("saving");
    setQuestionnaireMessage("Consolidando la salida intermedia del levantamiento...");

    try {
      const output = await postJson("/api/session/intermediate-output", {
        sessionId: databaseSessionId,
      });

      setQuestionnaireStatus("ready");
      setDiagnostic(null);
      setFlowState("intake_completed");
      setQuestionnaireMessage(
        `Levantamiento consolidado: ${output.sceneCount} escena(s), estado de revision ${output.readinessForTransduction}.`,
      );
      setDiagnosticMessage(
        "La salida intermedia quedo lista para revisar la relacion de causa y efecto.",
      );
    } catch (error) {
      setQuestionnaireStatus("error");
      setQuestionnaireMessage(
        error instanceof Error
          ? error.message
          : "No se pudo consolidar la salida intermedia.",
      );
    }
  };

  const saveMicroClarification = async () => {
    if (!databaseSessionId || !activeClarification) {
      setClarificationMessage("No hay una actividad activa para aclarar.");
      return;
    }

    const words = clarificationText.trim().split(/\s+/).filter(Boolean);
    if (words.length < 8) {
      setClarificationMessage(
        "Dame una precision un poco mas completa para que EVE pueda recalcular bien.",
      );
      return;
    }

    setQuestionnaireStatus("saving");
    setClarificationMessage("");
    setQuestionnaireMessage("Guardando aclaracion...");

    try {
      const response = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: databaseSessionId,
          answers: [
            {
              activityId: activeClarification.activityId,
              questionCode: "CONSISTENCY_CLARIFICATION",
              blockId: "consistency",
              selectedValue: null,
              freeText: clarificationText.trim(),
            },
          ],
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No pude guardar la aclaracion.");
      }

      setQuestionnaireStatus("ready");
      setQuestionnaireMessage("Aclaracion guardada. Recalculando cierre...");
      setActiveClarification(null);
      setClarificationText("");
      await runClosureCycle({
        phase: "closure_recheck",
      });
    } catch (error) {
      setQuestionnaireStatus("error");
      setClarificationMessage(
        error instanceof Error
          ? error.message
          : "Ocurrio un error guardando la aclaracion.",
      );
    }
  };

  const completionMessage =
    diagnosticMessage ||
    questionnaireMessage ||
    "Tu información quedó registrada. Puedes cerrar esta ventana o volver más tarde si el consultor lo indica.";

  if (isEstadoBPreview) {
    const previewSignOut = () => {
      console.log("[preview estado-b] sign out");
    };
    const previewContinue = () => {
      console.log("[preview estado-b] continue levantamiento");
    };

    return (
      <main className="min-h-screen bg-[#f5f5f5] text-[#272a32]">
        <LocalCanvasExperience
          estadoA={{
            creating: false,
            greetingName: "Miguel",
            onStartCommercial: previewContinue,
            onStartPositionContextChange: () => undefined,
            onSignOut: previewSignOut,
            participantContext: null,
            startErrorMessage: null,
            startPositionContext: EMPTY_START_POSITION_CONTEXT,
            userEmail: "maria@example.com",
          }}
          login={{
            authDisplayName: "",
            authEmail: "",
            authLoading: false,
            authMessage: "",
            authMode: "sign-in",
            authPassword: "",
            hideDemo: true,
            onAuthDisplayNameChange: () => undefined,
            onAuthEmailChange: () => undefined,
            onAuthPasswordChange: () => undefined,
            onDemo: () => undefined,
            onSelectSignInMode: () => undefined,
            onSelectSignUpMode: () => undefined,
            onSignIn: () => undefined,
            onSignUp: () => undefined,
            sessionCreating: false,
            supabaseAvailable: true,
          }}
          mode="session_resume_fallback"
          resume={{
            lastStepLabel: "Preguntas principales",
            lastUpdatedLabel: "Sesión guardada",
            onContinue: previewContinue,
            onSignOut: previewSignOut,
            progressPercent: 35,
            restoring: false,
            userName: "Miguel",
          }}
        />
      </main>
    );
  }

  const officialLoginProps = {
    authDisplayName,
    authEmail,
    authLoading: authStatus === "loading",
    authMessage,
    authMode: (panelReturnPath ? "sign-in" : authMode) as "sign-in" | "sign-up",
    authPassword,
    hideDemo: Boolean(panelReturnPath),
    onAuthDisplayNameChange: setAuthDisplayName,
    onAuthEmailChange: setAuthEmail,
    onAuthPasswordChange: setAuthPassword,
    onDemo: () => createDatabaseSession("demo"),
    onSelectSignInMode: () => setAuthMode("sign-in"),
    onSelectSignUpMode: () => {
      if (panelReturnPath) return;
      setAuthMode("sign-up");
    },
    onSignIn: (credentials: LocalAuthCredentials) =>
      authenticate("sign-in", credentials),
    onSignUp: (credentials: LocalAuthCredentials) =>
      authenticate("sign-up", credentials),
    sessionCreating: sessionStatus === "creating",
    supabaseAvailable: Boolean(authSupabase),
  };

  const officialEstadoAProps = {
    creating: sessionStatus === "creating",
    greetingName: displayName,
    onSignOut: signOut,
    onStartCommercial: handleStartAssessment,
    onStartPositionContextChange: handleStartPositionContextChange,
    participantContext: participantContext
      ? {
          userName: participantContext.user.name,
          companyName: participantContext.company.name,
          caseName: participantContext.case.name,
          positionTitle:
            participantContext.position?.title ?? "Puesto no declarado",
        }
      : null,
    startErrorMessage:
      sessionStatus === "error" || restoreStatus === "error" ? sessionMessage : null,
    startPositionContext,
    userEmail: authSession?.user.email,
  };

  const officialEstadoASheetProps = {
    ...officialEstadoAProps,
    onStartCommercial: handleContinueEstadoAOnSheet,
  };

  const officialResumeProps = {
    lastStepLabel: currentStep?.label ?? "Sesión guardada",
    lastUpdatedLabel: "Sesión guardada",
    onContinue: handleContinueLevantamiento,
    onSignOut: signOut,
    progressPercent: frontDoorProgress,
    restoring: restoreStatus === "restoring",
    userName: displayName,
  };

  const officialB05Props = {
    answers: b05StubAnswers,
    continueDisabled: false,
    continueLabel: "Continuar ↓",
    note: b05StubNote,
    onChange: (slotRef: string, patch: Partial<B05SlotAnswer>) => {
      setB05StubNote(null);
      setB05StubAnswers((prev) => ({
        ...prev,
        [slotRef]: { ...prev[slotRef], ...patch },
      }));
    },
    onContinue: () => {
      setB05StubNote(
        "Candidato visual B0.5 listo. Binding Renderer→field_key→slot_ref→BFF queda para una tarea posterior — no hay avance Runtime desde esta UI.",
      );
    },
    viewModel: b05VisualStub,
  };

  const officialB1Props = {
    answers: b1StubAnswers,
    continueDisabled: false,
    continueLabel: "Continuar ↓",
    note: b1StubNote,
    onChange: (fieldKey: string, patch: Partial<B1SlotAnswer>) => {
      setB1StubNote(null);
      setB1StubAnswers((prev) => ({
        ...prev,
        [fieldKey]: { ...prev[fieldKey], ...patch },
      }));
    },
    onContinue: () => {
      setB1StubNote(
        "Candidato visual B1 listo. Binding Renderer→field_key→slot_ref→BFF queda para X4-1 — no hay avance Runtime desde esta UI.",
      );
    },
    viewModel: b1VisualStub,
  };

  if (isB1Preview) {
    return (
      <main className="min-h-screen bg-[#f5f5f5] text-[#272a32]">
        <LocalCanvasExperience
          b1={officialB1Props}
          estadoA={officialEstadoAProps}
          login={officialLoginProps}
          mode="b1"
          resume={officialResumeProps}
        />
      </main>
    );
  }

  if (isB05Preview) {
    return (
      <main className="min-h-screen bg-[#f5f5f5] text-[#272a32]">
        <LocalCanvasExperience
          b05={officialB05Props}
          estadoA={officialEstadoAProps}
          login={officialLoginProps}
          mode="b05"
          resume={officialResumeProps}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#272a32]">
      {viewState === "routing_access" && (
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] items-center justify-center px-4">
          <p className="text-sm text-[#6f7280]" role="status">
            Resolviendo su acceso…
          </p>
        </div>
      )}

      {viewState === "access_screen" && (
        <LocalCanvasExperience
          estadoA={officialEstadoAProps}
          login={officialLoginProps}
          mode="login"
          resume={officialResumeProps}
        />
      )}

      {viewState === "create_session" && (
        <LocalCanvasExperience
          estadoA={officialEstadoAProps}
          login={officialLoginProps}
          mode={
            canRestoreCommercialSession && restoreStatus !== "error"
              ? "session_resume_loading"
              : canRestoreCommercialSession && restoreStatus === "error"
                ? "session_resume_fallback"
                : "estado_a"
          }
          resume={{
            ...officialResumeProps,
            restoring:
              canRestoreCommercialSession && restoreStatus !== "error"
                ? restoreStatus === "restoring"
                : false,
          }}
        />
      )}

      {viewState === "capture_workspace" &&
      (flowState === "intake_work_map" || flowState === "intake_significado") ? (
        <>
          <div className="mx-auto w-full max-w-[1260px] px-4 pt-4">
            <StatusMessage message={intakeMessage} status={intakeStatus} />
          </div>
          {flowState === "intake_significado" && !workMap ? (
            <main className="mx-auto w-full max-w-3xl px-4 py-10">
              <section className="rounded border border-[rgba(61,61,71,0.14)] bg-white p-6">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#6f7280]">
                  Significado de tu trabajo
                </p>
                <h1 className="mt-3 text-2xl font-semibold text-[#272a32]">
                  Primero completa tu mapa de trabajo
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f7280]">
                  No encontramos un mapa guardado para preparar esta pantalla.
                </p>
                <button
                  className="mt-5 rounded bg-[#3d3d47] px-4 py-2 text-sm font-medium text-white"
                  onClick={() => setFlowState("intake_work_map")}
                  type="button"
                >
                  Volver al mapa de trabajo
                </button>
              </section>
            </main>
          ) : (
            <LocalCanvasExperience
              estadoA={officialEstadoASheetProps}
              login={officialLoginProps}
              mode="intake_sheet"
              resume={officialResumeProps}
              significado={
                flowState === "intake_significado" && workMap
                  ? {
                      sceneEntryComplete,
                      sceneEntryInitiallyComplete: sceneEntryComplete,
                      onSceneEntryComplete: () => setSceneEntryComplete(true),
                      sceneEntryViewModel,
                      showSignificado: sceneEntryComplete,
                      significadoCompletedPersisted: false,
                      onMemoriaConfirm: (parts) => {
                        setB0MemoriaParts(parts);
                        setShowB0ComoOcurre(true);
                        window.requestAnimationFrame(() => {
                          scrollToLocalCanvasSection("b0-como-ocurre");
                        });
                      },
                      showComoOcurre: showB0ComoOcurre,
                      memoriaParts: b0MemoriaParts,
                      onComoOcurreConfirm: () => {
                        // Scene confirm stays inside Cómo ocurre; frecuencia continues in-place.
                      },
                      onFrecuenciaConfirm: () => {
                        // Local-canvas UX confirm — product Block0 API submit stays on legacy paths.
                      },
                    }
                  : null
              }
              workmap={
                flowState === "intake_work_map" ||
                flowState === "intake_significado"
                  ? {
                      heroGateComplete,
                      onHeroGateComplete: () => {
                        writeLocalHeroGateSeen(true);
                        setHeroGateComplete(true);
                        window.requestAnimationFrame(() =>
                          scrollToLocalCanvasSection("posicion-cuadrantes"),
                        );
                      },
                      estadoAComplete: workMapSheetEstadoAComplete,
                      explanationComplete: workMapExplanationComplete,
                      explanationInitiallyComplete:
                        workMapExplanationComplete ||
                        hasMaterialWorkMapProgress(workMap),
                      onExplanationComplete: () => {
                        setWorkMapExplanationComplete(true);
                        scrollToLocalCanvasSection("workmap");
                      },
                      showWorkMap:
                        workMapSheetEstadoAComplete ||
                        workMapExplanationComplete ||
                        hasMaterialWorkMapProgress(workMap),
                      workMapCompletedPersisted:
                        flowState === "intake_significado" ||
                        Boolean(workMap?.isSaved),
                      editor: {
                        disabled:
                          intakeStatus === "saving" ||
                          flowState === "intake_significado",
                        greetingAuthUser: authSession?.user ?? null,
                        greetingProfile: registeredUserNombre
                          ? { nombre: registeredUserNombre }
                          : null,
                        initialWorkMap: workMap,
                        onContinue: (draft) =>
                          continueFromWorkMapToSignificado(draft, {
                            skipPersist: true,
                          }),
                        onSave: async (draft) => {
                          const persisted = await saveWorkMapDraft(draft);
                          if (!persisted) {
                            throw new Error("workmap_save_failed");
                          }
                        },
                        onSignOut: signOut,
                        onStartPositionContextChange:
                          handleStartPositionContextChange,
                        runIntroTutorial: runWorkMapIntroTutorial,
                        sessionId: databaseSessionId,
                        startPositionContext,
                        userFirstName: displayName,
                        userFullName:
                          typeof authSession?.user.user_metadata?.name ===
                            "string" &&
                          authSession.user.user_metadata.name.trim()
                            ? authSession.user.user_metadata.name.trim()
                            : undefined,
                      },
                    }
                  : null
              }
            />
          )}
        </>
      ) : null}

      {viewState === "capture_workspace" &&
      flowState !== "intake_work_map" &&
      flowState !== "intake_significado" ? (
        flowState === "questionnaire_main" ||
        flowState === "support_activity_questionnaire" ? (
            useRuntimeLegacyQuestionnaire ? (
              <ClientShell variant="default" withSidebar>
                <div className="flex min-h-[calc(100vh-3.5rem)] flex-col pb-16">
                  <ClientTopbar
                    onSignOut={signOut}
                    showSignOut={Boolean(authSession)}
                    userEmail={authSession?.user.email}
                  />
                  <div className="mt-6 flex-1">
                    <StatusMessage
                      message={questionnaireMessage}
                      status={questionnaireStatus}
                    />
                    <SceneQuestionnaireRunner
                      disabled={questionnaireStatus === "saving"}
                      key={`capa21:${questionnaireScope}:${sceneQuestionnaireItems
                        .map((scene) => scene.sceneId)
                        .join(",")}`}
                      onComplete={completeSceneQuestionnaire}
                      onSceneAnswers={saveSceneQuestionnaire}
                      scenes={sceneQuestionnaireItems}
                      sessionId={databaseSessionId ?? ""}
                    />
                  </div>
                </div>
              </ClientShell>
            ) : (
              <>
                <div className="mx-auto w-full max-w-[1260px] px-4 pt-4">
                  <StatusMessage
                    message={questionnaireMessage}
                    status={questionnaireStatus}
                  />
                </div>
                <LocalCanvasExperience
                  b05={officialB05Props}
                  estadoA={officialEstadoAProps}
                  login={officialLoginProps}
                  mode="b05"
                  resume={officialResumeProps}
                />
              </>
            )
          ) : (
        <ClientShell
          variant="default"
          withSidebar
        >
          <div className="flex min-h-[calc(100vh-3.5rem)] flex-col pb-16">
              <ClientTopbar
                onSignOut={signOut}
                showSignOut={Boolean(authSession)}
                userEmail={authSession?.user.email}
              />

            <div className="mt-6 flex-1">
              <StatusMessage message={intakeMessage} status={intakeStatus} />
              <StatusMessage
                message={questionnaireMessage}
                status={questionnaireStatus}
              />
              <StatusMessage
                message={diagnosticMessage}
                status={diagnosticStatus}
              />

              {flowState === "intake_main_activities" && (
                <TripleIntake
                  disabled={intakeStatus === "saving"}
                  onComplete={saveTripleIntake}
                />
              )}

              {(flowState === "closure_check" ||
                flowState === "closure_recheck") && (
                <LoadingCard
                  text="La plataforma está verificando si la recopilación ya quedó suficientemente completa."
                  title="Revisando la información"
                />
              )}

              {flowState === "support_activity_selected_internal" && (
                <LoadingCard
                  text="Se requiere responder una actividad adicional para cerrar la recopilación de información. La abriremos automáticamente en un momento."
                  title="Necesitamos una actividad adicional"
                />
              )}

              {flowState === "micro_clarification" && activeClarification && (
                <MicroClarificationCard
                  activity={activeClarification}
                  disabled={questionnaireStatus === "saving"}
                  message={clarificationMessage}
                  onChange={setClarificationText}
                  onSubmit={saveMicroClarification}
                  value={clarificationText}
                />
              )}

              {flowState === "intake_completed" && (
                <ClientAssessmentComplete
                  message={completionMessage}
                  secondaryMessage={
                    activeSessionMode === "demo"
                      ? "Modo demo activo."
                      : undefined
                  }
                />
              )}
            </div>
          </div>
        </ClientShell>
        )
      ) : null}
    </main>
  );
}

function StatusMessage({
  message,
  status,
}: {
  message: string;
  status: "idle" | "saving" | "ready" | "error" | "loading";
}) {
  if (!message) return null;

  return (
    <div
      className={[
        "mb-4 rounded-md border px-4 py-3 text-sm",
        status === "error"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-[rgba(61,61,71,0.14)] bg-white text-[#272a32]",
      ].join(" ")}
    >
      {message}
    </div>
  );
}

function LoadingCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded border border-[rgba(61,61,71,0.14)] bg-white p-6">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#6f7280]">
        En proceso
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-[#272a32]">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f7280]">
        {text}
      </p>
    </section>
  );
}

function MicroClarificationCard({
  activity,
  disabled,
  message,
  onChange,
  onSubmit,
  value,
}: {
  activity: ActivityDiagnostic;
  disabled: boolean;
  message: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
}) {
  return (
    <section className="rounded border border-[rgba(61,61,71,0.14)] bg-white p-6">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#6f7280]">
        Aclaración breve
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-[#272a32]">
        Nos falta una precisión para cerrar bien
      </h1>
      <div className="mt-4 rounded border border-[rgba(61,61,71,0.14)] bg-[#fafafa] p-4 text-sm leading-6 text-[#272a32]">
        {(activity.consistency.clarification_prompt ?? "").split("\n").map(
          (line) => (
            <p className="mt-2 first:mt-0" key={line}>
              {line}
            </p>
          ),
        )}
      </div>
      <textarea
        className="mt-5 min-h-32 w-full rounded border border-[rgba(61,61,71,0.14)] bg-white px-3 py-3 text-sm leading-6 text-[#272a32] outline-none focus:border-[#3d3d47]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Escribe aqui la precision en tus palabras..."
        value={value}
      />
      {message && (
        <p className="mt-3 rounded border border-[rgba(61,61,71,0.14)] bg-[#fafafa] px-3 py-2 text-sm text-[#272a32]">
          {message}
        </p>
      )}
      <div className="mt-5 flex justify-end">
        <button
          className="rounded bg-[#3d3d47] px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={onSubmit}
          type="button"
        >
          {disabled ? "Guardando..." : "Guardar aclaracion"}
        </button>
      </div>
    </section>
  );
}

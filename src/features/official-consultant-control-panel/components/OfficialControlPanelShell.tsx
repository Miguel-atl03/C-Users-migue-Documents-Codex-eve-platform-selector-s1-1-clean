"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import styles from "../styles/official-control-panel.module.css";

import { parseOfficialControlPanelNavigation } from "../state/official-control-panel-navigation";
import { buildOfficialPanelLoginRedirect } from "../state/official-panel-login-redirect";
import { ACCESS_DENIED_HREF } from "../state/post-login-destination";

import type {
  ClientCompanyView,
  ExperienceGovernanceView,
  OfficialPanelMode,
  OfficialPanelShellState,
} from "../types/official-control-panel.types";

import { OfficialControlPanelModeSwitch } from "./OfficialControlPanelModeSwitch";
import { ClientCompanyHeader } from "./ClientCompanyHeader";
import { ClientCompanyKpiStrip } from "./ClientCompanyKpiStrip";
import { SupportProcessAxis } from "./SupportProcessAxis";
import { SupportProcessWorkspaceSummary } from "./SupportProcessWorkspaceSummary";
import { CoreMilestoneRail } from "./CoreMilestoneRail";
import { CoreMilestoneDetail } from "./CoreMilestoneDetail";
import { XyInteractionMatrix } from "./XyInteractionMatrix";
import { AttentionGovernancePanel } from "./AttentionGovernancePanel";
import { ManualWorkPanel } from "./ManualWorkPanel";
import { ParallelProductionPanel } from "./ParallelProductionPanel";
import { ExperienceGovernanceMode } from "./ExperienceGovernanceMode";
import { OfficialControlPanelLoadingState } from "./OfficialControlPanelLoadingState";
import { OfficialControlPanelErrorState } from "./OfficialControlPanelErrorState";
import { useClientContext } from "../hooks/use-client-context";
import { useCaseParticipants } from "../hooks/use-case-participants";
import { useCaseUserIndicatorMatrix } from "../hooks/use-case-user-indicator-matrix";
import { useCaseWorkMapProgress } from "../hooks/use-case-workmap-progress";
import { useCaseSupportProcesses } from "../hooks/use-case-support-processes";
import { useCaseCoreMilestones } from "../hooks/use-case-core-milestones";
import { useCaseManualWork } from "../hooks/use-case-manual-work";
import { useCaseParallelProduction } from "../hooks/use-case-parallel-production";
import { useCaseExperienceState } from "../hooks/use-case-experience-state";
import { useExperienceScreenInstrumentation } from "../hooks/use-experience-screen-instrumentation";
import {
  manualProcessNeedsClear,
  manualWorkItemNeedsClear,
  MANUAL_PROCESS_QUERY_KEY,
  MANUAL_WORK_ITEM_QUERY_KEY,
} from "../state/manual-work-navigation";
import { resolveEffectiveMilestoneCode } from "../presentation/core-milestone-axis-presentation";
import { CLIENT_COMPANY_VIEW_COPY } from "../types/official-control-panel.types";
import { presentClientContext } from "../presentation/client-context-presentation";
import {
  buildPanelAggregationSources,
  resolvePanelAggregationCompleteness,
} from "../presentation/aggregation-sources";
import { presentCompanyStateProjectionWithCompleteness } from "../presentation/company-state-projection";
import type { CompanyStateSurfaceProjection } from "../presentation/company-state-presentation";
import { composeCompanyControlPanelVM } from "@/services/eve/official-control-panel/official-control-panel-contract-compose";
import { deriveExperienceSourceObservedAt } from "@/services/eve/official-control-panel/official-control-panel-contract-adapt";
import { presentClientContextShellCopy } from "../presentation/client-context-shell-copy";
import { resolveOfficialPanelShellSnapshot } from "../state/official-panel-shell-snapshot";
import type { ClientContextStatus } from "../types/client-context.types";
import { PanelForbiddenState } from "./PanelScreenStateChrome";
import type { ClientContextErrorKind } from "../presentation/client-context-shell-copy";
import { CaseParticipantsPanel } from "./CaseParticipantsPanel";
import { RuntimeControlStateProvider } from "../state/runtime-control-state-context";
import type { CompanyAttentionAlertView } from "@/services/eve/official-control-panel/official-control-panel-experience.types";

type OfficialControlPanelShellProps = {
  initialMode?: OfficialPanelMode;
  initialView?: ClientCompanyView | ExperienceGovernanceView;
  initialShellState?: OfficialPanelShellState;
};

function ShellLayout({
  children,
  shellSnapshot,
}: {
  children: ReactNode;
  shellSnapshot?: {
    contextStatus: string;
    dataStatus: string;
  };
}) {
  return (
    <main
      className={styles.shell}
      data-shell-context-status={shellSnapshot?.contextStatus}
      data-shell-data-status={shellSnapshot?.dataStatus}
    >
      <div className={styles.appShell}>
        <div className={styles.mainColumn}>{children}</div>
      </div>
    </main>
  );
}

function navigationNeedsNormalization(
  searchParams: URLSearchParams,
  parsed: ReturnType<typeof parseOfficialControlPanelNavigation>,
): boolean {
  const modeRaw = searchParams.get("mode");
  const viewRaw = searchParams.get("view");

  if (modeRaw !== null && modeRaw !== parsed.mode) return true;
  if (viewRaw !== null && viewRaw !== parsed.view) return true;
  return false;
}

export function OfficialControlPanelShell({
  initialMode = "client-company",
  initialView = "monitoring",
  initialShellState = "ready-empty",
}: OfficialControlPanelShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parsedNavigation = useMemo(
    () =>
      parseOfficialControlPanelNavigation(searchParams, {
        allowShellStateOverride: process.env.NODE_ENV !== "production",
      }),
    [searchParams],
  );
  const mode = searchParams.has("mode")
    ? parsedNavigation.mode
    : initialMode;
  const view = searchParams.has("view")
    ? parsedNavigation.view
    : initialView;
  const shellState = searchParams.has("shellState")
    ? parsedNavigation.shellState
    : initialShellState;
  const {
    context,
    accessToken,
    selectCompany,
    selectRelationship,
    selectCase,
    retry: retryContext,
  } = useClientContext();

  const {
    participantsView,
    participantMonitoringVMs,
    screenState: participantsScreenState,
    toggleParticipant,
    selectProfile,
    selectSession,
    selectActivity,
    retry: retryParticipants,
  } = useCaseParticipants({
    context,
    accessToken,
  });

  const {
    data: workMapProgress,
  } = useCaseWorkMapProgress({
    context,
    accessToken,
    participantId: participantsView.selectedParticipant?.id ?? null,
    userId: participantsView.selectedParticipant?.userId ?? null,
    profileId: participantsView.selectedProfile?.id ?? null,
  });

  const {
    data: userIndicatorMatrix,
    loading: userIndicatorMatrixLoading,
    refreshing: userIndicatorMatrixRefreshing,
    error: userIndicatorMatrixError,
    retry: retryUserIndicatorMatrix,
  } = useCaseUserIndicatorMatrix({
    context,
    accessToken,
  });

  const {
    supportProcessAxis,
    screenState: supportProcessScreenState,
    requestId: supportProcessRequestId,
    selectProcess,
    retry: retrySupportProcesses,
  } = useCaseSupportProcesses({
    context,
    accessToken,
  });

  const {
    coreMilestoneAxis,
    screenState: coreMilestoneScreenState,
    requestId: coreMilestoneRequestId,
    selectMilestone,
    retry: retryCoreMilestones,
  } = useCaseCoreMilestones({
    context,
    accessToken,
  });

  const {
    state: manualWorkState,
    screenState: manualWorkScreenState,
    requestId: manualWorkRequestId,
    mutationSafety: manualWorkMutationSafety,
    retry: retryManualWork,
    submitAction: submitManualWorkAction,
    downloadPackage: downloadManualPackage,
    submitting: manualWorkSubmitting,
    overdueAlerts: manualOverdueAlerts,
  } = useCaseManualWork({
    context,
    accessToken,
    view:
      view === "monitoring" || view === "tracking" || view === "governance"
        ? view
        : "monitoring",
  });

  const {
    state: parallelProductionState,
    screenState: parallelProductionScreenState,
    requestId: parallelProductionRequestId,
    retry: retryParallelProduction,
    alerts: parallelProductionAlerts,
  } = useCaseParallelProduction({
    context,
    accessToken,
    view:
      view === "monitoring" || view === "tracking" || view === "governance"
        ? view
        : "monitoring",
  });

  const {
    state: experienceState,
    data: experienceData,
    dataStatus: experienceDataStatus,
    freshness: experienceFreshness,
    capabilities: experienceCapabilities,
    screenState: experienceScreenState,
    requestId: experienceRequestId,
    mutationSafety: experienceMutationSafety,
    retry: retryExperience,
    submitAction: submitExperienceAction,
    experienceAlertCount,
    attentionAlerts: experienceAttentionAlerts,
  } = useCaseExperienceState({
    context,
    accessToken,
    enabled: true,
  });
  const unifiedAttentionAlerts = useMemo<CompanyAttentionAlertView[]>(
    () => [
      ...experienceAttentionAlerts,
      ...(workMapProgress?.findings ?? []).map((item) => ({
        alertId: item.findingId,
        alertType:
          item.code === "functional_profile_missing"
            ? ("role_assignment_gap" as const)
            : ("workmap_coverage_gap" as const),
        severity: item.severity,
        title: item.title,
        detail: item.detail,
        scopeLabel: item.scope,
        responseHint: item.recommendedNextAction,
        userId: workMapProgress?.participant?.userId ?? null,
        capabilities: ["open_detail" as const],
      })),
    ],
    [experienceAttentionAlerts, workMapProgress],
  );

  const instrumentCaseId =
    context.status === "active" ? context.selection.caseId : null;
  useExperienceScreenInstrumentation({
    caseId: instrumentCaseId,
    accessToken,
    mode,
    view,
    enabled: context.authReadiness === "authenticated",
  });

  useEffect(() => {
    if (
      !manualProcessNeedsClear(searchParams) &&
      !manualWorkItemNeedsClear(searchParams)
    ) {
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    if (manualProcessNeedsClear(searchParams)) {
      next.delete(MANUAL_PROCESS_QUERY_KEY);
    }
    if (manualWorkItemNeedsClear(searchParams)) {
      next.delete(MANUAL_WORK_ITEM_QUERY_KEY);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const buildQueryString = useCallback(
    (next: {
      mode: OfficialPanelMode;
      view: ClientCompanyView | ExperienceGovernanceView;
      shellState?: OfficialPanelShellState;
    }) => {
      const nextShell = next.shellState ?? shellState;
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", next.mode);
      params.set("view", next.view);
      if (
        process.env.NODE_ENV !== "production" &&
        nextShell !== "ready-empty"
      ) {
        params.set("shellState", nextShell);
      } else {
        params.delete("shellState");
      }
      return params.toString();
    },
    [searchParams, shellState],
  );

  const pushNavigation = useCallback(
    (next: {
      mode: OfficialPanelMode;
      view: ClientCompanyView | ExperienceGovernanceView;
      shellState?: OfficialPanelShellState;
    }) => {
      const qs = buildQueryString(next);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [buildQueryString, pathname, router],
  );

  const replaceNavigation = useCallback(
    (next: {
      mode: OfficialPanelMode;
      view: ClientCompanyView | ExperienceGovernanceView;
      shellState?: OfficialPanelShellState;
    }) => {
      const qs = buildQueryString(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [buildQueryString, pathname, router],
  );

  useEffect(() => {
    if (navigationNeedsNormalization(searchParams, parsedNavigation)) {
      replaceNavigation({
        mode: parsedNavigation.mode,
        view: parsedNavigation.view,
        shellState: parsedNavigation.shellState,
      });
    }
  }, [parsedNavigation, replaceNavigation, searchParams]);

  const handleModeChange = (nextMode: OfficialPanelMode) => {
    if (nextMode === "user-experience-governance") {
      pushNavigation({ mode: nextMode, view: "journeys" });
      return;
    }
    pushNavigation({ mode: nextMode, view: "monitoring" });
  };

  const handleViewChange = (nextView: ClientCompanyView) => {
    pushNavigation({ mode: "client-company", view: nextView });
  };

  const handleExperienceViewChange = (nextView: ExperienceGovernanceView) => {
    pushNavigation({ mode: "user-experience-governance", view: nextView });
  };

  const handleRetry = () => {
    replaceNavigation({
      mode: "client-company",
      view: "monitoring",
      shellState: "ready-empty",
    });
  };

  const authReadiness = context.authReadiness ?? "checking";
  // Server Component already authorized capability. Client gate only covers
  // session drop / BFF hydration — never the primary anonymous deny path.
  const accessGatePending =
    authReadiness === "checking" ||
    authReadiness === "unauthenticated" ||
    authReadiness === "error" ||
    !accessToken ||
    (authReadiness === "authenticated" && !context.companiesLoaded);

  useEffect(() => {
    if (authReadiness === "unauthenticated" || authReadiness === "error") {
      const qs = searchParams.toString();
      const returnPath = qs ? `${pathname}?${qs}` : pathname;
      router.replace(buildOfficialPanelLoginRedirect(returnPath));
    }
  }, [authReadiness, pathname, router, searchParams]);

  const shellSnapshot = useMemo(
    () =>
      resolveOfficialPanelShellSnapshot({
        shellState,
        contextStatus: context.status,
        experienceDataStatus:
          experienceData?.dataStatus ??
          (experienceDataStatus === "available" ? "empty" : null),
      }),
    [context.status, experienceData, experienceDataStatus, shellState],
  );

  const companyControlPanelVm = useMemo(() => {
    if (
      context.status !== "active" ||
      !context.selectedCompany ||
      !context.selectedRelationship ||
      !context.selectedCase
    ) {
      return null;
    }
    const generatedAt = new Date().toISOString();
    const sourceObservedAt = experienceData
      ? deriveExperienceSourceObservedAt(experienceData)
      : experienceFreshness?.sourceObservedAt ?? null;
    const factualCompanyState =
      (workMapProgress?.findings?.length ?? 0) > 0 &&
      experienceData?.companyState.companyState !== "Cerrado" &&
      experienceData?.companyState.companyState !== "Bloqueado"
        ? {
            companyState: "Atención" as const,
            companyStateReason:
              "Existen brechas factuales activas entre WorkMap, selección, perfil o instrumentación.",
            alerts: unifiedAttentionAlerts,
            experienceAlertCount:
              experienceData?.companyState.experienceAlertCount ?? null,
            experienceAlertsComplete:
              experienceData?.companyState.experienceAlertsComplete ?? false,
          }
        : (experienceData?.companyState ?? null);
    return composeCompanyControlPanelVM({
      company: {
        id: context.selectedCompany.id,
        label: context.selectedCompany.label,
      },
      relationship: {
        id: context.selectedRelationship.id,
        label: context.selectedRelationship.label,
        statusLabel: null,
      },
      diagnosticCase: {
        id: context.selectedCase.id,
        label: context.selectedCase.label,
        statusLabel: context.selectedCase.statusLabel ?? null,
      },
      milestones: coreMilestoneAxis.items,
      processAxis: supportProcessAxis.items,
      attentionAlerts: unifiedAttentionAlerts,
      companyState: factualCompanyState,
      experience: experienceData,
      generatedAt,
      sourceObservedAt,
      extraAllowedCapabilities: experienceCapabilities
        .filter((c) => c.allowed)
        .map((c) => c.key),
    });
  }, [
    context,
    coreMilestoneAxis.items,
    supportProcessAxis.items,
    unifiedAttentionAlerts,
    workMapProgress,
    experienceData,
    experienceFreshness,
    experienceCapabilities,
  ]);

  const panelAggregationSources = useMemo(
    () =>
      buildPanelAggregationSources({
        experience: experienceScreenState,
        coreMilestones: coreMilestoneScreenState,
        manualWork: manualWorkScreenState,
        parallelProduction: parallelProductionScreenState,
      }),
    [
      experienceScreenState,
      coreMilestoneScreenState,
      manualWorkScreenState,
      parallelProductionScreenState,
    ],
  );

  const aggregationCompleteness = useMemo(
    () => resolvePanelAggregationCompleteness(panelAggregationSources),
    [panelAggregationSources],
  );

  const companyStateProjection = useMemo(
    () =>
      presentCompanyStateProjectionWithCompleteness({
        contextActive: context.status === "active",
        vm: companyControlPanelVm,
        completeness: aggregationCompleteness,
      }),
    [aggregationCompleteness, context.status, companyControlPanelVm],
  );
  const reconciledCompanyStateProjection = useMemo<CompanyStateSurfaceProjection>(
    () => {
      if (companyStateProjection.evaluable || !workMapProgress?.workmap.saved) {
        return companyStateProjection;
      }
      return {
        currentStatusLabel:
          workMapProgress.diagnosticCase.statusLabel ??
          "WorkMap guardado; seleccion primaria pendiente",
        nextStepLabel:
          workMapProgress.nextStep ??
          "Preparar elegibilidad de actividades primarias",
        evaluable: true,
        companyStateLabel: "Atención",
      };
    },
    [companyStateProjection, workMapProgress],
  );
  const reconciledCoreMilestoneProgress = useMemo(() => {
    const raw =
      coreMilestoneScreenState === "loading" ||
      coreMilestoneScreenState === "fatal" ||
      coreMilestoneScreenState === "forbidden" ||
      coreMilestoneScreenState === "not_found"
        ? null
        : coreMilestoneAxis.progress;
    if (
      raw &&
      raw.status !== "unavailable" &&
      (raw.achieved > 0 || !workMapProgress?.workmap.saved)
    ) {
      return raw;
    }
    return workMapProgress?.workmap.saved
      ? { achieved: 1, total: 7, status: "available" as const }
      : raw;
  }, [coreMilestoneAxis.progress, coreMilestoneScreenState, workMapProgress]);

  useEffect(() => {
    if (
      authReadiness === "authenticated" &&
      context.companiesLoaded &&
      context.companies.length === 0
    ) {
      router.replace(ACCESS_DENIED_HREF);
    }
  }, [
    authReadiness,
    context.companies.length,
    context.companiesLoaded,
    router,
  ]);

  if (accessGatePending) {
    return (
      <ShellLayout>
        <p className={styles.contextStateMessage} role="status">
          Cargando contexto autorizado…
        </p>
      </ShellLayout>
    );
  }

  if (
    authReadiness === "authenticated" &&
    context.companiesLoaded &&
    context.companies.length === 0
  ) {
    return (
      <ShellLayout>
        <p className={styles.contextStateMessage} role="status">
          Acceso no autorizado.
        </p>
      </ShellLayout>
    );
  }

  if (shellState === "loading") {
    return (
      <ShellLayout>
        <OfficialControlPanelLoadingState />
      </ShellLayout>
    );
  }

  if (shellState === "error") {
    return (
      <ShellLayout>
        <ClientCompanyHeader
          context={context}
          onCompanyChange={selectCompany}
          onRelationshipChange={selectRelationship}
          onCaseChange={selectCase}
          onRetry={retryContext}
        />
        <OfficialControlPanelErrorState onRetry={handleRetry} />
      </ShellLayout>
    );
  }

  const clientView: ClientCompanyView =
    view === "monitoring" || view === "tracking" || view === "governance"
      ? view
      : "monitoring";
  const experienceView: ExperienceGovernanceView =
    view === "journeys" || view === "support" || view === "screen_health"
      ? view
      : "journeys";
  const experienceMode = mode === "user-experience-governance";
  const viewCopy = CLIENT_COMPANY_VIEW_COPY[clientView];
  const contextPresentation = presentClientContext({
    companyLabel: context.selectedCompany?.label,
    relationshipLabel: context.selectedRelationship?.label,
    caseLabel: context.selectedCase?.label,
    currentStatusLabel: context.selectedCase?.statusLabel,
  });

  const effectiveMilestoneCode =
    resolveEffectiveMilestoneCode(coreMilestoneAxis);
  const effectiveProcessCode = supportProcessAxis.selectedItem?.code ?? null;

  return (
    <RuntimeControlStateProvider>
    <ShellLayout shellSnapshot={shellSnapshot}>
      <ClientCompanyHeader
        context={context}
        onCompanyChange={selectCompany}
        onRelationshipChange={selectRelationship}
        onCaseChange={selectCase}
        onRetry={retryContext}
      />
      <ClientCompanyKpiStrip
        presentation={contextPresentation}
        companyStateProjection={reconciledCompanyStateProjection}
        coreMilestoneProgress={reconciledCoreMilestoneProgress}
        experienceAlertCount={
          aggregationCompleteness.attentionComplete &&
          (experienceScreenState === "ready" ||
            experienceScreenState === "refreshing")
            ? (companyControlPanelVm?.companyStateAggregation
                ?.experienceAlertCount ?? experienceAlertCount)
            : null
        }
        aggregationCompleteness={aggregationCompleteness}
        workMapFindingCount={workMapProgress?.findings?.length ?? 0}
      />
      <OfficialControlPanelModeSwitch
        mode={mode}
        view={view}
        onModeChange={handleModeChange}
        onViewChange={handleViewChange}
        onExperienceViewChange={handleExperienceViewChange}
      />
      {!experienceMode ? (
        <>
          <SupportProcessAxis
            axis={supportProcessAxis}
            screenState={supportProcessScreenState}
            requestId={supportProcessRequestId}
            onSelectProcess={selectProcess}
            onRetry={retrySupportProcesses}
          />
          {clientView === "monitoring" && context.status === "active" ? (
            <div className={styles.monitoringXyRow}>
              <CoreMilestoneRail
                axis={coreMilestoneAxis}
                screenState={coreMilestoneScreenState}
                requestId={coreMilestoneRequestId}
                onSelectMilestone={selectMilestone}
                onRetry={retryCoreMilestones}
              />
              <XyInteractionMatrix
                processCode={effectiveProcessCode}
                milestoneCode={effectiveMilestoneCode}
              />
              <div className={styles.monitoringMilestoneOverview}>
                <h2
                  className={styles.workspaceTitle}
                  id="client-company-workspace-heading"
                >
                  {viewCopy.title}
                </h2>
                <CoreMilestoneDetail axis={coreMilestoneAxis} />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      <div
        className={[
          experienceMode ? styles.matrixExperience : styles.matrix,
          clientView !== "governance" ? styles.matrixWithoutAttention : "",
          !experienceMode &&
          clientView === "monitoring" &&
          context.status === "active"
            ? styles.matrixWithoutRail
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-testid={
          experienceMode ? "experience-matrix-layout" : "client-matrix-layout"
        }
      >
        {!experienceMode &&
        !(clientView === "monitoring" && context.status === "active") ? (
          <CoreMilestoneRail
            axis={coreMilestoneAxis}
            screenState={coreMilestoneScreenState}
            requestId={coreMilestoneRequestId}
            onSelectMilestone={selectMilestone}
            onRetry={retryCoreMilestones}
          />
        ) : null}
        <section
          className={[
            styles.workspace,
            clientView === "monitoring" && context.status === "active"
              ? styles.workspaceMonitoringFlat
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-labelledby="client-company-workspace-heading"
        >
          {context.errorKind === "context" ? (
            <PanelForbiddenState />
          ) : experienceMode ? (
            <ExperienceGovernanceMode
              view={experienceView}
              onViewChange={handleExperienceViewChange}
              state={experienceState}
              screenState={experienceScreenState}
              requestId={experienceRequestId}
              sourceObservedAt={experienceFreshness?.sourceObservedAt ?? null}
              mutationSafety={experienceMutationSafety}
              companyStateProjection={companyStateProjection}
              onRetry={retryExperience}
              onSubmitAction={submitExperienceAction}
            />
          ) : (
            <>
              {clientView === "monitoring" && context.status === "active" ? null : (
                <h2
                  className={styles.workspaceTitle}
                  id="client-company-workspace-heading"
                >
                  {viewCopy.title}
                </h2>
              )}
              <div
                role="tabpanel"
                id={`official-panel-panel-${clientView}`}
                aria-labelledby={`official-panel-view-${clientView}`}
              >
                {clientView === "monitoring" && context.status === "active" ? (
                  <div className={styles.monitoringStack}>
                    <SupportProcessWorkspaceSummary
                      axis={supportProcessAxis}
                      collapsed
                    />
                    <CaseParticipantsPanel
                      viewModel={participantsView}
                      participantMonitoringVMs={participantMonitoringVMs}
                      workMapProgress={workMapProgress}
                      userIndicatorMatrix={userIndicatorMatrix}
                      userIndicatorMatrixLoading={userIndicatorMatrixLoading}
                      userIndicatorMatrixRefreshing={userIndicatorMatrixRefreshing}
                      userIndicatorMatrixError={userIndicatorMatrixError}
                      onRetryUserIndicatorMatrix={retryUserIndicatorMatrix}
                      screenState={participantsScreenState}
                      onToggleParticipant={toggleParticipant}
                      onSelectProfile={selectProfile}
                      onSelectSession={selectSession}
                      onSelectActivity={selectActivity}
                      onRetry={retryParticipants}
                      accessToken={accessToken}
                      caseId={context.selectedCase?.id ?? null}
                    />
                    <ParallelProductionPanel
                      state={parallelProductionState}
                      screenState={parallelProductionScreenState}
                      requestId={parallelProductionRequestId}
                      caseId={context.selectedCase?.id ?? null}
                      accessToken={accessToken}
                      onRetry={retryParallelProduction}
                    />
                  </div>
                ) : clientView === "tracking" && context.status === "active" ? (
                  <ManualWorkPanel
                    state={manualWorkState}
                    screenState={manualWorkScreenState}
                    requestId={manualWorkRequestId}
                    mutationSafety={manualWorkMutationSafety}
                    onRetry={retryManualWork}
                    onSubmitAction={submitManualWorkAction}
                    onDownloadPackage={downloadManualPackage}
                    submitting={manualWorkSubmitting}
                  />
                ) : clientView === "governance" &&
                  context.status === "active" ? (
                  <ParallelProductionPanel
                    state={parallelProductionState}
                    screenState={parallelProductionScreenState}
                    requestId={parallelProductionRequestId}
                    caseId={context.selectedCase?.id ?? null}
                    accessToken={accessToken}
                    onRetry={retryParallelProduction}
                  />
                ) : (
                  <NonProcessWorkspace
                    view={clientView}
                    status={context.status}
                    caseLabel={context.selectedCase?.label}
                    errorKind={context.errorKind}
                  />
                )}
              </div>
            </>
          )}
        </section>
        {clientView === "governance" ? (
          <AttentionGovernancePanel
            status={context.status}
            view={clientView}
            caseLabel={context.selectedCase?.label}
            errorKind={context.errorKind}
            companyStateLabel={
              reconciledCompanyStateProjection.currentStatusLabel
            }
            manualOverdueAlerts={manualOverdueAlerts}
            parallelProductionAlerts={parallelProductionAlerts}
            companyAlerts={unifiedAttentionAlerts}
            attentionComplete={aggregationCompleteness.attentionComplete}
            sourceStates={{
              experience: experienceScreenState,
              manualWork: manualWorkScreenState,
              parallelProduction: parallelProductionScreenState,
            }}
            onRetryExperience={retryExperience}
            onRetryManualWork={retryManualWork}
            onRetryParallelProduction={retryParallelProduction}
            onOpenTrajectory={() =>
              pushNavigation({
                mode: "user-experience-governance",
                view: "journeys",
              })
            }
            onOpenSupport={() =>
              pushNavigation({
                mode: "user-experience-governance",
                view: "support",
              })
            }
          />
        ) : null}
      </div>
    </ShellLayout>
    </RuntimeControlStateProvider>
  );
}

function NonProcessWorkspace({
  view,
  status,
  caseLabel,
  errorKind,
}: {
  view: ClientCompanyView;
  status: ClientContextStatus;
  caseLabel?: string | null;
  errorKind?: ClientContextErrorKind | null;
}) {
  const copy = presentClientContextShellCopy({
    status,
    view,
    caseLabel,
    errorKind,
  });

  return (
    <div className={styles.workspaceEmptyState} role="status">
      <p className={styles.workspaceEmptyTitle}>{copy.workspaceTitle}</p>
      <p className={styles.workspaceEmptyMessage}>{copy.workspaceMessage}</p>
    </div>
  );
}

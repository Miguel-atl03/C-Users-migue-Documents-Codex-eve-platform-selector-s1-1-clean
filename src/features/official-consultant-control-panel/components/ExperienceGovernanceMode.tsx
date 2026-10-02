"use client";

import { useState } from "react";

import styles from "../styles/official-control-panel.module.css";
import type { ExperienceGovernanceView } from "../types/official-control-panel.types";
import { EXPERIENCE_GOVERNANCE_VIEW_COPY } from "../types/official-control-panel.types";
import type { ExperienceLoadState } from "../hooks/use-case-experience-state";
import type { CompanyStateSurfaceProjection } from "../presentation/company-state-presentation";
import type {
  ExperienceActionType,
  ExperienceScreenKey,
  ExperienceSupportQueueItemView,
} from "@/services/eve/official-control-panel/official-control-panel-experience.types";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import type { MutationSafety } from "../state/official-panel-mutation-safety";
import { EXPERIENCE_MODE_INTRO } from "../presentation/experience-governance-presentation";
import { ExperienceTabs } from "./ExperienceTabs";
import { UserJourneyMatrix } from "./UserJourneyMatrix";
import { SupportQueue } from "./SupportQueue";
import { ScreenHealthPanel } from "./ScreenHealthPanel";
import { SupportActionDrawer } from "./SupportActionDrawer";
import { PanelScreenStateChrome } from "./PanelScreenStateChrome";
import { resolveCapabilityAllowed } from "@/services/eve/official-control-panel/official-control-panel-capability-catalog";
import type { CapabilityVM } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import type { SupportActionSubmitInput } from "./SupportActionDrawer";

type ExperienceGovernanceModeProps = {
  view: ExperienceGovernanceView;
  onViewChange: (view: ExperienceGovernanceView) => void;
  state: ExperienceLoadState;
  screenState: OfficialPanelScreenState;
  requestId?: string | null;
  sourceObservedAt?: string | null;
  mutationSafety: MutationSafety;
  companyStateProjection: CompanyStateSurfaceProjection;
  onRetry: () => void;
  onSubmitAction: (input: SupportActionSubmitInput) => Promise<void>;
};

export function ExperienceGovernanceMode({
  view,
  onViewChange,
  state,
  screenState,
  requestId,
  sourceObservedAt,
  mutationSafety,
  companyStateProjection,
  onRetry,
  onSubmitAction,
}: ExperienceGovernanceModeProps) {
  const [selected, setSelected] =
    useState<ExperienceSupportQueueItemView | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const copy = EXPERIENCE_GOVERNANCE_VIEW_COPY[view];

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
  };

  const openDrawer = (item: ExperienceSupportQueueItemView) => {
    if (mutationSafety.mutationsBlocked) return;
    setSelected(item);
    setDrawerOpen(true);
  };

  const blocking =
    screenState === "loading" ||
    screenState === "fatal" ||
    screenState === "forbidden" ||
    screenState === "not_found";

  const showContent =
    !blocking &&
    state.status === "ready" &&
    (screenState === "ready" ||
      screenState === "refreshing" ||
      screenState === "partial" ||
      screenState === "stale");

  const capabilityMatrix: CapabilityVM[] =
    state.status === "ready" ? (state.data.capabilities ?? []) : [];
  const canGovernSupport =
    resolveCapabilityAllowed(capabilityMatrix, "send_support_message") &&
    !mutationSafety.mutationsBlocked;

  return (
    <section
      className={styles.experienceMode}
      data-testid="experience-governance-mode"
      data-screen-state={screenState}
      aria-labelledby="experience-governance-heading"
    >
      <h2
        className={styles.workspaceTitle}
        id="experience-governance-heading"
      >
        Gobernanza de Experiencia del Usuario
      </h2>
      <p className={styles.manualWorkIntro}>{EXPERIENCE_MODE_INTRO}</p>
      <ExperienceTabs view={view} onViewChange={onViewChange} />
      <h3 className={styles.manualWorkTitle}>{copy.title}</h3>

      <PanelScreenStateChrome
        screenState={screenState}
        requestId={requestId}
        sourceObservedAt={sourceObservedAt}
        onRetry={onRetry}
      />

      {showContent && state.status === "ready" ? (
        <>
          <p
            className={styles.workspaceEmptyMessage}
            data-testid="experience-company-state"
          >
            Estado Empresa Cliente: {companyStateProjection.currentStatusLabel}
          </p>

          {view === "journeys" ? (
            <UserJourneyMatrix
              users={state.data.data?.users ?? []}
              emptyMessage={
                state.data.data?.emptyMessage ?? copy.emptyMessage
              }
            />
          ) : null}

          {view === "support" ? (
            <SupportQueue
              items={state.data.data?.supportQueue ?? []}
              emptyMessage={copy.emptyMessage}
              onSelectItem={canGovernSupport ? openDrawer : undefined}
            />
          ) : null}

          {view === "screen_health" ? (
            <ScreenHealthPanel
              screens={state.data.data?.screensHealth ?? []}
              emptyMessage={copy.emptyMessage}
            />
          ) : null}

          <SupportActionDrawer
            open={drawerOpen && Boolean(selected)}
            item={selected}
            capabilities={capabilityMatrix}
            mutationsBlocked={mutationSafety.mutationsBlocked}
            mutationBlockReason={mutationSafety.blockReason}
            onClose={closeDrawer}
            onSubmit={onSubmitAction}
          />
          <button
            type="button"
            className={styles.srOnly}
            data-testid="panel-soft-refresh"
            onClick={onRetry}
          >
            Actualizar información
          </button>
        </>
      ) : null}
    </section>
  );
}

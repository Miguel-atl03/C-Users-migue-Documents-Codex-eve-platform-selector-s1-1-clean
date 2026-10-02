"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import styles from "../styles/official-control-panel.module.css";
import {
  monitoringTableRowsToParticipantListItems,
  presentParticipantMonitoringTableRows,
} from "../presentation/participant-monitoring-from-vm";
import type {
  FunctionalProfileListItem,
  ParticipantProfileViewModel,
} from "../types/participant-profile.types";
import { ActivityRuntimePanel } from "./ActivityRuntimePanel";
import { MonitoringActivitiesPanel } from "./MonitoringActivitiesPanel";
import { PanelScreenStateChrome } from "./PanelScreenStateChrome";
import { resolveRuntimeAvailability } from "../presentation/runtime-availability";
import type {
  OfficialPanelScreenState,
  ParticipantMonitoringVM,
} from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import type { CaseUserIndicatorMatrix } from "@/services/eve/official-control-panel/official-control-panel-user-indicator-matrix.types";
import type { WorkMapProgressView } from "@/services/eve/official-control-panel/official-control-panel-workmap-progress.types";
import type { ActivitySelectionConformanceView } from "@/services/eve/official-control-panel/official-control-panel-activity-selection.types";
import { getActivitySelectionConformance } from "../data/client-context-api";

type CaseParticipantsPanelProps = {
  viewModel: ParticipantProfileViewModel;
  participantMonitoringVMs: ParticipantMonitoringVM[];
  workMapProgress?: WorkMapProgressView | null;
  userIndicatorMatrix?: CaseUserIndicatorMatrix | null;
  userIndicatorMatrixLoading?: boolean;
  userIndicatorMatrixRefreshing?: boolean;
  userIndicatorMatrixError?: boolean;
  screenState?: OfficialPanelScreenState;
  onToggleParticipant: (participantId: string) => void;
  onSelectProfile: (participantId: string, profileId: string | null) => void;
  onSelectSession?: (sessionId: string | null) => void;
  onSelectActivity?: (activityId: string | null) => void;
  onRetry?: () => void;
  onRetryUserIndicatorMatrix?: () => void;
  accessToken?: string | null;
  caseId?: string | null;
};

const PANEL_TITLE = "Usuarios del caso";
const USER_INDICATOR_MATRIX_USER_SLOTS = 20;

type UserIndicatorCell = {
  value: string;
  title: string;
  status?: "positive" | "negative";
};

export function CaseParticipantsPanel({
  viewModel,
  participantMonitoringVMs,
  workMapProgress = null,
  userIndicatorMatrix = null,
  userIndicatorMatrixLoading = false,
  userIndicatorMatrixRefreshing = false,
  userIndicatorMatrixError = false,
  screenState = "ready",
  onToggleParticipant,
  onSelectSession,
  onSelectActivity,
  onRetry,
  onRetryUserIndicatorMatrix,
  accessToken = null,
  caseId = null,
}: CaseParticipantsPanelProps) {
  const workMapParticipantExpanded =
    Boolean(viewModel.expandedParticipantId) &&
    Boolean(workMapProgress?.workmap.activitiesCount);
  const runtimeAvailability = resolveRuntimeAvailability(viewModel);
  const workMapPendingRuntime =
    workMapParticipantExpanded &&
    workMapProgress?.runtime?.status !== "active";
  const runtimePrepared =
    workMapParticipantExpanded && workMapProgress?.runtime?.status === "prepared"
      ? {
          sessionCount: workMapProgress.runtime.runId ? 1 : 0,
          runCount: workMapProgress.runtime.preparedRunCount ?? 0,
          startedRunCount: workMapProgress.runtime.startedRunCount ?? 0,
        }
      : null;
  const matrixRuntimeSummary = resolveMatrixRuntimeSummary(userIndicatorMatrix);
  const matrixScope = resolveMatrixScope(viewModel, accessToken, caseId);

  const tableRows = useMemo(
    () => presentParticipantMonitoringTableRows(participantMonitoringVMs),
    [participantMonitoringVMs],
  );

  const profileCountByParticipantId = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of viewModel.participants) map.set(p.id, p.profileCount);
    return map;
  }, [viewModel.participants]);

  const participantsFromVm = useMemo(
    () =>
      monitoringTableRowsToParticipantListItems(
        tableRows,
        profileCountByParticipantId,
      ),
    [tableRows, profileCountByParticipantId],
  );

  return (
    <section
      className={styles.participantsPanel}
      aria-labelledby="participants-panel-heading"
      data-testid="recursive-monitoring-users"
      data-screen-state={screenState}
    >
      <PanelScreenStateChrome screenState={screenState} onRetry={onRetry} />
      <ParticipantsContent
        viewModel={viewModel}
        participantsFromVm={participantsFromVm}
        tableRows={tableRows}
        workMapProgress={workMapProgress}
        userIndicatorMatrix={userIndicatorMatrix}
        userIndicatorMatrixLoading={userIndicatorMatrixLoading}
        userIndicatorMatrixRefreshing={userIndicatorMatrixRefreshing}
        userIndicatorMatrixError={userIndicatorMatrixError}
        onToggleParticipant={onToggleParticipant}
        onSelectSession={onSelectSession}
        onSelectActivity={onSelectActivity}
        onRetry={onRetry}
        onRetryUserIndicatorMatrix={onRetryUserIndicatorMatrix}
        accessToken={accessToken}
        caseId={caseId}
      />

      {runtimeAvailability ? (
        <ActivityRuntimePanel
          availability={runtimeAvailability}
          workMapPendingRuntime={workMapPendingRuntime}
          runtimePrepared={runtimePrepared}
          matrixRuntimeSummary={matrixRuntimeSummary}
          matrixScope={matrixScope}
        />
      ) : null}
    </section>
  );
}

function resolveMatrixRuntimeSummary(matrix: CaseUserIndicatorMatrix | null) {
  const user = matrix?.users.find((candidate) => candidate.currentRuntimeRunState);
  if (!user) return null;
  return {
    runState: user.currentRuntimeRunState,
    blockLabel: user.currentRuntimeBlockLabel,
    activityOrdinal: user.currentRuntimeActivityOrdinal ?? null,
    activityTotal: user.currentRuntimeActivityTotal ?? null,
    b0InteractionCount: user.b0InteractionCount ?? null,
    b0ConfirmedInteractionCount: user.b0ConfirmedInteractionCount ?? null,
    b0SubfieldCount: user.b0SubfieldCount ?? null,
    b0EvidenceCount: user.b0EvidenceCount ?? null,
    b0CanonicalVariableCount: user.b0CanonicalVariableCount ?? null,
  };
}

function resolveMatrixScope(
  viewModel: ParticipantProfileViewModel,
  accessToken: string | null,
  caseId: string | null,
) {
  if (!accessToken || !caseId) return null;
  const participantId = viewModel.selectedParticipant?.id ?? null;
  const profileId = viewModel.selectedProfile?.id ?? null;
  const sessionId = viewModel.selectedSessionId;
  const activityId = viewModel.selectedActivityId;
  if (!participantId || !profileId || !sessionId || !activityId) return null;
  const runRow = viewModel.activities.find(
    (row) => row.activityId === activityId,
  );
  const runId = runRow?.runId ?? null;
  if (!runId) return null;
  return {
    accessToken,
    caseId,
    participantId,
    profileId,
    sessionId,
    activityId,
    runId,
  };
}

function ParticipantsContent({
  viewModel,
  participantsFromVm,
  tableRows,
  workMapProgress,
  userIndicatorMatrix,
  userIndicatorMatrixLoading,
  userIndicatorMatrixRefreshing,
  userIndicatorMatrixError,
  onToggleParticipant,
  onSelectSession,
  onSelectActivity,
  onRetry,
  onRetryUserIndicatorMatrix,
  accessToken,
  caseId,
}: {
  viewModel: ParticipantProfileViewModel;
  participantsFromVm: ReturnType<
    typeof monitoringTableRowsToParticipantListItems
  >;
  tableRows: ReturnType<typeof presentParticipantMonitoringTableRows>;
  workMapProgress: WorkMapProgressView | null;
  userIndicatorMatrix: CaseUserIndicatorMatrix | null;
  userIndicatorMatrixLoading: boolean;
  userIndicatorMatrixRefreshing: boolean;
  userIndicatorMatrixError: boolean;
  onToggleParticipant: (participantId: string) => void;
  onSelectSession?: (sessionId: string | null) => void;
  onSelectActivity?: (activityId: string | null) => void;
  onRetry?: () => void;
  onRetryUserIndicatorMatrix?: () => void;
  accessToken: string | null;
  caseId: string | null;
}) {
  if (viewModel.status === "idle") {
    return <ParticipantsEmpty title={viewModel.emptyTitle} message={viewModel.emptyMessage} />;
  }

  if (viewModel.status === "loading-participants") {
    return (
      <>
        <PanelHeading />
        <p className={styles.workspaceEmptyMessage} role="status">
          Cargando personas participantes...
        </p>
      </>
    );
  }

  if (viewModel.status === "error") {
    return (
      <>
        <PanelHeading />
        <div className={styles.manualWorkError} role="alert">
          <p className={styles.workspaceEmptyTitle}>Error tecnico</p>
          <p className={styles.workspaceEmptyMessage}>
            {viewModel.errorMessage ?? viewModel.emptyMessage}
          </p>
          {onRetry ? (
            <button
              type="button"
              className={styles.contextRetryButton}
              onClick={onRetry}
            >
              Reintentar
            </button>
          ) : null}
        </div>
      </>
    );
  }

  if (
    viewModel.status === "empty" ||
    (tableRows.length === 0 && participantsFromVm.length === 0)
  ) {
    return (
      <ParticipantsEmpty
        title="Sin participantes"
        message="Este caso no tiene personas participantes registradas."
      />
    );
  }

  const selectedWorkMapMatches =
    Boolean(viewModel.expandedParticipantId) &&
    Boolean(workMapProgress?.workmap.activitiesCount);

  return (
    <>
      <PanelHeading />
      <p className={styles.monitoringDepthHint} role="note">
        Monitoreo recursivo: usuario - rol funcional - actividad
      </p>
      <UserIndicatorMatrix
        matrix={userIndicatorMatrix}
        loading={userIndicatorMatrixLoading}
        refreshing={userIndicatorMatrixRefreshing}
        error={userIndicatorMatrixError}
        expandedParticipantId={viewModel.expandedParticipantId}
        onRetry={onRetryUserIndicatorMatrix}
      />
      <ParticipantsMonitoringTable
        rows={tableRows}
        participants={participantsFromVm}
        userIndicatorMatrix={userIndicatorMatrix}
        workMapProgress={workMapProgress}
        expandedParticipantId={viewModel.expandedParticipantId}
        selectedProfile={viewModel.selectedProfile}
        onOpenParticipant={onToggleParticipant}
      />

      {selectedWorkMapMatches && workMapProgress ? (
        <WorkMapActivityDrilldown
          progress={workMapProgress}
          selectedActivityId={viewModel.selectedActivityId}
          onSelectActivity={onSelectActivity ?? (() => undefined)}
          accessToken={accessToken}
          caseId={caseId}
        />
      ) : viewModel.selectedProfile ? (
          <MonitoringActivitiesPanel
            profileLabel={viewModel.selectedProfile.label}
            activities={viewModel.activities}
            loading={viewModel.activitiesLoading}
            error={viewModel.activitiesError}
            message={viewModel.activitiesMessage}
            linkStatus={viewModel.activitiesLinkStatus}
            sessions={viewModel.sessions}
            selectedSessionId={viewModel.selectedSessionId}
            onSelectSession={onSelectSession}
          />
      ) : null}
    </>
  );
}

function PanelHeading() {
  return (
    <h3 className={styles.participantsPanelTitle} id="participants-panel-heading">
      {PANEL_TITLE}
    </h3>
  );
}

function ParticipantsEmpty({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <>
      <PanelHeading />
      <div className={styles.workspaceEmpty} role="status">
        <p className={styles.workspaceEmptyTitle}>{title}</p>
        <p className={styles.workspaceEmptyMessage}>{message}</p>
      </div>
    </>
  );
}

function UserIndicatorMatrix({
  matrix,
  loading,
  refreshing,
  error,
  expandedParticipantId,
  onRetry,
}: {
  matrix: CaseUserIndicatorMatrix | null;
  loading: boolean;
  refreshing: boolean;
  error: boolean;
  expandedParticipantId: string | null;
  onRetry?: () => void;
}) {
  if (loading && !matrix) {
    return (
      <p className={styles.workspaceEmptyMessage} role="status">
        Cargando matriz de usuarios...
      </p>
    );
  }

  if (error && !matrix) {
    return (
      <div className={styles.manualWorkError} role="alert">
        <p className={styles.workspaceEmptyTitle}>
          No fue posible cargar la matriz de usuarios.
        </p>
        {onRetry ? (
          <button
            type="button"
            className={styles.contextRetryButton}
            onClick={onRetry}
          >
            Reintentar
          </button>
        ) : null}
      </div>
    );
  }

  if (!matrix || matrix.users.length === 0) {
    return (
      <div className={styles.workspaceEmpty} role="status">
        <p className={styles.workspaceEmptyTitle}>Sin participantes</p>
        <p className={styles.workspaceEmptyMessage}>
          Este caso no tiene participantes funcionales activos.
        </p>
      </div>
    );
  }

  const rows: Array<{
    label: string;
    total: string;
    cells: UserIndicatorCell[];
  }> = [
    {
      label: "WorkMaps guardados",
      total: String(matrix.workMapsSaved.total),
      cells: matrix.users.map((user) =>
        formatBooleanCell(matrix.workMapsSaved.byParticipant[user.participantId]),
      ),
    },
    {
      label: "Elegibles",
      total: formatNumberValue(
        matrix.users.reduce(
          (total, user) => total + (user.eligibleActivityCount ?? 0),
          0,
        ),
      ),
      cells: matrix.users.map((user) =>
        formatNumberCell(user.eligibleActivityCount),
      ),
    },
    {
      label: "Primarias",
      total: formatNumberValue(matrix.primarySelections.total),
      cells: matrix.users.map((user) =>
        formatNumberCell(
          user.selectedPrimaryCount ??
            matrix.primarySelections.byParticipant[user.participantId],
        ),
      ),
    },
    {
      label: "No primarias",
      total: formatNumberValue(
        matrix.users.reduce(
          (total, user) => total + (user.nonPrimaryContextCount ?? 0),
          0,
        ),
      ),
      cells: matrix.users.map((user) =>
        formatNumberCell(user.nonPrimaryContextCount),
      ),
    },
    {
      label: "Runtime en ejecución",
      total: String(matrix.runtimesStarted.total),
      cells: matrix.users.map((user) =>
        formatBooleanCell(
          matrix.runtimesStarted.byParticipant[user.participantId],
        ),
      ),
    },
    {
      label: "Sesiones Runtime preparadas",
      total: String(matrix.runtimesPrepared.totalSessions),
      cells: matrix.users.map((user) =>
        formatNumberCell(
          matrix.runtimesPrepared.sessionsByParticipant[user.participantId],
        ),
      ),
    },
    {
      label: "Runs preparados",
      total: String(matrix.runtimesPrepared.totalRuns),
      cells: matrix.users.map((user) =>
        formatNumberCell(
          matrix.runtimesPrepared.runsByParticipant[user.participantId],
        ),
      ),
    },
    {
      label: "Actividad actual",
      total: "—",
      cells: matrix.users.map((user) => formatCurrentActivityCell(user)),
    },
    {
      label: "Última interacción",
      total: "—",
      cells: matrix.users.map((user) => formatLastB0Cell(user)),
    },
    {
      label: "Participantes con atención",
      total: String(matrix.participantsWithAttention.total),
      cells: matrix.users.map((user) =>
        formatBooleanCell(
          matrix.participantsWithAttention.byParticipant[user.participantId],
        ),
      ),
    },
  ];
  const userSlots = Array.from(
    { length: USER_INDICATOR_MATRIX_USER_SLOTS },
    (_, index) => matrix.users[index] ?? null,
  );

  return (
    <div
      className={styles.userIndicatorMatrixScroll}
      data-testid="user-indicator-matrix"
      data-refreshing={refreshing ? "true" : "false"}
      style={
        {
          "--case-user-count": matrix.users.length,
        } as CSSProperties
      }
    >
      <table
        className={styles.userIndicatorMatrixTable}
        aria-label="Matriz horizontal de usuarios del caso"
      >
        <colgroup>
          <col className={styles.userIndicatorMatrixMetricCol} />
          <col className={styles.userIndicatorMatrixTotalCol} />
          {userSlots.map((user, index) => (
            <col
              key={user?.participantId ?? `empty-user-slot-${index}`}
              className={styles.userIndicatorMatrixUserCol}
            />
          ))}
        </colgroup>
        <tbody>
          <tr>
            <th scope="row" className={styles.userIndicatorMatrixMetric}>
              Total de participantes
            </th>
            <td className={styles.userIndicatorMatrixTotal}>
              {matrix.totalParticipants}
            </td>
            {userSlots.map((user, index) => (
              <td
                key={user?.participantId ?? `empty-user-name-${index}`}
                className={styles.userIndicatorMatrixNameCell}
              >
                {user ? (
                  <span
                  className={styles.userIndicatorMatrixName}
                  title={`case_participant_id: ${user.participantId}`}
                  aria-current={
                    expandedParticipantId === user.participantId
                      ? "true"
                      : undefined
                  }
                >
                  <span>{user.displayName}</span>
                  </span>
                ) : null}
              </td>
            ))}
          </tr>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className={styles.userIndicatorMatrixMetric}>
                {row.label}
              </th>
              <td className={styles.userIndicatorMatrixTotal}>{row.total}</td>
              {userSlots.map((user, index) => {
                const cell = user ? row.cells[index] : null;
                return (
                <td
                  key={`${row.label}-${user?.participantId ?? index}`}
                  className={styles.userIndicatorMatrixValue}
                  title={cell?.title}
                  aria-label={cell ? `${row.label}: ${cell.title}` : undefined}
                >
                  {cell?.status ? (
                    <span
                      className={[
                        styles.userIndicatorStatusDot,
                        cell.status === "positive"
                          ? styles.userIndicatorStatusDotPositive
                          : styles.userIndicatorStatusDotNegative,
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  ) : (
                    cell?.value ?? ""
                  )}
                </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParticipantsMonitoringTable({
  rows,
  participants,
  userIndicatorMatrix,
  workMapProgress,
  expandedParticipantId,
  selectedProfile,
  onOpenParticipant,
}: {
  rows: ReturnType<typeof presentParticipantMonitoringTableRows>;
  participants: ReturnType<typeof monitoringTableRowsToParticipantListItems>;
  userIndicatorMatrix: CaseUserIndicatorMatrix | null;
  workMapProgress: WorkMapProgressView | null;
  expandedParticipantId: string | null;
  selectedProfile: FunctionalProfileListItem | null;
  onOpenParticipant: (participantId: string) => void;
}) {
  const matrixUsers = userIndicatorMatrix?.users ?? [];
  if (rows.length === 0 && matrixUsers.length === 0) return null;

  const participantById = new Map(
    participants.map((participant) => [participant.id, participant]),
  );
  const rowById = new Map(rows.map((row) => [row.participantId, row]));
  const matrixUserById = new Map(
    matrixUsers.map((user) => [user.participantId, user]),
  );
  const tableParticipantIds =
    matrixUsers.length > 0
      ? matrixUsers.map((user) => user.participantId)
      : rows.map((row) => row.participantId);

  return (
    <div
      className={styles.monitoringUsersScroll}
      data-testid="participants-monitoring-table"
    >
      <table className={styles.monitoringUsersTable}>
        <thead>
          <tr>
            <th scope="col">Usuario</th>
            <th scope="col">Puesto declarado</th>
            <th scope="col">Rol funcional</th>
            <th scope="col">Etapa actual</th>
            <th scope="col">Responsabilidades</th>
            <th scope="col">Actividades</th>
            <th scope="col">Elegibles</th>
            <th scope="col">Primarias</th>
            <th scope="col">No primarias</th>
            <th scope="col">Atención</th>
            <th scope="col">Última interacción</th>
          </tr>
        </thead>
        <tbody>
          {tableParticipantIds.map((participantId) => {
            const row = rowById.get(participantId);
            const matrixUser = matrixUserById.get(participantId) ?? null;
            const participant = participantById.get(participantId);
            const sameWorkMapParticipant =
              workMapProgress?.participant?.id === participantId;
            const displayName =
              matrixUser?.displayName ?? row?.displayName ?? "Participante";
            const declaredPosition =
              matrixUser?.declaredPosition ??
              (sameWorkMapParticipant
                ? workMapProgress?.participant?.declaredPosition
                : null) ??
              participant?.declaredPosition ??
              "Pendiente";
            const profileLabel = resolveFunctionalProfileLabel(
              matrixUser,
              sameWorkMapParticipant ? workMapProgress : null,
              selectedProfile,
              participantId,
              expandedParticipantId,
            );
            const responsibilityCount =
              matrixUser?.responsibilityCount ??
              (sameWorkMapParticipant
                ? workMapProgress?.profileTrace?.responsibilitiesCount ??
                  workMapProgress?.workmap.responsibilitiesCount
                : null);
            const activityCount =
              matrixUser?.activityCount ??
              (sameWorkMapParticipant
                ? workMapProgress?.profileTrace?.activitiesCount ??
                  workMapProgress?.workmap.activitiesCount
                : null);
            const eligibleCount =
              matrixUser?.eligibleActivityCount ??
              (sameWorkMapParticipant
                ? workMapProgress?.selection?.eligibleCount ??
                  workMapProgress?.coverage.eligibleCount
                : null);
            const selectedPrimaryCount =
              matrixUser?.selectedPrimaryCount ??
              (sameWorkMapParticipant
                ? workMapProgress?.selection?.selectedPrimaryCount ??
                  workMapProgress?.coverage.selectedCount
                : null);
            const nonPrimaryContextCount =
              matrixUser?.nonPrimaryContextCount ??
              (sameWorkMapParticipant
                ? workMapProgress?.selection?.nonPrimaryContextCount ??
                  workMapProgress?.coverage.nonPrimaryContextCount
                : null);
            const attentionLabel =
              matrixUser?.attentionLabel ??
              row?.attentionLabel ??
              "Sin atención abierta";
            const stageLabel =
              matrixUser?.selectionStageLabel ??
              (sameWorkMapParticipant
                ? workMapProgress?.selection?.stageLabel
                : null) ??
              row?.journeyStageLabel ??
              "No iniciado";
            const selectionPolicyVersion =
              matrixUser?.selectionPolicyVersion ??
              (sameWorkMapParticipant
                ? workMapProgress?.selection?.policyVersion
                : null);
            const lastScreenLabel =
              matrixUser?.lastScreenLabel ??
              (sameWorkMapParticipant
                ? workMapProgress?.lastScreen.screenKey ??
                  "Instrumentación de pantalla pendiente"
                : null) ??
              formatLastInteraction(row?.lastActivityAt ?? null);
            const runtimeTraceLabel =
              matrixUser && matrixUser.b0ConfirmedInteractionCount != null
                ? `${lastScreenLabel}; ${matrixUser.b0ConfirmedInteractionCount}/4 interacciones, ${matrixUser.b0SubfieldCount ?? 0} subcampos, ${matrixUser.b0EvidenceCount ?? 0} evidencias, ${matrixUser.b0CanonicalVariableCount ?? 0} variables`
                : lastScreenLabel;
            return (
              <tr
                key={participantId}
                data-participant-id={participantId}
                className={
                  expandedParticipantId === participantId
                    ? styles.monitoringUserRowSelected
                    : undefined
                }
              >
                <th scope="row">
                  <button
                    type="button"
                    className={styles.monitoringUserSelect}
                    onClick={() => onOpenParticipant(participantId)}
                  >
                    {displayName}
                  </button>
                </th>
                <td>{declaredPosition}</td>
                <td>{profileLabel}</td>
                <td>
                  <span>{stageLabel}</span>
                  {selectionPolicyVersion ? (
                    <span
                      className={styles.monitoringDepthHint}
                      style={{ display: "block" }}
                    >
                      Política {selectionPolicyVersion}
                    </span>
                  ) : null}
                </td>
                <td>{formatCountOrDash(responsibilityCount)}</td>
                <td>{formatCountOrDash(activityCount)}</td>
                <td>{formatCountOrDash(eligibleCount)}</td>
                <td>{formatCountOrDash(selectedPrimaryCount)}</td>
                <td>{formatCountOrDash(nonPrimaryContextCount)}</td>
                <td>{attentionLabel}</td>
                <td>{runtimeTraceLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatLastInteraction(value: string | null) {
  if (!value) return "No disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function resolveFunctionalProfileLabel(
  matrixUser: CaseUserIndicatorMatrix["users"][number] | null,
  workMapProgress: WorkMapProgressView | null,
  selectedProfile: FunctionalProfileListItem | null,
  participantId: string,
  expandedParticipantId: string | null,
) {
  if (matrixUser?.functionalProfileId) {
    return matrixUser.functionalProfileLabel ?? "Perfil funcional materializado";
  }
  if (workMapProgress?.functionalProfile?.id) {
    return workMapProgress.functionalProfile.label ?? "Perfil funcional materializado";
  }
  const declaredArea =
    matrixUser?.declaredArea ?? workMapProgress?.functionalProfile?.label ?? null;
  if (declaredArea) return `Área declarada: ${declaredArea}; perfil funcional pendiente`;
  if (participantId === expandedParticipantId && selectedProfile) {
    return selectedProfile.label;
  }
  return "Pendiente de materialización";
}

function formatCountOrDash(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "—";
}

function formatBooleanCell(value: boolean | null | undefined): UserIndicatorCell {
  if (value === true) return { value: "", title: "Sí", status: "positive" };
  if (value === false) return { value: "", title: "No", status: "negative" };
  return { value: "—", title: "Fuente no resuelta" };
}

function formatNumberCell(value: number | null | undefined): UserIndicatorCell {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { value: String(value), title: `${value} actividades` };
  }
  return { value: "—", title: "Resultado pendiente o no materializado" };
}

function formatCurrentActivityCell(
  user: CaseUserIndicatorMatrix["users"][number],
): UserIndicatorCell {
  if (
    typeof user.currentRuntimeActivityOrdinal === "number" &&
    typeof user.currentRuntimeActivityTotal === "number"
  ) {
    const value = `${user.currentRuntimeActivityOrdinal}/${user.currentRuntimeActivityTotal}`;
    return {
      value,
      title: `Actividad actual ${value}; ${presentMatrixRuntimeState(user.currentRuntimeRunState)}`,
    };
  }
  return { value: "—", title: "Runtime pendiente" };
}

function formatLastB0Cell(
  user: CaseUserIndicatorMatrix["users"][number],
): UserIndicatorCell {
  if (user.b0ConfirmedInteractionCount != null) {
    return {
      value: user.currentRuntimeBlockLabel ?? "B0 pendiente",
      title: `${user.b0ConfirmedInteractionCount}/4 interacciones B0; ${user.b0ResponseCount ?? 0} respuestas; ${user.b0SubfieldCount ?? 0} subcampos; ${user.b0EvidenceCount ?? 0} evidencias; ${user.b0CanonicalVariableCount ?? 0} variables`,
    };
  }
  return { value: "—", title: "B0 pendiente" };
}

function presentMatrixRuntimeState(state: string | null) {
  if (state === "active_base_capture") return "Runtime en ejecución";
  if (state === "initialized") return "Runtime preparado";
  if (state === "blocked") return "Runtime bloqueado";
  if (!state) return "Runtime pendiente";
  return state;
}

function formatNumberValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : "—";
}

function WorkMapActivityDrilldown({
  progress,
  selectedActivityId,
  onSelectActivity,
  accessToken,
  caseId,
}: {
  progress: WorkMapProgressView;
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string | null) => void;
  accessToken: string | null;
  caseId: string | null;
}) {
  const [localSelectedActivityId, setLocalSelectedActivityId] = useState<
    string | null
  >(selectedActivityId);
  const effectiveSelectedActivityId =
    selectedActivityId ?? localSelectedActivityId;
  const selected =
    progress.activities.find(
      (activity) => activity.id === effectiveSelectedActivityId,
    ) ?? null;
  const selectedSelectionResultId = selected?.selectionResultId ?? null;
  const selectedSelectionResultItemId = selected?.selectionResultItemId ?? null;
  const profileFinding = primaryOperationalFinding(progress);
  const totalActivities =
    progress.activitiesPage?.total ?? progress.activities.length;
  const visibleActivityLimit = Math.min(10, totalActivities);
  const activitiesScrollRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const activityButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const lastDetailButtonRef = useRef<HTMLButtonElement | null>(null);
  const [activitiesScrollMaxHeight, setActivitiesScrollMaxHeight] = useState<
    number | null
  >(null);
  const [conformance, setConformance] =
    useState<ActivitySelectionConformanceView | null>(null);
  const [conformanceLoading, setConformanceLoading] = useState(false);
  const [conformanceError, setConformanceError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSelectedActivityId(selectedActivityId);
  }, [selectedActivityId]);

  useEffect(() => {
    if (!selected) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [selected]);

  useLayoutEffect(() => {
    const scrollNode = activitiesScrollRef.current;
    if (!scrollNode || progress.activities.length <= 10) {
      setActivitiesScrollMaxHeight(null);
      return;
    }

    const headerHeight =
      scrollNode.querySelector("thead")?.getBoundingClientRect().height ?? 0;
    const rows = Array.from(scrollNode.querySelectorAll("tbody tr")).slice(
      0,
      10,
    );
    const rowsHeight = rows.reduce(
      (total, row) => total + row.getBoundingClientRect().height,
      0,
    );
    setActivitiesScrollMaxHeight(Math.ceil(headerHeight + rowsHeight + 1));
  }, [progress.activities.length]);

  useEffect(() => {
    setConformance(null);
    setConformanceError(null);
    if (!selected || !accessToken || !caseId) return;
    if (!selectedSelectionResultId || !selectedSelectionResultItemId) {
      setConformanceError(
        "No verificable: la actividad no tiene identificador de resultado persistido.",
      );
      return;
    }

    const controller = new AbortController();
    setConformanceLoading(true);
    getActivitySelectionConformance(
      accessToken,
      caseId,
      selectedSelectionResultId,
      selectedSelectionResultItemId,
      controller.signal,
    )
      .then((value) => {
        setConformance(value);
        setConformanceError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setConformanceError("No fue posible cargar la conformidad persistida.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setConformanceLoading(false);
      });

    return () => controller.abort();
  }, [
    accessToken,
    caseId,
    effectiveSelectedActivityId,
    selectedSelectionResultId,
    selectedSelectionResultItemId,
  ]);

  const handleCloseActivityDetail = () => {
    setLocalSelectedActivityId(null);
    onSelectActivity(null);
    window.setTimeout(() => lastDetailButtonRef.current?.focus(), 0);
  };

  const handleToggleActivity = (activityId: string) => {
    const button = activityButtonRefs.current.get(activityId) ?? null;
    const nextActivityId =
      effectiveSelectedActivityId === activityId ? null : activityId;
    if (nextActivityId) {
      lastDetailButtonRef.current = button;
    }
    setLocalSelectedActivityId(nextActivityId);
    onSelectActivity(nextActivityId);
    if (!nextActivityId) {
      window.setTimeout(() => button?.focus(), 0);
    }
  };

  const handleDrawerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCloseActivityDetail();
      return;
    }
    if (event.key !== "Tab") return;
    const drawer = drawerRef.current;
    if (!drawer) return;
    const focusable = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("disabled") && element.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const activitiesScrollStyle: CSSProperties | undefined =
    activitiesScrollMaxHeight == null
      ? undefined
      : { maxHeight: `${activitiesScrollMaxHeight}px` };

  return (
    <section
      className={styles.monitoringActivitiesPanel}
      aria-labelledby="workmap-activity-drilldown-heading"
      data-testid="workmap-activity-drilldown"
    >
      <h4
        className={styles.monitoringActivitiesTitle}
        id="workmap-activity-drilldown-heading"
      >
        Actividades compactas - {progress.functionalProfile?.label ?? "rol funcional"}
      </h4>
      <p className={styles.workspaceEmptyMessage}>
        {visibleActivityLimit} de {totalActivities} visibles.
      </p>
      <ProfileConformanceSummary progress={progress} />
      <div
        ref={activitiesScrollRef}
        className={[
          styles.monitoringUsersScroll,
          styles.monitoringActivitiesScroll,
        ].join(" ")}
        style={activitiesScrollStyle}
      >
        <table className={styles.monitoringUsersTable}>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Actividad</th>
              <th scope="col">Estado</th>
              <th scope="col">Elegibilidad</th>
              <th scope="col">Selección</th>
              <th scope="col">Finding</th>
              <th scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {progress.activities.map((activity, index) => (
              <tr
                key={activity.id}
                className={
                  effectiveSelectedActivityId === activity.id
                    ? styles.monitoringUserRowSelected
                    : undefined
                }
              >
                <td>{index + 1}</td>
                <td>{summarizeActivity(activity.label)}</td>
                <td>{presentWorkMapActivityState(activity.state)}</td>
                <td>
                  {presentEligibility(activity.eligible, activity.classification)}
                </td>
                <td>{presentActivityClassification(activity.classification)}</td>
                <td>{activitySpecificFinding(progress, activity.id)?.title ?? "Sin finding particular"}</td>
                <td>
                  <button
                    ref={(element) => {
                      if (element) activityButtonRefs.current.set(activity.id, element);
                      else activityButtonRefs.current.delete(activity.id);
                    }}
                    type="button"
                    className={styles.contextRetryButton}
                    onClick={() => handleToggleActivity(activity.id)}
                  >
                    {effectiveSelectedActivityId === activity.id
                      ? "Cerrar"
                      : "Ver detalle"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <div className={styles.activityConformanceOverlay}>
          <button
            type="button"
            className={styles.activityConformanceBackdrop}
            aria-label="Cerrar detalle de actividad"
            onClick={handleCloseActivityDetail}
          />
          <article
            ref={drawerRef}
            className={styles.activityConformanceDrawer}
            data-testid="activity-conformance-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-conformance-drawer-title"
            aria-describedby="activity-conformance-drawer-description"
            onKeyDown={handleDrawerKeyDown}
          >
            <header className={styles.activityConformanceDrawerHeader}>
              <div>
                <p className={styles.workspaceEmptyMessage}>Detalle de actividad</p>
                <h5
                  id="activity-conformance-drawer-title"
                  className={styles.activitySelectionGroupTitle}
                >
                  {summarizeActivity(selected.label)}
                </h5>
                <p
                  id="activity-conformance-drawer-description"
                  className={styles.workspaceEmptyMessage}
                >
                  Perfil funcional: {progress.functionalProfile?.label ?? "Pendiente"} · Selección:{" "}
                  {presentActivityClassification(selected.classification)}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className={styles.contextRetryButton}
                onClick={handleCloseActivityDetail}
              >
                Cerrar
              </button>
            </header>
            <div
              className={styles.activityConformanceDrawerBody}
              data-testid="activity-conformance-drawer-body"
            >
              <dl className={styles.runtimeRunSummary}>
                <div>
                  <dt>Rol funcional</dt>
                  <dd>{progress.functionalProfile?.label ?? "Pendiente"}</dd>
                </div>
                <div>
                  <dt>Elegibilidad</dt>
                  <dd>{presentEligibility(selected.eligible, selected.classification)}</dd>
                </div>
                <div>
                  <dt>Selección</dt>
                  <dd>{presentActivityClassification(selected.classification)}</dd>
                </div>
                <div>
                  <dt>Runtime</dt>
                  <dd>{presentActivityRuntimeStatus(selected)}</dd>
                </div>
                {profileFinding ? (
                  <div>
                    <dt>Finding del perfil</dt>
                    <dd>{profileFinding.title}</dd>
                  </div>
                ) : null}
              </dl>
              <ActivitySelectionConformanceDetail
                conformance={conformance}
                activity={selected}
                loading={conformanceLoading}
                error={conformanceError}
              />
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

function activitySpecificFinding(
  progress: WorkMapProgressView,
  activityId: string,
) {
  return (
    progress.findings?.find(
      (finding) =>
        finding.scope === "workmap" &&
        (finding.findingId.includes(activityId) ||
          finding.detail.includes(activityId)),
    ) ?? null
  );
}

function primaryOperationalFinding(progress: WorkMapProgressView) {
  return (
    progress.findings?.find(
      (finding) =>
        finding.code === "canonical_activity_selection_snapshot_missing",
    ) ??
    progress.findings?.find(
      (finding) => finding.code === "activity_selection_effective_result_missing",
    ) ??
    progress.findings?.[0] ??
    null
  );
}

function presentWorkMapActivityState(
  state: WorkMapProgressView["activities"][number]["state"],
) {
  const labels: Record<string, string> = {
    captured: "Capturada",
    eligible: "Elegible",
    selected_primary: "Primaria seleccionada",
    selected_non_primary: "Contexto no primario",
    runtime_prepared: "Runtime preparado",
    not_selected: "No seleccionada",
    awaiting_effective_selection: "Esperando selección efectiva",
    runtime_not_started: "Runtime no iniciado",
    not_started: "No iniciado",
  };
  return labels[state ?? "not_started"] ?? "No iniciado";
}

function presentActivityClassification(
  classification: WorkMapProgressView["activities"][number]["classification"],
) {
  const labels: Record<string, string> = {
    primary: "Primaria",
    "non-primary": "Contexto no primario",
    pending: "Pendiente",
    unavailable: "No disponible",
  };
  return labels[classification ?? "pending"] ?? "Pendiente";
}

function ProfileConformanceSummary({
  progress,
}: {
  progress: WorkMapProgressView;
}) {
  const selection = progress.selection;
  if (!selection) return null;
  const evaluated =
    selection.eligibleCount ??
    progress.coverage.eligibleCount ??
    progress.activities.length;
  const globalStatus = profileConformanceStatus(selection);

  return (
    <dl className={styles.runtimeRunSummary}>
      <div>
        <dt>Política aplicada</dt>
        <dd>{selection.policyVersion ?? "No persistido"}</dd>
      </div>
      <div>
        <dt>Selection mode</dt>
        <dd>{selection.selectionMode ?? "No persistido"}</dd>
      </div>
      <div>
        <dt>Actividades evaluadas</dt>
        <dd>{formatCountOrDash(evaluated)}</dd>
      </div>
      <div>
        <dt>Primarias</dt>
        <dd>{formatCountOrDash(selection.selectedPrimaryCount)}</dd>
      </div>
      <div>
        <dt>Contextuales</dt>
        <dd>{formatCountOrDash(selection.nonPrimaryContextCount)}</dd>
      </div>
      <div>
        <dt>Manual review</dt>
        <dd>{profileManualReviewStatus(progress)}</dd>
      </div>
      <div>
        <dt>Replay</dt>
        <dd>{selection.replayStatus ?? "No persistido"}</dd>
      </div>
      <div>
        <dt>Trace completeness</dt>
        <dd>{selection.traceCompletenessStatus ?? "No persistido"}</dd>
      </div>
      <div>
        <dt>Estado global</dt>
        <dd>{presentConformanceStatus(globalStatus)}</dd>
      </div>
    </dl>
  );
}

function ActivitySelectionConformanceDetail({
  conformance,
  activity,
  loading,
  error,
}: {
  conformance: ActivitySelectionConformanceView | null;
  activity: WorkMapProgressView["activities"][number];
  loading: boolean;
  error: string | null;
}) {
  const tabs = [
    { id: "summary", label: "Resumen" },
    { id: "template", label: "Plantilla completa" },
    { id: "provenance", label: "Procedencia técnica" },
  ] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("summary");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (loading) {
    return (
      <p className={styles.workspaceEmptyMessage} role="status">
        Cargando detalle...
      </p>
    );
  }

  if (error) {
    return (
      <div className={styles.manualWorkError} role="alert">
        <p className={styles.workspaceEmptyTitle}>Detalle no verificable</p>
        <p className={styles.workspaceEmptyMessage}>{error}</p>
      </div>
    );
  }

  if (!conformance) return null;

  const summaryEntries = buildConformanceSummaryEntries(conformance, activity);
  const templateEntries = buildSelectorTemplateEntries(conformance);
  const c312ExtensionEntries = buildC312ExtensionEntries(conformance);
  const technicalProvenanceEntries = buildTechnicalProvenanceEntries(conformance);
  const tabBaseId = `activity-conformance-${conformance.resultId}-${conformance.itemId}`;

  function selectTab(index: number, focus = false) {
    const next = tabs[index];
    if (!next) return;
    setActiveTab(next.id);
    if (focus) window.setTimeout(() => tabRefs.current[index]?.focus(), 0);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectTab((index + 1) % tabs.length, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab((index - 1 + tabs.length) % tabs.length, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectTab(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      selectTab(tabs.length - 1, true);
    }
  }

  async function handleCopyEntry(entry: ConformanceEntry) {
    const value = presentConformanceEntry(entry);
    if (isAbsentConformanceValue(value)) return;
    setCopiedKey(entry.key);
    await copyTextToClipboard(value).catch(() => undefined);
    window.setTimeout(() => setCopiedKey((current) => (current === entry.key ? null : current)), 1500);
  }

  return (
    <section
      className={styles.activitySelectionGroup}
      aria-label="Conformidad de seleccion primaria"
    >
      <h6 className={styles.activitySelectionGroupTitle}>
        Conformidad C3.12
      </h6>
      {conformance.legacyTraceMessage ? (
        <p className={styles.workspaceEmptyMessage}>
          {conformance.legacyTraceMessage}
        </p>
      ) : null}
      <div className={styles.workspaceSubnav} role="tablist" aria-label="Detalle de conformance">
        {tabs.map((tab, index) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${tabBaseId}-${tab.id}-panel`}
              id={`${tabBaseId}-${tab.id}-tab`}
              tabIndex={selected ? 0 : -1}
              className={styles.workspaceSubnavButton}
              onClick={() => selectTab(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab === "summary" ? (
        <div
          id={`${tabBaseId}-summary-panel`}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-summary-tab`}
        >
          <ConformanceEntries
            title="Resumen"
            description="Resultado operativo y lectura metodológica inicial."
            entries={summaryEntries}
          />
        </div>
      ) : null}
      {activeTab === "template" ? (
        <div
          id={`${tabBaseId}-template-panel`}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-template-tab`}
        >
          <ConformanceEntries
            title="Plantilla completa"
            description="Selector_Template_v1_3 representado campo por campo, en el orden rector."
            entries={templateEntries}
          />
          <ConformanceEntries
            title="Extensión C3.12"
            description="Trazabilidad, replay y gobierno agregados fuera de los 38 campos rectores."
            entries={c312ExtensionEntries}
          />
        </div>
      ) : null}
      {activeTab === "provenance" ? (
        <div
          id={`${tabBaseId}-provenance-panel`}
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-provenance-tab`}
        >
          <ConformanceEntries
            title="Procedencia técnica"
            description="IDs, hashes y vínculos técnicos; separados de la lectura humana."
            entries={technicalProvenanceEntries}
            copyable
            copiedKey={copiedKey}
            onCopyEntry={handleCopyEntry}
          />
        </div>
      ) : null}
    </section>
  );
}

type ConformanceEntryStatus =
  | "persisted"
  | "not_persisted"
  | "not_applicable"
  | "unverifiable"
  | "review_required"
  | "unknown";

type ConformanceEntry = {
  key: string;
  label: string;
  technicalName?: string;
  value: unknown;
  status: ConformanceEntryStatus;
  group?: string;
};

function buildConformanceSummaryEntries(
  conformance: ActivitySelectionConformanceView,
  activity: WorkMapProgressView["activities"][number],
): ConformanceEntry[] {
  return [
    summaryEntry("activity", "Actividad", "activity_title", conformance.provenance.activityLabel),
    summaryEntry(
      "responsibility",
      "Responsabilidad fuente",
      "responsibility_title",
      conformance.provenance.responsibilityLabel,
      conformance.provenance.responsibilityLabel == null ? "not_persisted" : "persisted",
    ),
    summaryEntry(
      "profile",
      "Perfil funcional",
      "profile_label",
      conformance.provenance.profileLabel,
      conformance.provenance.profileLabel == null ? "unverifiable" : "persisted",
    ),
    summaryEntry(
      "eligibility",
      "Elegibilidad",
      "eligibility_status",
      conformance.eligibility.status,
      conformance.eligibility.status == null ? "not_persisted" : "persisted",
    ),
    summaryEntry("global_gate", "Gate global", "globalStatus", presentConformanceStatus(conformance.globalStatus)),
    summaryEntry(
      "score",
      "Score final",
      "finalSelectionScore",
      conformance.decision.finalSelectionScore,
      conformance.decision.finalSelectionScore == null ? "not_persisted" : "persisted",
    ),
    summaryEntry(
      "slot",
      "Slot asignado",
      "selectedSlot",
      conformance.decision.selectedSlot,
      conformance.decision.selectedSlot == null ? "not_applicable" : "persisted",
    ),
    summaryEntry(
      "decision",
      "Decisión",
      "selectionStatus",
      conformance.decision.selectionStatus,
      conformance.decision.selectionStatus == null ? "not_persisted" : "persisted",
    ),
    summaryEntry(
      "decision_reason",
      "Razón de selección/no selección",
      "selectionReasonText",
      conformance.decision.selectionReasonText ?? conformance.decision.selectionReasonCode,
      conformance.decision.selectionReasonText == null && conformance.decision.selectionReasonCode == null
        ? "not_persisted"
        : "persisted",
    ),
    summaryEntry("activity_runtime", "Estado Runtime de la actividad", "activityRuntimeStatus", presentActivityRuntimeStatus(activity)),
    summaryEntry("conformance", "Estado global de conformance", "globalStatus", presentConformanceStatus(conformance.globalStatus)),
    summaryEntry(
      "replay",
      "Replay",
      "replay_status",
      conformance.governance.replayStatus,
      conformance.governance.replayStatus == null ? "not_persisted" : "persisted",
    ),
    summaryEntry(
      "manual_review",
      "Revisión manual",
      "manualReviewRequired",
      conformance.governance.manualReviewRequired
        ? "Revisión requerida"
        : conformance.governance.manualReviewState ?? "No requerida",
      conformance.governance.manualReviewRequired ? "review_required" : "persisted",
    ),
  ];
}

function buildSelectorTemplateEntries(
  conformance: ActivitySelectionConformanceView,
): ConformanceEntry[] {
  const signal = (key: string) => conformance.signals.find((entry) => entry.key === key)?.value ?? null;
  const penalty = (key: string) => conformance.penalties.find((entry) => entry.key === key)?.value ?? null;
  return [
    selectorTemplateEntry(1, "activity_id", conformance.item.activityId, "Identidad"),
    selectorTemplateEntry(2, "responsibility_id", conformance.item.responsibilityId, "Identidad"),
    selectorTemplateEntry(3, "responsibility_title", conformance.provenance.responsibilityLabel, "Identidad"),
    selectorTemplateEntry(4, "activity_index", conformance.item.activityIndex, "Identidad"),
    selectorTemplateEntry(5, "activity_title", conformance.provenance.activityLabel, "Identidad"),
    selectorTemplateEntry(6, "activity_description", conformance.item.activityDescription, "Identidad"),
    selectorTemplateEntry(7, "eligibility_status", conformance.eligibility.status, "Elegibilidad"),
    selectorTemplateEntry(8, "exclusion_reason", conformance.eligibility.exclusionReason, "Elegibilidad", "not_applicable"),
    selectorTemplateEntry(9, "pmSignalPotential", signal("pmSignalPotential"), "Señales"),
    selectorTemplateEntry(10, "mocSignalPotential", signal("mocSignalPotential"), "Señales"),
    selectorTemplateEntry(11, "pfSignalPotential", signal("pfSignalPotential"), "Señales"),
    selectorTemplateEntry(12, "olcSignalPotential", signal("olcSignalPotential"), "Señales"),
    selectorTemplateEntry(13, "architecturalSignalPotential", signal("architecturalSignalPotential"), "Señales"),
    selectorTemplateEntry(14, "operationalCentrality", signal("operationalCentrality"), "Señales"),
    selectorTemplateEntry(15, "transformationObjectSignal", signal("transformationObjectSignal"), "Señales"),
    selectorTemplateEntry(16, "handoffDependencySignal", signal("handoffDependencySignal"), "Señales"),
    selectorTemplateEntry(17, "timerWaitSignal", signal("timerWaitSignal"), "Señales"),
    selectorTemplateEntry(18, "synchronizationGovernanceSignal", signal("synchronizationGovernanceSignal"), "Señales"),
    selectorTemplateEntry(19, "frictionExceptionSignal", signal("frictionExceptionSignal"), "Señales"),
    selectorTemplateEntry(20, "pfOlcRiskSignal", signal("pfOlcRiskSignal"), "Señales"),
    selectorTemplateEntry(21, "coverageDiversityValue", signal("coverageDiversityValue"), "Señales"),
    selectorTemplateEntry(22, "duplicatePenalty", penalty("duplicatePenalty"), "Penalizaciones"),
    selectorTemplateEntry(23, "tooMacroPenalty", penalty("tooMacroPenalty"), "Penalizaciones"),
    selectorTemplateEntry(24, "tooMicroPenalty", penalty("tooMicroPenalty"), "Penalizaciones"),
    selectorTemplateEntry(25, "overlySpecificToolPenalty", penalty("overlySpecificToolPenalty"), "Penalizaciones"),
    selectorTemplateEntry(26, "lateralContextPenalty", penalty("lateralContextPenalty"), "Penalizaciones"),
    selectorTemplateEntry(27, "responsibilityBalanceAdjustment", penalty("responsibilityBalanceAdjustment"), "Penalizaciones"),
    selectorTemplateEntry(28, "finalSelectionScore", conformance.decision.finalSelectionScore, "Decisión"),
    selectorTemplateEntry(29, "preferredSlotCandidate", conformance.decision.preferredSlotCandidate, "Decisión"),
    selectorTemplateEntry(30, "selectedSlot", conformance.decision.selectedSlot, "Decisión", "not_applicable"),
    selectorTemplateEntry(31, "selectionStatus", conformance.decision.selectionStatus, "Decisión"),
    selectorTemplateEntry(32, "selectionReasonCode", conformance.decision.selectionReasonCode, "Decisión"),
    selectorTemplateEntry(33, "selectionReasonText", conformance.decision.selectionReasonText, "Decisión"),
    selectorTemplateEntry(34, "nonPrimaryContextStatus", conformance.nonPrimaryContext.status, "Contexto", "not_applicable"),
    selectorTemplateEntry(35, "runtimeHandoffPriority", conformance.decision.runtimeHandoffPriority, "Decisión", "not_applicable"),
    selectorTemplateEntry(36, "traceFlags", conformance.governance.traceFlags, "QA"),
    selectorTemplateEntry(37, "manualReviewRequired", conformance.governance.manualReviewRequired, "QA"),
    selectorTemplateEntry(38, "notes", conformance.item.notes, "QA"),
  ];
}

function buildC312ExtensionEntries(
  conformance: ActivitySelectionConformanceView,
): ConformanceEntry[] {
  return [
    conformanceEntry("policy_version_extension", "policy_version", conformance.identity.policyVersion, "Gobierno"),
    conformanceEntry("selector_code_version_extension", "selector_code_version", conformance.identity.selectorCodeVersion, "Gobierno"),
    conformanceEntry("promotionConditionCode", "promotionConditionCode", conformance.nonPrimaryContext.promotionConditionCode, "Contexto"),
    conformanceEntry("promotionCondition", "promotionCondition", conformance.nonPrimaryContext.promotionCondition, "Contexto"),
    conformanceEntry("reviewCondition", "reviewCondition", conformance.nonPrimaryContext.reviewCondition, "Contexto"),
    conformanceEntry(
      "rule_refs",
      "rule_refs",
      conformance.eligibility.ruleRefs,
      "Elegibilidad",
      conformance.eligibility.ruleRefs.length === 0 ? "not_persisted" : "persisted",
    ),
    conformanceEntry("replay_status", "replay_status", conformance.governance.replayStatus, "QA"),
    conformanceEntry("replayed_at", "replayed_at", conformance.governance.replayedAt, "QA"),
    conformanceEntry("replay_hash", "replay_hash", conformance.governance.replayHash, "QA"),
    conformanceEntry("replay_diffs", "replay_diffs", conformance.governance.replayDiffs, "QA"),
    conformanceEntry("qa", "QA status", conformance.governance.qa, "QA"),
    conformanceEntry("trace_completeness", "trace completeness", conformance.governance.traceCompletenessStatus, "QA"),
  ];
}

function buildTechnicalProvenanceEntries(
  conformance: ActivitySelectionConformanceView,
): ConformanceEntry[] {
  return [
    conformanceEntry("case_id", "case_id", conformance.provenance.caseId, "Procedencia"),
    conformanceEntry("case_label", "case label", conformance.provenance.caseLabel, "Procedencia", conformance.provenance.caseLabel == null ? "unverifiable" : "persisted"),
    conformanceEntry("profile_id", "profile_id", conformance.provenance.profileId, "Procedencia"),
    conformanceEntry("profile_label", "profile label", conformance.provenance.profileLabel, "Procedencia", conformance.provenance.profileLabel == null ? "unverifiable" : "persisted"),
    conformanceEntry("lineage", "lineage", conformance.provenance.lineage, "Procedencia"),
    conformanceEntry("activity_description_source", "activity_description_source", conformance.item.activityDescriptionSource, "Procedencia"),
    conformanceEntry("source_workmap_id", "source_workmap_id", conformance.provenance.sourceWorkmapId, "Procedencia"),
    conformanceEntry("source_workmap_version_id", "source_workmap_version_id", conformance.provenance.sourceWorkmapVersionId, "Procedencia", conformance.provenance.sourceWorkmapVersionId == null ? "unverifiable" : "persisted"),
    conformanceEntry("profile_binding", "profile_binding", conformance.provenance.profileBinding, "Procedencia", conformance.provenance.profileBinding == null ? "unverifiable" : "persisted"),
    conformanceEntry("workmap_snapshot_hash", "workmap_snapshot_hash", conformance.provenance.workmapSnapshotHash, "Procedencia"),
    conformanceEntry("policy_version", "policy_version", conformance.identity.policyVersion, "Procedencia"),
    conformanceEntry("selector_code_version", "selector_code_version", conformance.identity.selectorCodeVersion, "Procedencia"),
    conformanceEntry("policy_manifest_hash", "policy_manifest_hash", conformance.identity.policyManifestHash, "Procedencia"),
    conformanceEntry("selection_result_hash", "selection_result_hash", conformance.identity.selectionResultHash, "Procedencia"),
    conformanceEntry("item_id", "item_id", conformance.item.itemId, "Procedencia"),
    conformanceEntry("role_runtime_session_id", "role_runtime_session_id", conformance.runtime.roleRuntimeSessionId, "Procedencia", conformance.runtime.roleRuntimeSessionId == null ? "not_applicable" : "persisted"),
    conformanceEntry("activity_runtime_run_id", "activity_runtime_run_id", conformance.runtime.activityRuntimeRunId, "Procedencia", conformance.runtime.activityRuntimeRunId == null ? "not_applicable" : "persisted"),
  ];
}

function selectorTemplateEntry(
  ordinal: number,
  field: string,
  value: unknown,
  group: string,
  missingStatus: ConformanceEntryStatus = "not_persisted",
): ConformanceEntry {
  return {
    key: `${String(ordinal).padStart(2, "0")}_${field}`,
    label: `${ordinal}. ${humanizeSelectorField(field)}`,
    technicalName: field,
    value,
    group,
    status: inferConformanceStatus(value, missingStatus),
  };
}

function summaryEntry(
  key: string,
  label: string,
  technicalName: string,
  value: unknown,
  status: ConformanceEntryStatus = "persisted",
): ConformanceEntry {
  void technicalName;
  return { key, label, value, status };
}

function conformanceEntry(
  key: string,
  label: string,
  value: unknown,
  group?: string,
  missingStatus: ConformanceEntryStatus = "not_persisted",
): ConformanceEntry {
  return {
    key,
    label,
    technicalName: key,
    value,
    group,
    status: inferConformanceStatus(value, missingStatus),
  };
}

function inferConformanceStatus(
  value: unknown,
  missingStatus: ConformanceEntryStatus,
): ConformanceEntryStatus {
  if (Array.isArray(value) && value.length === 0) return missingStatus;
  if (value == null) return missingStatus;
  return "persisted";
}

function humanizeSelectorField(field: string) {
  const labels: Record<string, string> = {
    activity_id: "ID de actividad",
    responsibility_id: "ID de responsabilidad",
    responsibility_title: "Responsabilidad fuente",
    activity_index: "Índice de actividad",
    activity_title: "Actividad",
    activity_description: "Descripción de actividad",
    eligibility_status: "Elegibilidad",
    exclusion_reason: "Razón de exclusión",
    finalSelectionScore: "Score final",
    preferredSlotCandidate: "Slot candidato",
    selectedSlot: "Slot asignado",
    selectionStatus: "Decisión",
    selectionReasonCode: "Código de razón",
    selectionReasonText: "Razón",
    nonPrimaryContextStatus: "Estado contextual no primario",
    runtimeHandoffPriority: "Prioridad de handoff Runtime",
    traceFlags: "Trace flags",
    manualReviewRequired: "Revisión manual requerida",
    notes: "Notas",
  };
  return labels[field] ?? field;
}

function conformanceSectionId(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ConformanceEntries({
  title,
  description,
  entries,
  copyable = false,
  copiedKey = null,
  onCopyEntry,
}: {
  title: string;
  description?: string;
  entries: ConformanceEntry[];
  copyable?: boolean;
  copiedKey?: string | null;
  onCopyEntry?: (entry: ConformanceEntry) => void;
}) {
  return (
    <div className={styles.activitySelectionGroup} id={conformanceSectionId(title)}>
      <p className={styles.activitySelectionGroupTitle}>{title}</p>
      {description ? <p className={styles.workspaceEmptyMessage}>{description}</p> : null}
      {title === "Plantilla completa" ? (
        <p className={styles.workspaceEmptyMessage}>
          Índice visual: Identidad · Elegibilidad · Señales · Penalizaciones · Decisión · Contexto · QA · Procedencia
        </p>
      ) : null}
      <dl className={styles.runtimeRunSummary}>
        {entries.map((entry) => (
          <div key={entry.key}>
            <dt>
              {entry.label}
              {entry.technicalName && entry.technicalName !== entry.label ? (
                <span className={styles.workspaceEmptyMessage}> {entry.technicalName}</span>
              ) : null}
            </dt>
            <dd>
              {presentConformanceEntry(entry)}
              {copyable && onCopyEntry && !isAbsentConformanceValue(presentConformanceEntry(entry)) ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className={styles.contextRetryButton}
                    onClick={() => onCopyEntry(entry)}
                  >
                    Copiar
                  </button>
                  {copiedKey === entry.key ? (
                    <span className={styles.workspaceEmptyMessage}> Copiado</span>
                  ) : null}
                </>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function presentEligibility(
  eligible: boolean | null | undefined,
  classification?: WorkMapProgressView["activities"][number]["classification"],
) {
  if (eligible === true) return "Elegible";
  if (eligible === false) return "No elegible";
  if (classification === "pending") return "Revisión requerida";
  return "No verificable";
}

function presentConformanceStatus(
  status: ActivitySelectionConformanceView["globalStatus"],
) {
  const labels: Record<ActivitySelectionConformanceView["globalStatus"], string> = {
    conformant: "Conforme",
    conformant_with_traceability_gaps: "Conforme con brechas de trazabilidad",
    manual_review_required: "Revisión manual requerida",
    unverifiable: "No verificable",
    mismatch: "Diferencia detectada",
  };
  return labels[status];
}

function profileConformanceStatus(
  selection: NonNullable<WorkMapProgressView["selection"]>,
): ActivitySelectionConformanceView["globalStatus"] {
  if (selection.replayStatus === "mismatch") return "mismatch";
  if (selection.replayStatus === "unverifiable") return "unverifiable";
  if (selection.traceCompletenessStatus === "legacy_selection_trace_incomplete") {
    return "conformant_with_traceability_gaps";
  }
  if (selection.stage === "blocked") return "manual_review_required";
  return "conformant";
}

function profileManualReviewStatus(progress: WorkMapProgressView) {
  const hasReviewRequired = progress.activities.some(
    (activity) => activity.classification === "pending",
  );
  return hasReviewRequired ? "Revisión requerida" : "No requerida";
}

function presentConformanceEntry(entry: {
  value: unknown;
  status: ConformanceEntryStatus;
}) {
  if (entry.status === "not_applicable") return "No aplicable";
  if (entry.status === "unverifiable") return "No verificable";
  if (entry.status === "review_required") return "Revisión requerida";
  if (entry.status === "unknown") return "Dato desconocido";
  if (entry.status === "not_persisted") return "No persistido";
  return presentConformanceValue(entry.value);
}

function presentConformanceValue(value: unknown): string {
  if (value == null) return "No persistido";
  if (typeof value === "string") {
    if (value === "workmap_explicit") return "Capturada explícitamente en WorkMap";
    if (value === "absent") return "No capturada";
    if (value === "legacy_unknown") return "Procedencia histórica no verificable";
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "No verificable";
  }
}

function isAbsentConformanceValue(value: string) {
  return [
    "No persistido",
    "No verificable",
    "No aplicable",
    "Revisión requerida",
    "Dato desconocido",
  ].includes(value);
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const element = document.createElement("textarea");
  element.value = value;
  element.setAttribute("readonly", "");
  element.style.position = "fixed";
  element.style.opacity = "0";
  document.body.appendChild(element);
  element.select();
  document.execCommand("copy");
  document.body.removeChild(element);
}

function presentActivityRuntimeStatus(
  activity: WorkMapProgressView["activities"][number],
) {
  if (activity.classification === "non-primary") {
    return "No aplica — no genera Runtime";
  }
  if (activity.classification === "primary" && !activity.runtimeRunId) {
    return "Inconsistencia — run no localizado";
  }
  const runState = (activity.runtimeRunState ?? activity.runtimeRunReadinessState ?? "").toLowerCase();
  if (runState === "blocked") return "Runtime bloqueado";
  if (["completed", "complete", "done", "closed", "archived"].includes(runState)) {
    return "Runtime completado";
  }
  if (
    [
      "active",
      "running",
      "in_progress",
      "active_base_capture",
      "b0_confirmation_pending",
      "semantic_preload_loaded",
      "base_capture_active",
      "causal_capture_active",
    ].includes(runState)
  ) {
    return "Runtime en ejecución";
  }
  if (
    activity.state === "runtime_prepared" ||
    runState === "initialized" ||
    runState === "ready" ||
    runState === "prepared"
  ) {
    return "Runtime preparado";
  }
  if (activity.state === "not_selected") return "No aplica — no genera Runtime";
  return "Runtime no iniciado";
}

function summarizeActivity(label: string): string {
  const firstLine = label.split(/\r?\n/)[0]?.trim() ?? label;
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}...` : firstLine;
}

"use client";



import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";

import { EveLogo } from "@/components/EveLogo";

import { ClientShell } from "@/components/client/ClientShell";

import { EmptyAssessmentState } from "@/components/client/EmptyAssessmentState";

import { SignificadoDeTuTrabajo } from "@/components/significado/SignificadoDeTuTrabajo";

import type { SignificadoBlock0ReviewProgress } from "@/components/significado/SignificadoDeTuTrabajo";

import { WorkMapIntake } from "@/components/WorkMapIntake";

import {

  EMPTY_START_POSITION_CONTEXT,

  type StartPositionContext,

} from "@/domain/start-position-context";

import type { PrimaryActivitySelectionResult } from "@/domain/primary-activity-selection-policy";

import { createEmptyWorkMap, type WorkMapData } from "@/domain/work-map";

import {

  countFilledWorkMapActivities,

  countWorkMapResponsibilities,

  createE2eFinancialExampleWorkMap,

  E2E_BLOCK0_DEMO_SESSION_ID,

} from "@/features/dev/e2e-block0-demo-fixture";

import {

  advanceE2eDemoToEstadoA,

  buildE2eBlock0DemoTrace,

  E2E_BLOCK0_DEMO_LOGIN_COPY,

  E2E_BLOCK0_DEMO_PHASE_LABELS,

  resolveE2eSourceModeAfterSave,

  type E2eBlock0DemoPhase,

  type E2eBlock0DemoTrace,

  type E2eBlock0WorkMapSourceMode,

} from "@/features/dev/e2e-block0-demo-state";

import type { SignificadoSubmitPayload } from "@/domain/significado-de-trabajo";

import { selectPrimaryActivitiesFromWorkMap } from "@/services/primary-activity-selector";
import {
  clearWorkMapDraft,
  readWorkMapDraft,
  writeWorkMapDraft,
} from "@/services/work-map-draft";



function E2eBlock0DemoLoginPanel({ onEnterDemo }: { onEnterDemo: () => void }) {

  const handleDemoClick = (event: MouseEvent<HTMLButtonElement>) => {

    event.preventDefault();

    event.stopPropagation();

    onEnterDemo();

  };



  return (

    <div className="mx-auto flex h-screen w-full max-w-[1180px] items-center justify-center overflow-hidden px-4 py-4 sm:px-8">

      <div className="w-full overflow-hidden rounded border border-[rgba(61,61,71,0.14)] bg-white lg:grid lg:max-h-[min(560px,calc(100vh-2rem))] lg:grid-cols-[140px_1fr]">

        <aside className="relative hidden bg-[#2f333a] lg:flex lg:flex-col">

          <div className="px-6 pt-8">

            <EveLogo size="md" variant="on-dark" />

          </div>

          <div className="mt-auto px-6 pb-8">

            <p className="text-[9px] font-medium leading-[1.45] tracking-[0.22em] text-white/55">

              ENTERPRISE

              <br />

              VIABILITY

              <br />

              ENGINE<span className="text-[8px]">™</span>

            </p>

          </div>

        </aside>



        <div className="flex items-center justify-center bg-[#f5f5f5] p-6 sm:p-8">

          <div className="w-full max-w-[360px]">

            <div className="lg:hidden">

              <EveLogo size="sm" variant="muted" />

            </div>

            <h1 className="mt-1 text-2xl font-semibold text-[#272a32]">

              {E2E_BLOCK0_DEMO_LOGIN_COPY.title}

            </h1>

            <p className="mt-2 text-sm leading-5 text-[#6f7280]">

              {E2E_BLOCK0_DEMO_LOGIN_COPY.subtitle}

            </p>

            <p className="mt-1.5 text-sm leading-5 text-[#6f7280]">

              {E2E_BLOCK0_DEMO_LOGIN_COPY.demoHint}

            </p>



            <div className="mt-5 grid gap-2.5" aria-hidden="true">

              <input

                className="h-11 rounded border border-[rgba(61,61,71,0.14)] bg-white px-3 text-sm text-[#272a32] outline-none"

                disabled

                placeholder="Email"

                readOnly

                tabIndex={-1}

                type="email"

                value=""

              />

              <input

                className="h-11 rounded border border-[rgba(61,61,71,0.14)] bg-white px-3 text-sm text-[#272a32] outline-none"

                disabled

                placeholder="Password"

                readOnly

                tabIndex={-1}

                type="password"

                value=""

              />

            </div>



            <div className="mt-4 grid gap-2.5">

              <button

                className="h-11 rounded bg-[#3d3d47] px-4 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"

                disabled

                type="button"

              >

                Iniciar sesión

              </button>

              <p className="text-center text-[11px] text-[#6f7280]">o</p>

              <button

                className="h-11 rounded border border-[rgba(61,61,71,0.14)] bg-white px-4 text-sm font-medium text-[#272a32] transition disabled:cursor-not-allowed disabled:opacity-50"

                disabled

                type="button"

              >

                Crear cuenta

              </button>

              <button

                className="h-11 rounded border border-[rgba(61,61,71,0.14)] bg-white px-4 text-sm font-medium text-[#272a32] transition hover:bg-[#fafafa]"

                data-e2e-demo-login-button="true"

                onClick={handleDemoClick}

                type="button"

              >

                {E2E_BLOCK0_DEMO_LOGIN_COPY.demoButtonLabel}

              </button>

              <p className="text-xs text-[#6f7280]">

                {E2E_BLOCK0_DEMO_LOGIN_COPY.demoFootnote}

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}



function formatSourceModeLabel(sourceMode: E2eBlock0WorkMapSourceMode | null) {
  if (sourceMode === "loaded_financial_example") {
    return "loaded_financial_example";
  }
  if (sourceMode === "manual_modified_from_example") {
    return "manual_modified_from_example";
  }
  if (sourceMode === "manual") {
    return "manual";
  }
  return "—";
}

function syncDemoWorkMapDraft(workMap: WorkMapData) {
  clearWorkMapDraft(E2E_BLOCK0_DEMO_SESSION_ID);
  writeWorkMapDraft(workMap, E2E_BLOCK0_DEMO_SESSION_ID);
}

function clearDemoWorkMapDraft() {
  clearWorkMapDraft(E2E_BLOCK0_DEMO_SESSION_ID);
}



function DevTracePanel({

  trace,

  showTrace,

  onToggleTrace,

}: {

  trace: E2eBlock0DemoTrace;

  showTrace: boolean;

  onToggleTrace: () => void;

}) {

  if (!showTrace) {

    return (

      <div className="border-b border-neutral-200 bg-[#f7f7f2] px-4 py-2 text-center text-xs text-neutral-600">

        <button

          className="font-medium text-emerald-800 hover:underline"

          onClick={onToggleTrace}

          type="button"

        >

          Ver traza demo

        </button>

      </div>

    );

  }



  return (

    <div className="border-b border-neutral-200 bg-[#f7f7f2] px-4 py-4 text-xs text-neutral-700">

      <div className="mx-auto max-w-6xl space-y-4">

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="font-semibold text-neutral-800">Traza demo (solo /dev/e2e-block0)</p>

            <p className="text-neutral-500">

              Etapa: {E2E_BLOCK0_DEMO_PHASE_LABELS[trace.phase]}

            </p>

          </div>

          <button

            className="shrink-0 font-medium text-emerald-800 hover:underline"

            onClick={onToggleTrace}

            type="button"

          >

            Ocultar traza

          </button>

        </div>



        {trace.traceabilityErrors.length > 0 ? (

          <div className="space-y-1 rounded border border-red-300 bg-red-50 p-3 text-red-900">

            {trace.traceabilityErrors.map((error) => (

              <p key={error} className="font-medium">

                {error}

              </p>

            ))}

          </div>

        ) : null}



        <section className="rounded border border-neutral-200 bg-white p-3">
          <h3 className="font-semibold text-neutral-800">A. Fuente actual</h3>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-neutral-500">sourceMode</dt>
              <dd>{formatSourceModeLabel(trace.sourceTrace.sourceMode)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">wasExampleLoaded</dt>
              <dd>{trace.sourceTrace.wasExampleLoaded ? "true" : "false"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">wasManualEditedAfterExample</dt>
              <dd>{trace.sourceTrace.wasManualEditedAfterExample ? "true" : "false"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">savedWorkMapExists</dt>
              <dd>{trace.sourceTrace.savedWorkMapExists ? "true" : "false"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">savedAt</dt>
              <dd>{trace.sourceTrace.savedAt ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">selectedAreasFromDraft</dt>
              <dd>
                {trace.sourceTrace.selectedAreasFromDraft.length
                  ? trace.sourceTrace.selectedAreasFromDraft.join(", ")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">selectedAreasFromSavedSnapshot</dt>
              <dd>
                {trace.sourceTrace.selectedAreasFromSavedSnapshot.length
                  ? trace.sourceTrace.selectedAreasFromSavedSnapshot.join(", ")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">areasMatch</dt>
              <dd>{trace.sourceTrace.areasMatch ? "true" : "false"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-3">
          <h3 className="font-semibold text-neutral-800">B. Conteos</h3>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-neutral-500">responsibilitiesCount visible</dt>
              <dd>{trace.countTrace.responsibilitiesCountVisible}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">responsibilitiesCount saved</dt>
              <dd>{trace.countTrace.responsibilitiesCountSaved}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">flattenedActivitiesCount visible</dt>
              <dd>{trace.countTrace.flattenedActivitiesCountVisible}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">flattenedActivitiesCount saved</dt>
              <dd>{trace.countTrace.flattenedActivitiesCountSaved}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">countsMatch</dt>
              <dd>{trace.countTrace.countsMatch ? "true" : "false"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded border border-neutral-200 bg-white p-3">
          <h3 className="font-semibold text-neutral-800">
            C. Actividades aplanadas (guardadas)
          </h3>

          {trace.flattenedActivities.length === 0 ? (

            <p className="mt-2 text-neutral-500">Sin actividades aplanadas todavía.</p>

          ) : (

            <div className="mt-2 overflow-x-auto">

              <table className="min-w-full border-collapse text-left">

                <thead>

                  <tr className="border-b border-neutral-200 text-neutral-500">

                    <th className="px-2 py-1">flattenedIndex</th>

                    <th className="px-2 py-1">respIdx</th>

                    <th className="px-2 py-1">actIdx</th>

                    <th className="px-2 py-1">activityId</th>

                    <th className="px-2 py-1">activityTitle</th>

                    <th className="px-2 py-1">responsibilityTitle</th>

                  </tr>

                </thead>

                <tbody>

                  {trace.flattenedActivities.map((activity) => (

                    <tr key={activity.activityId} className="border-b border-neutral-100">

                      <td className="px-2 py-1">{activity.flattenedIndex}</td>

                      <td className="px-2 py-1">{activity.responsibilityIndex}</td>

                      <td className="px-2 py-1">

                        {activity.activityIndexWithinResponsibility}

                      </td>

                      <td className="px-2 py-1 font-mono">{activity.activityId}</td>

                      <td className="max-w-xs px-2 py-1">{activity.activityTitle}</td>

                      <td className="max-w-xs px-2 py-1">{activity.responsibilityTitle}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>



        <section className="rounded border border-neutral-200 bg-white p-3">
          <h3 className="font-semibold text-neutral-800">D. Selección primaria</h3>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-neutral-500">policy</dt>
              <dd>{trace.selectionTrace.policy ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">selectionMode</dt>
              <dd>{trace.selectionTrace.selectionMode ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">selectedCount</dt>
              <dd>{trace.selectionTrace.selectedCount || "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">maxAllowed</dt>
              <dd>{trace.selectionTrace.maxAllowed}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">nonPrimaryContextCount</dt>
              <dd>{trace.selectionTrace.nonPrimaryContextCount}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">eligibleCount</dt>
              <dd>{trace.selectionTrace.eligibleCount ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">excludedCount</dt>
              <dd>{trace.selectionTrace.excludedCount ?? "—"}</dd>
            </div>
          </dl>

          {trace.selectedPrimaryActivities.length > 0 ? (

            <div className="mt-3 overflow-x-auto">

              <table className="min-w-full border-collapse text-left">

                <thead>

                  <tr className="border-b border-neutral-200 text-neutral-500">

                    <th className="px-2 py-1">selectedIndex</th>
                    <th className="px-2 py-1">selectedSlot</th>
                    <th className="px-2 py-1">flattenedIndex</th>
                    <th className="px-2 py-1">respIdx</th>
                    <th className="px-2 py-1">actIdx</th>
                    <th className="px-2 py-1">activityId</th>
                    <th className="px-2 py-1">activityTitle</th>
                    <th className="px-2 py-1">selectionReasonCode</th>
                    <th className="px-2 py-1">selectionReasonText</th>
                    <th className="px-2 py-1">finalSelectionScore</th>
                    <th className="px-2 py-1">responsibilityBalanceAffected</th>

                  </tr>

                </thead>

                <tbody>

                  {trace.selectedPrimaryActivities.map((selected) => (

                    <tr key={`${selected.activityId}-${selected.selectedIndex}`}>

                      <td className="px-2 py-1">{selected.selectedIndex}</td>
                      <td className="px-2 py-1">{selected.selectedSlot}</td>
                      <td className="px-2 py-1">{selected.sourceFlattenedIndex ?? "—"}</td>
                      <td className="px-2 py-1">{selected.responsibilityIndex ?? "—"}</td>
                      <td className="px-2 py-1">
                        {selected.activityIndexWithinResponsibility ?? "—"}
                      </td>
                      <td className="px-2 py-1 font-mono">{selected.activityId}</td>
                      <td className="max-w-xs px-2 py-1">{selected.activityTitle}</td>
                      <td className="px-2 py-1 font-mono">{selected.selectionReasonCode}</td>
                      <td className="max-w-sm px-2 py-1">{selected.selectionReasonText}</td>
                      <td className="px-2 py-1">
                        {selected.finalSelectionScore.toFixed(3)}
                      </td>
                      <td className="px-2 py-1">
                        {selected.responsibilityBalanceAffectedResult ? "true" : "false"}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          ) : (

            <p className="mt-2 text-neutral-500">Sin selección primaria todavía.</p>

          )}

          {trace.nonPrimaryContextActivities.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <p className="mb-2 font-medium text-neutral-600">
                Actividades de contexto no primarias
              </p>
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th className="px-2 py-1">activityTitle</th>
                    <th className="px-2 py-1">contextStatus</th>
                    <th className="px-2 py-1">contextReason</th>
                  </tr>
                </thead>
                <tbody>
                  {trace.nonPrimaryContextActivities.map((activity) => (
                    <tr key={activity.activityId} className="border-b border-neutral-100">
                      <td className="max-w-xs px-2 py-1">{activity.activityTitle}</td>
                      <td className="px-2 py-1">{activity.contextStatus}</td>
                      <td className="max-w-sm px-2 py-1">{activity.contextReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {trace.preRuntimeContextBundle ? (
            <div className="mt-4 rounded border border-neutral-200 p-3">
              <p className="font-medium text-neutral-600">PreRuntimeContextBundle</p>
              <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-neutral-500">version</dt>
                  <dd>{trace.preRuntimeContextBundle.policyVersion}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">functional_role_context</dt>
                  <dd>
                    {trace.preRuntimeContextBundle.estadoAContext.functional_role_context
                      .value ?? "gap"}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">decision_level_context</dt>
                  <dd>
                    {trace.preRuntimeContextBundle.estadoAContext.decision_level_context
                      .value ?? "gap"}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">workmap_area_context</dt>
                  <dd>
                    {trace.preRuntimeContextBundle.workMapContext.areas.value?.length ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">responsibility_context</dt>
                  <dd>
                    {trace.preRuntimeContextBundle.workMapContext.responsibilities.value
                      ?.length ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">primary_activity_context</dt>
                  <dd>
                    {trace.preRuntimeContextBundle.selectionContext
                      ?.selectedPrimaryActivities.value?.length ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">non_primary_activity_context</dt>
                  <dd>
                    {trace.preRuntimeContextBundle.selectionContext
                      ?.nonPrimaryContextActivities.value?.length ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">epistemicStatus</dt>
                  <dd>
                    {
                      trace.preRuntimeContextBundle.estadoAContext
                        .functional_role_context.epistemicStatus
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">allowedUses</dt>
                  <dd>
                    {trace.preRuntimeContextBundle.estadoAContext.functional_role_context.allowedUses.join(
                      ", ",
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">forbiddenUses</dt>
                  <dd>
                    {trace.preRuntimeContextBundle.estadoAContext.functional_role_context.mustNotBeUsedFor.join(
                      ", ",
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

        </section>



        <section className="rounded border border-neutral-200 bg-white p-3">

          <h3 className="font-semibold text-neutral-800">E. Actividad actual en Significado</h3>

          <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">

            <div>

              <dt className="text-neutral-500">currentActivityIndex</dt>

              <dd>

                {trace.currentActivity.currentActivityIndex &&

                trace.currentActivity.currentActivityTotal

                  ? `${trace.currentActivity.currentActivityIndex} de ${trace.currentActivity.currentActivityTotal}`

                  : "—"}

              </dd>

            </div>

            <div className="sm:col-span-2">

              <dt className="text-neutral-500">currentActivityTitle</dt>

              <dd>{trace.currentActivity.currentActivityTitle ?? "—"}</dd>

            </div>

            <div>

              <dt className="text-neutral-500">source flattenedIndex</dt>

              <dd>{trace.currentActivity.sourceFlattenedIndex ?? "—"}</dd>

            </div>

            <div>

              <dt className="text-neutral-500">source responsibilityIndex</dt>

              <dd>{trace.currentActivity.sourceResponsibilityIndex ?? "—"}</dd>

            </div>

            <div>

              <dt className="text-neutral-500">source activityIndexWithinResponsibility</dt>

              <dd>

                {trace.currentActivity.sourceActivityIndexWithinResponsibility ?? "—"}

              </dd>

            </div>

            <div>

              <dt className="text-neutral-500">exactMatchInFlattenedWorkMap</dt>

              <dd>

                {trace.currentActivity.exactMatchInFlattenedWorkMap ? "true" : "false"}

              </dd>

            </div>

            <div>

              <dt className="text-neutral-500">inSelectedPrimaryActivities</dt>

              <dd>{trace.currentActivity.inSelectedPrimaryActivities ? "true" : "false"}</dd>

            </div>

          </dl>

        </section>



        <section className="rounded border border-neutral-200 bg-white p-3">

          <h3 className="font-semibold text-neutral-800">F. Prefill B0-Q01</h3>

          <dl className="mt-2 grid gap-2 sm:grid-cols-2">

            <div className="sm:col-span-2">

              <dt className="text-neutral-500">prefillSourceActivityTitle</dt>

              <dd>{trace.block0Prefill.prefillSourceActivityTitle ?? "—"}</dd>

            </div>

            <div>

              <dt className="text-neutral-500">prefillBuiltFromCurrentActivity</dt>

              <dd>

                {trace.block0Prefill.prefillBuiltFromCurrentActivity ? "true" : "false"}

              </dd>

            </div>

            <div>

              <dt className="text-neutral-500">Progreso Block 0</dt>

              <dd>

                {trace.block0Prepared}/{trace.block0Total} · Continuar:{" "}

                {trace.continueEnabled ? "Sí" : "No"}

              </dd>

            </div>

            <div>

              <dt className="text-neutral-500">action</dt>

              <dd>{trace.block0Prefill.action ?? "—"}</dd>

            </div>

            <div>

              <dt className="text-neutral-500">object</dt>

              <dd>{trace.block0Prefill.object ?? "—"}</dd>

            </div>

            <div>

              <dt className="text-neutral-500">procedureOrStandard</dt>

              <dd>{trace.block0Prefill.procedureOrStandard ?? "—"}</dd>

            </div>

            <div>

              <dt className="text-neutral-500">output</dt>

              <dd>{trace.block0Prefill.output ?? "—"}</dd>

            </div>

          </dl>

          {trace.block0Prefill.epistemicStatusesDevOnly.length > 0 ? (

            <div className="mt-3">

              <p className="font-medium text-neutral-600">Estados epistémicos (dev only)</p>

              <ul className="mt-1 space-y-1">

                {trace.block0Prefill.epistemicStatusesDevOnly.map((entry) => (

                  <li key={entry.field}>

                    {entry.field}: {entry.status}

                  </li>

                ))}

              </ul>

            </div>

          ) : null}

        </section>

      </div>

    </div>

  );

}



export default function E2EBlock0DemoPage() {

  const [isClientReady, setIsClientReady] = useState(false);

  const [phase, setPhase] = useState<E2eBlock0DemoPhase>("login");

  const [showTrace, setShowTrace] = useState(false);

  const [authDisplayName, setAuthDisplayName] = useState("Usuario Demo");

  const [startPositionContext, setStartPositionContext] =

    useState<StartPositionContext>(EMPTY_START_POSITION_CONTEXT);

  const [workMap, setWorkMap] = useState<WorkMapData | null>(null);

  const [workMapSeed, setWorkMapSeed] = useState<WorkMapData | null>(null);

  const [savedWorkMapSnapshot, setSavedWorkMapSnapshot] = useState<WorkMapData | null>(null);

  const [workMapSourceMode, setWorkMapSourceMode] =

    useState<E2eBlock0WorkMapSourceMode | null>(null);

  const [wasExampleLoaded, setWasExampleLoaded] = useState(false);

  const [wasManualEditedAfterExample, setWasManualEditedAfterExample] = useState(false);

  const [workMapSavedAt, setWorkMapSavedAt] = useState<string | null>(null);

  const [workMapSeedKey, setWorkMapSeedKey] = useState(0);

  const [draftSyncToken, setDraftSyncToken] = useState(0);

  const [primaryActivitySelectionResult, setPrimaryActivitySelectionResult] =

    useState<PrimaryActivitySelectionResult | null>(null);

  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);

  const [block0Progress, setBlock0Progress] =

    useState<SignificadoBlock0ReviewProgress | null>(null);

  const [submitNotice, setSubmitNotice] = useState<string | null>(null);



  useEffect(() => {

    setIsClientReady(true);

  }, []);



  useEffect(() => {

    if (!showTrace || phase !== "work_map") {

      return;

    }

    const intervalId = window.setInterval(() => {

      setDraftSyncToken((current) => current + 1);

    }, 750);

    return () => window.clearInterval(intervalId);

  }, [phase, showTrace]);



  const visibleDraftWorkMap = useMemo(() => {

    if (phase === "login" || phase === "estado_a") {

      return null;

    }

    void draftSyncToken;

    if (phase === "work_map" && typeof window !== "undefined") {

      return readWorkMapDraft(E2E_BLOCK0_DEMO_SESSION_ID) ?? workMapSeed;

    }

    return savedWorkMapSnapshot ?? workMap;

  }, [

    draftSyncToken,

    phase,

    savedWorkMapSnapshot,

    workMap,

    workMapSeed,

  ]);



  const trace = useMemo(

    () =>

      buildE2eBlock0DemoTrace({

        phase,

        workMap: phase === "login" || phase === "estado_a" ? null : workMap,

        visibleDraftWorkMap,

        savedWorkMapSnapshot,

        sourceMode: workMapSourceMode,

        wasExampleLoaded,

        wasManualEditedAfterExample,

        workMapSavedAt,

        primaryActivitySelectionResult,

        block0Progress,

      }),

    [

      block0Progress,

      phase,

      primaryActivitySelectionResult,

      savedWorkMapSnapshot,

      visibleDraftWorkMap,

      wasExampleLoaded,

      wasManualEditedAfterExample,

      workMap,

      workMapSavedAt,

      workMapSourceMode,

    ],

  );



  const resetDemo = useCallback(() => {

    clearDemoWorkMapDraft();

    setPhase("login");

    setShowTrace(false);

    setAuthDisplayName("Usuario Demo");

    setStartPositionContext(EMPTY_START_POSITION_CONTEXT);

    setWorkMap(null);

    setWorkMapSeed(null);

    setSavedWorkMapSnapshot(null);

    setWorkMapSourceMode(null);

    setWasExampleLoaded(false);

    setWasManualEditedAfterExample(false);

    setWorkMapSavedAt(null);

    setWorkMapSeedKey((current) => current + 1);

    setDraftSyncToken((current) => current + 1);

    setPrimaryActivitySelectionResult(null);

    setBlock0Progress(null);

    setSelectionNotice(null);

    setSubmitNotice(null);

  }, []);



  const enterDemo = useCallback(() => {

    const next = advanceE2eDemoToEstadoA(authDisplayName);

    setAuthDisplayName(next.authDisplayName);

    setStartPositionContext(next.startPositionContext);

    setPhase(next.phase);

    setSubmitNotice(null);

    setSelectionNotice(null);

  }, [authDisplayName]);



  const beginWorkMap = useCallback(() => {

    const initial = createEmptyWorkMap();

    initial.startPositionContext = { ...startPositionContext };

    syncDemoWorkMapDraft(initial);

    setWorkMap(null);

    setWorkMapSeed(initial);

    setSavedWorkMapSnapshot(null);

    setWorkMapSourceMode("manual");

    setWasExampleLoaded(false);

    setWasManualEditedAfterExample(false);

    setWorkMapSavedAt(null);

    setWorkMapSeedKey((current) => current + 1);

    setDraftSyncToken((current) => current + 1);

    setPrimaryActivitySelectionResult(null);

    setBlock0Progress(null);

    setSelectionNotice(null);

    setSubmitNotice(null);

    setPhase("work_map");

  }, [startPositionContext]);



  const loadFinancialExample = useCallback(() => {

    const example = createE2eFinancialExampleWorkMap(startPositionContext);

    syncDemoWorkMapDraft(example);

    setWorkMap(null);

    setWorkMapSeed(example);

    setSavedWorkMapSnapshot(null);

    setWorkMapSourceMode("loaded_financial_example");

    setWasExampleLoaded(true);

    setWasManualEditedAfterExample(false);

    setWorkMapSavedAt(null);

    setWorkMapSeedKey((current) => current + 1);

    setDraftSyncToken((current) => current + 1);

    setSelectionNotice(null);

    setSubmitNotice(null);

  }, [startPositionContext]);



  const applySavedWorkMapSnapshot = useCallback(

    (draft: WorkMapData) => {

      const nextSourceMode = resolveE2eSourceModeAfterSave({

        declaredSourceMode: workMapSourceMode,

        wasExampleLoaded,

        savedWorkMap: draft,

      });

      setWorkMapSourceMode(nextSourceMode);

      if (

        wasExampleLoaded &&

        nextSourceMode === "manual_modified_from_example"

      ) {

        setWasManualEditedAfterExample(true);

      }

      setSavedWorkMapSnapshot(draft);

      setWorkMap(draft);

      setWorkMapSeed(draft);

      setWorkMapSavedAt(new Date().toISOString());

      syncDemoWorkMapDraft(draft);

      setDraftSyncToken((current) => current + 1);

    },

    [wasExampleLoaded, workMapSourceMode],

  );



  const handleWorkMapSave = useCallback(

    async (draft: WorkMapData) => {

      applySavedWorkMapSnapshot(draft);

      setSelectionNotice(null);

    },

    [applySavedWorkMapSnapshot],

  );



  const handleWorkMapContinue = useCallback(async (draft: WorkMapData) => {

    const selection = selectPrimaryActivitiesFromWorkMap(draft);

    if (selection.mode === "reentry_required") {

      setSelectionNotice(

        "El mapa necesita actividades con más detalle antes de continuar.",

      );

      applySavedWorkMapSnapshot(draft);

      return;

    }



    applySavedWorkMapSnapshot(draft);

    setPrimaryActivitySelectionResult(selection);

    setBlock0Progress(null);

    setSelectionNotice(null);

    setSubmitNotice(null);

    setPhase("significado");

  }, [applySavedWorkMapSnapshot]);



  const handleSignificadoContinue = useCallback((submitResult: SignificadoSubmitPayload) => {

    setSubmitNotice(

      `Demo completada: se capturaron ${Object.keys(submitResult.block0Answers ?? {}).length} respuestas de revisión.`,

    );

  }, []);



  const workMapStatusLine = useMemo(() => {

    if (!visibleDraftWorkMap) {

      return "Sin borrador visible.";

    }

    const responsibilities = countWorkMapResponsibilities(visibleDraftWorkMap);

    const activities = countFilledWorkMapActivities(visibleDraftWorkMap);

    const savedLabel = savedWorkMapSnapshot?.isSaved ? "guardado" : "sin guardar";

    return `Fuente actual: ${formatSourceModeLabel(workMapSourceMode)} · ${responsibilities} responsabilidades · ${activities} actividades · ${savedLabel}.`;

  }, [

    savedWorkMapSnapshot?.isSaved,

    visibleDraftWorkMap,

    workMapSourceMode,

  ]);



  if (!isClientReady) {

    return (

      <main className="min-h-screen bg-[#f5f5f5]">

        <div className="border-b border-neutral-200 bg-white px-4 py-2 text-center text-xs text-neutral-700">

          Demo controlada · Login demo → Comienza tu levantamiento → WorkMap → Significado

        </div>

        <div className="flex min-h-[calc(100vh-2.5rem)] items-center justify-center text-sm text-neutral-600">

          Preparando demo controlada…

        </div>

      </main>

    );

  }



  return (

    <main className="min-h-screen bg-[#f5f5f5]">

      <div className="border-b border-neutral-200 bg-white px-4 py-2 text-center text-xs text-neutral-700">

        <span>

          Demo controlada · Login demo → Comienza tu levantamiento → WorkMap → Significado

        </span>

        <button

          className="ml-3 rounded border border-neutral-300 bg-white px-2 py-0.5 font-medium text-neutral-800 hover:bg-neutral-50"

          onClick={resetDemo}

          type="button"

        >

          Reset demo

        </button>

      </div>



      <DevTracePanel

        onToggleTrace={() => setShowTrace((current) => !current)}

        showTrace={showTrace}

        trace={trace}

      />



      {selectionNotice ? (

        <div

          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900"

          role="alert"

        >

          {selectionNotice}

        </div>

      ) : null}



      {submitNotice ? (

        <div

          className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-900"

          role="status"

        >

          {submitNotice}

        </div>

      ) : null}



      {phase === "login" ? (

        <E2eBlock0DemoLoginPanel onEnterDemo={enterDemo} />

      ) : null}



      {phase === "estado_a" ? (

        <ClientShell variant="landing">

          <EmptyAssessmentState

            creating={false}

            greetingName={authDisplayName}

            onStartCommercial={beginWorkMap}

            onStartPositionContextChange={setStartPositionContext}

            startPositionContext={startPositionContext}

          />

        </ClientShell>

      ) : null}



      {phase === "work_map" && workMapSeed ? (

        <ClientShell variant="landing" withSidebar={false}>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

            <div className="border-b border-neutral-200 bg-[#f7f7f2] px-4 py-2 text-center text-xs text-neutral-600">

              <button

                className="rounded border border-neutral-300 bg-white px-3 py-1.5 font-medium text-neutral-800 hover:bg-neutral-50"

                onClick={loadFinancialExample}

                type="button"

              >

                Cargar ejemplo financiero

              </button>

              <span className="ml-2 text-neutral-500">{workMapStatusLine}</span>

            </div>

            <WorkMapIntake

              key={workMapSeedKey}

              initialWorkMap={workMapSeed}

              onContinue={handleWorkMapContinue}

              onSave={handleWorkMapSave}

              onStartPositionContextChange={setStartPositionContext}

              sessionId={E2E_BLOCK0_DEMO_SESSION_ID}

              startPositionContext={startPositionContext}

              userFirstName={authDisplayName}

            />

          </div>

        </ClientShell>

      ) : null}



      {phase === "significado" && workMap ? (

        <SignificadoDeTuTrabajo

          layout="standalone"

          onBack={() => {

            setBlock0Progress(null);

            if (workMap) {

              setWorkMapSeed(workMap);

              syncDemoWorkMapDraft(workMap);

              setDraftSyncToken((current) => current + 1);

            }

            setPhase("work_map");

          }}

          onBlock0ReviewProgressChange={setBlock0Progress}

          onContinue={handleSignificadoContinue}

          primaryActivitySelectionResult={primaryActivitySelectionResult}

          sessionId={E2E_BLOCK0_DEMO_SESSION_ID}

          sessionMode="demo"

          userDisplayName={authDisplayName}

          workMap={workMap}

        />

      ) : null}

    </main>

  );

}



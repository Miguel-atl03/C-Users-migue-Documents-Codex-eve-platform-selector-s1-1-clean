import { register } from "node:module";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");
const hookPath = join(tmpdir(), "eve-operational-description-coach-trace-path-hook.mjs");

writeFileSync(
  hookPath,
  `import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const projectRoot = ${JSON.stringify(projectRoot)};

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let mappedPath = resolvePath(projectRoot, "src", specifier.slice(2));
    if (!/\\.(tsx?|jsx?|mjs|cjs)$/.test(mappedPath)) {
      mappedPath += ".ts";
    }
    return {
      shortCircuit: true,
      url: pathToFileURL(mappedPath).href,
    };
  }
  return nextResolve(specifier, context);
}
`,
);

register(pathToFileURL(hookPath).href, import.meta.url);

const {
  buildOperationalDescriptionCoachEvent,
  coachEventPreguntaId,
  parseCoachEventFromRow,
  shouldPersistCoachEvent,
} = await import("@/services/operational-description-coach/coach-event");
const { evaluateOperationalDescriptionCoach } = await import(
  "@/services/operational-description-coach/evaluate-operational-description-coach"
);

const FINANCE_CONTEXT = {
  activityTitle:
    "Analizo la proyección mensual de erogaciones comparando el gasto real contra Oracle para generar reportes de desviaciones con análisis de causa raíz.",
  actionVerb: "Analizo",
  inputOrObject:
    "la proyección mensual de erogaciones y el gasto real registrado en Oracle",
  outputOrResult: "reporte de desviaciones con análisis de causa raíz",
};

test("coach event builder captures scan and narrative context", () => {
  const result = evaluateOperationalDescriptionCoach(
    "Comparo la proyeccion",
    FINANCE_CONTEXT,
  );
  const event = buildOperationalDescriptionCoachEvent({
    sessionId: "session-1",
    draftText: "Comparo la proyeccion",
    context: FINANCE_CONTEXT,
    result,
    workMapActivityId: "act-1",
    eventId: "event-1",
    occurredAt: "2026-06-15T12:00:00.000Z",
  });

  assert.ok(event);
  assert.equal(event?.questionId, "B0-Q02");
  assert.equal(event?.workMapActivityId, "act-1");
  assert.equal(event?.contextSummary.narrativeMode, true);
  assert.equal(event?.scan.priorityGap, "transformation_core");
});

test("coach event dedup skips identical consecutive traces", () => {
  const event = buildOperationalDescriptionCoachEvent({
    sessionId: "session-1",
    draftText: "Comparo la proyeccion",
    context: FINANCE_CONTEXT,
    result: evaluateOperationalDescriptionCoach(
      "Comparo la proyeccion",
      FINANCE_CONTEXT,
    ),
    workMapActivityId: "act-1",
    eventId: "event-1",
  });

  assert.ok(event);
  assert.equal(shouldPersistCoachEvent(event!, event), false);
  assert.equal(
    shouldPersistCoachEvent(
      {
        ...event!,
        coachMessage: "Otro mensaje distinto",
      },
      event,
    ),
    true,
  );
});

test("coach event row parser roundtrips persisted payload", () => {
  const event = buildOperationalDescriptionCoachEvent({
    sessionId: "session-1",
    draftText: "Comparo la proyeccion",
    context: FINANCE_CONTEXT,
    result: evaluateOperationalDescriptionCoach(
      "Comparo la proyeccion",
      FINANCE_CONTEXT,
    ),
    workMapActivityId: "act-1",
    eventId: "event-abc",
  });

  assert.ok(event);
  const parsed = parseCoachEventFromRow({
    pregunta_id: coachEventPreguntaId("event-abc"),
    texto_libre: JSON.stringify(event),
    actividad_id: null,
    created_at: "2026-06-15T12:00:00.000Z",
  });

  assert.equal(parsed?.eventId, "event-abc");
  assert.equal(parsed?.coachMessage, event?.coachMessage);
});

test("coach API route exposes GET trace and session guard", async () => {
  const routeSource = await import("node:fs").then((fs) =>
    fs.readFileSync(
      join(projectRoot, "src/app/api/coach/operational-description/route.ts"),
      "utf8",
    ),
  );

  assert.match(routeSource, /export async function GET/);
  assert.match(routeSource, /persistOperationalDescriptionCoachTrace/);
  assert.match(routeSource, /resolveSessionOwner/);
});

test("significado wiring passes session mode and activity id to coach hook", async () => {
  const componentSource = await import("node:fs").then((fs) =>
    fs.readFileSync(
      join(projectRoot, "src/components/significado/SignificadoDeTuTrabajo.tsx"),
      "utf8",
    ),
  );
  const hookSource = await import("node:fs").then((fs) =>
    fs.readFileSync(
      join(projectRoot, "src/hooks/use-operational-description-coach.ts"),
      "utf8",
    ),
  );

  assert.match(componentSource, /workMapActivityId/);
  assert.match(componentSource, /sessionMode/);
  assert.match(hookSource, /workMapActivityId/);
  assert.match(hookSource, /mode: sessionMode/);
});

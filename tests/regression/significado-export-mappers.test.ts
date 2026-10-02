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
const hookPath = join(tmpdir(), "eve-significado-export-path-hook.mjs");

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
  buildOperationalDescriptionCoachTraceExports,
  buildSignificadoBlock0AnswerExports,
  isSignificadoBlock0AnswerPreguntaId,
  parseSignificadoBlock0QuestionKey,
  significadoBlock0PreguntaId,
} = await import("@/services/export/significado-export-mappers");
const { buildOperationalDescriptionCoachEvent } = await import(
  "@/services/operational-description-coach/coach-event"
);
const { evaluateOperationalDescriptionCoach } = await import(
  "@/services/operational-description-coach/evaluate-operational-description-coach"
);

const activityExports = [
  {
    activityId: "legacy-1",
    order: 1,
    text: "Actividad principal",
    role: "principal",
    structuralRecommendation: "primary_candidate",
    rankingScore: 10,
    coverageRatio: 0.8,
    closureState: null,
    closureQuality: null,
    closureConfidence: null,
    missionFinal: null,
    consistencyAlertCount: 0,
    createdAt: null,
    provenance: {
      source: "user_captured",
      sourceTable: "actividades",
      sourceField: "ancla_narrativa",
      sourceId: "legacy-1",
      capturedAt: null,
      notes: "",
    },
  },
] as const;

const FINANCE_CONTEXT = {
  activityTitle:
    "Analizo la proyección mensual de erogaciones comparando el gasto real contra Oracle para generar reportes de desviaciones con análisis de causa raíz.",
  actionVerb: "Analizo",
};

test("significado block0 pregunta ids exclude coach events", () => {
  assert.equal(significadoBlock0PreguntaId("B0-Q02"), "SIGNIFICADO:B0-Q02");
  assert.equal(
    significadoBlock0PreguntaId("B0-Q01.action_verb"),
    "SIGNIFICADO:B0-Q01.action_verb",
  );
  assert.equal(isSignificadoBlock0AnswerPreguntaId("SIGNIFICADO:B0-Q02"), true);
  assert.equal(
    isSignificadoBlock0AnswerPreguntaId(
      "SIGNIFICADO:B0-Q02_COACH_EVENT:abc",
    ),
    false,
  );
  assert.deepEqual(parseSignificadoBlock0QuestionKey("SIGNIFICADO:B0-Q02"), {
    questionKey: "B0-Q02",
    questionCode: "B0-Q02",
    subfieldId: null,
  });
});

test("coach trace export mapper reconstructs persisted events", () => {
  const result = evaluateOperationalDescriptionCoach(
    "Comparo la proyeccion",
    FINANCE_CONTEXT,
  );
  const event = buildOperationalDescriptionCoachEvent({
    sessionId: "session-1",
    draftText: "Comparo la proyeccion",
    context: FINANCE_CONTEXT,
    result,
    workMapActivityId: "wm-1",
    legacyActivityId: "legacy-1",
    eventId: "event-1",
    occurredAt: "2026-06-15T12:00:00.000Z",
  });

  const traces = buildOperationalDescriptionCoachTraceExports({
    answerRows: [
      {
        id: "row-1",
        actividad_id: "legacy-1",
        pregunta_id: "SIGNIFICADO:B0-Q02_COACH_EVENT:event-1",
        texto_libre: JSON.stringify(event),
        updated_at: "2026-06-15T12:00:00.000Z",
      },
    ],
    activityExports: [...activityExports],
  });

  assert.equal(traces.length, 1);
  assert.equal(traces[0]?.eventId, "event-1");
  assert.equal(traces[0]?.activityOrder, 1);
  assert.equal(traces[0]?.workMapActivityId, "wm-1");
  assert.equal(traces[0]?.coachSource, "deterministic");
});

test("block0 answer export mapper includes B0-Q02 text", () => {
  const rows = buildSignificadoBlock0AnswerExports({
    answerRows: [
      {
        id: "row-2",
        actividad_id: "legacy-1",
        pregunta_id: "SIGNIFICADO:B0-Q02",
        texto_libre: "Comparo la proyeccion mensual y escalo desviaciones.",
        updated_at: "2026-06-15T12:05:00.000Z",
      },
      {
        id: "row-3",
        actividad_id: "legacy-1",
        pregunta_id: "SIGNIFICADO:B0-Q02_COACH_EVENT:event-1",
        texto_libre: "{}",
        updated_at: "2026-06-15T12:00:00.000Z",
      },
    ],
    activityExports: [...activityExports],
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.questionCode, "B0-Q02");
  assert.match(rows[0]?.answerText ?? "", /Comparo la proyeccion mensual/);
  assert.equal(rows[0]?.activityOrder, 1);
});

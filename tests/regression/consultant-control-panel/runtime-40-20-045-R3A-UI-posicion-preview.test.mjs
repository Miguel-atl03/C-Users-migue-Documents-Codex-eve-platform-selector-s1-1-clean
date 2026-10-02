import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function mustExist(rel) {
  assert.equal(fs.existsSync(path.join(root, rel)), true, `missing ${rel}`);
}

test("UI-Posición A — companion preview files exist", () => {
  mustExist("src/app/dev/ui-posicion/page.tsx");
  mustExist("src/components/eve-local-canvas/LocalEstadoAPositionCuadrantesProposal.tsx");
  mustExist("src/components/eve-local-canvas/canvas-posicion-cuadrantes.module.css");
  mustExist("src/components/eve-local-canvas/posicion-cuadrantes-copy.ts");
});

test("UI-Posición B — mock v4 copy + Otro + complete gate", () => {
  const copy = read("src/components/eve-local-canvas/posicion-cuadrantes-copy.ts");
  assert.match(copy, /¿Cuando el trabajo ocurre, qué papel sueles ocupar\?/);
  assert.match(copy, /Cuando hay que decidir algo, ¿qué suele pasar contigo\?/);
  assert.match(copy, /id: "other"/);
  assert.match(copy, /isPosicionCuadrantesComplete/);
  assert.match(copy, /roleOther/);
  assert.match(copy, /POSICION_BREATH/);
  assert.match(copy, /POSICION_CHOICE_HINT/);
  assert.match(copy, /otherEngraved/);
  assert.match(copy, /sheetSaved/);
  assert.match(copy, /commitPosicionCuadrantes/);
  assert.match(copy, /getPosicionTraceStatus/);
  assert.match(copy, /touchPosicionCuadrantes/);
  assert.match(copy, /resolveRoleMarkLabel/);
});

test("UI-Posición C — proposal: inscriptions, no form controls", () => {
  const proposal = read(
    "src/components/eve-local-canvas/LocalEstadoAPositionCuadrantesProposal.tsx",
  );
  assert.match(proposal, /role="radiogroup"/);
  assert.match(proposal, /aria-pressed/);
  assert.match(proposal, /otherEditing/);
  assert.match(proposal, /otherInput/);
  assert.match(proposal, /columnHead/);
  assert.match(proposal, /choiceHintEnter/);
  assert.match(proposal, /choiceHintSettled/);
  assert.match(proposal, /POSICION_CHOICE_HINT/);
  assert.match(proposal, /roomBlock/);
  assert.match(proposal, /traceWrap/);
  assert.match(proposal, /Comienza tu levantamiento/);
  assert.match(proposal, /commitPosicionCuadrantes/);
  assert.match(proposal, /getPosicionTraceStatus/);
  assert.match(proposal, /traceSaved/);
  assert.match(proposal, /Guardado/);
  assert.match(proposal, /traceReady/);
  assert.doesNotMatch(proposal, /type="radio"/);
  assert.doesNotMatch(proposal, /type="checkbox"/);
  assert.doesNotMatch(proposal, /Posición cuadrantes v4 · autorizado/);
  assert.doesNotMatch(proposal, /previewTag/);
});

test("UI-Posición D — wired into productive intake_sheet", () => {
  const experience = read("src/components/eve-local-canvas/LocalCanvasExperience.tsx");
  assert.match(experience, /LocalEstadoAPositionCuadrantesSection/);
  assert.match(experience, /mode === "intake_sheet"/);
  mustExist("src/components/eve-local-canvas/LocalEstadoAPositionCuadrantesSection.tsx");
  mustExist("src/app/dev/ui-posicion-workmap/page.tsx");
});

test("UI-Posición E — dev page uses local mock state + preview memory", () => {
  const preview = read("src/app/dev/ui-posicion/page.tsx");
  assert.match(preview, /LocalEstadoAPositionCuadrantesProposal/);
  assert.match(preview, /EMPTY_POSICION_CUADRANTES_STATE/);
  assert.match(preview, /useState/);
  assert.match(preview, /localStorage/);
  assert.match(preview, /life/);
  assert.match(preview, /useLayoutEffect/);
  assert.match(preview, /fresh/);
  assert.doesNotMatch(preview, /from ["']@\/lib\/supabase/);
});

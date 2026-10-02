import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const attention = readFileSync(
  resolve(
    "src/features/official-consultant-control-panel/components/AttentionGovernancePanel.tsx",
  ),
  "utf8",
);

const css = readFileSync(
  resolve(
    "src/features/official-consultant-control-panel/styles/official-control-panel.module.css",
  ),
  "utf8",
);

test("collapsed rail uses horizontal title like Hitos Core without br", () => {
  assert.doesNotMatch(attention, /<br\s*\/?>/i);
  assert.doesNotMatch(attention, /contextDrawerVerticalText/);
  assert.match(attention, /className=\{styles\.railYTitle\}/);
  assert.match(attention, /aria-label="Abrir panel contextual"/);
  assert.match(attention, /aria-expanded="false"/);
  assert.match(attention, /data-testid="attention-collapsed-rail"/);
  assert.match(attention, /data-testid="attention-open-drawer"/);
  assert.match(attention, /data-testid="attention-open-drawer-label"/);
  assert.match(attention, /aria-hidden="true"/);
});

test("collapsed rail CSS locks writing-mode horizontal-tb", () => {
  assert.match(
    css,
    /\.contextDrawerCollapsedRail \.railYTitle[\s\S]*writing-mode:\s*horizontal-tb/,
  );
  assert.match(
    css,
    /\.contextDrawerCollapsedToggle[\s\S]*writing-mode:\s*horizontal-tb/,
  );
  assert.match(
    css,
    /Collapsed Attention rail stays horizontal \(parity with Hitos Core\)/,
  );
  assert.doesNotMatch(css, /\.contextDrawerVerticalText/);
  assert.doesNotMatch(
    css,
    /contextDrawerCollapsedRail[\s\S]{0,800}writing-mode:\s*vertical-rl/i,
  );
  const mediaIdx = css.lastIndexOf("@media");
  assert.ok(mediaIdx > 0);
  const lastMedia = css.slice(mediaIdx);
  assert.match(lastMedia, /writing-mode:\s*horizontal-tb\s*!important/);
  assert.doesNotMatch(lastMedia, /writing-mode:\s*vertical-rl/i);
});

test("expanded drawer toggle is not forced vertical", () => {
  const expandedToggleBlock = attention.slice(
    attention.indexOf("Cerrar panel contextual"),
    attention.indexOf("Cerrar panel contextual") + 120,
  );
  assert.doesNotMatch(expandedToggleBlock, /contextDrawerCollapsedToggle/);
  assert.doesNotMatch(expandedToggleBlock, /contextDrawerVerticalText/);
});

test("drawer has no obsolete placeholder for §§15–17", () => {
  assert.doesNotMatch(
    attention,
    /Las alertas y la gobernanza se habilitarán en las siguientes unidades/,
  );
  assert.match(attention, /Sin alertas activas para el caso/);
  assert.match(attention, /attentionComplete/);
});

test("e2e rail covers desktop tablet mobile geometry", () => {
  const e2e = readFileSync(
    resolve(
      "tests/e2e/official-consultant-control-panel-experience-governance-correction.spec.ts",
    ),
    "utf8",
  );
  assert.match(e2e, /1440/);
  assert.match(e2e, /1024/);
  assert.match(e2e, /390/);
  assert.match(e2e, /horizontal-tb/);
});

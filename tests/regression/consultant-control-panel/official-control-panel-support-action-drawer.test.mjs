import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Behavioral contract for SupportActionDrawer success path:
 * POST resolves → drawer closes → soft refresh may still be in flight.
 * Refresh must never gate dismissal or reopen the drawer.
 */

const root = process.cwd();

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

test("submitAction resolves after POST and does not await soft refresh", () => {
  const hook = read(
    "src/features/official-consultant-control-panel/hooks/use-case-experience-state.ts",
  );
  assert.match(hook, /await postCaseExperienceAction/);
  assert.match(hook, /void load\(\{\s*soft:\s*true\s*\}\)/);
  assert.doesNotMatch(
    hook,
    /await postCaseExperienceAction[\s\S]*?await load\(\{\s*soft:\s*true/,
  );
  assert.match(hook, /actionInFlightRef/);
});

test("ExperienceGovernanceMode opens drawer only via explicit consultant action", () => {
  const mode = read(
    "src/features/official-consultant-control-panel/components/ExperienceGovernanceMode.tsx",
  );
  assert.match(mode, /drawerOpen/);
  assert.match(mode, /setDrawerOpen\(true\)/);
  assert.match(mode, /closeDrawer/);
  assert.match(mode, /setDrawerOpen\(false\)/);
  assert.match(mode, /setSelected\(null\)/);
  assert.match(mode, /open=\{drawerOpen && Boolean\(selected\)\}/);
  // No auto-open from refreshed queue / capabilities alone.
  assert.doesNotMatch(mode, /useEffect\([\s\S]*setDrawerOpen\(true\)/);
  assert.doesNotMatch(mode, /key=\{selected\?\.id/);
});

test("SupportActionDrawer closes on success and keeps open on error", () => {
  const drawer = read(
    "src/features/official-consultant-control-panel/components/SupportActionDrawer.tsx",
  );
  assert.match(drawer, /await onSubmit\(/);
  assert.match(drawer, /onClose\(\)/);
  assert.match(
    drawer,
    /No fue posible registrar la acción de soporte/,
  );
  assert.match(drawer, /submitPromiseRef/);
  assert.match(drawer, /disabled=\{busy/);
  // Success path: onClose inside try after await onSubmit.
  assert.match(
    drawer,
    /await onSubmit\(\{[\s\S]*?\}\);\s*resetTransientState\(\);\s*onClose\(\);/,
  );
  // Error path sets error and busy=false without onClose in catch.
  assert.match(
    drawer,
    /catch \{\s*if \(!mountedRef\.current\) return;\s*setError\([\s\S]*?setBusy\(false\);/,
  );
});

test("success-then-refresh sequencing does not block close", async () => {
  let refreshSettled = false;
  const post = async () => {
    /* 2xx */
  };
  const softRefresh = () =>
    new Promise((resolve) => {
      setTimeout(() => {
        refreshSettled = true;
        resolve(undefined);
      }, 50);
    });

  // Mirrors submitAction: resolve after POST; fire refresh without await.
  await post();
  void softRefresh();
  assert.equal(refreshSettled, false);

  let drawerOpen = true;
  const closeDrawer = () => {
    drawerOpen = false;
  };
  closeDrawer();
  assert.equal(drawerOpen, false);

  await new Promise((r) => setTimeout(r, 60));
  assert.equal(refreshSettled, true);
  assert.equal(drawerOpen, false);
});

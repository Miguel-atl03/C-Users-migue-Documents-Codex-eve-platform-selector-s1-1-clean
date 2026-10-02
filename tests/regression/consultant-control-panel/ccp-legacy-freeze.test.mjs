import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

function readText(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

function assertExists(relativePath) {
  assert.equal(existsSync(resolve(projectRoot, relativePath)), true, `Missing ${relativePath}`);
}

function listFilesRecursive(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFilesRecursive(full));
    else files.push(full);
  }
  return files;
}

const hookPath = join(tmpdir(), "eve-ccp-legacy-freeze-path-hook.mjs");
writeFileSync(
  hookPath,
  `import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";
const projectRoot = ${JSON.stringify(projectRoot)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let mappedPath = resolvePath(projectRoot, "src", specifier.slice(2));
    if (!/\\.(tsx?|jsx?|mjs|cjs)$/.test(mappedPath)) {
      mappedPath += ".ts";
    }
    return { shortCircuit: true, url: pathToFileURL(mappedPath).href };
  }
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\\.(tsx?|jsx?|mjs|cjs|json)$/.test(specifier) &&
    context.parentURL
  ) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const withTs = resolvePath(parentDir, specifier + ".ts");
    const withTsx = resolvePath(parentDir, specifier + ".tsx");
    if (existsSync(withTs)) {
      return { shortCircuit: true, url: pathToFileURL(withTs).href };
    }
    if (existsSync(withTsx)) {
      return { shortCircuit: true, url: pathToFileURL(withTsx).href };
    }
  }
  return nextResolve(specifier, context);
}
`,
);
register(pathToFileURL(hookPath).href);

const { LEGACY_CONSULTANT_CONTROL_PANEL_STATUS } = await import(
  "@/services/eve/consultant-control-panel/legacy-consultant-control-panel-status.ts"
);
const { OFFICIAL_CONTROL_PANEL_STATUS } = await import(
  "@/features/official-consultant-control-panel/index.ts"
);

test("legacy CCP status is draft and not official", () => {
  assert.equal(LEGACY_CONSULTANT_CONTROL_PANEL_STATUS.official, false);
  assert.equal(LEGACY_CONSULTANT_CONTROL_PANEL_STATUS.status, "draft");
  assert.equal(LEGACY_CONSULTANT_CONTROL_PANEL_STATUS.label, "BORRADOR NO OFICIAL");
});

test("official control panel status is design_pending and not started", () => {
  assert.equal(OFFICIAL_CONTROL_PANEL_STATUS.implementationStarted, false);
  assert.equal(OFFICIAL_CONTROL_PANEL_STATUS.status, "design_pending");
  assert.equal(OFFICIAL_CONTROL_PANEL_STATUS.official, true);
});

test("legacy route, docs, and badge wiring remain available", () => {
  assertExists("src/app/admin/consultant-control-panel/page.tsx");
  assertExists("docs/drafts/consultant-control-panel-legacy/README.md");
  assertExists("src/features/official-consultant-control-panel/README.md");
  assertExists("src/features/official-consultant-control-panel/index.ts");
  assertExists("src/app/admin/official-consultant-control-panel/page.tsx");

  const page = readText("src/app/admin/consultant-control-panel/page.tsx");
  assert.match(page, /LEGACY \/ DRAFT MODULE/);

  const header = readText("src/components/consultant/control-panel/PMCaseHeader.tsx");
  assert.match(header, /LEGACY_CONSULTANT_CONTROL_PANEL_STATUS/);
  assert.match(header, /ccp-legacy-draft-badge/);
  assert.match(
    header,
    /Esta pantalla se conserva únicamente como referencia histórica/,
  );

  const nav = readText("src/app/admin/runtime-vsm/page.tsx");
  assert.match(nav, /Panel anterior — Borrador/);

  const officialPage = readText(
    "src/app/admin/official-consultant-control-panel/page.tsx",
  );
  assert.doesNotMatch(
    officialPage,
    /redirect\s*\(\s*["']\/admin\/consultant-control-panel/,
  );
});

test("official Unit 1 shell exists without legacy UI imports", () => {
  const officialDir = resolve(projectRoot, "src/features/official-consultant-control-panel");
  const files = listFilesRecursive(officialDir).map((f) =>
    f.slice(officialDir.length + 1).replace(/\\/g, "/"),
  );

  assert.ok(files.includes("README.md"));
  assert.ok(files.includes("index.ts"));
  assert.ok(files.includes("components/OfficialControlPanelShell.tsx"));
  assert.ok(files.includes("config/official-control-panel-status.ts"));

  for (const relative of files) {
    if (!/\.(tsx?|mjs|css|md)$/.test(relative)) continue;
    const text = readText(`src/features/official-consultant-control-panel/${relative}`);
    assert.doesNotMatch(text, /from ["']@\/components\/consultant\/control-panel/);
    assert.doesNotMatch(text, /ConsultantControlPanelPMShell/);
    assert.doesNotMatch(text, /PMCaseHeader/);
    assert.doesNotMatch(text, /legacy-consultant-control-panel-status/);
  }
});

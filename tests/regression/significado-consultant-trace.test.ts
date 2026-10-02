import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../..");

function readText(relativePath: string) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

const hookPath = join(tmpdir(), "eve-significado-consultant-trace-path-hook.mjs");

function registerPathHook() {
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
}

test("consultant significado trace admin routes exist", () => {
  for (const path of [
    "src/app/admin/significado-trace/page.tsx",
    "src/app/admin/significado-trace/[sessionId]/page.tsx",
    "src/components/consultant/SignificadoConsultantTraceView.tsx",
    "src/services/significado-consultant-trace.ts",
  ]) {
    assert.equal(existsSync(resolve(projectRoot, path)), true, `Missing ${path}`);
  }
});

test("consultant trace view renders coach and block0 sections", () => {
  const view = readText("src/components/consultant/SignificadoConsultantTraceView.tsx");

  assert.match(view, /Trazas del coach/);
  assert.match(view, /B0-Q02 · Descripción operativa/);
  assert.match(view, /Respuestas Significado/);
  assert.match(view, /Descargar Excel/);
  assert.match(view, /coachSourceLabels/);
  assert.match(view, /Supabase no configurado para esta prueba local/);
  assert.match(view, /No se consultaron datos reales/);
});

test("consultant trace builder guards missing supabase env", () => {
  const service = readText("src/services/significado-consultant-trace.ts");
  const supabaseServer = readText("src/lib/supabase-server.ts");

  assert.match(service, /isSupabaseConfigured/);
  assert.match(service, /supabase_missing_env/);
  assert.match(supabaseServer, /export const isSupabaseConfigured/);
  assert.match(supabaseServer, /function requireSupabaseEnv/);
  assert.doesNotMatch(
    supabaseServer,
    /^[\s\S]*export const isSupabaseConfigured[\s\S]*^if \(!supabaseUrl \|\| !supabaseAnonKey\)/m,
  );
});

test("consultant trace builder loads coach events and block0 answers when configured", () => {
  const service = readText("src/services/significado-consultant-trace.ts");

  assert.match(service, /listOperationalDescriptionCoachEvents/);
  assert.match(service, /listSignificadoBlock0Answers/);
  assert.match(service, /operationalDescriptionFinal/);
  assert.match(service, /status: "loaded"/);
});

test("consultant trace builder does not activate diagnosis export or transduction", () => {
  const service = readText("src/services/significado-consultant-trace.ts");
  const sessionPage = readText("src/app/admin/significado-trace/[sessionId]/page.tsx");

  assert.doesNotMatch(service, /diagnostics/);
  assert.doesNotMatch(service, /transduction/);
  assert.doesNotMatch(service, /parallel-production/);
  assert.doesNotMatch(sessionPage, /diagnostics/);
  assert.doesNotMatch(sessionPage, /transduction/);
});

test("significado trace lookup links back to runtime vsm", () => {
  const page = readText("src/app/admin/significado-trace/page.tsx");
  assert.match(page, /\/admin\/runtime-vsm/);
});

test("buildSignificadoConsultantTrace returns controlled state without supabase env", async () => {
  registerPathHook();

  const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const savedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const { buildSignificadoConsultantTrace } = await import(
      "@/services/significado-consultant-trace"
    );

    const trace = await buildSignificadoConsultantTrace("test-session");

    assert.equal(trace.status, "supabase_missing_env");
    assert.equal(trace.sessionId, "test-session");
    assert.equal(trace.session, null);
    assert.deepEqual(trace.coachEvents, []);
    assert.deepEqual(trace.block0Answers, []);
    assert.equal(trace.operationalDescriptionFinal, null);
  } finally {
    if (savedUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
    }

    if (savedKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = savedKey;
    }
  }
});

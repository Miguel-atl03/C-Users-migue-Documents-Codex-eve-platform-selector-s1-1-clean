import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(tmpdir(), "eve-official-ccp-r2b-path-hook.mjs");
writeFileSync(
  hookPath,
  `import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";
const root = ${JSON.stringify(projectRoot)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = resolvePath(root, "src", specifier.slice(2));
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    const base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  return nextResolve(specifier, context);
}
`,
);
register(pathToFileURL(hookPath).href);

const {
  classifyParticipantProfileViewStatus,
  deriveAssignmentPresentation,
  presentParticipantItem,
  presentProfileItem,
  presentProfileResolutionLabel,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/presentation/participant-profile-presentation.ts",
    ),
  ).href
);

const {
  buildParticipantProfileNavigation,
  changeParticipantSelection,
  parseParticipantSelection,
  parseProfileSelection,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/state/participant-profile-navigation.ts",
    ),
  ).href
);

const {
  changeClientContextCase,
  changeClientContextCompany,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/features/official-consultant-control-panel/state/client-context-navigation.ts",
    ),
  ).href
);

function read(relPath) {
  return readFileSync(resolve(projectRoot, relPath), "utf8");
}

test("clasifica empty vs error vs partial vs active", () => {
  assert.equal(
    classifyParticipantProfileViewStatus({
      caseActive: true,
      loadingParticipants: false,
      participantsError: false,
      participants: [],
      loadingProfiles: false,
    }),
    "empty",
  );
  assert.equal(
    classifyParticipantProfileViewStatus({
      caseActive: true,
      loadingParticipants: false,
      participantsError: true,
      participants: [],
      loadingProfiles: false,
    }),
    "error",
  );
  assert.equal(
    classifyParticipantProfileViewStatus({
      caseActive: true,
      loadingParticipants: false,
      participantsError: false,
      participants: [
        {
          id: "p1",
          label: "Persona A",
          profileCount: 1,
          participationStatusLabel: "Activa",
          profileResolutionStatus: "partial",
        },
      ],
      loadingProfiles: false,
    }),
    "partial",
  );
  assert.equal(
    classifyParticipantProfileViewStatus({
      caseActive: true,
      loadingParticipants: false,
      participantsError: false,
      participants: [
        {
          id: "p1",
          label: "Persona A",
          profileCount: 2,
          participationStatusLabel: "Activa",
          profileResolutionStatus: "resolved",
        },
      ],
      loadingProfiles: false,
    }),
    "active",
  );
});

test("traduce estados de perfil sin enums técnicos", () => {
  assert.equal(presentProfileResolutionLabel("resolved"), "Confirmado");
  assert.equal(
    presentProfileResolutionLabel("mixed-unresolved"),
    "Asignación no resuelta",
  );
  assert.equal(
    presentProfileResolutionLabel("reentry-required"),
    "Requiere revisión",
  );
  assert.equal(
    presentProfileResolutionLabel("manual-review-required"),
    "Revisión del consultor",
  );
  const mixed = presentProfileItem({
    id: "pr1",
    label: "Perfil operativo",
    resolutionStatus: "mixed-unresolved",
  });
  assert.equal(mixed.needsReview, true);
  assert.doesNotMatch(mixed.resolutionLabel, /mixed_unresolved/);
});

test("deriva single/multi confirmed y revisión desde perfiles R2A", () => {
  const base = {
    id: "p1",
    label: "Persona A",
    profileCount: 1,
    participationStatusLabel: "Activa",
    profileResolutionStatus: "resolved",
  };
  assert.equal(
    deriveAssignmentPresentation({
      participant: base,
      profiles: [
        { id: "a", label: "Perfil 1", resolutionStatus: "resolved" },
      ],
    }).kind,
    "single_confirmed",
  );
  assert.equal(
    deriveAssignmentPresentation({
      participant: { ...base, profileCount: 2 },
      profiles: [
        { id: "a", label: "Perfil 1", resolutionStatus: "resolved" },
        { id: "b", label: "Perfil 2", resolutionStatus: "resolved" },
      ],
    }).kind,
    "multi_confirmed",
  );
  assert.equal(
    deriveAssignmentPresentation({
      participant: base,
      profiles: [
        {
          id: "a",
          label: "Perfil 1",
          resolutionStatus: "manual-review-required",
        },
      ],
    }).label,
    "Revisión del consultor",
  );
  assert.equal(presentParticipantItem(base).label, "Persona A");
});

test("navegación participant/profile y limpieza al cambiar caso/empresa", () => {
  const current = new URLSearchParams(
    "mode=client-company&view=monitoring&case=19fc9eff-4219-43f0-854c-e2b3350f23f2&participant=p1&profile=pr1&milestone=m1",
  );
  assert.equal(parseParticipantSelection(current), "p1");
  assert.equal(parseProfileSelection(current), "pr1");

  const changedPerson = changeParticipantSelection(current, "p2");
  assert.equal(changedPerson.get("participant"), "p2");
  assert.equal(changedPerson.get("profile"), null);

  const clearedCase = changeClientContextCase(current, {
    companyId: "c1",
    relationshipId: "r1",
    caseId: "other-case",
  });
  assert.equal(clearedCase.get("participant"), null);
  assert.equal(clearedCase.get("profile"), null);
  assert.equal(clearedCase.get("milestone"), null);

  const clearedCompany = changeClientContextCompany(current, "c2");
  assert.equal(clearedCompany.get("participant"), null);
  assert.equal(clearedCompany.get("profile"), null);

  const rebuilt = buildParticipantProfileNavigation(current, {
    participantId: null,
    profileId: "orphan",
  });
  assert.equal(rebuilt.get("participant"), null);
  assert.equal(rebuilt.get("profile"), null);
});

test("shell integra panel sin sustituir rail de hitos ni activar KPI", () => {
  const shell = read(
    "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  );
  assert.match(shell, /CaseParticipantsPanel/);
  assert.match(shell, /CoreMilestoneRail/);
  assert.match(shell, /CoreMilestoneDetail/);
  const participantsIndex = shell.indexOf("<CaseParticipantsPanel");
  const milestoneIndex = shell.indexOf("<CoreMilestoneDetail");
  const matrixIndex = shell.indexOf("<XyInteractionMatrix");
  // Orden rector §§8–9 Monitoreo: detalle → intersección → matriz → personas
  assert.ok(
    participantsIndex >= 0 &&
      milestoneIndex >= 0 &&
      matrixIndex >= 0 &&
      milestoneIndex < matrixIndex &&
      matrixIndex < participantsIndex,
    "Usuarios del caso va después de detalle/matriz (§§8–9)",
  );
  assert.doesNotMatch(shell, /Responsabilidades:.*\[/);
  assert.doesNotMatch(shell, /Ventas|Finanzas|Logística/);

  const strip = read(
    "src/features/official-consultant-control-panel/components/ClientCompanyKpiStrip.tsx",
  );
  assert.match(strip, /—/);
  assert.doesNotMatch(strip, /participantsView/);

  const panel = read(
    "src/features/official-consultant-control-panel/components/CaseParticipantsPanel.tsx",
  );
  assert.match(
    panel,
    /Este caso no tiene personas participantes registradas/,
  );
  assert.match(panel, /Usuarios del caso/);
});

test("reutiliza BFF R2A; no duplica routes", () => {
  const api = read(
    "src/features/official-consultant-control-panel/data/client-context-api.ts",
  );
  assert.match(api, /\/participants/);
  assert.match(api, /\/profiles/);
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/route.ts",
      ),
    ),
  );
  assert.equal(
    existsSync(
      resolve(
        projectRoot,
        "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/people/route.ts",
      ),
    ),
    false,
  );
});

test("docs R2B existen", () => {
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "docs/eve/panel-control/TRAMO_R2B_PARTICIPANT_PROFILE_NAVIGATION.md",
      ),
    ),
  );
  assert.ok(
    existsSync(
      resolve(
        projectRoot,
        "docs/eve/panel-control/TRAMO_R2B_PARTICIPANT_PROFILE_NAVIGATION_DICTAMEN.md",
      ),
    ),
  );
});

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const officialRoot =
  "C:/Users/migue/Documents/Codex/eve-platform-selector-s1-1-clean/external-consumers/eve-platform";
const localRoot = path.join(repoRoot, "src");

const pairs = [
  ["src/services/work-map-activity-validation.ts", "src/services/local-work-map-activity-validation.ts"],
  ["src/services/work-map-responsibility-validation.ts", "src/services/local-work-map-responsibility-validation.ts"],
  ["src/services/work-map-save-validation.ts", "src/services/local-work-map-save-validation.ts"],
  ["src/domain/work-map.ts", "src/domain/local-work-map.ts"],
  [
    "tests/regression/work-map-save-validation.test.ts",
    "tests/regression/local-work-map-save-validation.test.ts",
  ],
];

function fixImports(content) {
  return content
    .replaceAll("@/domain/work-map", "@/domain/local-work-map")
    .replaceAll(
      "@/services/work-map-activity-validation",
      "@/services/local-work-map-activity-validation",
    )
    .replaceAll(
      "@/services/work-map-responsibility-validation",
      "@/services/local-work-map-responsibility-validation",
    )
    .replaceAll(
      "@/services/work-map-save-validation",
      "@/services/local-work-map-save-validation",
    )
    .replaceAll("../../src/domain/work-map.ts", "../../src/domain/local-work-map.ts")
    .replaceAll(
      "../../src/services/work-map-save-validation.ts",
      "../../src/services/local-work-map-save-validation.ts",
    )
    .replaceAll(
      "../../src/services/work-map-responsibility-validation.ts",
      "../../src/services/local-work-map-responsibility-validation.ts",
    )
    .replaceAll(
      "../../src/services/work-map-activity-validation.ts",
      "../../src/services/local-work-map-activity-validation.ts",
    );
}

for (const [srcRel, dstRel] of pairs) {
  const src = path.join(officialRoot, srcRel);
  const dst = path.join(repoRoot, dstRel);
  const content = fixImports(fs.readFileSync(src, "utf8"));
  fs.writeFileSync(dst, content, "utf8");
  console.log(`ported ${dstRel}`);
}

const domainPath = path.join(localRoot, "domain/local-work-map.ts");
let domain = fs.readFileSync(domainPath, "utf8");

domain = domain.replace(
  'export type WorkMapGuideKey = "area" | "responsibility" | "activity" | "save";',
  `export type WorkMapGuideKey =
  | "area"
  | "responsibility"
  | "activity"
  | "save"
  | "roleHelp";`,
);

domain = domain.replace(
  `  return {
    area: false,
    responsibility: false,
    activity: false,
    save: false,
  };`,
  `  return {
    area: false,
    responsibility: false,
    activity: false,
    save: false,
    roleHelp: false,
  };`,
);

domain = domain.replace(
  `    return {
      area: Boolean(candidate.area),
      responsibility: Boolean(candidate.responsibility),
      activity: Boolean(candidate.activity),
      save: Boolean(candidate.save),
    };`,
  `    return {
      area: Boolean(candidate.area),
      responsibility: Boolean(candidate.responsibility),
      activity: Boolean(candidate.activity),
      save: Boolean(candidate.save),
      roleHelp: Boolean(candidate.roleHelp),
    };`,
);

domain = domain.replace(
  `    return {
      area: true,
      responsibility: true,
      activity: true,
      save: true,
    };`,
  `    return {
      area: true,
      responsibility: true,
      activity: true,
      save: true,
      roleHelp: true,
    };`,
);

fs.writeFileSync(domainPath, domain, "utf8");
console.log("merged roleHelp into local-work-map.ts");

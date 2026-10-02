import { NextResponse } from "next/server";
import type { QuestionCatalog } from "@/domain/questionnaire";
import questionCatalogV03 from "@/rules/question-catalog-v03.json";
import { runtimeQuestionCatalog } from "@/runtime/capa1-runtime-manifest";

const catalogs = {
  FULL_V03: questionCatalogV03 as QuestionCatalog,
  CAPA1_V2_1: runtimeQuestionCatalog as QuestionCatalog,
} as const;

type QuestionCatalogVersion = keyof typeof catalogs;

const defaultCatalogVersion: QuestionCatalogVersion = "FULL_V03";

const isQuestionCatalogVersion = (
  value: string | null,
): value is QuestionCatalogVersion =>
  value === "FULL_V03" || value === "CAPA1_V2_1";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedVersion =
    searchParams.get("version") ?? searchParams.get("catalogVersion");

  if (requestedVersion && !isQuestionCatalogVersion(requestedVersion)) {
    return NextResponse.json(
      {
        error: "Version de catalogo no soportada.",
        supportedVersions: Object.keys(catalogs),
        defaultVersion: defaultCatalogVersion,
      },
      { status: 400 },
    );
  }

  const version: QuestionCatalogVersion = isQuestionCatalogVersion(
    requestedVersion,
  )
    ? requestedVersion
    : defaultCatalogVersion;

  return NextResponse.json({
    ...catalogs[version],
    supportedVersions: Object.keys(catalogs),
    defaultVersion: defaultCatalogVersion,
    runtimeSource:
      version === "CAPA1_V2_1" ? "compiled_runtime_manifest" : "legacy_full_v03_catalog",
  });
}
import { access, readFile } from "node:fs/promises";
import * as path from "node:path";
import { inflateRawSync } from "node:zlib";
import type {
  MotherGenericSheetExtract,
  RuntimeBaseInteractionExtract,
  RuntimeCatalogLoaderExtractionReport,
  RuntimeCatalogLoaderInput,
  RuntimeCatalogLoaderResult,
  RuntimeCausalInteractionExtract,
  RuntimeGenericSheetExtract,
  RuntimeRectorDocumentName,
  RuntimeTechnicalSpecExtract,
  SourceRowTrace,
} from "./runtime-40-20-rector-catalog-loader-types";

const RUNTIME_SPEC_DOCUMENT =
  "EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx" as const;
const RUNTIME_CATALOG_DOCUMENT =
  "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx" as const;
const MOTHER_CATALOG_DOCUMENT =
  "EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx" as const;

const REQUIRED_RUNTIME_SHEETS = [
  "Version_Control",
  "Runtime_Interactions_Base_40",
  "Runtime_Interactions_Causal_20",
  "Required_Field_Model",
  "UX_Subfield_Structure",
  "Epistemic_Policy",
  "MMABP_Output_Map",
  "Canonical_Variables",
  "Branching_Budget_Rules",
  "Critical_Routes",
  "Semantic_Resolution_Gates",
  "Process_State_Timer_Gates",
  "Readiness_Gaps_Reentry",
  "Parallel_Production_Contract",
  "QA_Checklist",
  "Implementation_Dictionaries",
];

const RUNTIME_GENERIC_SHEETS: Record<
  string,
  RuntimeGenericSheetExtract["extract_kind"]
> = {
  Version_Control: "version_control",
  Required_Field_Model: "required_field",
  UX_Subfield_Structure: "ux_subfield",
  Epistemic_Policy: "epistemic_policy",
  MMABP_Output_Map: "mmabp_output_map",
  Canonical_Variables: "canonical_variable",
  Branching_Budget_Rules: "branching_rule",
  Critical_Routes: "critical_route",
  Semantic_Resolution_Gates: "semantic_gate",
  Process_State_Timer_Gates: "process_state_timer_gate",
  Readiness_Gaps_Reentry: "readiness_rule",
  Parallel_Production_Contract: "parallel_production_contract",
  QA_Checklist: "qa_rule",
  Implementation_Dictionaries: "implementation_dictionary",
};

const MOTHER_GENERIC_SHEETS: Record<
  string,
  MotherGenericSheetExtract["extract_kind"]
> = {
  Version_Control: "version_control",
  Catalogo_Madre_Nodos: "mother_node",
  Source_Question_Registry: "source_question",
  Runtime_Classification: "runtime_classification",
  UX_Copy_View: "ux_copy",
  Epistemic_Governance: "epistemic_governance",
  MMABP_Mapping: "mmabp_mapping",
  Canonical_Variables: "canonical_variable",
  Critical_Routes: "critical_route",
  Trigger_Branching_Rules: "trigger_branching_rule",
  Readiness_Reentry_Gaps: "readiness_reentry_gap",
  VSM_AHE_Prep: "vsm_ahe_prep",
  Variables_Canonicas_Source: "variable_canonica_source",
  Implementation_Dictionaries: "implementation_dictionary",
  Audit_Issues: "audit_issue",
};

const MATERIALITY: RuntimeCatalogLoaderResult["materiality"] = {
  level: "runtime_40_20_rector_catalog_loader_local_extraction",
  local_only: true,
  runtime_40_20_started: false,
  next_authorization_required: true,
};

export async function runRuntime4020RectorCatalogLoader(
  input: RuntimeCatalogLoaderInput,
): Promise<RuntimeCatalogLoaderResult> {
  const blockers: string[] = [];

  if (input.options?.allow_file_read !== true) {
    blockers.push("allow_file_read_required");
    return result(input.case_id, emptyReport(input.case_id), blockers);
  }

  blockers.push(...(await missingPathBlockers(input)));

  if (blockers.length > 0) {
    return result(input.case_id, emptyReport(input.case_id), blockers);
  }

  let runtimeSpecExtract: RuntimeTechnicalSpecExtract;
  let runtimeWorkbook: WorkbookExtract;
  let motherWorkbook: WorkbookExtract;

  try {
    runtimeSpecExtract = await extractRuntimeSpec(input.document_paths.runtime_spec_path);
  } catch {
    blockers.push("runtime_spec_unreadable");
    return result(input.case_id, emptyReport(input.case_id), blockers);
  }

  try {
    runtimeWorkbook = await extractWorkbook(input.document_paths.runtime_catalog_path);
  } catch {
    blockers.push("runtime_catalog_unreadable");
    return result(
      input.case_id,
      { ...emptyReport(input.case_id), runtime_spec_extract: runtimeSpecExtract },
      blockers,
    );
  }

  try {
    motherWorkbook = await extractWorkbook(input.document_paths.mother_catalog_path);
  } catch {
    blockers.push("mother_catalog_unreadable");
    return result(
      input.case_id,
      buildReport(input.case_id, runtimeSpecExtract, runtimeWorkbook, emptyWorkbook()),
      blockers,
    );
  }

  const report = buildReport(
    input.case_id,
    runtimeSpecExtract,
    runtimeWorkbook,
    motherWorkbook,
  );
  const missingRuntimeSheets = REQUIRED_RUNTIME_SHEETS.filter(
    (sheetName) => !report.runtime_catalog_sheets_detected.includes(sheetName),
  );

  if (missingRuntimeSheets.length > 0) {
    blockers.push("missing_required_runtime_catalog_sheet");
  }

  if (report.base_count !== 40) {
    blockers.push("runtime_base_count_not_40");
  }

  if (report.causal_count !== 20) {
    blockers.push("runtime_causal_count_not_20");
  }

  return result(input.case_id, report, blockers);
}

async function missingPathBlockers(
  input: RuntimeCatalogLoaderInput,
): Promise<string[]> {
  const pathChecks: Array<[string, string]> = [
    ["runtime_spec_path_missing", input.document_paths.runtime_spec_path],
    ["runtime_catalog_path_missing", input.document_paths.runtime_catalog_path],
    ["mother_catalog_path_missing", input.document_paths.mother_catalog_path],
  ];
  const blockers: string[] = [];

  for (const [blocker, filePath] of pathChecks) {
    try {
      await access(resolveReadablePath(filePath));
    } catch {
      blockers.push(blocker);
    }
  }

  return blockers;
}

async function extractRuntimeSpec(
  filePath: string,
): Promise<RuntimeTechnicalSpecExtract> {
  const zipEntries = readZipEntries(await readFile(resolveReadablePath(filePath)));
  const documentXml = zipEntries.get("word/document.xml");
  if (!documentXml) {
    throw new Error("DOCX document.xml missing");
  }

  const paragraphs = extractParagraphs(documentXml.toString("utf8"));
  const fullText = paragraphs.join(" ");
  const title = paragraphs.find((paragraph) => paragraph.length > 0) ?? "not_found";

  return {
    source_document: RUNTIME_SPEC_DOCUMENT,
    detected_version: detectVersion(fullText, "v1.0.1"),
    title_detected: title,
    mentions_runtime_40_20: /Runtime\s*40(?:\+|\/)?20|40\+20/i.test(fullText),
    mentions_runtime_catalog_v1_1_1:
      /Cat[aá]logo\s+Runtime/i.test(fullText) && /v1\.1\.1|v1_1_1/i.test(fullText),
    mentions_mother_catalog_v1_0:
      /Cat[aá]logo\s+Madre\s+Capa\s+1/i.test(fullText) &&
      /v1\.0|v1_0/i.test(fullText),
    section_headings_detected: detectSectionHeadings(paragraphs),
  };
}

async function extractWorkbook(filePath: string): Promise<WorkbookExtract> {
  const zipEntries = readZipEntries(await readFile(resolveReadablePath(filePath)));
  const workbookXml = textEntry(zipEntries, "xl/workbook.xml");
  const workbookRelsXml = textEntry(zipEntries, "xl/_rels/workbook.xml.rels");
  const sharedStrings = parseSharedStrings(zipEntries.get("xl/sharedStrings.xml"));
  const sheetRefs = parseWorkbookSheets(workbookXml, workbookRelsXml);
  const sheets: WorkbookSheetExtract[] = [];

  for (const sheetRef of sheetRefs) {
    const sheetXml = textEntry(zipEntries, sheetRef.path);
    sheets.push({
      name: sheetRef.name,
      rows: parseWorksheetRows(sheetXml, sharedStrings),
    });
  }

  return { sheets };
}

function buildReport(
  caseId: string,
  runtimeSpecExtract: RuntimeTechnicalSpecExtract,
  runtimeWorkbook: WorkbookExtract,
  motherWorkbook: WorkbookExtract,
): RuntimeCatalogLoaderExtractionReport {
  const runtimeBaseRows =
    runtimeWorkbook.sheets.find(
      (sheet) => sheet.name === "Runtime_Interactions_Base_40",
    )?.rows ?? [];
  const runtimeCausalRows =
    runtimeWorkbook.sheets.find(
      (sheet) => sheet.name === "Runtime_Interactions_Causal_20",
    )?.rows ?? [];

  return {
    case_id: caseId,
    runtime_spec_extract: runtimeSpecExtract,
    runtime_base_interactions: runtimeBaseRows.map((row) =>
      runtimeBaseInteraction(row),
    ),
    runtime_causal_interactions: runtimeCausalRows.map((row) =>
      runtimeCausalInteraction(row),
    ),
    runtime_generic_extracts: runtimeGenericExtracts(runtimeWorkbook),
    mother_generic_extracts: motherGenericExtracts(motherWorkbook),
    runtime_catalog_sheets_detected: runtimeWorkbook.sheets.map((sheet) => sheet.name),
    mother_catalog_sheets_detected: motherWorkbook.sheets.map((sheet) => sheet.name),
    base_count: runtimeBaseRows.length,
    causal_count: runtimeCausalRows.length,
  };
}

function runtimeBaseInteraction(
  row: WorkbookDataRow,
): RuntimeBaseInteractionExtract {
  return {
    ...trace(RUNTIME_CATALOG_DOCUMENT, "Runtime_Interactions_Base_40", row),
    interaction_group: "base",
    runtime_interaction_id: stringValue(row.raw_row.runtime_interaction_id),
    visible_text: stringValue(row.raw_row.visible_text_v1_1),
    source_codes: splitCodes(row.raw_row.source_codes),
  };
}

function runtimeCausalInteraction(
  row: WorkbookDataRow,
): RuntimeCausalInteractionExtract {
  return {
    ...trace(RUNTIME_CATALOG_DOCUMENT, "Runtime_Interactions_Causal_20", row),
    interaction_group: "causal",
    runtime_interaction_id: stringValue(row.raw_row.runtime_interaction_id),
    visible_text: stringValue(row.raw_row.visible_text_v1_1),
    trigger_condition: stringValue(row.raw_row.trigger_condition),
    source_codes: splitCodes(row.raw_row.source_codes),
  };
}

function runtimeGenericExtracts(
  workbook: WorkbookExtract,
): RuntimeGenericSheetExtract[] {
  return workbook.sheets.flatMap((sheet) => {
    const extractKind = RUNTIME_GENERIC_SHEETS[sheet.name];
    if (!extractKind) {
      return [];
    }

    return sheet.rows.map((row) => ({
      ...trace(RUNTIME_CATALOG_DOCUMENT, sheet.name, row),
      extract_kind: extractKind,
    }));
  });
}

function motherGenericExtracts(
  workbook: WorkbookExtract,
): MotherGenericSheetExtract[] {
  return workbook.sheets.flatMap((sheet) => {
    const extractKind = MOTHER_GENERIC_SHEETS[sheet.name];
    if (!extractKind) {
      return [];
    }

    return sheet.rows.map((row) => ({
      ...trace(MOTHER_CATALOG_DOCUMENT, sheet.name, row),
      extract_kind: extractKind,
    }));
  });
}

function trace(
  sourceDocument: RuntimeRectorDocumentName,
  sourceSheet: string,
  row: WorkbookDataRow,
): SourceRowTrace {
  return {
    source_document: sourceDocument,
    source_sheet: sourceSheet,
    source_row_number: row.source_row_number,
    raw_row: row.raw_row,
  };
}

function result(
  caseId: string,
  extractionReport: RuntimeCatalogLoaderExtractionReport,
  blockers: string[],
): RuntimeCatalogLoaderResult {
  const uniqueBlockers = unique(blockers);
  const ok = uniqueBlockers.length === 0;

  return {
    ok,
    case_id: caseId,
    extraction_report: extractionReport,
    no_go_check: {
      no_go_triggered: !ok,
      blockers: uniqueBlockers,
      runtime_40_20_started: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      registry_live_db_created: false,
      ir_real_created: false,
      object_inventory_real_opened: false,
      f5c_real_opened: false,
      export_created: false,
      diagnosis_created: false,
      delivered_created: false,
    },
    blocked_reason: ok ? undefined : uniqueBlockers[0],
    materiality: MATERIALITY,
  };
}

function emptyReport(caseId: string): RuntimeCatalogLoaderExtractionReport {
  return {
    case_id: caseId,
    runtime_spec_extract: {
      source_document: RUNTIME_SPEC_DOCUMENT,
      detected_version: "not_found",
      title_detected: "not_found",
      mentions_runtime_40_20: false,
      mentions_runtime_catalog_v1_1_1: false,
      mentions_mother_catalog_v1_0: false,
      section_headings_detected: [],
    },
    runtime_base_interactions: [],
    runtime_causal_interactions: [],
    runtime_generic_extracts: [],
    mother_generic_extracts: [],
    runtime_catalog_sheets_detected: [],
    mother_catalog_sheets_detected: [],
    base_count: 0,
    causal_count: 0,
  };
}

function emptyWorkbook(): WorkbookExtract {
  return { sheets: [] };
}

function readZipEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Invalid ZIP central directory");
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8");
    const data = readLocalZipEntry(
      buffer,
      localHeaderOffset,
      compressedSize,
      compressionMethod,
    );

    entries.set(fileName, data);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const minimumOffset = Math.max(0, buffer.length - 0xffff - 22);

  for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new Error("ZIP end of central directory not found");
}

function readLocalZipEntry(
  buffer: Buffer,
  localHeaderOffset: number,
  compressedSize: number,
  compressionMethod: number,
): Buffer {
  if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
    throw new Error("Invalid ZIP local header");
  }

  const fileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataOffset = localHeaderOffset + 30 + fileNameLength + extraLength;
  const compressedData = buffer.subarray(dataOffset, dataOffset + compressedSize);

  if (compressionMethod === 0) {
    return compressedData;
  }

  if (compressionMethod === 8) {
    return inflateRawSync(compressedData);
  }

  throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
}

function textEntry(entries: Map<string, Buffer>, entryName: string): string {
  const entry = entries.get(entryName);
  if (!entry) {
    throw new Error(`Missing ZIP entry: ${entryName}`);
  }

  return entry.toString("utf8");
}

function parseSharedStrings(entry: Buffer | undefined): string[] {
  if (!entry) {
    return [];
  }

  return matchAll(
    entry.toString("utf8"),
    /<(?:\w+:)?si\b[\s\S]*?<\/(?:\w+:)?si>/g,
  ).map((si) => xmlText(si));
}

function parseWorkbookSheets(
  workbookXml: string,
  workbookRelsXml: string,
): Array<{ name: string; path: string }> {
  const relationships = new Map<string, string>();

  for (const rel of matchAll(
    workbookRelsXml,
    /<(?:\w+:)?Relationship\b[^>]*>/g,
  )) {
    const id = attribute(rel, "Id");
    const target = attribute(rel, "Target");
    if (id && target) {
      relationships.set(id, normalizeWorkbookTarget(target));
    }
  }

  return matchAll(workbookXml, /<(?:\w+:)?sheet\b[^>]*\/?>/g).map((sheetTag) => {
    const name = attribute(sheetTag, "name") ?? "unknown_sheet";
    const relationId =
      attribute(sheetTag, "r:id") ??
      attribute(sheetTag, "id") ??
      "missing_relationship";
    const sheetPath = relationships.get(relationId);

    if (!sheetPath) {
      throw new Error(`Missing workbook relationship for ${name}`);
    }

    return { name, path: sheetPath };
  });
}

function normalizeWorkbookTarget(target: string): string {
  if (target.startsWith("/")) {
    return target.slice(1);
  }

  if (target.startsWith("xl/")) {
    return target;
  }

  return `xl/${target}`;
}

function parseWorksheetRows(
  worksheetXml: string,
  sharedStrings: string[],
): WorkbookDataRow[] {
  const worksheetRows = matchAll(
    worksheetXml,
    /<(?:\w+:)?row\b[^>]*>[\s\S]*?<\/(?:\w+:)?row>/g,
  );
  const parsedRows = worksheetRows.map((rowXml, fallbackIndex) => {
    const rowNumber =
      Number(attribute(rowXml, "r")) || Number(fallbackIndex + 1);
    const cells = matchAll(
      rowXml,
      /<(?:\w+:)?c\b[^>]*>[\s\S]*?<\/(?:\w+:)?c>/g,
    ).map((cellXml) => parseCellValue(cellXml, sharedStrings));

    return { rowNumber, cells };
  });
  const header = parsedRows.find((row) =>
    row.cells.some((cell) => cell.trim().length > 0),
  );

  if (!header) {
    return [];
  }

  const headerKeys = header.cells.map((cell, index) =>
    safeHeaderName(cell, index),
  );

  return parsedRows
    .filter(
      (row) =>
        row.rowNumber > header.rowNumber &&
        row.cells.some((cell) => cell.trim().length > 0),
    )
    .map((row) => ({
      source_row_number: row.rowNumber,
      raw_row: row.cells.reduce<Record<string, unknown>>((rawRow, cell, index) => {
        rawRow[headerKeys[index] ?? `column_${index + 1}`] = cell;
        return rawRow;
      }, {}),
    }));
}

function parseCellValue(cellXml: string, sharedStrings: string[]): string {
  const type = attribute(cellXml, "t");

  if (type === "s") {
    const index = Number(
      firstMatch(cellXml, /<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/),
    );
    return sharedStrings[index] ?? "";
  }

  if (type === "inlineStr") {
    return xmlText(cellXml);
  }

  return decodeXml(
    firstMatch(cellXml, /<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/) ?? "",
  );
}

function extractParagraphs(documentXml: string): string[] {
  return matchAll(documentXml, /<w:p\b[\s\S]*?<\/w:p>/g)
    .map((paragraph) => xmlText(paragraph))
    .filter((text) => text.length > 0);
}

function detectVersion(text: string, preferredVersion: string): string | "not_found" {
  if (text.includes(preferredVersion)) {
    return preferredVersion;
  }

  return firstMatch(text, /v\d+(?:[._]\d+)+/) ?? "not_found";
}

function detectSectionHeadings(paragraphs: string[]): string[] {
  return paragraphs
    .filter((paragraph) => /^\d+(?:\.\d+)*\.\s+\S/.test(paragraph))
    .slice(0, 30);
}

function xmlText(xml: string): string {
  return decodeXml(
    xml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeXml(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function attribute(xml: string, name: string): string | undefined {
  const escapedName = name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const match = new RegExp(`\\b${escapedName}="([^"]*)"`).exec(xml);
  return match ? decodeXml(match[1]) : undefined;
}

function firstMatch(text: string, regex: RegExp): string | undefined {
  return regex.exec(text)?.[1];
}

function matchAll(text: string, regex: RegExp): string[] {
  return Array.from(text.matchAll(regex), (match) => match[0]);
}

function safeHeaderName(value: string, index: number): string {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : `column_${index + 1}`;
}

function splitCodes(value: unknown): string[] | undefined {
  const text = stringValue(value);
  if (!text) {
    return undefined;
  }

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function resolveReadablePath(filePath: string): string {
  const resolved = path.resolve(filePath);

  if (process.platform === "win32" && !resolved.startsWith("\\\\?\\")) {
    return `\\\\?\\${resolved}`;
  }

  return resolved;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

interface WorkbookExtract {
  sheets: WorkbookSheetExtract[];
}

interface WorkbookSheetExtract {
  name: string;
  rows: WorkbookDataRow[];
}

interface WorkbookDataRow {
  source_row_number: number;
  raw_row: Record<string, unknown>;
}

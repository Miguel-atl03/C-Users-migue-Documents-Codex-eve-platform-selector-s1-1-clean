import { existsSync, readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import type { SessionExportPayload } from "@/domain/export";
import {
  createZipArchive,
  type ZipEntryInput,
} from "@/services/export/minimal-xlsx";

type ZipEntry = {
  path: string;
  method: number;
  compressedSize: number;
  localOffset: number;
  data: Uint8Array;
};

const templateCandidates = [
  process.env.EVE_ACTIVITY_COLLECTION_TEMPLATE_XLSX,
  "C:\\Users\\migue\\Desktop\\Servicio Productizado EVE\\Herramienta de Actividades EVE FULL - V04.xlsx",
].filter(Boolean) as string[];

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const columnName = (index: number) => {
  let name = "";
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
};

const columnIndex = (column: string) =>
  column.split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;

const findEocd = (bytes: Buffer) => {
  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (bytes.readUInt32LE(index) === 0x06054b50) return index;
  }
  throw new Error("No pude leer la estructura interna del Excel.");
};

const readZipEntries = (bytes: Buffer): ZipEntry[] => {
  const eocd = findEocd(bytes);
  const count = bytes.readUInt16LE(eocd + 10);
  let offset = bytes.readUInt32LE(eocd + 16);
  const entries: ZipEntry[] = [];

  for (let index = 0; index < count; index += 1) {
    const method = bytes.readUInt16LE(offset + 10);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const fileNameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const path = bytes
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8");
    const localNameLength = bytes.readUInt16LE(localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
    const data =
      method === 0
        ? new Uint8Array(compressed)
        : method === 8
          ? new Uint8Array(inflateRawSync(compressed))
          : new Uint8Array();

    entries.push({ path, method, compressedSize, localOffset, data });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
};

const decodeSharedStrings = (xml: string) =>
  [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    match[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  );

const sharedValue = ({
  attrs,
  body,
  sharedStrings,
}: {
  attrs: string;
  body: string;
  sharedStrings: string[];
}) => {
  const value = body.match(/<v>(.*?)<\/v>/)?.[1];
  if (!value) return "";
  return attrs.includes('t="s"') ? sharedStrings[Number(value)] ?? "" : value;
};

const parseRows = (sheetXml: string, sharedStrings: string[]) => {
  const rows: { rowNumber: number; cells: { ref: string; value: string; attrs: string }[] }[] = [];

  for (const rowMatch of sheetXml.matchAll(/<row[^>]* r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(rowMatch[1]);
    const rowBody = rowMatch[2];
    const cells = [
      ...rowBody.matchAll(/<c[^>]* r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>|<c[^>]* r="([A-Z]+\d+)"([^>]*)\/>/g),
    ].map((cellMatch) => ({
      ref: cellMatch[1] ?? cellMatch[4],
      attrs: cellMatch[2] ?? cellMatch[5] ?? "",
      value: sharedValue({
        attrs: cellMatch[2] ?? cellMatch[5] ?? "",
        body: cellMatch[3] ?? "",
        sharedStrings,
      }),
    }));
    rows.push({ rowNumber, cells });
  }

  return rows;
};

const questionCodeFromHeader = (header: string) =>
  header.match(/^(\d+\.\d+)/)?.[1] ?? null;

const buildAnswerLookup = (payload: SessionExportPayload) => {
  const lookup = new Map<string, string>();
  payload.questionnaireAnswers.forEach((answer) => {
    lookup.set(
      `${answer.activityId}:${answer.questionCode}`,
      answer.selectedLabel || answer.freeText || answer.selectedValue || "",
    );
  });
  return lookup;
};

const cellXml = ({
  column,
  row,
  style,
  value,
}: {
  column: string;
  row: number;
  style: string;
  value: string;
}) => {
  const styleAttr = style ? ` s="${style}"` : "";
  if (!value) return `<c r="${column}${row}"${styleAttr}/>`;
  return `<c r="${column}${row}"${styleAttr} t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
};

const addTraceSheet = (workbookXml: string, workbookRelsXml: string) => {
  const existingIds = [...workbookXml.matchAll(/sheetId="(\d+)"/g)].map((match) =>
    Number(match[1]),
  );
  const nextSheetId = Math.max(...existingIds) + 1;
  const existingRIds = [...workbookRelsXml.matchAll(/Id="rId(\d+)"/g)].map(
    (match) => Number(match[1]),
  );
  const nextRid = Math.max(...existingRIds) + 1;

  return {
    workbookXml: workbookXml.replace(
      "</sheets>",
      `<sheet name="TRAZABILIDAD_EVE" sheetId="${nextSheetId}" r:id="rId${nextRid}"/></sheets>`,
    ),
    workbookRelsXml: workbookRelsXml.replace(
      "</Relationships>",
      `<Relationship Id="rId${nextRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/></Relationships>`,
    ),
  };
};

const addContentType = (contentTypesXml: string) =>
  contentTypesXml.replace(
    "</Types>",
    `<Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
  );

const traceSheetXml = (payload: SessionExportPayload) => {
  const rows = [
    ["Elemento", "Valor"],
    ["sessionId", payload.sessionId],
    ["exportGeneratedAt", payload.exportGeneratedAt],
    ["sessionStatus", payload.finalOutput.session_status],
    ["closureQuality", payload.finalOutput.session_closure_quality],
    ["supportIterations", String(payload.finalOutput.total_support_iterations)],
    ["assumptions", payload.assumptions.join("\n")],
    ["unresolvedGaps", payload.finalOutput.unresolved_gaps_global.join("\n")],
    ["keyDependencies", payload.finalOutput.key_dependencies.join("\n")],
    ["keyTensions", payload.finalOutput.key_tensions.join("\n")],
    [
      "coachB0Q02Events",
      String(payload.operationalDescriptionCoachTraces.length),
    ],
    [
      "significadoBlock0Answers",
      String(payload.significadoBlock0Answers.length),
    ],
    [
      "latestCoachMessage",
      payload.operationalDescriptionCoachTraces[0]?.coachMessage ?? "",
    ],
    [
      "latestOperationalDescription",
      payload.significadoBlock0Answers.find((answer) => answer.questionCode === "B0-Q02")
        ?.answerText ?? "",
    ],
  ];

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rows
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 1}">${row
          .map((value, cellIndex) =>
            cellXml({
              column: columnName(cellIndex),
              row: rowIndex + 1,
              style: rowIndex === 0 ? "7" : "",
              value,
            }),
          )
          .join("")}</row>`,
    )
    .join("")}</sheetData>
</worksheet>`;
};

export const findActivityCollectionTemplatePath = () =>
  templateCandidates.find((candidate) =>
    existsSync(/* turbopackIgnore: true */ candidate),
  ) ?? null;

export const populateActivityCollectionTemplate = (
  payload: SessionExportPayload,
) => {
  const templatePath = findActivityCollectionTemplatePath();
  if (!templatePath) return null;

  const entries = readZipEntries(
    readFileSync(/* turbopackIgnore: true */ templatePath),
  );
  const entryMap = new Map(entries.map((entry) => [entry.path, entry]));
  const readText = (path: string) => {
    const entry = entryMap.get(path);
    if (!entry) throw new Error(`La plantilla no contiene ${path}.`);
    return textDecoder.decode(entry.data);
  };

  const sharedStrings = decodeSharedStrings(readText("xl/sharedStrings.xml"));
  const sheet1Xml = readText("xl/worksheets/sheet1.xml");
  const rows = parseRows(sheet1Xml, sharedStrings);
  const headerRow = rows.find((row) => row.rowNumber === 6);
  const templateDataRow = rows.find((row) => row.rowNumber === 7);
  if (!headerRow || !templateDataRow) {
    throw new Error("La plantilla V04 no tiene la matriz esperada en Sheet1.");
  }

  const headerByColumn = new Map(
    headerRow.cells.map((cell) => [cell.ref.replace(/\d+$/, ""), cell.value]),
  );
  const styleByColumn = new Map(
    templateDataRow.cells.map((cell) => [
      cell.ref.replace(/\d+$/, ""),
      cell.attrs.match(/s="(\d+)"/)?.[1] ?? "",
    ]),
  );
  const answerLookup = buildAnswerLookup(payload);
  const dataRows = payload.activities.map((activity, activityIndex) => {
    const rowNumber = 7 + activityIndex;
    const cells = [];

    for (let column = columnIndex("B"); column <= columnIndex("AY"); column += 1) {
      const columnRef = columnName(column);
      const questionCode = questionCodeFromHeader(headerByColumn.get(columnRef) ?? "");
      let value = "";
      if (questionCode === "1.1") value = activity.text;
      else if (questionCode === "1.2") value = activity.missionFinal ?? "";
      else if (questionCode) {
        value = answerLookup.get(`${activity.activityId}:${questionCode}`) ?? "";
      }
      cells.push(
        cellXml({
          column: columnRef,
          row: rowNumber,
          style: styleByColumn.get(columnRef) ?? "5",
          value,
        }),
      );
    }

    return `<row r="${rowNumber}" spans="2:51" ht="60.75">${cells.join("")}</row>`;
  });

  const staticRows = rows
    .filter((row) => row.rowNumber < 7)
    .map((row) => sheet1Xml.match(new RegExp(`<row[^>]* r="${row.rowNumber}"[\\s\\S]*?<\\/row>`))?.[0] ?? "")
    .join("");
  const newSheetData = `<sheetData>${staticRows}${dataRows.join("")}</sheetData>`;
  const updatedSheet1 = sheet1Xml
    .replace(/<dimension ref="[^"]+"/, `<dimension ref="B1:AY${Math.max(7, payload.activities.length + 6)}"`)
    .replace(/<sheetData>[\s\S]*?<\/sheetData>/, newSheetData);

  const workbookXml = readText("xl/workbook.xml");
  const workbookRelsXml = readText("xl/_rels/workbook.xml.rels");
  const contentTypesXml = readText("[Content_Types].xml");
  const trace = addTraceSheet(workbookXml, workbookRelsXml);

  const outputEntries: ZipEntryInput[] = entries.map((entry) => {
    if (entry.path === "xl/worksheets/sheet1.xml") {
      return { path: entry.path, data: updatedSheet1 };
    }
    if (entry.path === "xl/workbook.xml") {
      return { path: entry.path, data: trace.workbookXml };
    }
    if (entry.path === "xl/_rels/workbook.xml.rels") {
      return { path: entry.path, data: trace.workbookRelsXml };
    }
    if (entry.path === "[Content_Types].xml") {
      return { path: entry.path, data: addContentType(contentTypesXml) };
    }
    return { path: entry.path, data: entry.data };
  });

  outputEntries.push({
    path: "xl/worksheets/sheet3.xml",
    data: textEncoder.encode(traceSheetXml(payload)),
  });

  return createZipArchive(outputEntries);
};

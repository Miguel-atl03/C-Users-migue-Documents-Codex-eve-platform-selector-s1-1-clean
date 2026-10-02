import { readFileSync, writeFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

const XLSX_PATH =
  "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx";

function readUInt16LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8);
}

function readUInt32LE(buffer, offset) {
  return (
    buffer[offset] |
    (buffer[offset + 1] << 8) |
    (buffer[offset + 2] << 16) |
    (buffer[offset + 3] << 24)
  );
}

function parseZipEntries(buffer) {
  const entries = new Map();
  let offset = 0;

  while (offset + 30 <= buffer.length) {
    const signature = readUInt32LE(buffer, offset);
    if (signature !== 0x04034b50) break;

    const compressionMethod = readUInt16LE(buffer, offset + 8);
    const compressedSize = readUInt32LE(buffer, offset + 18);
    const uncompressedSize = readUInt32LE(buffer, offset + 22);
    const fileNameLength = readUInt16LE(buffer, offset + 26);
    const extraFieldLength = readUInt16LE(buffer, offset + 28);
    const fileNameStart = offset + 30;
    const fileName = buffer
      .subarray(fileNameStart, fileNameStart + fileNameLength)
      .toString("utf8");
    const dataStart = fileNameStart + fileNameLength + extraFieldLength;
    const compressedData = buffer.subarray(
      dataStart,
      dataStart + compressedSize,
    );

    let data;
    if (compressionMethod === 0) {
      data = compressedData;
    } else if (compressionMethod === 8) {
      data = inflateRawSync(compressedData);
    } else {
      throw new Error(`Unsupported compression method ${compressionMethod} for ${fileName}`);
    }

    entries.set(fileName, data);
    offset = dataStart + compressedSize;
  }

  return entries;
}

function decodeXmlEntities(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseSharedStrings(xml) {
  const strings = [];
  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  let match;
  while ((match = siRegex.exec(xml)) !== null) {
    const siContent = match[1];
    const textParts = [];
    const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(siContent)) !== null) {
      textParts.push(decodeXmlEntities(tMatch[1]));
    }
    strings.push(textParts.join(""));
  }
  return strings;
}

function columnLettersToIndex(column) {
  let index = 0;
  for (const char of column) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}

function parseSheetRows(xml, sharedStrings) {
  const rows = [];
  const rowRegex = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowNumber = Number(rowMatch[1]);
    const rowContent = rowMatch[2];
    const cells = [];
    const cellRegex = /<c[^>]*r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const column = cellMatch[1];
      const typeMatch = /t="([^"]+)"/.exec(cellMatch[3] ?? "");
      const valueMatch = /<v>([\s\S]*?)<\/v>/.exec(cellMatch[4] ?? "");
      const inlineMatch = /<t[^>]*>([\s\S]*?)<\/t>/.exec(cellMatch[4] ?? "");
      const columnIndex = columnLettersToIndex(column);
      let value = "";

      if (typeMatch?.[1] === "s" && valueMatch) {
        value = sharedStrings[Number(valueMatch[1])] ?? "";
      } else if (inlineMatch) {
        value = decodeXmlEntities(inlineMatch[1]);
      } else if (valueMatch) {
        value = decodeXmlEntities(valueMatch[1]);
      }

      cells.push({ columnIndex, value });
    }

    cells.sort((a, b) => a.columnIndex - b.columnIndex);
    rows.push({ rowNumber, values: cells.map((cell) => cell.value) });
  }

  return rows;
}

function sheetToObjects(rows) {
  if (rows.length === 0) return [];
  const headers = rows[0].values.map((value) => String(value).trim());
  return rows.slice(1).map((row) => {
    const object = {};
    headers.forEach((header, index) => {
      object[header] = row.values[index] ?? "";
    });
    return object;
  });
}

function loadWorkbook(path) {
  const buffer = readFileSync(path);
  const entries = parseZipEntries(buffer);
  const sharedStringsXml = entries.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  const sharedStrings = parseSharedStrings(sharedStringsXml);
  const workbookXml = entries.get("xl/workbook.xml")?.toString("utf8") ?? "";
  const relsXml = entries.get("xl/_rels/workbook.xml.rels")?.toString("utf8") ?? "";

  const relMap = new Map();
  const relRegex = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/>/g;
  let relMatch;
  while ((relMatch = relRegex.exec(relsXml)) !== null) {
    relMap.set(relMatch[1], relMatch[2].replace(/^\//, ""));
  }

  const sheets = [];
  const sheetRegex = /<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/>/g;
  let sheetMatch;
  while ((sheetMatch = sheetRegex.exec(workbookXml)) !== null) {
    const sheetName = sheetMatch[1];
    const relId = sheetMatch[2];
    const target = relMap.get(relId);
    if (!target) continue;
    const sheetPath = target.startsWith("xl/") ? target : `xl/${target}`;
    const sheetXml = entries.get(sheetPath)?.toString("utf8") ?? "";
    const rows = parseSheetRows(sheetXml, sharedStrings);
    sheets.push({ sheetName, rows: sheetToObjects(rows) });
  }

  return sheets;
}

const sheetsToRead = [
  "Runtime_Interactions_Base_40",
  "UX_Subfield_Structure",
  "Canonical_Variables",
  "Branching_Budget_Rules",
  "Critical_Routes",
  "Readiness_Gaps_Reentry",
  "Runtime_Interactions_Causal_20",
  "Implementation_Dictionaries",
  "Required_Field_Model",
];

const workbook = loadWorkbook(XLSX_PATH);
const result = { sheets: {}, block0_rows: [] };

for (const sheetName of sheetsToRead) {
  const sheet = workbook.find((entry) => entry.sheetName === sheetName);
  if (!sheet) {
    result.sheets[sheetName] = { error: "NOT_FOUND" };
    continue;
  }

  result.sheets[sheetName] = {
    headers: sheet.rows.length ? Object.keys(sheet.rows[0]) : [],
    row_count: sheet.rows.length,
    rows: sheet.rows,
  };
}

for (const sheetName of [
  "Runtime_Interactions_Base_40",
  "Runtime_Interactions_Causal_20",
  "UX_Subfield_Structure",
  "Canonical_Variables",
]) {
  for (const row of result.sheets[sheetName]?.rows ?? []) {
    const block = String(row.block ?? "").trim();
    const runtimeInteractionId = String(row.runtime_interaction_id ?? "").trim();
    const triggerCondition = String(row.trigger_condition ?? "");
    if (
      block === "0" ||
      runtimeInteractionId.startsWith("B0-") ||
      (runtimeInteractionId === "C01" && triggerCondition.includes("B0-"))
    ) {
      result.block0_rows.push({ ...row, _source_sheet: sheetName });
    }
  }
}

writeFileSync(
  "docs/audits/_block0_extraction_raw.json",
  JSON.stringify(result, null, 2),
  "utf8",
);

console.log(
  `Extracted ${result.block0_rows.length} Block 0 rows from ${XLSX_PATH}`,
);

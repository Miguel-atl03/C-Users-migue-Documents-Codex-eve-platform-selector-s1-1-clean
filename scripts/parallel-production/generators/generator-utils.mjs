import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const REQUIRED_CANDIDATE_PROHIBITED_USES = [
  "diagnostic_input",
  "monetization_input",
  "capa2_readiness_input",
  "capa2_5_input",
  "capa3_input",
  "root_cause_input",
  "final_client_narrative",
  "evidence_replacement",
  "final_export",
];

export const readJson = (root, relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

export const writeJson = (root, relativePath, value) => {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
};

export const sha256 = (content) => crypto.createHash("sha256").update(content).digest("hex");

export const writeGeneratedFile = (root, relativePath, content) => {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
  return {
    file_path: relativePath.replace(/\\/g, "/"),
    content_hash: sha256(content),
  };
};

export const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export const unique = (values) => [...new Set(values.filter(Boolean))];

export const xmlEscape = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export const plantUmlEscape = (value) => String(value ?? "").replaceAll('"', '\\"');

export const safeId = (prefix, value) =>
  `${prefix}_${String(value ?? "element")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64)}`;

export function collectIrElements(irPackage, quadrant) {
  const entries = Object.values(irPackage?.models ?? {})
    .filter((model) => !quadrant || model.quadrant === quadrant)
    .flatMap((model) => asArray(model.elements).map((element) => ({ ...element, quadrant: model.quadrant })));
  return entries;
}

export function makeFactMap(inventory) {
  return new Map(asArray(inventory?.structural_facts).map((fact) => [fact.fact_id, fact]));
}

export function traceFromExport(exportItem) {
  return {
    source_ir_element_ids: asArray(exportItem.source_ir_element_ids),
    source_registry_element_ids: asArray(exportItem.source_registry_element_ids),
    source_fact_ids: asArray(exportItem.source_fact_ids),
    source_candidate_ids: asArray(exportItem.source_candidate_ids),
    source_evidence_ids: asArray(exportItem.source_evidence_ids),
    source_scene_ids: asArray(exportItem.source_scene_ids),
    source_blocks: asArray(exportItem.source_blocks),
    source_questions: asArray(exportItem.source_questions),
    generated_by: "EVE Parallel Production",
    candidate_only: true,
  };
}

export function bpmnDocumentation(trace) {
  return `<bpmn:documentation><![CDATA[${JSON.stringify(trace)}]]></bpmn:documentation>`;
}

export function bpmnDiagramInterchange({ diagramId, planeId, processId, nodes, flows }) {
  const shapeLines = nodes.map((node, index) => {
    const x = node.x ?? 160 + index * 190;
    const y = node.y ?? 160;
    const width = node.width ?? (node.kind === "event" ? 36 : node.kind === "annotation" ? 260 : 140);
    const height = node.height ?? (node.kind === "event" ? 36 : node.kind === "annotation" ? 70 : 80);
    return [
      `    <bpmndi:BPMNShape id="${xmlEscape(node.id)}_di" bpmnElement="${xmlEscape(node.id)}">`,
      `      <dc:Bounds x="${x}" y="${y}" width="${width}" height="${height}" />`,
      "    </bpmndi:BPMNShape>",
    ].join("\n");
  });
  const center = (node) => {
    const width = node.width ?? (node.kind === "event" ? 36 : node.kind === "annotation" ? 260 : 140);
    const height = node.height ?? (node.kind === "event" ? 36 : node.kind === "annotation" ? 70 : 80);
    return {
      x: (node.x ?? 160) + width / 2,
      y: (node.y ?? 160) + height / 2,
    };
  };
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edgeLines = flows
    .filter((flow) => nodeById.has(flow.sourceRef) && nodeById.has(flow.targetRef))
    .map((flow) => {
      const source = center(nodeById.get(flow.sourceRef));
      const target = center(nodeById.get(flow.targetRef));
      return [
        `    <bpmndi:BPMNEdge id="${xmlEscape(flow.id)}_di" bpmnElement="${xmlEscape(flow.id)}">`,
        `      <di:waypoint x="${source.x}" y="${source.y}" />`,
        `      <di:waypoint x="${target.x}" y="${target.y}" />`,
        "    </bpmndi:BPMNEdge>",
      ].join("\n");
    });

  return [
    `  <bpmndi:BPMNDiagram id="${xmlEscape(diagramId)}">`,
    `  <bpmndi:BPMNPlane id="${xmlEscape(planeId)}" bpmnElement="${xmlEscape(processId)}">`,
    ...shapeLines,
    ...edgeLines,
    "  </bpmndi:BPMNPlane>",
    "  </bpmndi:BPMNDiagram>",
  ].join("\n");
}

export function plantUmlTraceLines(trace) {
  return [
    `' generated_by: ${trace.generated_by}`,
    `' candidate_only: ${trace.candidate_only}`,
    `' source_ir_element_ids: ${JSON.stringify(trace.source_ir_element_ids)}`,
    `' source_registry_element_ids: ${JSON.stringify(trace.source_registry_element_ids)}`,
    `' source_fact_ids: ${JSON.stringify(trace.source_fact_ids)}`,
    `' source_evidence_ids: ${JSON.stringify(trace.source_evidence_ids)}`,
    `' source_candidate_ids: ${JSON.stringify(trace.source_candidate_ids)}`,
    `' source_scene_ids: ${JSON.stringify(trace.source_scene_ids)}`,
    `' source_blocks: ${JSON.stringify(trace.source_blocks)}`,
    `' source_questions: ${JSON.stringify(trace.source_questions)}`,
  ];
}

export function requireIrValidated(irPackage, conformanceReport, consistencyReport) {
  const passStatuses = new Set(["passed", "passed_with_warnings"]);
  const errors = [];
  if (!passStatuses.has(irPackage?.conformance_status)) errors.push("MMABP-IR conformance_status is not passed");
  if (!passStatuses.has(irPackage?.consistency_status)) errors.push("MMABP-IR consistency_status is not passed");
  if (!passStatuses.has(conformanceReport?.conformance_status)) errors.push("conformance_report is not passed");
  if (!passStatuses.has(consistencyReport?.consistency_status)) errors.push("consistency_report is not passed");
  return errors;
}

export function hasOpenBlockingGap(gap) {
  return gap?.blocking_status === "blocking" && ["open", "in_review"].includes(gap?.resolution_status);
}

import { asArray, plantUmlEscape, plantUmlTraceLines, traceFromExport } from "./generator-utils.mjs";

const technicalNamePattern = /(^tbl|entity$|dto$|dao$|impl$|repository$|service$)/i;

export function generateMocPlantUml({ irPackage, diagramExport }) {
  const mocModel = irPackage.models?.MoC_IR;
  const selectedIds = new Set(asArray(diagramExport.source_ir_element_ids));
  const elements = asArray(mocModel?.elements).filter((element) => selectedIds.has(element.ir_element_id));
  if (!elements.length) throw new Error("MoC PlantUML generation requires MoC_IR elements");

  const trace = traceFromExport(diagramExport);
  const lines = [
    "@startuml",
    "title MoC Candidate Class Diagram",
    ...plantUmlTraceLines(trace),
    "skinparam classAttributeIconSize 0",
    "",
  ];

  for (const element of elements) {
    if (element.ir_element_type === "class") {
      if (!element.business_concept || technicalNamePattern.test(element.label)) {
        throw new Error(`MoC class ${element.ir_element_id} must represent a business concept`);
      }
      const stereotype = element.external_entity ? " <<external>>" : "";
      lines.push(`class "${plantUmlEscape(element.label)}"${stereotype} as ${element.ir_element_id} {`);
      lines.push(`  .. traceability ..`);
      lines.push(`  source_ir = "${plantUmlEscape(element.ir_element_id)}"`);
      asArray(element.attributes).forEach((attribute) => lines.push(`  ${plantUmlEscape(attribute)}`));
      asArray(element.operations).forEach((operation) => lines.push(`  ${plantUmlEscape(operation)}()`));
      lines.push("}");
      lines.push(`note right of ${element.ir_element_id}`);
      lines.push(`candidate_only: true`);
      lines.push(`source_ir_element_ids: ${JSON.stringify(trace.source_ir_element_ids)}`);
      lines.push(`source_registry_element_ids: ${JSON.stringify(trace.source_registry_element_ids)}`);
      lines.push(`source_fact_ids: ${JSON.stringify(trace.source_fact_ids)}`);
      lines.push("end note");
      continue;
    }
    if (element.ir_element_type === "relationship") {
      if (!element.cardinality && !element.semantic_reason) {
        throw new Error(`MoC relationship ${element.ir_element_id} requires cardinality or semantic reason`);
      }
      lines.push(`' relationship: ${plantUmlEscape(element.label)}; semantic_reason=${plantUmlEscape(element.semantic_reason ?? "")}`);
    }
  }

  lines.push("");
  lines.push("' generated_candidate_file_not_evidence");
  lines.push("@enduml");
  return `${lines.join("\n")}\n`;
}

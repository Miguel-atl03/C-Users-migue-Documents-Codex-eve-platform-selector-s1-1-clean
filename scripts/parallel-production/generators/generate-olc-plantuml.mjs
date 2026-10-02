import { asArray, plantUmlEscape, plantUmlTraceLines, traceFromExport } from "./generator-utils.mjs";

export function generateOlcPlantUml({ irPackage, diagramExport }) {
  const olcModel = irPackage.models?.OLC_IR;
  const selectedIds = new Set(asArray(diagramExport.source_ir_element_ids));
  const elements = asArray(olcModel?.elements).filter((element) => selectedIds.has(element.ir_element_id));
  if (!elements.length) throw new Error("OLC PlantUML generation requires OLC_IR elements");

  const trace = traceFromExport(diagramExport);
  const lines = [
    "@startuml",
    "title OLC Candidate State Machine",
    ...plantUmlTraceLines(trace),
    "",
  ];

  for (const element of elements) {
    if (element.ir_element_type === "object_state") {
      if (element.represents_task) throw new Error(`OLC state ${element.ir_element_id} cannot represent a process task`);
      lines.push(`state "${plantUmlEscape(element.label)}" as ${element.ir_element_id}`);
      lines.push(`[*] --> ${element.ir_element_id} : candidate_constructor`);
      lines.push(`note right of ${element.ir_element_id}`);
      lines.push(`candidate_only: true`);
      lines.push(`object_class: ${plantUmlEscape(element.object_class ?? "")}`);
      lines.push(`source_ir_element_ids: ${JSON.stringify(trace.source_ir_element_ids)}`);
      lines.push(`source_registry_element_ids: ${JSON.stringify(trace.source_registry_element_ids)}`);
      lines.push(`source_fact_ids: ${JSON.stringify(trace.source_fact_ids)}`);
      lines.push("end note");
      continue;
    }
    if (element.ir_element_type === "transition") {
      if (!element.reason) throw new Error(`OLC transition ${element.ir_element_id} requires reason`);
      lines.push(`${element.from_state} --> ${element.to_state} : ${plantUmlEscape(element.reason)}`);
    }
    if (element.ir_element_type === "self_loop") {
      if (element.creates_false_state) throw new Error(`OLC self-loop ${element.ir_element_id} cannot create false state`);
      lines.push(`${element.state_id} --> ${element.state_id} : ${plantUmlEscape(element.reason ?? "attribute/relation change")}`);
    }
  }

  lines.push("");
  lines.push("' generated_candidate_file_not_evidence");
  lines.push("@enduml");
  return `${lines.join("\n")}\n`;
}

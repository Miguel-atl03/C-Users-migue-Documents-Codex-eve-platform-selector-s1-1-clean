import {
  asArray,
  bpmnDiagramInterchange,
  bpmnDocumentation,
  safeId,
  traceFromExport,
  xmlEscape,
} from "./generator-utils.mjs";

export function generatePmBpmn({ irPackage, diagramExport }) {
  const pmModel = irPackage.models?.PM_IR;
  const elements = asArray(pmModel?.elements).filter((element) =>
    asArray(diagramExport.source_ir_element_ids).includes(element.ir_element_id),
  );
  if (!elements.length) throw new Error("PM BPMN generation requires PM_IR elements");

  const processElement = elements.find((element) => element.ir_element_type === "business_process") ?? elements[0];
  if (!processElement.ir_element_id) throw new Error("PM process requires source_ir_element_id");
  if (processElement.represents_organizational_chart) {
    throw new Error("PM process cannot represent an organizational chart");
  }

  const trace = traceFromExport(diagramExport);
  const processId = safeId("PM_PROCESS", processElement.ir_element_id);
  const startEvents = asArray(processElement.trigger_events);
  const targetStates = asArray(processElement.target_states);
  const supportMarkers = asArray(processElement.support_markers);
  const flowLines = [];
  const nodeLines = [];
  const diNodes = [];
  const diFlows = [];

  if (startEvents.length) {
    nodeLines.push(`    <bpmn:startEvent id="${processId}_START" name="${xmlEscape(startEvents[0])}">${bpmnDocumentation(trace)}</bpmn:startEvent>`);
    diNodes.push({ id: `${processId}_START`, kind: "event", x: 160, y: 180 });
  }

  nodeLines.push(`    <bpmn:task id="${processId}_MAP" name="${xmlEscape(processElement.label)}">${bpmnDocumentation(trace)}</bpmn:task>`);
  diNodes.push({ id: `${processId}_MAP`, kind: "task", x: startEvents.length ? 280 : 160, y: 160, width: 180, height: 80 });

  if (targetStates.length) {
    nodeLines.push(`    <bpmn:endEvent id="${processId}_TARGET" name="${xmlEscape(targetStates[0])}">${bpmnDocumentation(trace)}</bpmn:endEvent>`);
    diNodes.push({ id: `${processId}_TARGET`, kind: "event", x: startEvents.length ? 520 : 400, y: 180 });
  }

  supportMarkers.forEach((marker, index) => {
    nodeLines.push(`    <bpmn:subProcess id="${processId}_SUPPORT_${index + 1}" name="${xmlEscape(marker)}">${bpmnDocumentation(trace)}</bpmn:subProcess>`);
    diNodes.push({ id: `${processId}_SUPPORT_${index + 1}`, kind: "task", x: 280 + index * 220, y: 300, width: 200, height: 90 });
  });

  if (startEvents.length) {
    flowLines.push(`    <bpmn:sequenceFlow id="${processId}_FLOW_START" sourceRef="${processId}_START" targetRef="${processId}_MAP" />`);
    diFlows.push({ id: `${processId}_FLOW_START`, sourceRef: `${processId}_START`, targetRef: `${processId}_MAP` });
  }
  if (targetStates.length) {
    flowLines.push(`    <bpmn:sequenceFlow id="${processId}_FLOW_TARGET" sourceRef="${processId}_MAP" targetRef="${processId}_TARGET" />`);
    diFlows.push({ id: `${processId}_FLOW_TARGET`, sourceRef: `${processId}_MAP`, targetRef: `${processId}_TARGET` });
  }
  diNodes.push({ id: `${processId}_CANDIDATE_ONLY`, kind: "annotation", x: 160, y: 430, width: 300, height: 70 });
  const diagramInterchange = bpmnDiagramInterchange({
    diagramId: `${processId}_DIAGRAM`,
    planeId: `${processId}_PLANE`,
    processId,
    nodes: diNodes,
    flows: diFlows,
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="PM_DEFINITIONS_${xmlEscape(processElement.ir_element_id)}" targetNamespace="https://eve.local/parallel-production/candidate">
  <bpmn:process id="${processId}" name="${xmlEscape(processElement.label)}" isExecutable="false">
${nodeLines.join("\n")}
${flowLines.join("\n")}
    <bpmn:textAnnotation id="${processId}_CANDIDATE_ONLY">${bpmnDocumentation(trace)}<bpmn:text>candidate_only=true; generated_candidate_file_not_evidence</bpmn:text></bpmn:textAnnotation>
  </bpmn:process>
${diagramInterchange}
</bpmn:definitions>
`;
}

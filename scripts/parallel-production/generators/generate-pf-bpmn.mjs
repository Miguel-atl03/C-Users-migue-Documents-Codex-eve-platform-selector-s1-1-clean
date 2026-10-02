import {
  asArray,
  bpmnDiagramInterchange,
  bpmnDocumentation,
  safeId,
  traceFromExport,
  xmlEscape,
} from "./generator-utils.mjs";

export function generatePfBpmn({ irPackage, diagramExport }) {
  const pfModel = irPackage.models?.PF_IR;
  const selectedIds = new Set(asArray(diagramExport.source_ir_element_ids));
  const elements = asArray(pfModel?.elements).filter((element) => selectedIds.has(element.ir_element_id));
  if (!elements.length) throw new Error("PF BPMN generation requires PF_IR elements");

  const trace = traceFromExport(diagramExport);
  const processId = "PF_PROCESS_FLOW_CANDIDATE";
  const nodeLines = [
    `    <bpmn:startEvent id="${processId}_START" name="Inicio candidato">${bpmnDocumentation(trace)}</bpmn:startEvent>`,
  ];
  const generatedNodeIds = [`${processId}_START`];
  const diNodes = [{ id: `${processId}_START`, kind: "event", x: 160, y: 180 }];

  elements.forEach((element, index) => {
    if (element.ir_element_type === "task" && element.ready === true && (!element.object_class || !element.object_state)) {
      throw new Error(`PF task ${element.ir_element_id} requires object and state`);
    }
    if (element.ir_element_type === "gateway" && element.decision_kind === "organizational" && !element.decision_evidence) {
      throw new Error(`PF gateway ${element.ir_element_id} requires decision evidence`);
    }
    if (element.ir_element_type === "process_state" && !asArray(element.awaited_events).length) {
      throw new Error(`PF process state ${element.ir_element_id} requires awaited event`);
    }

    const nodeId = safeId(`PF_${index + 1}`, element.ir_element_id);
    generatedNodeIds.push(nodeId);
    diNodes.push({
      id: nodeId,
      kind: element.ir_element_type === "process_state" ? "event" : "task",
      x: 280 + index * 220,
      y: element.ir_element_type === "process_state" ? 180 : 160,
      width: element.ir_element_type === "process_state" ? 36 : 180,
      height: element.ir_element_type === "process_state" ? 36 : 80,
    });
    if (element.ir_element_type === "process_state") {
      const eventName = asArray(element.awaited_events)[0];
      const timer = element.timer_event
        ? `<bpmn:timerEventDefinition><bpmn:timeDuration>${xmlEscape(element.timer_event)}</bpmn:timeDuration></bpmn:timerEventDefinition>`
        : "";
      nodeLines.push(`    <bpmn:intermediateCatchEvent id="${nodeId}" name="${xmlEscape(element.label)}">${bpmnDocumentation({ ...trace, awaited_events: asArray(element.awaited_events) })}${timer}</bpmn:intermediateCatchEvent>`);
      if (eventName) {
        nodeLines.push(`    <bpmn:textAnnotation id="${nodeId}_EVENT">${bpmnDocumentation(trace)}<bpmn:text>awaited_event=${xmlEscape(eventName)}</bpmn:text></bpmn:textAnnotation>`);
        diNodes.push({ id: `${nodeId}_EVENT`, kind: "annotation", x: 250 + index * 220, y: 280, width: 300, height: 70 });
      }
      return;
    }
    if (element.ir_element_type === "workaround") {
      nodeLines.push(`    <bpmn:task id="${nodeId}" name="${xmlEscape(element.label)}">${bpmnDocumentation(trace)}</bpmn:task>`);
      return;
    }
    nodeLines.push(`    <bpmn:task id="${nodeId}" name="${xmlEscape(element.label)}">${bpmnDocumentation(trace)}</bpmn:task>`);
  });

  nodeLines.push(`    <bpmn:endEvent id="${processId}_END" name="Fin candidato">${bpmnDocumentation(trace)}</bpmn:endEvent>`);
  generatedNodeIds.push(`${processId}_END`);
  diNodes.push({ id: `${processId}_END`, kind: "event", x: 280 + elements.length * 220, y: 180 });

  const flowLines = generatedNodeIds.slice(0, -1).map((sourceId, index) =>
    `    <bpmn:sequenceFlow id="${processId}_FLOW_${index + 1}" sourceRef="${sourceId}" targetRef="${generatedNodeIds[index + 1]}" />`,
  );
  const diFlows = generatedNodeIds.slice(0, -1).map((sourceId, index) => ({
    id: `${processId}_FLOW_${index + 1}`,
    sourceRef: sourceId,
    targetRef: generatedNodeIds[index + 1],
  }));
  diNodes.push({ id: `${processId}_CANDIDATE_ONLY`, kind: "annotation", x: 160, y: 430, width: 300, height: 70 });
  const diagramInterchange = bpmnDiagramInterchange({
    diagramId: `${processId}_DIAGRAM`,
    planeId: `${processId}_PLANE`,
    processId,
    nodes: diNodes,
    flows: diFlows,
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="PF_DEFINITIONS" targetNamespace="https://eve.local/parallel-production/candidate">
  <bpmn:process id="${processId}" name="Process Flow candidato" isExecutable="false">
${nodeLines.join("\n")}
${flowLines.join("\n")}
    <bpmn:textAnnotation id="${processId}_CANDIDATE_ONLY">${bpmnDocumentation(trace)}<bpmn:text>candidate_only=true; generated_candidate_file_not_evidence</bpmn:text></bpmn:textAnnotation>
  </bpmn:process>
${diagramInterchange}
</bpmn:definitions>
`;
}

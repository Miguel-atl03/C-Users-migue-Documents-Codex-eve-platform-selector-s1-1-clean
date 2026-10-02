import {
  canonicalizeEventType,
  canonicalizeState,
  isAllowedObjectState,
  isCanonicalEvent,
  transitionObjects,
} from "./domain-state-registry.mjs";
import { modeAllowsBlocking, resolveMbaOperationMode } from "./operation-mode.mjs";
import { evaluateTransitionNonconformance } from "./nonconformance-rules.mjs";

const transitionRegistry = transitionObjects();

const same = (left, right) => String(left ?? "") === String(right ?? "");

export function evaluateTransition(input, options = {}) {
  const modeResolution = options.modeResolution ?? resolveMbaOperationMode(options.env);
  const objectType = input.object_type ?? input.objectType;
  const rawPreviousState = input.previous_state ?? input.previousState;
  const rawTargetState = input.target_state ?? input.targetState;
  const previousState = canonicalizeState(objectType, rawPreviousState);
  const targetState = canonicalizeState(objectType, rawTargetState);
  const eventType = canonicalizeEventType(input.event_type ?? input.eventType);
  const operation = input.operation;
  const responsibleProcess = input.responsible_process ?? input.responsibleProcess;
  const violations = [];
  const warnings = [];

  if (!objectType) violations.push("object_type is required.");
  if (!previousState) violations.push("previous_state is required.");
  if (!targetState) violations.push("target_state is required.");
  if (!eventType) violations.push("event_type is required.");
  if (!operation) violations.push("operation is required.");
  if (!responsibleProcess) violations.push("responsible_process is required.");

  if (eventType && !isCanonicalEvent(eventType)) {
    violations.push(`event_type ${eventType} is not a canonical MBA event.`);
  }

  if (objectType && previousState && !isAllowedObjectState(objectType, previousState)) {
    violations.push(`${objectType} [${previousState}] is not declared in MBA OLC.`);
  }

  if (objectType && targetState && !isAllowedObjectState(objectType, targetState)) {
    violations.push(`${objectType} [${targetState}] is not declared in MBA OLC.`);
  }

  const transition = transitionRegistry.find(
    (item) =>
      item.object_type === objectType &&
      item.previous_state === previousState &&
      item.target_state === targetState &&
      item.event_type === eventType,
  );

  if (!transition) {
    violations.push(
      `Transition ${objectType} [${previousState}] --${eventType}--> [${targetState}] is not allowed by MBA OLC.`,
    );
  } else {
    if (!same(transition.operation, operation)) {
      violations.push(`operation ${operation} is not authorized; expected ${transition.operation}.`);
    }
    if (!same(transition.responsible_process, responsibleProcess)) {
      violations.push(
        `responsible_process ${responsibleProcess} is not authorized; expected ${transition.responsible_process}.`,
      );
    }
  }

  const nonconformance = evaluateTransitionNonconformance(
    {
      ...input,
      object_type: objectType,
      previous_state: previousState,
      target_state: targetState,
      raw_previous_state: rawPreviousState,
      raw_target_state: rawTargetState,
      event_type: eventType,
      responsible_process: responsibleProcess,
    },
    options.context,
  );

  for (const finding of nonconformance) {
    violations.push(`${finding.rule_id}: ${finding.description}`);
  }

  if (modeResolution.downgrade_reason) {
    warnings.push(modeResolution.downgrade_reason);
  }

  const valid = violations.length === 0;
  const blocking = !valid && modeAllowsBlocking(modeResolution);

  return {
    status: valid ? "valid" : "non_conformant",
    blocking,
    operation_mode: modeResolution.mode,
    requested_mode: modeResolution.requested_mode,
    enforcement_armed: modeResolution.enforcement_armed,
    canonical: {
      object_type: objectType,
      previous_state: previousState,
      event_type: eventType,
      operation,
      target_state: targetState,
      responsible_process: responsibleProcess,
    },
    violations,
    warnings,
    nonconformance,
  };
}

export function assertTransitionAllowed(input, options = {}) {
  const result = evaluateTransition(input, options);
  if (result.blocking) {
    const error = new Error(result.violations.join(" "));
    error.validation_result = result;
    throw error;
  }
  return result;
}

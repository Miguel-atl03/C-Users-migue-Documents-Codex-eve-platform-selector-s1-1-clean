import { randomUUID } from "node:crypto";
import { canonicalizeEventType, canonicalizeState } from "./domain-state-registry.mjs";
import { resolveMbaOperationMode } from "./operation-mode.mjs";
import { evaluateTransition } from "./transition-guard.mjs";

export class InMemoryMbaEventLedger {
  constructor({ env, modeResolution } = {}) {
    this.modeResolution = modeResolution ?? resolveMbaOperationMode(env);
    this.events = [];
    this.objectStateSnapshots = new Map();
    this.findings = [];
  }

  snapshotKey(objectType, objectId) {
    return `${objectType}:${objectId}`;
  }

  objectStates() {
    const states = {};
    for (const snapshot of this.objectStateSnapshots.values()) {
      states[snapshot.object_type] = states[snapshot.object_type] ?? [];
      states[snapshot.object_type].push({
        object_id: snapshot.object_id,
        state: snapshot.current_state,
        updated_at: snapshot.updated_at,
      });
    }
    return states;
  }

  recordEvent(input) {
    const objectType = input.object_type ?? input.objectType;
    const objectId = String(input.object_id ?? input.objectId ?? `${objectType}:unknown`);
    const rawPreviousState = input.previous_state ?? input.previousState;
    const rawTargetState = input.target_state ?? input.targetState;
    const rawEventType = input.event_type ?? input.eventType;
    const previousState = canonicalizeState(objectType, rawPreviousState);
    const targetState = canonicalizeState(objectType, rawTargetState);
    const eventType = canonicalizeEventType(rawEventType);
    const timestamp = input.timestamp ?? new Date().toISOString();
    const context = {
      objectStates: this.objectStates(),
      ...(input.context ?? {}),
    };
    const validationResult = evaluateTransition(
      {
        ...input,
        object_type: objectType,
        object_id: objectId,
        previous_state: previousState,
        target_state: targetState,
        event_type: eventType,
      },
      {
        modeResolution: this.modeResolution,
        context,
      },
    );

    const entry = {
      event_id: input.event_id ?? input.eventId ?? randomUUID(),
      event_type: eventType,
      emitted_by: input.emitted_by ?? input.emittedBy ?? "mba_control_plane",
      received_by: input.received_by ?? input.receivedBy ?? validationResult.canonical.responsible_process,
      object_type: objectType,
      object_id: objectId,
      previous_state: previousState,
      target_state: targetState,
      timestamp,
      technical_actor: input.technical_actor ?? input.technicalActor ?? "mba_control_plane",
      correlation_id: input.correlation_id ?? input.correlationId ?? input.case_id ?? input.caseId ?? null,
      case_id: input.case_id ?? input.caseId ?? input.correlation_id ?? input.correlationId ?? null,
      operation: input.operation,
      responsible_process: input.responsible_process ?? input.responsibleProcess,
      payload: input.payload ?? {},
      validation_result: validationResult,
      legacy_event_type: rawEventType === eventType ? null : rawEventType,
      legacy_previous_state: rawPreviousState === previousState ? null : rawPreviousState,
      legacy_target_state: rawTargetState === targetState ? null : rawTargetState,
      governance_mode: validationResult.operation_mode,
      warnings: validationResult.warnings,
      nonconformances: validationResult.nonconformance,
      source_adapter: input.source_adapter ?? input.sourceAdapter ?? null,
      session_id: input.session_id ?? input.sessionId ?? null,
    };

    this.events.push(entry);
    if (validationResult.nonconformance.length) {
      this.findings.push(
        ...validationResult.nonconformance.map((finding) => ({
          ...finding,
          event_id: entry.event_id,
          case_id: entry.case_id,
          object_type: entry.object_type,
          object_id: entry.object_id,
          status: "open",
        })),
      );
    }

    this.objectStateSnapshots.set(this.snapshotKey(objectType, objectId), {
      object_type: objectType,
      object_id: objectId,
      current_state: targetState,
      case_id: entry.case_id,
      updated_at: timestamp,
      last_event_id: entry.event_id,
      last_validation_status: validationResult.status,
    });

    return entry;
  }

  listEvents() {
    return [...this.events];
  }

  listFindings() {
    return [...this.findings];
  }

  listSnapshots() {
    return [...this.objectStateSnapshots.values()];
  }
}

export function createMbaEventLedger(options = {}) {
  return new InMemoryMbaEventLedger(options);
}

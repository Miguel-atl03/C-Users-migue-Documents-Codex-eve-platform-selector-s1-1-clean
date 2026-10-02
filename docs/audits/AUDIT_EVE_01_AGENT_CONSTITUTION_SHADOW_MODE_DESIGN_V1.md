# AUDIT — EVE 01 Agent Constitution Shadow Mode Design V1

## 1. Resumen ejecutivo

Dictamen: `AGENT_CONSTITUTION_SHADOW_MODE_DESIGN_READY`.

Se diseno el modo conceptual `constitutional_shadow` para `EVE-01-AGENT-CONSTITUTION` sin implementarlo. El diseno queda disabled-by-default, sin efectos laterales, sin bloqueo de usuario, sin mutacion de payload, sin registry write, sin diagnostico final, sin Produccion Paralela real y sin `runtimeAuthority`.

## 2. Estado previo

Prerequisitos leidos y confirmados:

- `AGENT_CONSTITUTION_PACKAGE_INTAKE_READY_NOT_WIRED`.
- `AGENT_CONSTITUTION_STATIC_TESTS_READY`.
- `METHOD_KERNEL_SHADOW_MODE_READY`.
- `METHOD_KERNEL_SHADOW_UI_TRACE_READY_WITH_GAPS`, con aprobacion posterior registrada.

Dependencia registrada:

- `EVE-00-METHOD-KERNEL@0.2.0`.

## 3. Diseño del modo constitutional_shadow

`constitutional_shadow` evalua decisiones constitucionales del agente en sombra:

- autoridad de fuentes;
- frontera de Capa 1;
- epistemologia de evidencia;
- relacion con Method Kernel;
- preclasificacion diagnostica permitida;
- runtime behavior permitido;
- frontera con Produccion Paralela;
- auditoria y `source_trace`;
- futura trazabilidad UI dev.

El modo no es productivo y no actua como gate.

## 4. Contrato conceptual input/output

Contrato creado:

- `docs/audits/_eve_01_agent_constitution_shadow_mode_contract_v1.json`

Input conceptual:

- `mode: "constitutional_shadow"`;
- `requestedAction`;
- `inputClassification`;
- `evidenceItems`;
- `sourceTrace`;
- `methodKernelResult` opcional;
- `runtimeContext` opcional;
- `actorContext` opcional;
- `targetBoundary` opcional;
- `requestedOutputType` opcional.

Output conceptual:

- `AgentConstitutionEvaluationResult`;
- readiness state;
- allowed/blocked actions;
- required inputs;
- findings;
- audit events;
- hard safety flags en false.

## 5. Fixtures futuros

Fixtures disenados:

- `capture_allowed_traced_evidence`;
- `missing_source_trace`;
- `scope_blocked_final_diagnosis`;
- `diagnostic_preclassification_candidate`;
- `parallel_preview_blocked_missing_readiness`;
- `audit_required_incomplete_source_trace`.

## 6. Relación con Method Kernel

EVE-00 valida conformance/consistency metodologica.

EVE-01 decide si una accion del agente esta permitida constitucionalmente.

EVE-01 no reemplaza EVE-00. Puede consumir `methodKernelResult` como evidencia estructural, no como diagnostico. Si se pide diagnostico o salida estructural sin resultado metodologico o traza equivalente, debe bloquear o pedir evidencia.

## 7. Future UI trace requirements

Se creo:

- `docs/audits/_eve_01_agent_constitution_future_ui_trace_requirements_v1.json`

El futuro dev harness debe mostrar:

- selectedFixture;
- requestedAction;
- inputClassification;
- evidenceItems;
- sourceTrace;
- methodKernelResult;
- readinessState;
- allowedActions;
- blockedActions;
- requiredInputs;
- findings;
- auditEvents;
- safetyFlags;
- MATCH expected/actual.

Fixtures visuales minimos:

- capture allowed;
- scope blocked;
- diagnostic preclassification;
- export blocked;
- audit required.

## 8. Riesgos

Matriz creada:

- `docs/audits/_eve_01_agent_constitution_shadow_mode_risks_v1.json`

Riesgos principales:

- convertir preclassification en diagnosis final;
- duplicar Method Kernel;
- duplicar Runtime readiness;
- usar D2 para crear reglas MMABP;
- usar D4/D5 para relajar D1;
- permitir `raw_text_export`;
- permitir `untraceable_recommendation`;
- exponer maquinaria interna en UI final;
- registrar `runtimeAuthority` demasiado pronto;
- escribir registry desde shadow mode;
- bloquear usuario desde shadow mode.

## 9. Qué no se hizo

- No implementacion.
- No cableado.
- No `runtimeAuthority`.
- No `src`.
- No UI.
- No Runtime productivo.
- No WorkMap.
- No Significado.
- No registry.
- No diagnosis final.
- No Produccion Paralela.
- No tests modificados.
- No paquete base `EVE_01_Agent_Constitution_v0_1.*` modificado.

## 10. Recomendación

A. Implementar `constitutional_shadow` como dominio/servicio puro.

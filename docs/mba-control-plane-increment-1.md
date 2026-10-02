# MBA Control Plane - Incremento 1

El incremento 1 implementa una capa lateral de gobierno MBA en modo sombra. No reescribe Capa 1.0, no reescribe Produccion Paralela y no activa Capa 2.0, Capa 2.5 ni Capa 3.

## Modos de operacion

Modo por defecto:

```text
MBA_CONTROL_PLANE_MODE=shadow
```

Tambien se acepta ausencia de variable; el sistema inicia en `shadow_mode`.

Modo de gobierno suave:

```text
MBA_CONTROL_PLANE_MODE=soft_governance
```

Prepara warnings y findings, pero no bloquea transiciones.

Modo enforcement:

```text
MBA_CONTROL_PLANE_MODE=enforcement
MBA_ALLOW_ENFORCEMENT=true
MBA_ENFORCEMENT_CONFIRMATION=ENABLE_MBA_OLC_BLOCKING
```

Si falta cualquiera de esas tres condiciones, el Control Plane baja a `soft_governance_mode` y registra `enforcement_not_armed`.

## Contrato implementado

- `Domain State Registry`: estados exactos Object[State] del MBA.
- `Transition Guard`: valida objeto, estado origen, evento causal, operacion, estado destino y proceso responsable.
- `Event Ledger`: registra eventos MBA canonicos con resultado de validacion.
- `Timer Ledger`: registra timers de process states observados y levanta NC-05 si falta timer o salida temporal.
- `NC-01` a `NC-10`: reglas evaluables de no conformidad.
- Adaptador Capa 1.0: traduce `scene_canonical_record`, `evidence_bundle_for_transduction`, `session_ready_for_transduction`, gaps y flags.
- Adaptador Produccion Paralela: traduce `mmabp_design_source_bundle`, `InventarioMMABP`, `MMABPIR`, `ArchitectureConsistencyAssessment` y `candidate_export_package`.

## Fronteras

- `session_ready_for_transduction` se registra como senal observada, no como target state. El target MBA canonico es `EvidenceBundle [ReadyForTransduction]`.
- `candidate_export_package` no se promueve automaticamente a `ExportCodePackage [Generated]`. Solo se promueve si existe `ArchitectureConsistencyAssessment [Satisfied]` y validacion sintactica aprobada.
- Findings QA de inventario, registros, IR o diagramacion regresan a `P-SUP-06`, no a `P-CORE-01`.
- Capa 1.0 no puede producir nodos EVE, root cause ni monetizacion.

## Endpoints laterales

- `POST /api/mba-control-plane/observe`: recibe salidas observadas de Capa 1.0 y/o Produccion Paralela y devuelve reporte de conformidad.
- `POST /api/mba-control-plane/report`: recibe eventos/timers ya observados y devuelve reporte de conformidad.

Los endpoints son laterales: no modifican la logica existente ni bloquean operacion en `shadow_mode`.

## Incremento 1.1 - persistencia operativa shadow

Rutas productivas conectadas en modo sombra:

- `POST /api/scenes/canonicalize`
- `POST /api/session/intermediate-output`
- `POST /api/parallel-production/design-source-bundle`

La conexion se ejecuta despues de la operacion funcional existente. Si la observacion MBA o Supabase falla, el error se captura y la respuesta funcional de la ruta no cambia.

Tablas preparadas en:

```text
schemas/mba-control-plane/persistence-v01.sql
```

Aplicacion manual recomendada:

1. Abrir el SQL editor del proyecto Supabase.
2. Ejecutar completo `schemas/mba-control-plane/persistence-v01.sql`.
3. Confirmar que existan:
   - `mba_event_ledger`
   - `mba_object_state_snapshots`
   - `mba_domain_state_observations`
   - `mba_transition_findings`
   - `mba_timer_ledger`
   - `mba_compliance_reports`
   - `mba_legacy_mappings`
4. Ejecutar una ruta productiva conectada.
5. Verificar que se haya insertado un `mba_compliance_reports.report_json`.

Campos persistidos por evento:

- `case_id`, `correlation_id`, `session_id`
- `object_type`, `object_id`
- `previous_state`, `target_state`
- `event_type` canonico
- `legacy_event_type`, `legacy_previous_state`, `legacy_target_state` cuando aplica
- `validation_result`
- `governance_mode`
- `timestamp`
- `technical_actor`
- `payload`
- `warnings`
- `nonconformances`
- `source_adapter`

Ejemplo de reporte de conformidad:

```text
tests/reports/mba-control-plane/increment-1-1-sample-compliance-report.json
```

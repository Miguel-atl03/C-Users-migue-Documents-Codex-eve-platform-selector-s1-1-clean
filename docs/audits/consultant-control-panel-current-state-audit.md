# Auditoría técnica — Pantalla actual Consultant Control Panel

## 1. Resumen ejecutivo

La pantalla de Panel de Control Consultor ya existe en el repositorio y está materializada como superficie interna administrativa. La ruta principal encontrada es `/admin/consultant-control-panel`; la ruta `/consultant/control-panel` existe como alias y redirige a la ruta administrativa conservando los parámetros de búsqueda.

El estado actual no es una activación productiva. La pantalla opera con un modelo de lectura, BFFs locales y un fixture no productivo opcional de Cervecería Ámbar Ancestral. Los controles manuales y las descargas están visibles como capacidades gobernadas, pero se mantienen bloqueados por política hasta que existan endpoints/generadores auditados con autoridad explícita.

La pantalla ya conecta visual y contractualmente con Runtime 40/20, gates, readiness, objetos SUP, Producción Paralela como frontera de exportación y trazabilidad Significado/WorkMap. No se observó uso directo de Supabase desde el frontend, ni service role, ni ejecución productiva, ni export real, ni diagnóstico final automático.

## 2. Ruta actual encontrada

- Ruta oficial: `src/app/admin/consultant-control-panel/page.tsx`
- URL oficial: `/admin/consultant-control-panel`
- Alias: `src/app/consultant/control-panel/page.tsx`
- URL alias: `/consultant/control-panel`
- Comportamiento del alias: redirige a `/admin/consultant-control-panel` y conserva query params.
- Estados de ruta:
  - `src/app/admin/consultant-control-panel/loading.tsx`
  - `src/app/admin/consultant-control-panel/error.tsx`

Documento de diseño operativo encontrado:

- `docs/consultant-control-panel/EVE_Diseno_Operativo_Panel_Control_Consultor_Experto.docx`

## 3. Árbol de archivos relacionados

```text
src/app/admin/consultant-control-panel/
  page.tsx
  loading.tsx
  error.tsx

src/app/consultant/control-panel/
  page.tsx

src/components/consultant/control-panel/
  ConsultantControlPanel.tsx
  CaseCenterPanel.tsx
  FunctionalUserHelpPanel.tsx
  ClientCompanyProgressPanel.tsx
  EveOperationalTracePanel.tsx
  SupFinalObjectsBackbonePanel.tsx
  ConsultantDownloadsPanel.tsx
  ControlPanelFilters.tsx
  ManualActionDrawer.tsx
  AuditJustificationModal.tsx
  PanelChrome.tsx
  ccp.module.css

src/services/eve/consultant-control-panel/
  consultant-control-panel-access.ts
  consultant-control-panel-service.ts
  consultant-control-panel-types.ts
  sup-final-objects-backbone.ts
  fixtures/cerveceria-ambar-ancestral-fixture.ts
  fixtures/ambar-runtime-4020-operational-ledgers.ts

src/app/api/eve/consultant/control-panel/
  state/route.ts
  client-company-progress/route.ts
  user-functional-help/route.ts
  operational-trace/route.ts
  downloads/route.ts
  manual-action/route.ts
  download-request/route.ts

docs/consultant-control-panel/
  EVE_Diseno_Operativo_Panel_Control_Consultor_Experto.docx
  consultant_control_panel_data_contract.json
  consultant_control_panel_boundary_ledger.json
  consultant_control_panel_manual_actions_policy.json
  consultant_control_panel_downloads_policy.json
  consultant_control_panel_ui_mapping.md
  consultant_control_panel_test_report.md
  consultant_control_panel_implementation_plan.md

tests/regression/consultant-control-panel/
  consultant-control-panel.test.mjs
```

## 4. Componentes frontend actuales

La pantalla principal carga `ConsultantControlPanel` desde la ruta administrativa. El componente es cliente y administra filtros, estado inicial, recarga por BFF y render de áreas.

Componentes principales:

- `ConsultantControlPanel.tsx`: shell general, filtros, links a VSM y Significado, mensaje de frontera y acceso bloqueado al cliente.
- `CaseCenterPanel.tsx`: centro de caso, alcance seleccionado, blockers, readiness y último estado.
- `FunctionalUserHelpPanel.tsx`: ayuda funcional por usuario, bloque actual, preguntas pendientes, errores/bloqueos y controles manuales.
- `ClientCompanyProgressPanel.tsx`: avance por empresa, caso, usuarios, roles y bloques Runtime.
- `EveOperationalTracePanel.tsx`: timeline operativo, bloques Runtime, presupuesto 40/20 por run, gates, readiness y vínculos a SUP.
- `SupFinalObjectsBackbonePanel.tsx`: columna vertebral SUP y objetos finales.
- `ConsultantDownloadsPanel.tsx`: descargas candidatas, todas bloqueadas por generador autorizado.
- `ControlPanelFilters.tsx`: filtros de alcance.
- `ManualActionDrawer.tsx` y `AuditJustificationModal.tsx`: intención de acciones auditadas, sin ejecución real habilitada.

El estilo visual reutiliza patrones de superficies admin existentes: fondo `#f7f7f2`, marca en verde, paneles blancos con borde, métricas, badges y estados vacíos.

## 5. Fuentes de datos actuales

La fuente principal actual es `buildConsultantControlPanelState` en `consultant-control-panel-service.ts`.

Fuentes activas:

- Estado vacío seguro cuando no hay datos en alcance.
- Fixture local no productivo de Cervecería Ámbar Ancestral cuando se pide `fixture=ambar` o se habilita por env en modo no producción.
- Ledgers locales de Runtime 40/20 para el fixture: BASE-40, CAUSAL-20, gates y readiness.
- Contrato SUP local en `sup-final-objects-backbone.ts`.

No se encontró lectura directa de datos reales de Supabase en la pantalla o servicio auditado. El servicio declara explícitamente que es read-mode, no toca producción, no usa service_role y no inventa diagnóstico.

## 6. Endpoints o servicios llamados

La pantalla llama desde cliente a:

- `GET /api/eve/consultant/control-panel/state`

El contrato documental lista además:

- `GET /api/eve/consultant/control-panel/client-company-progress`
- `GET /api/eve/consultant/control-panel/user-functional-help`
- `GET /api/eve/consultant/control-panel/operational-trace`
- `GET /api/eve/consultant/control-panel/downloads`
- `POST /api/eve/consultant/control-panel/manual-action`
- `POST /api/eve/consultant/control-panel/download-request`

Todos los BFFs revisados pasan por `assertConsultantControlPanelAccess` y construyen respuesta desde `buildConsultantControlPanelState` o handlers locales. Los POST de acción manual y descarga no ejecutan mutación productiva: validan justificación/consultor y devuelven estado bloqueado o pendiente de generador.

## 7. Conexión con Runtime 40/20

La conexión está representada en Área 3:

- Cobertura de bloques Runtime por `activity_runtime_run`.
- Bloques 0, 0.5 y 1-7 por run.
- Presupuesto 40/20 por usuario, rol y actividad primaria.
- Presupuesto por `activity_runtime_run`, no agregado de empresa/caso.
- BASE-40 resolution ledger por run.
- CAUSAL-20 closure ledger por run.
- Versión de reglas operativas Runtime 40/20.
- Validación local de que el fixture tenga gates y runtime budget poblados.

La pantalla no inicia Runtime real. Solo presenta estado y trazabilidad operacional simulada/local o estructuras vacías seguras.

## 8. Conexión con WorkMap y Significado

La pantalla incluye navegación a:

- `/admin/runtime-vsm`
- `/admin/significado-trace`

La relación con WorkMap/Significado aparece como trazabilidad de actor, escena, empresa cliente, transducción, evidencia, variables/gaps y objetos SUP. No se detectó generación real de WorkMap ni modificación de diagnósticos Significado desde esta pantalla.

Estado actual: conexión conceptual y de navegación, no ejecución productiva.

## 9. Conexión con Gates y Readiness

La pantalla muestra:

- `base_resolution_gate`
- `causal_closure_gate`
- `gate_summaries`
- `readiness`
- flags de readiness
- revisión consultor requerida
- autoservicio público permitido/no permitido
- diagnóstico final automático permitido/no permitido
- exportación productiva permitida/no permitida

En el fixture se observan gate codes:

- `B0`
- `B2`
- `B3/C09`
- `B7/C20`
- `SEM`
- `PST`

La lectura arquitectónica vigente queda preservada: los gates regulan frontera, calidad, readiness y No-Go; no sustituyen los bloques de captura.

## 10. Conexión con Producción Paralela y descargas

El panel expone un área de descargas con ocho tipos:

- `questions_answers_excel`
- `pathology_map_report`
- `mba_camunda_templates`
- `evidence_traceability_bundle`
- `consultant_packet`
- `gate_readiness_report`
- `audit_trail`
- `canonical_variables_gaps`

Todas las descargas están deshabilitadas con razón `Pendiente de generador autorizado`.

El mapping SUP conecta descargas con objetos finales como EvidenceBundle, ArchitectureConsistencyAssessment, ExportCodePackage, BPMNCodePackage y PlantUMLCodePackage. Sin embargo, el estado actual bloquea exportación productiva y diagnóstico final automático.

La existencia de rutas de Producción Paralela relacionadas en el repositorio no implica que esta pantalla las active.

## 11. Seguridad y autoridad

Mecanismos actuales:

- Rechazo explícito de superficie cliente con `x-eve-surface: client` o `cliente`.
- Roles aceptados: `consultant`, `operator`, `supervisor`, `auditor`.
- Token opcional por `EVE_CONSULTANT_CONTROL_PANEL_ACCESS_TOKEN`.
- Modo local por `EVE_CONSULTANT_CONTROL_PANEL_LOCAL_ENABLED`.
- Fallback no productivo en desarrollo.
- En producción, si no hay token válido, se bloquea el acceso.

Fronteras observadas:

- No service_role en frontend.
- No Supabase directo desde cliente.
- No secrets expuestos en los componentes auditados.
- No producción tocada por el servicio del panel.
- No migraciones ni SQL ejecutados por esta auditoría.

Riesgo a atender antes de producción real: el fallback de desarrollo es adecuado para local, pero cualquier despliegue real debe depender de token/sesión/autorización robusta y no de parámetros de query o headers triviales.

## 12. Acciones manuales existentes

Acciones definidas:

- `continue_block`
- `restart_block`
- `reopen_block`
- `set_questions_manually`
- `select_activity_manually`
- `mark_for_review`
- `request_reentry`

Estado actual:

- Todas están deshabilitadas.
- Todas requieren justificación.
- Todas requieren audit trail.
- La política documental exige consultor responsable, timestamp, alcance, estado previo, estado nuevo y justificación.
- El handler rechaza ausencia de justificación o consultor.
- Con justificación válida, responde `disabled_requires_audited_endpoint`; no muta estado real.

## 13. Tests existentes

Test encontrado:

- `tests/regression/consultant-control-panel/consultant-control-panel.test.mjs`

Cobertura declarada en el test:

- Existencia de rutas y componentes.
- Render de áreas principales.
- Reutilización de patrón visual oficial.
- Filtros presentes.
- Controles manuales bloqueados.
- Descargas bloqueadas.
- Acceso cliente bloqueado.
- Ausencia de service role y clientes Supabase en frontend.
- Ausencia de Ring 5, activación reabierta, diagnóstico final automático y export productivo.
- Fixture local Cervecería Ámbar Ancestral.
- Cobertura Runtime 40/20 por run.
- Gates y readiness.
- SUP final objects.

Reporte documental existente:

- `docs/consultant-control-panel/consultant_control_panel_test_report.md`

Resultados documentados ahí:

- `npx tsc --noEmit`: passed.
- `node --test tests/regression/consultant-control-panel/consultant-control-panel.test.mjs`: passed.
- `npx next build --webpack` desde ruta corta: passed.
- `npm test`: fase 1 passed; 3 fallos preexistentes de parallel-production hash mismatch, no relacionados con este panel.

En esta auditoría no se ejecutaron tests, porque el alcance solicitado fue inspección y reporte documental.

## 14. Comparación contra la especificación UI v1.1

Estado frente a la especificación operativa encontrada:

Cumplido o parcialmente cumplido:

- Existe pantalla de Panel de Control Consultor.
- Existe ruta interna y alias.
- Existe control de acceso para consultor/operador.
- El cliente queda bloqueado.
- La pantalla muestra caso, alcance, usuario, rol, actividad y estado.
- Hay filtros por empresa, caso, usuario, rol, actividad, run, evento, gate y status.
- Hay área de ayuda funcional.
- Hay área de progreso de empresa cliente.
- Hay traza operativa Runtime 40/20.
- Hay gates/readiness visibles.
- Hay columna vertebral SUP.
- Hay descargas candidatas.
- Hay controles manuales con justificación y audit trail como contrato.
- Hay fixture local útil para revisión visual y regresión.
- Se preserva la frontera: sin diagnóstico final automático, sin export productivo y sin reabrir activación.

No cumplido como operación real:

- No hay integración productiva con datos reales.
- No hay escritura auditada de acciones manuales.
- No hay generadores autorizados de descarga.
- No hay endpoint productivo de export real desde esta pantalla.
- No hay autoridad real de sesión/identidad más allá del guard actual y headers/token.
- No hay evidencia de conexión real a tablas persistentes del Runtime desde este panel.

Lectura: la UI v1.1 está implementada como superficie funcional-local y contractual, no como consola productiva final.

## 15. Riesgos de reemplazo

Reemplazar la pantalla completa ahora tendría riesgos altos:

- Se perdería la separación actual entre cliente y consultor.
- Se podría romper la frontera de no activación.
- Se podría perder el mapping ya logrado entre Runtime 40/20, SUP, readiness y descargas.
- Se podrían reabrir acciones manuales sin audit trail.
- Se podrían activar descargas sin generador autorizado.
- Se podría confundir fixture local con datos productivos.
- Se podría romper la cobertura de regresión existente.
- Se podría diluir el principio Gate > Chip si la nueva UI mezcla interpretación con autorización.

La pantalla actual debe tratarse como base conservable. El siguiente trabajo debería ser incremental y contractual, no reemplazo visual total.

## 16. Recomendación técnica de siguiente paso

Siguiente paso recomendado:

Crear una fase separada de hardening/productización del Panel de Control Consultor, sin activación real automática.

Prioridad sugerida:

1. Definir autorización real de consultor con sesión/identidad, no solo headers locales.
2. Conectar BFFs read-only a fuentes persistentes autorizadas del Runtime, manteniendo service_role fuera del frontend.
3. Mantener fixture local como modo demo/regresión, claramente separado de producción.
4. Diseñar endpoints auditados para acciones manuales, con ledger de intervención antes de habilitar botones.
5. Diseñar generadores autorizados de descarga, empezando por paquetes no productivos/review-only.
6. Mantener `diagnosis_final_automatic=false` y `productive_export_executed=false` hasta autorización explícita separada.
7. Ampliar tests para identidad, autorización, fuentes reales read-only y bloqueo de escritura.

No se recomienda reemplazar la pantalla actual. Se recomienda endurecerla.

## 17. Lista de archivos que NO deben tocarse todavía

No tocar todavía sin autorización separada:

- `src/app/admin/consultant-control-panel/page.tsx`
- `src/app/consultant/control-panel/page.tsx`
- `src/components/consultant/control-panel/ConsultantControlPanel.tsx`
- `src/components/consultant/control-panel/*.tsx`
- `src/components/consultant/control-panel/ccp.module.css`
- `src/services/eve/consultant-control-panel/consultant-control-panel-access.ts`
- `src/services/eve/consultant-control-panel/consultant-control-panel-service.ts`
- `src/services/eve/consultant-control-panel/consultant-control-panel-types.ts`
- `src/services/eve/consultant-control-panel/sup-final-objects-backbone.ts`
- `src/services/eve/consultant-control-panel/fixtures/*.ts`
- `src/app/api/eve/consultant/control-panel/*/route.ts`
- `src/app/api/eve/runtime-40-20/consultant/*/route.ts`
- cualquier migración SQL
- cualquier configuración de Supabase
- cualquier generador real de exportación
- cualquier endpoint de activación real

## 18. Conclusión

El Panel de Control Consultor existe y está en un estado técnico útil como superficie interna local/read-only. Ya organiza el caso, el usuario, el progreso, Runtime 40/20, gates/readiness, SUP y descargas candidatas bajo una frontera explícita de no activación.

No está listo para operar como consola productiva real sin una fase adicional de autorización, conexión read-only a datos persistentes, endpoints auditados y generadores controlados. La decisión correcta no es reemplazarlo, sino proteger lo que ya está bien delimitado y avanzar por capas autorizadas.

Dictamen de auditoría: pantalla existente encontrada, materialidad local confirmada, activación productiva no autorizada.

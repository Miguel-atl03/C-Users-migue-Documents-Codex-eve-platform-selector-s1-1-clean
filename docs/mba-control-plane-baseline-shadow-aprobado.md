# MBA Control Plane - Baseline Shadow Aprobado

## 1) Incrementos aprobados (1.0 a 1.6)

- Incremento 1.0: nucleo MBA Control Plane en shadow.
- Incremento 1.1: integracion shadow real con rutas productivas y persistencia operativa base.
- Incremento 1.2: validacion operativa con Supabase real y casos representativos.
- Incremento 1.3: verificacion de persistencia real y observacion inicial.
- Incremento 1.4: persistencia server-side con service role y RLS activo.
- Incremento 1.5: mapeo de flags V8/R8 a findings/warnings persistidos.
- Incremento 1.6: cadena runtime lateral de Produccion Paralela (inventory -> IR -> assessment -> candidate export).

## 2) Capacidades operativas activas

- Domain State Registry y OLC validation activos.
- Transition Guard activo en modos shadow/soft/enforcement (enforcement no armado por defecto).
- Event Ledger, Timer Ledger, snapshots, observations, findings y compliance reports persistidos en `mba_*`.
- Mapeo canonico de legacy events/states hacia MBA.
- RLS activo y persistencia MBA con service role server-side.
- Warnings V8/R8 traducidos y persistidos en `mba_transition_findings`.
- Persistencia lateral operativa para artefactos runtime de Produccion Paralela en `parallel_production_runtime_artifacts`.
- Endpoints runtime 1.6 operativos:
  - `POST /api/parallel-production/inventory/resolve`
  - `POST /api/parallel-production/mmabp-ir/project`
  - `POST /api/parallel-production/assessment/run`
  - `POST /api/parallel-production/candidate-export/generate`

## 3) Casos reales que validaron capacidades

- Caso Real 1:
  - ejecucion real sin fixtures
  - persistencia mba_* confirmada
  - frontera core/lateral respetada
- Caso Real 2:
  - señales no triviales (`ready_with_flags`, V8/R8)
  - warnings/findings V8/R8 persistidos tras Incremento 1.5
- Caso Real 3 - Cerveceria Ambar Ancestral:
  - ejecucion real nueva por flujo funcional normal
  - shadow mode estable, sin invadir core
- Validacion runtime Incremento 1.6:
  - 4 endpoints laterales con HTTP 200
  - 4 runtime artifacts persistidos
  - candidate export persistido como candidato tecnico (sin export final)

## 4) Fronteras protegidas

- No modificacion de `EvidenceBundle` readiness por Produccion Paralela.
- `session_ready_for_transduction` no promovido como target state canonico.
- `candidate_export_package` no equivale a `ExportCodePackage [Generated]`.
- Produccion Paralela no invade `CasoDiagnosticoEVE` core.
- RLS activo en tablas sensibles; escritura desde backend con service role server-side.

## 5) Pendiente antes de soft_governance_mode

- Consolidar mas corridas reales multi-caso en ventana temporal continua.
- Cerrar mappings legacy unresolved con riesgo de falso warning.
- Ajustar umbrales de findings/warnings laterales para reducir ruido operativo.
- Verificar estabilidad de timers y hallazgos NC-05 por proceso.
- Cerrar checklist de observabilidad (conteos, falsos negativos de scripts, trazabilidad por run).

## 6) Riesgos pendientes

- Riesgo de drift semantico entre estados tecnicos y estados MBA si no se mantiene disciplina de canonicidad.
- Riesgo de sobre-alerta en findings laterales al crecer volumen de casos.
- Riesgo de dependencia en scripts de extraccion si no se sigue fortaleciendo robustez de lectura.
- Riesgo de promotion confusion si no se mantiene `allow_export_promotion=false` en runtime actual.

## 7) Recomendacion para siguiente fase

- Mantener `shadow_mode` activo.
- Ejecutar un lote corto adicional de casos reales orientados a señales laterales (assessment/candidate export).
- Cerrar hardening de reportes/scripts y mappings unresolved.
- Preparar un plan controlado de entrada a `soft_governance_mode` en entorno acotado, con criterios de rollback explicitos.

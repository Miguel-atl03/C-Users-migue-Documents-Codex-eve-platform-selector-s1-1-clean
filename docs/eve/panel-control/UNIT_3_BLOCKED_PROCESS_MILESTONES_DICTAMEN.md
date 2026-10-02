# Dictamen — Unidad 3 BLOQUEADA

Fecha: 2026-07-15  
Alcance: Proceso principal + Hitos del caso + Hito actual (Panel Oficial / Empresa Cliente)  
Caso canónico de validación: Cervecería Amber (`19fc9eff-4219-43f0-854c-e2b3350f23f2`)

## Veredicto

**Unidad 3 bloqueada: no existe una fuente factual suficiente para representar el Proceso principal y los Hitos del caso.**

No se implementó BFF, UI ni datos cosméticos. No se inventaron proceso ni hitos para Amber. No se avanzó a Unidad 4. Staging y producción no fueron modificados. Unidad 2 permanece intacta.

---

## 1. Fuentes consultadas

### Corpus (diseño rector)

| Artefacto | Hallazgo para Unidad 3 |
|-----------|------------------------|
| `docs/eve/panel-control/corpus/CORPUS_MANIFEST.md` | Inventario; canónico: Diseño Panel Matriz XY |
| `Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` | Define lectura de hito actual / siguiente evento / timer / proceso responsable en lenguaje de diseño; **no es persistencia** |
| `MMABP_Minimal_Business_Architecture_EVE_v1_1_B3_B7_alineado.docx` | Arquitectura MMABP (presente en corpus) |
| `PrimaryActivitySelectionPolicy_EVE_MMABP_v1_3_Operacional.xlsx` | Política de actividades (fuera del alcance de Unidad 3 UI) |
| `EVE_PF_CORE_01_Camunda_v0_3_0.bpmn` | Diagrama PF-CORE; **diseño**, no filas de caso |
| `Diseno_Panel_Control_EVE_Runtime_40_20_MBA_Ajustado_v2_RolFuncional.docx` | **No presente** en corpus ni en Downloads al momento de la inspección |

El diseño exige banda/rail de proceso e hitos; **no sustituye** tablas ni contratos Case → Proceso → Hitos.

### Documentación de producto

- `docs/eve/panel-control/UNIT_2B_CONTEXT_ACTIVATION.md` — Unidad 2B **excluye explícitamente** procesos e hitos.
- Placeholders actuales: `ProcessAxisPlaceholder.tsx`, `CoreMilestoneRailPlaceholder.tsx`, copy `"Contexto activo"` en `client-context-shell-copy.ts`.

---

## 2. Inspección de persistencia (local Supabase)

Script: `scripts/eve/official-control-panel/inspect-unit3-process-persistence.mjs`  
Ejecutado contra contenedor `supabase_db_eve-platform`.

| Pregunta | Resultado factual |
|----------|-------------------|
| Tablas `%milestone%` / `%hito%` / `%main_process%` / `%proceso%` / `%process_structure%` / `%case_process%` | **0** |
| Columnas `%milestone%` / `%hito%` / `%main_process%` / `%proceso_principal%` / `%current_milestone%` / `%expected_event%` / `%support_process%` | **0** |
| Amber caso `19fc9eff-…` | Existe: label INC16; company+relationship OK; `estado_actual = NULL` |
| `process_state_timer_event` para Amber | Tabla existe; **0 filas**; dominio **Runtime 40+20** (fuera de alcance) |
| `eve_pm_registry` para Amber | Tabla existe; **0 filas**; registro candidato PM (conformance forzada en false), **no** hitos del panel |

### Vínculo Caso → Proceso principal

**No existe.** `sesiones_llenado` solo tiene puente de contexto Unit 2A (`client_company_id`, `client_relationship_id`, `display_name`, `estado_actual` de cuestionario). Sin FK/campo de proceso principal.

### Vínculo Proceso → Hitos

**No existe.** Sin tabla de hitos, orden canónico, estado de hito, evento esperado, timer/límite ni proceso de soporte ligado al proceso del caso.

### Regla de hito actual

**No existe** regla inequívoca persistida. No se puede elegir “el primero incompleto”, “el último creado” ni inferir desde UI.

### Estados / eventos / timers reales de hito

No hay enum ni filas de hito del caso en el panel oficial.  
`estado_actual` de Amber es **NULL** y, aunque tuviera valor, pertenece a **capas de cuestionario**, no a hitos del proceso principal.

---

## 3. BFF oficial existente

Rutas bajo `/api/eve/official-consultant-control-panel/`:

1. `GET .../client-companies`
2. `GET .../client-companies/:companyId/relationships`
3. `GET .../relationships/:relationshipId/cases`
4. `POST .../local-session` (solo local)

**No existe** `GET .../cases/:caseId/process-structure`.

Crearlo ahora forzaría mapear vacío o inventar desde Runtime/BPMN/MBA — prohibido por la regla de bloqueo.

---

## 4. Near-misses descartados (no usar)

| Fuente | Por qué no sirve para Unidad 3 |
|--------|--------------------------------|
| `process_state_timer_event` | Runtime 40+20; ligado a `activity_runtime_run`; instrucción: no activar Runtime |
| `eve_pm_registry` / PF/MoC/OLC registry | Control de promoción de candidatos; no lista operativa de hitos |
| `mba_event_ledger` / `mba_timer_ledger` | Plano MBA shadow; no contrato de hitos del panel |
| Catálogo estático `pm-process-catalog.ts` (legacy) | Fixture visual; Unit 1/2 lo prohiben como contenido del rail |
| BPMN `EVE_PF_CORE_01` | Diseño Camunda; no filas por caso Amber |
| Inferir por nombre INC16 / última actividad / Runtime | Prohibido explícitamente |

---

## 5. UI actual (sin cambios)

Con Amber activo (Unidad 2):

- Banda: “Proceso principal” + caso INC16 + Estado/Próximo evento/Timer = **No disponible** (placeholder)
- Rail: título “Hitos del caso” + nota **“Contexto activo”** (placeholder)
- Workspace: “Contexto activo.” / vistas en unidades siguientes

Eso es coherente con Unidad 2; **no** es Unidad 3.

---

## 6. Pruebas

No se añadieron pruebas de implementación (no hay feature).  
Se dejó inspector factual reproducible:

```bash
node scripts/eve/official-control-panel/inspect-unit3-process-persistence.mjs
```

Exit `0` + `"verdict":"UNIT_3_BLOCKED"` confirma ausencia de tablas/columnas de proceso-hitos.

Regresión Units 1–2: **sin tocar código de producto**.

---

## 7. Datos faltantes / desbloqueo futuro

Para desbloquear Unidad 3 se necesita, como mínimo (diseño explícito + migración + seed factual, **no** cosmético):

1. Persistencia **Case → Main process** (id, label, current status / next event / timer si existen).
2. Persistencia **Process → Milestones** con: label operativo, sequence canónica, status real, expected event, timer/límite, support process opcional.
3. Regla **inequívoca** de hito actual (campo o proyección auditável).
4. BFF `process-structure` con el mismo gate Consultor ∧ empresa ∧ relación ∧ caso.
5. Datos Amber reales (si el caso debe demostrar `active`), o empty/partial honestos si el caso aún no tiene estructura.

Hasta entonces: **empty factual**, no invención.

---

## 8. Archivos modificados en esta pasada

| Archivo | Motivo |
|---------|--------|
| `docs/eve/panel-control/UNIT_3_BLOCKED_PROCESS_MILESTONES_DICTAMEN.md` | Este dictamen |
| `scripts/eve/official-control-panel/inspect-unit3-process-persistence.mjs` | Gate factual local |

**Cero** cambios en `src/`, migraciones, seeds Amber, staging o producción.

---

## 9. Confirmaciones de no-avance

| Ítem | Estado |
|------|--------|
| Runtime 40+20 | No activado |
| Usuarios / roles / actividades | No activados |
| Matriz / Producción Paralela / alertas / Gobernanza Experiencia | No activados |
| Unidad 4 | No iniciada |
| Hitos cosméticos / fixtures Amber | No creados |
| Staging / producción | Intactos |
| Unidad 2 | Intacta |

---

## Mensaje canónico de bloqueo

> **Unidad 3 bloqueada: no existe una fuente factual suficiente para representar el Proceso principal y los Hitos del caso.**

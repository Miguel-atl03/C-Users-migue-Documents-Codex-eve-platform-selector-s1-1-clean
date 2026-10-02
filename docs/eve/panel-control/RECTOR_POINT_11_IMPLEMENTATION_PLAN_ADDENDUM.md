# Addendum vinculante — §11 Selección de actividades primarias y contexto no primario

Fecha: 2026-07-16  
Autoridad exclusiva: `docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` (v1.0)  
Título literal: **11. Selección de actividades primarias y contexto no primario**  
Subsección: **11.1 Panel de cobertura por usuario/rol**  

Plan base: `RECTOR_POINTS_10_12_IMPLEMENTATION_PLAN.md`  
Status base: `RECTOR_POINTS_10_12_STATUS_DICTAMEN.md`  
Rollback previo: `ROLLBACK_POINTS_11_12_DICTAMEN.md`  

**Alcance de este documento:** planificación y dictamen.  
**No incluye:** código, migraciones, BFF, componentes, pruebas ejecutadas, datos Amber inventados, ni §12.

**Fuente excluida:** `Diseno_Panel_Control_EVE_Runtime_40_20_MBA_Ajustado_v2_RolFuncional.docx`

---

## 0. Objetivo

Completar la planificación de §11 resolviendo las brechas abiertas del plan 10–12 sobre:

- si el selector solo calcula o también persiste un resultado auditado;
- trazabilidad exacta de los campos 11.1;
- objeto factual observado;
- estados y temporalidad;
- compuerta de persistencia (A / B / C);
- BFF/UI/navegación/seguridad/pruebas **condicionales** (no implementables sin fuente factual).

---

## 1. Alcance aprobado (no ampliables)

El panel monitorea el resultado del selector interno EVE:

Rol funcional / sesión funcional  
→ resultado factual del selector  
→ actividades primarias  
→ actividades no primarias como contexto  
→ pendientes o bloqueadas  

**Solo lectura.** Campos visibles cuando exista fuente factual:

- `eligible_count`
- `selected_count`
- `selection_mode`
- `selected_slot`
- `selection_reason_code`
- `non_primary_context_count`
- `workmap_coverage_gap`
- `promotion_condition`

Modos rectores:

| Condición | Modo |
|-----------|------|
| 0 elegibles | `reentry_required` |
| 1–8 elegibles | `non_competitive_inclusion` |
| >8 elegibles | `competitive_selection` (máximo 8) |
| Ambigüedad fuerte | `manual_review_required` |

**Prohibido en esta etapa:** checkboxes; “hacer primaria”; drag-and-drop; edición de razones; override; selección manual de ocho; creación de actividades; Runtime 40+20; convertir al Consultor en selector diagnóstico.

---

## 2. Pregunta crítica — respuesta inequívoca

**¿El selector interno EVE únicamente calcula la selección, o también existe una persistencia factual y auditada de su resultado por caso, usuario, rol/sesión y actividad?**

### Respuesta

**Únicamente calcula.** Existe una **política de cálculo** canónica (v1.3) y un objeto en memoria `PrimaryActivitySelectionResult`. **No existe** un ledger persistido y auditado del resultado de selección por caso + usuario + rol/sesión + actividad con modo, slots, reasons, no-primarias y promoción.

### Confusiones prohibidas

| Confusión | Veredicto |
|-----------|-----------|
| `activity_runtime_run` existente = actividad primaria | **Falso.** Run = ejecución Runtime, no selección. |
| `role_runtime_session.selected_primary_activity_count` = set auditado | **Falso.** Contador agregado, no lista ni reasons/slots. |
| Recalcular WorkMap en el BFF = resultado observado | **Falso.** Contradice el carácter observacional del panel. |
| `role_session_activities` (intento §§11–12) = fuente canónica | **Falso.** Tabla **eliminada** en rollback; no se repropondrá por defecto. |

---

## 3. Auditoría factual de fuentes

| Fuente | Tipo | Calcula | Persiste | Identidad caso | Identidad rol/sesión | Identidad actividad | Auditoría | Autoridad |
|--------|------|---------|----------|----------------|----------------------|---------------------|-----------|-----------|
| `src/domain/primary-activity-selection-policy.v1.3.ts` + JSON/schema/XLSX v1.3 | Política | Declara reglas | No | No | No | Vía campos requeridos | Normativa | **CANÓNICA OPERACIONAL** |
| `src/services/primary-activity-selector.ts` (`selectPrimaryActivitiesFromWorkMap`) | Calculador | Sí | No (retorna objeto) | No | No | `activityId` | Solo en resultado efímero | **POLÍTICA DE CÁLCULO** |
| `src/domain/primary-activity-selection-policy.ts` (`PrimaryActivitySelectionResult`, `SelectionRunLog`) | Tipos dominio | No | No | Vía WorkMap snapshot | No RRS | Sí | Campos in-result | **CANÓNICA OPERACIONAL** (contrato de cálculo) |
| `src/app/page.tsx` / Significado / draft state | Consumer UI | Reusa selector | Estado React / payload | `sessionId` intake | No RRS | Sí | Efímera | **POLÍTICA DE CÁLCULO** (consumidor) |
| `SignificadoSubmitPayload.primaryActivitySelectionResult` | Payload | No | No mapeado a ledger de selección | `sessionId` | No | Embebido | Handoff efímero | **POLÍTICA DE CÁLCULO** |
| `significado-block0-repository` | Persistencia | No | Respuestas Block0 | `sesion_id` | No | Opcional | ≠ selección | **PERSISTENCIA DE RESULTADO** (otro dominio) |
| `role_runtime_session.selected_primary_activity_count` / `secondary_activity_count` | Schema Runtime | No | Contadores | `case_id` | RRS id | No | No reasons/slots | **PERSISTENCIA DE RESULTADO** Runtime — **NO UTILIZABLE** como §11 |
| `activity_runtime_run` | Schema Runtime | No | Runs | `case_id` | `role_runtime_session_id` | `activity_id` | Ejecución | **PERSISTENCIA DE RESULTADO** Runtime — **NO UTILIZABLE** como selección |
| Monitoreo §10 (`listActivityRunsBySession`, labels UNAVAILABLE) | Lectura panel | No | Lee runs | Caso | RRS | Run-as-activity | Vacío factual | **NO UTILIZABLE** como cobertura 11.1 |
| Legacy CCP view-models (`eligible_count` / `selected_count`) | Legacy | Aproxima | No | Fixture | Fixture | Fixture | No selector v1.3 | **LEGACY** / **NO UTILIZABLE** |
| Tests / E2E (`primary-activity-selection-policy.test.ts`, e2e-block0 traces) | Prueba | Invoca selector | No | Fixture | No | Fixture | Asserts | **ARTEFACTO DE PRUEBA** |
| `role_session_activities` (migración point11) | — | — | — | — | — | — | Eliminada | **NO UTILIZABLE** (rollback) |
| BFF `selection-coverage` | Plan | — | — | — | — | — | Inexistente en código | Planificado / ausente |
| Homónimos `reentry_required` / `manual_review_required` en readiness/perfil | Runtime/perfil | Otro dominio | Sí (readiness) | Caso/run | — | Run | Distinto de §11 | **LEGACY** relativo a selección |

---

## 4. Matriz de trazabilidad — campos §11.1

| Campo rector | Fuente exacta | Tabla/vista/servicio | Campo técnico | Cardinalidad | Puede ser null | Regla de degradación | Confirmado |
|--------------|---------------|----------------------|---------------|--------------|----------------|----------------------|------------|
| `eligible_count` | Cálculo v1.3 | `selectPrimaryActivitiesFromWorkMap` → `runLog` | `eligibleActivityCount` | 0..n por ejecución efímera | No en resultado vivo; **sí** en panel sin fuente | Sin fuente → `null` / “No disponible”; error ≠ 0 | **Parcial efímero** — no persistido |
| `selected_count` | Cálculo v1.3; RRS count **no** equivale | `runLog.selectedActivityCount` | mismo | 0..8 en modo competitivo | Idem | No usar `selected_primary_activity_count` como proxy | **Parcial efímero** |
| `selection_mode` | Cálculo v1.3 | `mode` / `runLog.mode` | `reentry_required` \| `non_competitive_inclusion` \| `competitive_selection` | 1 por ejecución | Sí en panel sin fuente | `manual_review_required` tipado pero **no asignado** por selector actual → no afirmar cobertura de ambigüedad | **Parcial** |
| `selected_slot` | Cálculo por actividad primaria | `SelectedPrimaryActivity.selectedSlot` | 1..8 | 1 por primaria | Sí si no primaria / sin fuente | Sin fuente → null | **Parcial efímero** |
| `selection_reason_code` | Cálculo por actividad | `selectionReasonCode` | enum `SelectionReasonCode` | 1 por primaria | Sí sin fuente | Sin fuente → null; no inventar labels | **Parcial efímero** |
| `non_primary_context_count` | Derivado del cálculo | `nonPrimaryContextActivities.length` | conteo | 0..n | Sí sin fuente | Fórmula: longitud del arreglo de contexto; sin arreglo persistido → null | **Parcial efímero** |
| `workmap_coverage_gap` | Rector / XLSX / plan | **Ningún servicio ejecutable** | — | — | — | Siempre “No disponible” hasta definición + persistencia | **Faltante** |
| `promotion_condition` | Cálculo en no primaria | `ContextActivity.promotionCondition` | string | 0..1 por no primaria | Sí | Sin contexto persistido → null | **Parcial efímero** |

### Reglas anti-“derivable” sin definición

Ningún campo anterior puede mostrarse en el panel oficial como cifra factual sin:

1. **fuente** persistida o resultado de selección auditado;
2. **fórmula** explícita (p. ej. conteo = filas con `classification=primary`);
3. **momento de cálculo** (escritura del selector, no GET del panel);
4. **autoridad** (política v1.3 versionada);
5. **auditoría** (quién/cuándo/versión/inputs);
6. **inconsistencias** (conflicto modo vs conteos → `partial` / “El resultado de selección está incompleto.”).

---

## 5. Objeto factual observado

### Qué representa §11

El objeto mínimo es el **resultado del selector interno** (cobertura de selección), **no** el run Runtime.

| Pregunta | Respuesta |
|----------|-----------|
| ¿Pertenece al caso? | Scope de autorización: sí (`case_id`). |
| ¿Al participante / perfil? | Navegación UI §10: sí (`participant_id`, `profile_id`). |
| ¿A la sesión funcional? | **Ancla operativa requerida:** `role_runtime_session_id`. |
| ¿A una ejecución de política? | Idealmente sí (`selection_run_id` o equivalente) — **hoy no existe en DB**. |
| ¿A la actividad? | Detalle por fila: `activity_id` + clasificación / slot / reason. |

### Clave de lectura mínima (cuando exista fuente)

`case_id` ∧ `participant_id` ∧ `profile_id` ∧ `role_runtime_session_id` ∧ (`selection_run_id` si materializado) ∧ `activity_id` (detalle).

**No proponer clave nueva** si aparece una identidad canónica en el repositorio; hoy la identidad canónica de profundidad es la de §10 + RRS. El `selection_run_id` solo entra a URL si existe una única ejecución inequívoca o un selector explícito — **nunca** “última por timestamp” sin regla.

---

## 6. Estados y temporalidad (desde la fuente real)

| Pregunta | Hallazgo actual |
|----------|-----------------|
| ¿Cuándo está vigente una selección? | Solo mientras vive el resultado en memoria / payload de la sesión de captura. **No hay vigencia en DB.** |
| ¿Puede recalcularse? | Sí, sobre el mismo WorkMap (determinista en gran medida, `selectorVersion: "v1.3"`). |
| ¿Existe versión? | Versión de **política** (`v1.3`), no versión de **resultado persistido**. |
| ¿Resultado más reciente autorizado? | **No hay** regla de vigencia autorizada en panel; prohibido usar último timestamp / último run / última inserción. |
| ¿Se conservan resultados anteriores? | **No** en un ledger de selección. |
| ¿Selección revocada? | **No modelada** en persistencia de selección. |
| ¿Durante un recálculo? | Sustituye el objeto efímero; sin auditoría de transición para el panel. |
| ¿Selección incompleta? | En panel: ausencia de fuente → vacío; campos faltantes (p. ej. gap) → `partial` / incompleto. |

---

## 7. Compuerta de persistencia — Resultado B

### Evaluación A / B / C

| Resultado | ¿Aplica? | Motivo |
|-----------|----------|--------|
| **A — Fuente factual reutilizable (cero migraciones)** | No | No hay ledger de selección reutilizable. |
| **B — Política calculable, resultado no persistido** | **Sí** | Selector v1.3 calcula; resultado no conservado como observación auditada. |
| **C — Sin fuente suficiente** | No como veredicto primario | Hay política; falta persistencia del resultado. |

### ¿Puede el panel calcular bajo demanda?

| Criterio | Evaluación |
|----------|------------|
| ¿Altera el significado observacional? | **Sí** — el panel debe monitorear el resultado, no re-ejecutar el selector. |
| ¿Determinista? | Parcialmente, sobre WorkMap dado. |
| ¿Conserva versión de política? | En el objeto efímero (`selectorVersion`), no en DB. |
| ¿Posee todos los inputs? | WorkMap ligado a RRS/panel **no** está garantizado como input factual de monitoreo. |
| ¿Auditable? | Sin escritura, el GET no deja traza de “qué se observó”. |
| ¿Cubre `workmap_coverage_gap`? | **No** — campo no calculado en el selector. |
| ¿Cubre `manual_review_required`? | **No operacional** en el asignador actual. |

**Conclusión:** no se autoriza implementación read-only por recálculo on-demand.

### Decisión de compuerta

**§11 BLOQUEADO POR AUSENCIA DE RESULTADO FACTUAL PERSISTIDO**

Ruta futura condicionada (no activa en este addendum): ampliación de persistencia **solo** con ciclo de vida completo + **aprobación separada** del usuario (equivalente a decisión C futura).  
**No** proponer por defecto `role_session_activities` ni tabla equivalente.

---

## 8. Prohibición de migraciones no aprobadas

No se autoriza crear una migración para §11 durante la implementación posterior, salvo que:

1. este addendum (u otro dictamen posterior) demuestre brecha factual;
2. se defina ciclo de vida completo (objeto, constructor, estados, vigencia, actor de escritura, auditoría, corrección, revocación, cardinalidad, fuente de verdad);
3. el usuario apruebe por separado dicha ampliación.

**No volver a proponer por defecto:** `role_session_activities` ni equivalente.

---

## 9. BFF planificado (condicional — no implementar ahora)

Solo si existe fuente factual suficiente. Ruta alineada a convenciones §10:

`GET .../monitoring/roles/:profileId/sessions/:sessionId/selection-coverage`

Contrato conceptual a **adaptar** (no copiar mecánicamente) cuando exista fuente:

```ts
type ActivitySelectionCoverageView = {
  eligibleCount: number | null;
  selectedCount: number | null;
  selectionMode:
    | "reentry-required"
    | "non-competitive-inclusion"
    | "competitive-selection"
    | "manual-review-required"
    | "unavailable";
  nonPrimaryContextCount: number | null;
  workmapCoverageGap: boolean | null;
  promotionConditionLabel: string | null;
  activities: Array<{
    activityId: string;
    label: string;
    classification: "primary" | "non-primary" | "pending" | "unavailable";
    selectedSlot: number | null;
    selectionReasonLabel: string | null;
  }>;
  dataStatus: "available" | "partial" | "unavailable";
};
```

Reglas:

- no devolver Runtime profundo;
- error → `unavailable` / mensaje genérico (no lista vacía ni ceros falsos);
- cero filas con consulta OK → vacío factual con mensaje de §12 de este addendum.

**Estado hoy:** endpoint **inexistente**; **no implementar** hasta desbloqueo A o C aprobada.

---

## 10. Zona visual y presentación (condicional)

Amplía exclusivamente la profundidad §10:

Monitoreo de Empresa Cliente  
→ Usuario  
→ Rol funcional  
→ Sesión funcional  
→ **Panel de cobertura §11.1**

**No mover:** Eje X; Eje Y; matriz X/Y; franja superior; Atención y gobernanza; Personas participantes; selección de contexto.  
**No crear otra página.**

### Lectura factual (cuando exista fuente)

**Cobertura del rol**

- Elegibles  
- Seleccionadas como primarias  
- Contexto no primario  
- Modo de selección  
- Brecha de cobertura  
- Condición de promoción  

Detalle por actividad: Actividad · Clasificación · Slot · Razón de selección.  
Sin controles de mutación.

### Mensajes

| Situación | Texto |
|-----------|-------|
| Vacío factual | No hay un resultado de selección registrado para esta sesión funcional. |
| Datos parciales | El resultado de selección está incompleto. |
| Error técnico | No fue posible cargar la cobertura de actividades. |

Error ≠ conteo cero.

---

## 11. Navegación

Reutilizar §10:

- `participant`
- `profile`
- `role_runtime_session_id`
- `activity_id`

`selection_run_id`: **no** agregar a URL hasta identidad persistida. Si en el futuro hay 0 ejecuciones → ninguna; 1 inequívoca → puede normalizarse; N → selector explícito; **prohibido** autoseleccionar por fecha más reciente sin regla.

Cascadas existentes de §10 se conservan; cambio de sesión limpia actividad (y cualquier profundidad posterior).

---

## 12. Seguridad

Validación acumulativa en toda lectura futura:

Consultor ∧ Empresa ∧ Relación ∧ Caso ∧ Participante ∧ Perfil ∧ Sesión funcional ∧ resultado de selección ∧ Actividad

Debe impedir: selección ajena; mezcla entre sesiones; actividad de otro caso; manipulación de IDs; acceso directo no autorizado; fuga de reasons/conteos. La URL no concede acceso.

---

## 13. Cervecería Amber (readonly — sin inserts)

Verificación planificada (no inventar datos):

| Elemento | Tratamiento |
|----------|-------------|
| Participante / perfil | Usar evidencia canónica si existe |
| Sesión funcional | Si falta → detener profundidad **antes** de §11 |
| Resultado de selección | Si falta → mensaje de vacío factual de §10 de este addendum |
| Primarias / no primarias | No fabricar demostración completa |

Amber **no** se usa para demostrar FX-03/FX-04.

---

## 14. Fixtures FX-03 y FX-04 (rector §22)

| Fixture | Escenario | Datos mínimos | Resultado esperado | Persistencia test-only | Limpieza |
|---------|-----------|---------------|--------------------|------------------------|----------|
| **FX-03** | Selección ≤8 | WorkMap / resultado con 1–8 elegibles | `non_competitive_inclusion`; todas elegibles como primarias; no-primarias según política; sin controles de elección | Fixture aislado (no Amber) | Borrar filas test-only al cerrar |
| **FX-04** | Selección >8 | >8 elegibles | `competitive_selection`; máx. 8 slots; reasons visibles; contexto no primario preservado; `selected_count` ≤ 8 | Fixture aislado (no Amber) | Idem |

No afirmar cobertura CP-009 / FX solo con JSON/mocks sin flujo integrado panel + BFF + fuente factual.

---

## 15. Criterio CP-009 (literal)

> **CP-009** — Actividades no primarias permanecen visibles como contexto.

| Regla CP-009 | Dato de entrada | Acción | Resultado esperado | Evidencia |
|--------------|-----------------|--------|--------------------|-----------|
| No-primarias visibles | Resultado con `nonPrimaryContextActivities` | Abrir cobertura §11.1 | Sección “Contexto no primario” con ítems | UI + BFF |
| No confundir con primaria | Misma sesión | Comparar clasificaciones | Primarias y no primarias disjuntas | Assert IDs |
| Máx. 8 en competitivo | FX-04 | Leer `selected_count` / slots | ≤ 8; slots 1..8 únicos | Assert |
| Reasons visibles | Primarias con `selectionReasonCode` | Render | Label de razón presente o “No disponible” | UI |
| Sin selección manual | Cualquier modo | Inspeccionar UI | Sin checkbox / drag / “hacer primaria” | A11y/DOM |
| Scope sesión | Sesión A vs B | Pedir cobertura | Sin cruce | BFF 403 / vacío scope |
| Degradación | Error de fuente | GET fallido | Mensaje error; no ceros | Assert `dataStatus=unavailable` |
| Modo correcto | 0 / 1–8 / >8 elegibles | Lectura mode | Modos rectores | Assert |

---

## 16. Pruebas planificadas (cuando exista fuente)

### Fuente factual

- selección existente / ausente / parcial;
- múltiples ejecuciones;
- versión revocada (si el modelo futuro la define);
- error de fuente ≠ vacío.

### Modos

- cero elegibles → `reentry_required`;
- 1–8 → `non_competitive_inclusion`;
- >8 → `competitive_selection` máx. 8;
- ambigüedad fuerte → `manual_review_required` **solo si** la fuente lo registra (hoy el selector no lo asigna).

### Presentación / seguridad / navegación / regresión

Conforme a §§10–12 de este addendum; Playwright real (no láminas estáticas); §§7–10 intactos; Amber conserva vacío factual de selección.

**Hoy:** estas pruebas **no** pueden cerrar el panel oficial por ausencia de fuente.

---

## 17. Dictamen obligatorio

### Decisión única

**B. §11 BLOQUEADO POR AUSENCIA DE RESULTADO FACTUAL**

(Equivalente: Resultado B — política calculable, resultado no persistido; recálculo on-demand **no** autorizado para el panel observacional.)

### Resumen ejecutivo

| Ítem | Estado |
|------|--------|
| Fuente factual | **Ausente** (solo política + resultado efímero) |
| Campos disponibles como cálculo | mode, slots, reasons, conteos, promotion (parcial) |
| Campos faltantes | persistencia auditada; `workmap_coverage_gap` ejecutable; `manual_review_required` operacional; `selection_run_id` |
| BFF exacto | `selection-coverage` — **planificado, no implementable ahora** |
| UI exacta | Panel cobertura 11.1 bajo sesión §10 — **planificada, no implementable ahora** |
| Pruebas CP-009 / FX-03 / FX-04 | Especificadas; no ejecutables contra panel sin fuente |
| Riesgos | Confundir run/count/recálculo con observación; reintroducir tabla especulativa |
| Código / migraciones en esta tarea | **Cero** |
| §12 | **No iniciado** |

### Ruta futura (no aprobada)

Si el usuario aprueba por separado una ampliación de persistencia (decisión C), deberá definir ciclo de vida completo **antes** de cualquier migración. Este addendum **no** diseña esa tabla.

---

## 18. Entregables de esta tarea

1. Este documento: `RECTOR_POINT_11_IMPLEMENTATION_PLAN_ADDENDUM.md`
2. Actualización de la sección §11 / Ola B en `RECTOR_POINTS_10_12_IMPLEMENTATION_PLAN.md`
3. Actualización del estado §11 en `RECTOR_POINTS_10_12_STATUS_DICTAMEN.md`

**Detenerse aquí. No implementar §11. No iniciar §12.**

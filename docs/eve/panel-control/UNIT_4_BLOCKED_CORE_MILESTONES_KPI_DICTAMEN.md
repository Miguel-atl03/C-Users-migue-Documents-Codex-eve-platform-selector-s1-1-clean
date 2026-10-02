# Dictamen — Unidad 4 BLOQUEADA

Fecha: 2026-07-15  
Alcance: KPI «Hitos core alcanzados»  
Caso canónico: Cervecería Amber (`19fc9eff-4219-43f0-854c-e2b3350f23f2`)  
**Unidad 5: no iniciada.** Staging/producción: sin cambios.

## Veredicto

**Unidad 4 bloqueada: no existe una regla factual suficiente para calcular Hitos core alcanzados.**

No se implementó cálculo BFF, no se amplió el modelo con `is_core`/`achieved_*` como falso cierre, no se poblaron hitos de Amber, no se mostró `0` / `0 de 0` / porcentajes. El KPI permanece en **—** (ausencia de modelo / estructura), coherente con Amber sin proceso.

---

## 1. Fuentes consultadas

| Fuente | Hallazgo relevante |
|--------|-------------------|
| `Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` | §6.2 KPI: «Hitos core alcanzados: **x/7**». §8 Eje Y: catálogo **H0–H6** de PF-CORE-01 (`CasoDiagnosticoEVE` + `Object[State]`). §8.1 estado **`reached`**: «El Object[State] fue registrado por el core». Relación **P**: línea paralela **no produce el hito core**. |
| `MMABP_…B3_B7_alineado.docx` | Object[State] / conformance; no tipifica `case_milestones.is_core` del panel oficial Unit 3A. |
| `PrimaryActivitySelectionPolicy_…xlsx` | Política de actividades; sin contrato operable de KPI de hitos core del panel Unit 3A. |
| `UNIT_3A_PROCESS_MILESTONE_PERSISTENCE.md` | Hitos genéricos sin `is_core`; estados mínimos **no sustituyen OLC/PF/Object[State]**. Amber: proceso/hitos vacíos. |
| `UNIT_3B_PROCESS_MILESTONE_UI_DICTAMEN.md` | UI consume estructura; KPI explícitamente **inactivos (`—`)**; Unit 4 no iniciada. |

---

## 2. Definiciones del corpus (diseño)

### ¿Qué es un hito core?

En el diseño del panel, los **hitos core** del eje Y son los **siete** hitos de **PF-CORE-01** (H0…H6), no «cualquier hito del proceso»:

| ID | Etiqueta UI (diseño) |
|----|----------------------|
| H0 | Caso abierto |
| H1 | Escena operativa consolidada |
| H2 | Listo para transducción |
| H3 | Escenas evidenciales validadas |
| H4 | Película causal agregada |
| H5 | Diagnóstico experto recibido |
| H6 | Caso entregado y cerrado |

El propio corpus distingue procesos en **paralelo (P)** que **no producen el hito core**.

### ¿Qué es alcanzado?

§8.1: UI `reached` = **Object[State] registrado por el core**.  
No equivale automáticamente a:

- primer incompleto / secuencia / nombre / % / posición en rail;
- ni a inventar Runtime/BPMN como estado del caso.

### Presentación autorizada del KPI (diseño)

«**x/7**» (conteo). El diseño admite porcentaje solo como dato secundario; **esta Unidad 4** (instrucción operativa) **prohíbe** porcentaje general y **`0 de 0`**.

---

## 3. Persistencia actual (Unit 3A) vs regla requerida

| Necesidad Unit 4 | Estado factual |
|------------------|----------------|
| Clasificación explícita `is_core` (o vínculo canónico H0–H6) | **Ausente** en `case_milestones` |
| Señal de logro `reached` / Object[State] (o `achieved_at` autorizado) | **Ausente**; solo `status` mínimo Unit 3A |
| Equivalencia documental `status=completed` ⇒ `reached` | **No autorizada**: Unit 3A declara que esos estados **no sustituyen** OLC/PF/Object[State]; corpus define `reached` por Object[State] |
| Catálogo fijo H0–H6 persistido por caso | **No**; inventarlo desde BPMN está **prohibido** |
| Amber proceso/hitos | `mainProcess=null`, `milestones=[]` |

Por tanto: **no hay regla factual computable** sin:

1. inventar que todo hito Unit 3A es core, o  
2. inventar que `completed` = alcanzado Object[State], o  
3. hardcodear x/7 desde BPMN sin filas del caso.

Las tres violan la instrucción de Unidad 4.

---

## 4. Ampliación mínima **no** aplicada

Se evaluó `is_core` + posible `achieved_at`.  
**No se aplicó** porque:

- `is_core` solo resuelve la clasificación; **no** cierra «alcanzado» sin Object[State]/evidence;
- crear `achieved_at` cosmético sin evidencia de core registraría progreso aparente;
- Amber no tiene estructura: el KPI correcto sigue siendo **—**, no `0 de 7`.

Desbloqueo futuro mínimo (fuera de este dictamen; requiere aprobación):

1. Persistencia `is_core` (o FK a catálogo H0–H6) en hitos del proceso **del caso**.  
2. Regla de logro explícita ligada a Object[State] **o** señal mínima auditada autorizada.  
3. Cálculo servidor → `available | partial | unavailable` (nunca `0 de 0`).  
4. UI solo en la celda «Hitos core alcanzados».  
5. Datos Amber solo con evidencia/aprobación — nunca seed cosmético.

---

## 5. Comportamiento actual (honesto)

| Contexto | KPI «Hitos core alcanzados» |
|----------|-----------------------------|
| Amber (sin proceso) | **—** |
| Otros 6 KPI | **—** |
| BFF process-structure | Sin `coreMilestoneProgress` |
| Cálculo | No existe |

Interpretación: **ausencia de modelo/estructura**, no «0 avances del caso».

---

## 6. Pruebas / capturas de esta pasada

- Regresión: el strip KPI no calcula ni muestra `X de Y` / `%` / `0 de 0`.
- Inspección: columnas `is_core` / `achieved_*` no existen en `case_milestones`.
- Captura Amber: `reports/local/unit4/screenshots/01-amber-kpi-no-disponible.png` (KPI en —).

Escenarios `3 de 5` / parcial **no** se implementaron (requerirían regla + datos test-only post-desbloqueo).

---

## 7. Confirmaciones de no-avance

| Restricción | Cumplida |
|-------------|----------|
| No activar Usuarios / Roles / Actividades / Runtime / Gobernanza | Sí |
| No inventar hitos Amber | Sí |
| No mostrar 0 / 0 de 0 / % | Sí |
| Unit 3A/3B intactas (sin falsa activación KPI) | Sí |
| Cero staging/producción | Sí |
| Unidad 5 no iniciada | Sí |
| Cero cambios visuales de activación del KPI | Sí (permanece —) |

---

## 8. Archivos de esta pasada

| Archivo | Rol |
|---------|-----|
| `docs/eve/panel-control/UNIT_4_BLOCKED_CORE_MILESTONES_KPI_DICTAMEN.md` | Este dictamen |
| `scripts/eve/official-control-panel/inspect-unit4-core-milestone-kpi.mjs` | Gate factual local |
| `tests/regression/consultant-control-panel/official-control-panel-unit4-blocked.test.mjs` | Congela no-cálculo |
| `reports/local/unit4/screenshots/01-amber-kpi-no-disponible.png` | Evidencia visual Amber |

**Cero** migraciones KPI. **Cero** cambios de BFF/UI de cálculo.

---

## 9. Mensaje de bloqueo operativo

> **Unidad 4 bloqueada: no existe una regla factual suficiente para calcular Hitos core alcanzados.**

El corpus exige clasificación core (H0–H6 / no-paralelo) y logro por Object[State] (`reached`). La persistencia Unit 3A no aporta ni `is_core` ni Object[State]/achieved. Sin inventar equivalencias, el KPI no puede activarse.

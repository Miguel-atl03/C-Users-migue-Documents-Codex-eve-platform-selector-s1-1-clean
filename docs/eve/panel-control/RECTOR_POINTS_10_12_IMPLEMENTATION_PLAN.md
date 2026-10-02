# Plan de implementación — Puntos 10–12 del diseño rector

Fecha: 2026-07-16  
**Autoridad única:** `docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` (v1.0)  
**Módulo contrastado:** `src/features/official-consultant-control-panel/`, `src/app/api/eve/official-consultant-control-panel/`, `src/services/eve/official-control-panel/`, migraciones oficiales y Runtime P3, tests y reports locales.  
**Excluido como autoridad:** `Diseno_Panel_Control_EVE_Runtime_40_20_MBA_Ajustado_v2_RolFuncional.docx`, panel legacy, instrucciones históricas, bundles anteriores.  
**Esta tarea:** documentación únicamente — cero cambios de código, datos o UI.

Documentos de partida a respetar:

- `RECTOR_POINTS_1_9_IMPLEMENTATION_PLAN.md`
- `RECTOR_POINTS_1_9_STATUS_DICTAMEN.md`
- `RECTOR_POINT_7_SUPPORT_PROCESS_AXIS_DICTAMEN.md`
- `RECTOR_POINTS_8_9_EJE_Y_MATRIZ_DICTAMEN.md`
- Tramos R2A/R2B (participantes / perfiles)

## Método

Estados permitidos únicamente:

| Estado | Criterio |
|--------|----------|
| CERRADO | Datos/fuente + lógica + UI + autorización + pruebas + evidencia visual cuando aplique |
| PARCIAL | Solo una parte (UI sin datos, persistencia sin UI, shell sin comportamiento, etc.) |
| NO INICIADO | Sin implementación relevante en el panel oficial |
| BLOQUEADO POR DATOS | Falta fuente factual |
| BLOQUEADO POR INFRAESTRUCTURA | Falta plataforma/infra |
| IMPLEMENTADO FUERA DE SECUENCIA | Existe fuera del panel oficial o antes de dependencias rectoras |

Si una afirmación no está en el docx: **No sustentado explícitamente por el diseño rector.**

---

## 1. Confirmación literal de títulos §§10–12

| Esperado (corto) | Título exacto en el rector | ¿Coincide? |
|------------------|----------------------------|------------|
| Monitoreo recursivo | **10. Monitoreo recursivo Empresa -> Usuario -> Rol -> Actividad** | **NO** — el rector añade la cascada completa |
| Selección de actividades | **11. Selección de actividades primarias y contexto no primario** | **NO** — el rector añade “primarias y contexto no primario” |
| Runtime 40+20 | **12. Runtime 40+20 y bloques individuales** | **NO** — el rector añade “y bloques individuales” |

### Subsecciones exactas

**§10**

- `10.1 Tabla principal de usuarios`
- `10.2 Expansión por rol funcional`
- `10.3 Expansión por actividad`

**§11**

- `11.1 Panel de cobertura por usuario/rol`

**§12**

- `12.1 Diseño del detalle de actividad`
- `12.2 Reglas de presentación`

---

## 2. Extracción funcional del rector

### 2.1 §10 — Monitoreo recursivo Empresa -> Usuario -> Rol -> Actividad

El panel debe permitir **cuatro niveles de lectura sin cambiar de pantalla**. Cada nivel hereda el scope anterior y añade detalle.

| Nivel | Pregunta | Contenido principal |
|-------|----------|---------------------|
| Empresa Cliente | ¿Cómo está el conjunto? | Caso, hitos, cobertura, usuarios, roles, procesos, manualidad, blockers |
| Usuario físico | ¿Dónde está esta persona? | Engagement, sesión, roles, trayectoria, actividades y soporte |
| Rol funcional | ¿Qué parte del trabajo representa? | Responsabilidades, actividades seleccionadas, cobertura y gaps |
| Actividad | ¿Qué evidencia y estado produce? | Runtime, bloques, gaps, readiness, SCR, bundle y MDSB |

#### 10.1 Tabla principal de usuarios

Columnas: `Usuario | Engagement / sesión | Roles | Actividades | Etapa actual | Readiness | Atención`

Los ejemplos del rector son **fixture visual**; la implementación debe consumir datos reales y no hardcodear estados.

#### 10.2 Expansión por rol funcional

Columnas: `Rol | Responsabilidades | Elegibles | Primarias | No primarias | Estado | Próximo paso`

#### 10.3 Expansión por actividad

Columnas: `Actividad | Razón de selección | Base | Causales | Bloque actual | Readiness | Ruta crítica`

Ejemplos de readiness citados: `ready_with_flags`, `ready`, `reentry_required`.

#### Qué ya cubren R2A/R2B

| Capa | Estado |
|------|--------|
| Caso → Persona participante | CERRADO (R2A + UI R2B) |
| Persona → Perfil funcional | CERRADO estructural / PARCIAL semántico (perfil ≠ `role_runtime_session`) |
| Perfil → Actividad | NO INICIADO |
| Actividad → Runtime | NO INICIADO en panel oficial |

#### Zona exacta en Monitoreo

Workspace central, **después** de:

1. Detalle del proceso seleccionado (colapsable)
2. Intersección X/Y
3. Matriz X/Y

Misma pantalla; sin rutas nuevas. Componentes previstos por §18: `ParticipantMonitoringTable`, `RoleMonitoringAccordion`, `ActivityRuntimePanel`.

### 2.2 §11 — Selección de actividades primarias y contexto no primario

> El panel monitorea el resultado del selector interno EVE; no convierte al usuario en selector diagnóstico.

| Condición | Modo | Comportamiento |
|-----------|------|----------------|
| 0 elegibles | `reentry_required` | Volver a WorkMap; no crear actividades |
| 1 a 8 elegibles | `non_competitive_inclusion` | Todas las elegibles pasan a Runtime |
| >8 elegibles | `competitive_selection` | Señales, slots, deduplicación; **máximo 8** |
| Ambigüedad fuerte | `manual_review_required` | Bloquear handoff hasta aclaración |

#### 11.1 Panel de cobertura por usuario/rol

| Dato | Lectura UI |
|------|------------|
| `eligible_count` | Actividades que pasaron gates |
| `selected_count` | Actividades primarias enviadas a Runtime |
| `selection_mode` | Cómo se decidió la inclusión |
| `selected_slot` | Razón funcional del slot 1..8 |
| `selection_reason_code` | Explicación específica por actividad |
| `non_primary_context_count` | Realidad preservada fuera del run principal |
| `workmap_coverage_gap` | Posible subcaptura del rol |
| `promotion_condition` | Cuándo una no primaria puede reentrar |

Regla de experiencia: la UI puede mostrar que EVE profundizará ciertas actividades y permitir **correcciones factuales**. No debe pedir “elige tus ocho favoritas” ni mostrar la selección como diagnóstico.

**Prohibición de esta etapa:** el Consultor no inventa, cambia ni fuerza la selección desde el panel (salvo autorización expresa futura del rector; no aplica aquí).

#### Addendum vinculante (2026-07-16) — brecha factual cerrada en planificación

Documento: `RECTOR_POINT_11_IMPLEMENTATION_PLAN_ADDENDUM.md`

| Hallazgo | Dictamen |
|----------|----------|
| Selector v1.3 (`selectPrimaryActivitiesFromWorkMap`) | **POLÍTICA DE CÁLCULO** — produce `PrimaryActivitySelectionResult` efímero |
| Persistencia auditada del resultado por caso/RRS/actividad | **Ausente** |
| `activity_runtime_run` / conteos RRS | **NO UTILIZABLE** como evidencia de selección |
| `role_session_activities` (intento previo) | **NO UTILIZABLE** — eliminada en rollback; no reproponer por defecto |
| Recálculo on-demand en panel | **No autorizado** (contradice carácter observacional) |
| `workmap_coverage_gap` / `manual_review_required` operacional | **Faltantes** en resultado ejecutable actual |

**Estado de planificación §11:** **BLOQUEADO POR AUSENCIA DE RESULTADO FACTUAL PERSISTIDO** (decisión B del addendum).  
BFF `selection-coverage`, UI 11.1, FX-03/FX-04 y CP-009 quedan **especificados** pero **no implementables** hasta fuente factual (Resultado A) o ampliación de persistencia con **aprobación separada** (ruta C futura). **Cero migraciones** autorizadas por defecto.

### 2.3 §12 — Runtime 40+20 y bloques individuales

| Bloque | Función | Base | Causales máx. | Control destacado |
|--------|---------|------|---------------|-------------------|
| B0 | Anclaje y confirmación de actividad | 4 | 1 | B0 semantic entry |
| B0.5 | Encuadre sistémico | 3 | 1 | Cliente, hito, prioridad |
| B1 | Disparador | 4 | 1 | Inicio y precondiciones |
| B2 | Transformación | 6 | 4 | Ruta crítica V3 |
| B3 | Salida y receptor | 5 | 3 | Ruta crítica R9 |
| B4 | Flujo real | 6 | 4 | Process State / timer |
| B5 | Capacidad y discrecionalidad | 5 | 1 | Variedad y sostenibilidad |
| B6 | Compensación y workaround | 5 | 4 | Retrabajo y absorción |
| B7 | Verificación ligera | 2 | 1 | Frontera no diagnóstica |

(Suma base = 40.)

#### 12.1 Diseño del detalle de actividad

Wireframe: actividad + rol + run; chips de bloques; `Base: n / 40`; causales abiertas/cerradas/no activadas; readiness; gaps; próxima acción; acciones de lectura `[Ver bloque] [Ver respuestas autorizadas] [Ver gaps] [Ver historial]`.

#### 12.2 Reglas de presentación

- B0, B0.5, B1–B7 aparecen **individualmente**
- No presentar 60 preguntas como una barra única de porcentaje
- Distinguir base resuelta, causal abierta, causal cerrada y causal no activada
- Readiness y gaps tienen prioridad sobre el conteo
- B7 nunca produce diagnóstico, MoC, IR o registry directo
- Rutas B0, B2, B3 y B7 muestran badge de ruta crítica

**Unidad de ejecución:** `activity_runtime_run` bajo actividad primaria.  
**Ejecución ausente:** vacío factual (“No disponible” / “No hay registros para este caso”), no error inventado.  
**Lectura vs intervención:** Monitoreo = lectura; mutación / evidencia cruda = capabilities §20 y etapas posteriores (§§15–16).

#### 12.3 Separación §12-A / §12-B / §12-C (actualizado 2026-07-17 — plan matrices corregido)

| Tramo | Alcance | Estado |
|-------|---------|--------|
| **§12-A — Estructura visual y navegación** | Jerarquía Monitoreo, campos, chips B0–B7, mensajes causales | **CERRADA** (estructura) |
| **§12-B — Matrices Base 40 / Causal 20** | Columnas/estados congelados; catálogo vs factual; BFF read-only | **Entrega A (Base 40) CERRADA**; Entrega B pendiente |
| **§12-C — Gaps, timers, revisión y readiness** | Pie operativo factual; gaps/timers/reentry/readiness | **PLANIFICADO** (Entrega C; obligatorio para cierre del complemento) |
| **KPI x/40·x/20 global** | Barra % / conteo de universo como KPI | **FUERA** del complemento v1.1 |

**Plan vinculante:** `RECTOR_POINT_12_MATRICES_INTEGRATION_PLAN.md`  
**Autoridad de superficies:** `Diseno_Complementario_Runtime_Matrices_Base_Causal_Panel_EVE_v1_1.docx` (no sustituye el rector).

**Reglas vinculantes del plan corregido:**

- Columnas Base (8) y Causal (7) congeladas; sin columna Bloque (derivada del ID).  
- Causal: una fila por ID; llave `P{0-3}-C##`.  
- Separar regla canónica vs resultado factual del run.  
- Razón de selección = `branching_decision` del run; **prohibido** reutilizar razón §11.  
- `not_evaluated` ≠ `unavailable`.  
- Orden: Entrega A → checkpoint → B → checkpoint → C → dictamen complemento.  
- Sin Entrega C no declarar el complemento cerrado operacionalmente.  
- Ausencia de overlay → No evaluado / No disponible; nunca `0/40` ni `0/20` inventados.

##### Fuentes (confirmadas en plan)

| Requisito | Fuente |
|-----------|--------|
| Catálogo Base/Causal | complemento v1.1 + `runtime-*-matrix.catalog.ts` / BASE40·CAUSAL20 rules |
| Overlay | `branching_decision`, `runtime_interaction_instance`, mapping, `source_question_code` |
| Gaps / timer / readiness | `readiness_*`, `process_state_timer_event`, `semantic_resolution_event` |
| BFF | `.../runs/:runId/runtime/base-matrix`, `causal-matrix`, detalle, gaps-readiness (C) |

##### Decisión vigente

- Plan matrices: **LISTO PARA IMPLEMENTACIÓN** (Entrega A pendiente de aprobación explícita).  
- No migraciones nuevas.  
- No KPI `x/40`/`x/20` global.  
- Amber sin inserts.  
- Código/dictámenes de matrices previos a esta corrección quedan sujetos a realineación A→B→C.

### 2.4 Reglas relacionadas (§§3, 4, 5, 6, 17, 18, 20, 21, 22, 23)

| Sección | Título exacto (síntesis) | Impacto en 10–12 |
|---------|--------------------------|------------------|
| §3 | Principios de diseño y fronteras | P2 profundidad; P4 Object[State]; P9–P10 no-primarias; P7/P8 no diagnostica ni edita |
| §4 | Arquitectura de información del panel | Cascada clear; URL usuario/rol/actividad; jerarquía objetos |
| §5 | Diseño visual general - Modo Empresa Cliente | Centro Monitoreo = tabla usuarios + expandir |
| §6 | Modo Empresa Cliente | Monitoreo = estado actual; Seguimiento/Gobernanza fuera de detalle UI aquí |
| §17 | Estados, reglas de agregación y alertas | Solo vacíos/alertas que tocan usuario/rol/actividad; no UI global de alertas |
| §18 | Arquitectura front-end y componentes Material UI | Componentes y params URL |
| §20 | Seguridad, auditoría y accesibilidad | Scope acumulativo; sin service_role en front |
| §21 | Carga, error y degradación | Vacíos válidos: sin usuarios / sin roles / sin elegibles / sin causales |
| §22 | Pruebas y aceptación | CP-007…CP-011; FX-03/FX-04 |
| §23 | Fases de implementación | Fase 2 = recursión (usuarios, roles, actividades, Runtime) |

### 2.5 Cascada de limpieza (rector §4.2 + reglas mínimas de esta etapa)

| Cambio | Permanece | Se limpia |
|--------|-----------|-----------|
| Cambiar caso | Empresa | Usuario, rol, actividad, run, proceso, hito, participant/profile |
| Cambiar usuario | Empresa, caso, proceso, hito | Rol, actividad, run |
| Cambiar rol | Empresa, caso, usuario, proceso, hito | Actividad, run |
| Cambiar actividad | … + rol | Run |
| Monitoreo ↔ Seguimiento | Empresa, caso, proceso, hito, drill-down | Solo layout central |

---

## 3. Estado de partida que se respeta

| Punto | Estado al iniciar 10–12 |
|-------|-------------------------|
| §4–§6 | PARCIAL |
| §7 Eje X | CERRADO estructural / PARCIAL operacional |
| §8 Eje Y | CERRADO estructural / PARCIAL operacional |
| §9 Matriz X/Y | CERRADO estructural |

**Reutilizar sin reconstruir:** contexto Empresa→Relación→Caso; autorización Consultor; participantes; perfiles; navegación URL; Eje X; Eje Y; matriz; BFF/RLS.  
**No mover ni rediseñar §§7–9.**

---

## 4. Auditoría del repositorio

| Capacidad | Fuente real | Tabla/vista | BFF | UI actual | Tests | Estado |
|-----------|-------------|-------------|-----|-----------|-------|--------|
| Empresa→Relación→Caso | Unit 2A/2B | assignments, relationships, sesiones_llenado | client-companies, relationships, cases | ClientContextSelector | unit2a/2b | **CERRADO** |
| Auth consultor + RLS | context-auth | RLS oficiales | todas las rutas oficiales | gate authenticated | unit2a, staging | **CERRADO** |
| Participantes caso | R2A | `case_participants` | `GET .../participants` | CaseParticipantsPanel | R2a/R2b | **CERRADO** |
| Perfiles funcionales | R2A | `case_participant_profiles` | `GET .../profiles` | FunctionalProfile* | R2a/R2b | **PARCIAL** |
| URL participant/profile | R2B | query | — | participant-profile-navigation | R2b | **CERRADO** |
| §7 Eje X | catalog + BFF | catalog | support-processes | SupportProcessAxis | rector-7 | **CERRADO estructural / PARCIAL operacional** |
| §8 Eje Y | 4A + RPC | core_milestone_* | core-milestones | CoreMilestoneRail | 8-9 | **CERRADO estructural / PARCIAL operacional** |
| §9 Matriz X/Y | catalog fijo | — | client | XyInteraction* | 8-9 | **CERRADO estructural** |
| Usuario §10.1 | vía participant | case_participants.user_id | participants | lista expandible | R2b | **PARCIAL** |
| Rol §10.2 | profile R2 | profiles | profiles | select profile | R2b | **PARCIAL** |
| Actividades por rol | — | sin vínculo oficial panel | **none** | **none** | **none** | **NO INICIADO** |
| Selección §11 | `activity_selection_results` effective + policy v1.3 admin | ledger §11 + items | BFF activity-selection | Cobertura de actividades | rector-point-11 | **CERRADO estructural** (Amber vacío factual) |
| Runtime runs | schema P3 + runtime-40-20 | `role_runtime_session`, `activity_runtime_run` | `/api/eve/runtime-40-20/*` | **none** oficial | runtime modules | **NO INICIADO** en panel oficial |
| Bloques B0–B7 | Runtime + Significado | interaction instances | runtime-40-20 | **none** oficial | runtime/Significado | **NO INICIADO** en panel oficial |
| Base / causal | Runtime ops | run states | runtime-40-20 | **none** oficial | runtime | **NO INICIADO** en panel oficial |
| Gaps / readiness | P3/P5 | `readiness_gap_record`, `readiness_decision_record` | runtime-40-20 | **none** oficial | P5 scripts | **NO INICIADO** en panel oficial |
| Profundidad Monitoreo | shell | — | partial | Caso→X/Y→Persona→Perfil | R2+7–9 | **PARCIAL** |

### Inventario BFF oficial actual

- `.../client-companies`
- `.../client-companies/[companyId]/relationships`
- `.../relationships/[relationshipId]/cases`
- `.../cases/[caseId]/participants`
- `.../cases/[caseId]/participants/[participantId]/profiles`
- `.../cases/[caseId]/support-processes`
- `.../cases/[caseId]/core-milestones`
- `.../cases/[caseId]/process-structure`
- `.../local-session`

**No existen** endpoints oficiales de actividades, selección, runs, bloques, gaps o readiness.

### Assets externos reutilizables (no cableados)

| Concern | Rutas |
|---------|-------|
| Primary selection policy | `src/domain/primary-activity-selection-policy.ts`, `.v1.3.ts`; corpus xlsx |
| Runtime schema | `supabase/migrations/20260708123000_eve_runtime_40_20_p3_schema_rls.sql` |
| Runtime services | `src/services/eve/runtime-40-20/` |
| Runtime BFF | `src/app/api/eve/runtime-40-20/` |
| Legacy CCP | `src/services/eve/consultant-control-panel/` — **fuera de alcance oficial** |

---

## 5. Reutilización de trabajo adelantado

| Asset | Decisión | Nota |
|-------|----------|------|
| `case_participants` | Conservar | Base Caso → Usuario |
| `case_participant_profiles` | Conservar | Capa presentación de rol UI; **no** es aún `role_runtime_session` |
| `CaseParticipantsPanel` | Evolucionar in-place | Misma zona Monitoreo → tabla §10.1 + expansiones |
| `participant` / `profile` URL | Adaptador + migración | Dual-read temporal; destino canónico §18 |
| Igualdad empresa participante = empresa caso | No reintroducir | Dictamen R2A affiliation |

### Qué satisface §10 hoy

Persona expandible + perfil seleccionable con URL y BFF autorizados.

### Qué falta según vocabulario rector

- Tabla 10.1 con columnas Engagement / Actividades / Etapa / Readiness / Atención factuales
- Rol = `role_runtime_session` (no solo `display_label` de perfil)
- Actividades elegibles/primarias/no primarias
- Resumen Runtime en 10.3

### Presentación vs contrato

| Tipo | Cambio |
|------|--------|
| Presentación | Columnas UI, copy, acordeones, colapso |
| Contrato de datos | Vínculo auditado perfil/participante ↔ `role_runtime_session`; listados de actividad; selección; runs |

---

## 6. Modelo de datos requerido

| Punto | Objeto factual | Relación | Estado | Fuente de escritura | Auditoría | Existe |
|-------|----------------|----------|--------|---------------------|-----------|--------|
| §10 | Usuario del caso | Caso → Usuario | enabled | admin / R2A | context audit | **Sí** `case_participants` |
| §10 | Perfil funcional UI | Usuario → Perfil | resolution_status | admin / R2A | context audit | **Sí** `case_participant_profiles` |
| §10 | Sesión de rol Runtime | Caso → `role_runtime_session` | draft…archived | Runtime engines | source_trace | **Sí tabla; vínculo a participante/perfil NO** |
| §10/11 | Actividad elegible/primaria | Rol → Actividad | selection_* | selector EVE (fuera panel) | policy/runtime | **Parcial fuera de secuencia** |
| §12 | `activity_runtime_run` | Actividad primaria → Run | estados run | Runtime orchestrator | source_trace | **Sí; no cableado al panel** |
| §12 | Bloques / instancias | Run → B0–B7 | interaction state | Runtime | — | **Sí schema** |
| §12 | Gaps / readiness | Run → records | gap/decision | Runtime / P5 | — | **Sí schema** |

### Puente crítico

`role_runtime_session.role_id` y `activity_runtime_run.activity_id` son UUID **sin FK** a `case_participant_profiles`.

**Regla:** no proponer tablas nuevas hasta demostrar que no existe estructura equivalente. La primera brecha a resolver (contrato, no UI) es un **vínculo explícito auditado** participante/perfil ↔ sesión de rol. Sin él, la UI muestra vacíos factuales en actividades/runs.

**Prohibido:**

- Usar `sesiones_llenado.usuario_id` como sustituto de participación sin contrato
- Usar fixtures como persistencia productiva
- Inventar joins

---

## 7. Contratos BFF (diseño; no implementar en esta tarea)

Prefijo: `/api/eve/official-consultant-control-panel/`  
Auth: Bearer consultor.  
Scope acumulativo: **Consultor ∧ Empresa ∧ Relación ∧ Caso** (+ Usuario ∧ Rol ∧ Actividad ∧ Run según profundidad).  
**La URL nunca concede acceso.**

| Ruta | Autorización | Request | Response mínimo | Vacío / parcial / error | Campos prohibidos | Degradación |
|------|--------------|---------|-----------------|-------------------------|-------------------|-------------|
| `GET .../cases/{caseId}/monitoring/users` (o evolucionar `/participants`) | caso autorizado | caseId | filas §10.1 + ids | lista vacía ≠ “0%” | engagement inventado | partial si falta Runtime |
| `GET .../users/{userId}/role-sessions` | + user del caso | userId | RRS / labels / counts | sin roles = mensaje §21 | roles inventados | empty factual |
| `GET .../role-sessions/{rrsId}/activities` | + rrs | rrsId | elegibles / primarias / no primarias + reasons | `reentry_required` | mutación de selección | GET-only |
| `GET .../role-sessions/{rrsId}/selection-coverage` | + rrs | rrsId | campos §11.1 | partial flags | UI competitiva de elección | read-only |
| `GET .../activities/{activityId}/runtime-summary` | + activity | activityId | run id, state, base/causal, readiness, gaps summary | sin run | % único 60Q | “No disponible” |
| `GET .../runs/{runId}/blocks` | + run | runId | chips B0–B7 + estados | causales no activadas OK | diagnóstico B7 | partial por bloque |
| `GET .../runs/{runId}/gaps-readiness` | + run | runId | gaps + decision | empty gaps OK | respuestas raw sin capability | forbidden si no capability |

Estrategia: reutilizar lectura de `src/services/eve/runtime-40-20/` mediante **adaptadores de servicio oficiales**; no PostgREST desde el front; no montar BFF legacy CCP.

---

## 8. Integración visual (sin alterar §§7–9)

```
Cabecera Empresa/Caso
KPI strip
Eje X (posición actual)
Eje Y (posición actual)
Detalle proceso (colapsable)
Intersección X/Y
Matriz X/Y
★ Profundidad §10–12: Persona → Rol → Actividad → Runtime
Atención drawer (fuera de etapa salvo mensajes read-only)
```

- Eje X, Eje Y, Matriz: **permanecen**
- Atención / Gobernanza / Seguimiento: **fuera** de diseño UI detallado en esta etapa
- No mover componentes como efecto colateral

---

## 9. Navegación — decisión fija

### Conservar (no romper §§7–9)

`company`, `relationship`, `case`, `mode`, `view`, `process`, `milestone`

### Profundidad canónica (rector §18.2 + scope §19)

| Param | Significado |
|-------|------------|
| `user_id` | Usuario físico autorizado del caso |
| `role_runtime_session_id` | Sesión de rol Runtime |
| `activity_id` | Actividad |
| `run` | `activity_runtime_run_id` cuando el detalle de run está abierto |

### Adaptación de R2B

1. **Dual-read temporal:** si llegan `participant` / `profile`, resolver a `user_id` (+ metadata de perfil).
2. Al escribir URL preferir params canónicos.
3. Tras estabilizar Ola A, deprecar escritura de `participant`/`profile`.
4. Cascada de limpieza según §2.5.
5. Refresh / back-forward solo restauran combinaciones que pasen auth BFF.

---

## 10. Plan de ejecución acelerado — tres olas

### Ola A — §10 Monitoreo recursivo Empresa -> Usuario -> Rol -> Actividad

**Complejidad:** alta  
**Cierra:** Caso → Usuario → Rol funcional → Actividad (lectura; Runtime solo resumen si existe run).

Incluye:

1. Auditoría Amber readonly (conteos participants / profiles / RRS / runs; sin inserts)
2. Contrato de vínculo perfil ↔ RRS (migración solo si se demuestra necesaria; si no hay datos → vacío factual)
3. BFF users + role-sessions + activities list
4. Navegación canónica + cascade + dual-read
5. UI: tabla 10.1 + expansiones 10.2 / 10.3 en zona participantes
6. Tests integridad / auth / nav / a11y + capturas; regresión §§7–9

**Criterio de cierre verificable:** en Monitoreo, con caso autorizado, se navega usuario → rol → actividad sin páginas nuevas (CP-007); vacíos §21 correctos; sin mutación de selección; ejes X/Y/matriz intactos.

**Bloqueo parcial esperado:** sin vínculo RRS o sin runs, columnas Actividad/Readiness muestran “No disponible” / “No hay registros…”.

### Ola B — §11 Selección de actividades primarias y contexto no primario

**Complejidad:** media  
**Estado:** **CERRADO estructural** — resultado factual persistido + lectura read-only (`RECTOR_POINT_11_ACTIVITY_SELECTION_DICTAMEN.md`).  
**Operacional Amber:** vacío factual (sin resultados inventados).

Incluye entregado:

1. Migración `activity_selection_results` + items + publish/validate/revoke
2. Admin `manage-activity-selection-results.mjs` (único camino que ejecuta política)
3. BFF `.../sessions/:sessionId/activity-selection`
4. UI Cobertura de actividades (GET-only)
5. Verificador + tests FX conceptuales

**No incluye:** §12; recálculo desde panel; migración en staging/producción.

### Ola C — §12 Runtime 40+20 y bloques individuales

**Complejidad:** alta  
**Estado (2026-07-17 — plan matrices corregido):**  
- **§12-A estructura visual:** **CERRADA**.  
- **§12-B Matrices Base 40 / Causal 20:** **PLAN LISTO PARA IMPLEMENTACIÓN** — ver `RECTOR_POINT_12_MATRICES_INTEGRATION_PLAN.md` (columnas/estados/Entrega C). Entrega A **no iniciada** en la tarea de corrección documental.  
- **§12-C Gaps/timers/readiness:** **PLANIFICADO** (obligatorio para cierre operacional del complemento).

**Cierra §12-A:** `ActivityRuntimePanel` visible tras Cobertura; resumen + B0–B7 estructurales; mensajes causales; Amber vacío factual.  

**Cierra §12-B (cuando A+B bajo plan corregido):** 40/20 filas; celdas duales regla/hecho; razón desde `branching_decision`; filtros; drawer; sin barra % ni `0/40` inventado.  

**Cierra complemento (A+B+C):** pie operativo factual; gaps; timers; reentry; readiness.

Orden vinculante: **A → checkpoint → B → checkpoint → C → dictamen**. No paralelo.

**No incluye (esta corrección documental):** código, migraciones nuevas, KPI global x/40, §13, inicio de Entrega A.

---

## 11. Paralelización

### Puede hacerse en paralelo

- Contratos y tipos TS
- Auditoría de tablas / Amber readonly
- Adaptadores de presentación
- Fixtures test-only
- Pruebas de seguridad / RLS
- Componentes visuales con contratos mock estabilizados

### Estrictamente secuencial

```
usuario/rol factual
  → actividad
    → selección (§11)
      → Runtime (§12)
```

No saltar dependencias causales para “acelerar”.

---

## 12. Cervecería Amber

Caso canónico de validación (IDs ya usados en ops locales):

| Entidad | ID |
|---------|-----|
| Company | `5c08029f-15e9-4bbd-b13e-0ff4765e23b8` |
| Relationship | `7c499a1c-31c6-4fc9-8b20-2fd8cdc57043` |
| Case (INC16) | `19fc9eff-4219-43f0-854c-e2b3350f23f2` |

### Declaraciones de datos (a verificar readonly en Ola A; no inventar)

| Dato | Expectativa de planificación |
|------|------------------------------|
| Contexto empresa/relación/caso | Existe |
| Participantes / perfiles | Según DB real; puede ser vacío |
| `role_runtime_session` / runs ligados a participantes | Típicamente ausentes o desvinculados |
| Estado operacional P-SUP / H0–H6 | PARCIAL / No disponible (ya conocido §§7–8) |

### Vacíos válidos (rector §21)

- Sin usuarios → caso sin participantes; **no** “0% completado”
- Sin roles → no inventar rol
- Sin elegibles → `reentry_required`
- Sin causales → ninguna activada; **no** es error
- Sin run → “No disponible” / “No hay registros para este caso”

### Pruebas

Requieren fixtures / DB test-only. **Nunca** insertar usuarios, roles, actividades o runs ficticios en Amber.

---

## 13. Pruebas y criterios de cierre por ola

| Área | Ola A | Ola B | Ola C |
|------|-------|-------|-------|
| Integridad | ✓ | ✓ | ✓ |
| Autorización acumulativa | ✓ | ✓ | ✓ |
| BFF vacío/parcial/error | ✓ | ✓ | ✓ |
| Navegación cascade | ✓ | ✓ | ✓ |
| UI Monitoreo | tabla + expand | cobertura | bloques |
| Accesibilidad | ✓ | ✓ | ✓ |
| Responsive | ✓ | ✓ | ✓ |
| Back/forward | ✓ | ✓ | ✓ |
| Params inválidos | ✓ | ✓ | ✓ |
| Degradación parcial | ✓ | ✓ | ✓ |
| Regresión §§7–9 | **obligatoria** | **obligatoria** | **obligatoria** |
| Capturas | usuarios, rol, actividad | cobertura | bloques Runtime |
| Criterios rector | CP-007, CP-008 | CP-009 | CP-010, CP-011 |

**No aceptar** “componente creado” como cierre.

---

## 14. Lo que queda fuera de esta etapa

| Punto | Título (corto) | Uso en este plan |
|-------|----------------|------------------|
| §13 | Manual P-SUP-03/04/05 | Solo dependencia posterior |
| §14 | Producción Paralela / QA | Solo dependencia posterior |
| §15 | Gobernanza de Experiencia | Solo dependencia posterior |
| §16 | Intervención de soporte | Solo dependencia posterior |
| §17 | Estados y alertas globales | Solo reglas de vacío/alerta puntuales |

No diseñar UI detalladas de esos puntos aquí.

---

## 15. Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Sin puente profile ↔ RRS | Ola A no llega a actividad factual | Contrato explícito o vacío factual; no join inventado |
| Contaminar Amber | Falsos positivos | Solo lectura; fixtures aislados |
| Reusar BFF legacy CCP | Diseño incorrecto | Solo adaptadores oficiales nuevos |
| Mutación de selección desde panel | Viola §11 | Endpoints GET-only en esta etapa |
| Mover ejes al meter profundidad | Rompe §§7–9 | Zona estricta post-matriz; tests regresión |
| Igualar participant = user sin resolve | Auth rota | Dual-read + validación BFF |

---

## 16. Estimación relativa

| Ola | Punto | Complejidad |
|-----|-------|-------------|
| A | §10 Monitoreo recursivo Empresa -> Usuario -> Rol -> Actividad | **Alta** |
| B | §11 Selección de actividades primarias y contexto no primario | **Media** |
| C | §12 Runtime 40+20 y bloques individuales | **Alta** |

---

## 17. Entregables de esta tarea de planificación

1. Este documento: `RECTOR_POINTS_10_12_IMPLEMENTATION_PLAN.md`
2. Dictamen: `RECTOR_POINTS_10_12_STATUS_DICTAMEN.md`

**No incluye código, migraciones, componentes, tests ni datos.**

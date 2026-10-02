# Dictamen — Tramo R2 BLOQUEADO

Fecha: 2026-07-15  
Alcance: Empresa cliente → Caso → Usuario físico → Perfil funcional  
Caso canónico: Cervecería Amber (`19fc9eff-4219-43f0-854c-e2b3350f23f2`)  
**Siguiente tramo (perfil → responsabilidades → actividades): no iniciado.**  
Staging/producción: sin cambios.

## Veredicto

**Tramo R2 bloqueado: no existe una fuente factual suficiente para representar usuarios del caso y perfiles funcionales internos.**

No se creó `CaseParticipant` / perfiles inventados, no se expuso BFF de participantes, no se alteró la UI del panel oficial, no se poblaron Ventas/Finanzas/Logística, no se activaron KPI Usuarios / Roles funcionales. Permanecen en **—**.

---

## 1. Trazabilidad de diseño ejecutada (inspección)

| Sección | Contenido | Uso en R2 |
|---------|-----------|-----------|
| Corpus v1.0 **§10** | Un login; 1..\* perfiles; estados de resolución | Define profundidad conceptual requerida |
| MR-008 | Panel muestra usuario físico expandible por perfiles funcionales | Criterio UI objetivo — **no implementable sin fuente factual** |
| MR-009 | Reasignación manual conserva audit trail; no sobrescribe evidencia | Requisito de integridad futuro — **sin modelo de asignación aún** |
| Jerarquía panel (corpus **§10**) | empresa → caso → usuario → perfil → actividad → run | Profundidad R2 = solo hasta perfil; actividades fuera de alcance |
| `ui_v1_1` | Usuario físico se expande en uno o más perfiles funcionales | Zona visual prevista; **no activada** |

### Requisitos MR cubiertos en este dictamen

- **MR-008 / MR-009**: reconocidos como rectoría; **no implementados** por bloqueo factual.
- MR-001…MR-007, MR-010: fuera del alcance R2 (Runtime / selector / Significado / descargas).

### Partes del diseño ya cerradas (no reabrir)

| Tramo/Unidad | Estado |
|--------------|--------|
| Unidad 2A/2B — contexto empresa/relación/caso | Cerrado |
| Unidad 3A/3B — proceso principal + hitos operativos UI | Cerrado |
| Unidad 4A — persistencia H0–H6 + evidencia Object[State] | Cerrado (KPI visual no activado) |
| Unidad 4 KPI visual / Unidad 5 | No iniciadas |

### Brecha que queda después de R2

No existe persistencia oficial del panel para:

1. **Caso → Usuario participante** (N usuarios físicos explícitos del caso), y  
2. **Usuario → Perfil funcional** (etiqueta visible + estado de resolución, sin confundir con cargo/seguridad).

### Siguiente punto rector esperado (sin iniciar)

**Perfil funcional → responsabilidades → actividades**

Requiere aprobación explícita posterior a desbloqueo de R2.

---

## 2. Inventario factual (inspección obligatoria)

### A) Estructuras encontradas

| Estructura | Columnas relevantes | ¿Sirve como Caso→Usuario participante? | ¿Sirve como Usuario→Perfil funcional? |
|------------|---------------------|------------------------------------------|----------------------------------------|
| `sesiones_llenado` | `id`, `usuario_id` → `usuarios` | **No autorizado como contrato R2.** Es dueño/llenador de la sesión de captura. Unidad 2A: `empresa_id` del participante **no** determina empresa del caso. La instrucción R2 prohíbe asumir `usuario_id` = participante del caso sin contrato explícito multi-usuario. | No |
| `usuarios` | `id`, `auth_user_id`, `empresa_id`, `email` | Identidad física posible, **sin vínculo de participación en caso** aparte de `sesiones_llenado.usuario_id` | Sin etiqueta de perfil ni resolución |
| `role_runtime_session` | `case_id`, `role_id`, `state` (draft/active/…) | Runtime por caso/rol; **sin `user_id` / `case_participant_id`** | No es perfil UI del panel; instrucción R2 **prohíbe Runtime** como fuente; estados ≠ `mixed_unresolved` |
| `eve_role_runtime_session` | `case_id` text, `role_id` text | Igual: Runtime local paralelo; sin usuario físico | No |
| `activity_runtime_run` | `reentry_required`, `manual_review_required` en `state` | Runtime | No es perfil; estados de run, no de perfil panel |
| `case_participants` / `case_participant` / `functional_profiles` | — | **No existen** (`to_regclass` = null) | — |

### B) BFF oficial existente

Rutas `official-consultant-control-panel`: empresas, relaciones, casos, `process-structure`, local-session.  
**No** existe `.../cases/:caseId/participants` ni `.../profiles`.

### C) UI panel oficial

Shell con contexto + banda/rail de proceso/hitos (3B). KPI strip declara labels «Usuarios» / «Roles funcionales» pero renderiza **—**.  
**No** hay zona «Personas participantes» navegable.  
Legacy/fixture `consultant-control-panel` (P-CLIENT-01 / WorkMap) **no** es fuente del panel oficial ni de Amber canónico.

### D) Amber (DB local inspeccionada)

| Hecho | Valor |
|-------|-------|
| Caso | `19fc9eff-4219-43f0-854c-e2b3350f23f2` |
| `sesiones_llenado.usuario_id` | `5a830545-d8a7-4a4f-b727-629d3c6e3751` (seed recuperación Unit 2; email test-only) |
| `role_runtime_session` del caso | **0 filas** |
| Participantes multi-usuario / perfiles funcionales panel | **Ausentes** |
| Conclusión UI autorizada si R2 existiera | «Personas participantes: No disponibles» (vacío factual) — **no implementado** porque el tramo está bloqueado |

---

## 3. Por qué no se creó persistencia mínima ahora

La instrucción permite crear equivalentes a `CaseParticipant` / `RoleRuntimeSession` **solo** si el repositorio confirma la brecha **y** hay base para poblar sin inventar.

Crear tablas vacías + UI «No disponibles» **sin** contrato canónico de participación ni de perfil (etiqueta + resolución) implicaría:

- reinterpretar `sesiones_llenado.usuario_id` como participante R2 (prohibido sin contrato);
- o usar Runtime/`role_id` sin `user_id` (prohibido / insuficiente);
- o inventar perfiles desde fixtures/imagen (prohibido).

La **regla de bloqueo (§2)** prevalece: detener y dictaminar.

---

## 4. Ampliación **no** aplicada

No se implementó:

- migraciones `case_participants` / perfiles;
- BFF participants/profiles;
- URL `participant=` / `profile=`;
- UI expandible de personas;
- seed Amber de usuarios/perfiles;
- cálculo KPI Usuarios / Roles funcionales;
- tramo responsabilidades/actividades;
- cambios staging/producción.

---

## 5. Confirmaciones

| Control | Estado |
|---------|--------|
| Cero cambios de UI del panel oficial | Sí |
| KPI Usuarios / Roles funcionales = — | Sí |
| Amber sin datos inventados | Sí |
| Unit 2/3/4A sin regresión por este tramo | Sí (solo docs/scripts/tests de bloqueo) |
| Staging/producción intactos | Sí |
| Siguiente tramo no iniciado | Sí |

---

## 6. Desbloqueo futuro (fuera de este dictamen)

Requiere, como mínimo y con aprobación explícita:

1. Contrato factual **Caso → Usuario participante** (tabla o vínculo explícito auditado, distinto del dueño opcional de `sesiones_llenado` si el diseño lo separa).
2. Contrato factual **Usuario → Perfil funcional** con `role_label_visible` + `resolution_status` respaldados (sin `role_type`; sin inventar desde WorkMap no vinculado).
3. Integridad MR-009 (reasignación auditada).
4. Solo entonces BFF + UI «Personas participantes» / expandible (MR-008).

Inspector: `scripts/eve/official-control-panel/inspect-tramo-r2-case-participants.mjs`

# Plan de implementación — Puntos 1–9 del diseño rector

Fecha: 2026-07-16  
**Autoridad única:** `docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` (v1.0)  
**Módulo contrastado:** `src/features/official-consultant-control-panel/`, `src/app/admin/official-consultant-control-panel/`, `src/services/eve/official-control-panel/`, migraciones oficiales, tests y reports locales.  
**Excluido como autoridad:** panel legacy, Runtime docs ajenos, numeraciones históricas de unidades (solo evidencia factual).  
**Esta tarea:** documentación únicamente — cero cambios de código, datos o UI.

## Método

Estados permitidos únicamente:

| Estado | Criterio |
|--------|----------|
| CERRADO | Datos/fuente + lógica + UI + autorización + pruebas + evidencia visual cuando aplique |
| PARCIAL | Solo una parte (UI sin datos, persistencia sin UI, shell sin comportamiento, etc.) |
| NO INICIADO | Sin implementación relevante |
| BLOQUEADO POR DATOS | Falta fuente factual |
| BLOQUEADO POR INFRAESTRUCTURA | Falta plataforma/infra |
| IMPLEMENTADO FUERA DE SECUENCIA | Existe, pero el rector lo sitúa después de dependencias no materializadas |
| NO SUSTENTADO POR EL RECTOR | No aparece en el diseño rector |

Si una afirmación no está en el docx: **No sustentado explícitamente por el diseño rector.**

---

## 1. Extracción punto a punto (diseño rector)

### 1. Dictamen ejecutivo y alcance

| Campo | Contenido rector |
|-------|------------------|
| Título exacto | Dictamen ejecutivo y alcance |
| Propósito | Adoptar dos ejes como estructura principal: X = proceso de soporte observado; Y = hito alcanzado/esperado; combinación = intersección de monitoreo **sin afirmar causalidad inexistente**. Una ruta, una cabecera Empresa Cliente; modos Empresa Cliente y Gobernanza de Experiencia del Usuario. |
| Capacidades | Centro de observación = Empresa Cliente y estado del caso (no Runtime ni audit trail); profundidad usuarios → roles → actividades → Runtime 40+20; ejes P-SUP-01..09 y hitos `CasoDiagnosticoEVE` en PF-CORE-01; experiencia transversal; intervención solo autorizada/auditada. |
| Visual | No especifica wireframe propio (remite a §5). |
| Datos | CasoDiagnosticoEVE; procesos P-SUP; role_runtime_session; actividades. |
| Interacción | Modos superiores; profundización recursiva. |
| Dependencias | Fuentes §2; principios §3. |
| Aceptación | No sustentado explícitamente como checklist numerado; criterio implícito: ejes X/Y adoptados como estructura principal. |
| Estado frente al repo | **PARCIAL** |

### 2. Fuentes rectoras y jerarquía de autoridad

| Campo | Contenido rector |
|-------|------------------|
| Título exacto | Fuentes rectoras y jerarquía de autoridad |
| Propósito | Declarar fuentes documentales y su uso (MBA, BPMN PF-CORE-01, Capas 1.0/PP, catálogos Runtime, Catálogo Madre, PrimaryActivitySelectionPolicy, Capas 2.0–2.5). |
| Capacidades / UI / datos de panel | Documentales; no definen componentes UI. |
| Aceptación | Corpus del panel incluye esas fuentes. |
| Estado | **CERRADO** (documental): inventariadas en `docs/eve/panel-control/corpus/CORPUS_MANIFEST.md`. |

### 3. Principios de diseño y fronteras

| Campo | Contenido rector |
|-------|------------------|
| Título exacto | Principios de diseño y fronteras |
| Propósito | P1–P10: Empresa primero; profundidad recursiva; X⊥Y; Object[State] autoridad; manual≠automático; conformance antes de consistency; experiencia no diagnostica; intervención sin corrupción; contexto≠evidencia; no primario≠irrelevante. Frontera crítica: Gobernanza de Experiencia no es PM nuevo sin cambio MBA. |
| Estado | **PARCIAL** (shell “empresa primero”; Object[State] no domina UI; ejes no ortogonalizados en pantalla). |

### 4. Arquitectura de información del panel

| Campo | Contenido rector |
|-------|------------------|
| Título exacto | Arquitectura de información del panel |
| Propósito | Jerarquía EmpresaCliente → ClientEngagement → CasoDiagnosticoEVE → usuario → role_runtime_session → actividades/runs; trabajo manual P-SUP-03/04/05; Producción Paralela P-SUP-06..09. |
| Modos | Empresa Cliente: Monitoreo \| Seguimiento \| Gobernanza. Gobernanza de Experiencia: Trayectorias \| Soporte \| Salud de pantallas. |
| Filtros | Sin proceso/hito = vista global; solo X; solo Y; X+Y = intersección; usuario/rol/actividad. |
| Persistencia | §4.3: selección proceso/hito/usuario/rol/actividad en URL y BFF scope; cambiar subvista no pierde contexto. §4.4: `mode=company`, `view=monitoring`, `process=Todos`, `milestone=hito actual`. |
| Estado | **PARCIAL** (modos/subvistas/contexto empresa-relación-caso; faltan filtros process/milestone H0–H6/user/role/activity canónicos). |

### 5. Diseño visual general

| Campo | Contenido rector |
|-------|------------------|
| Título exacto | Diseño visual general (cuerpo: «Diseño visual general - Modo Empresa Cliente») |
| Wireframe | Cabecera + KPIs; tabs Empresa Cliente / Gobernanza Experiencia; subvistas; banda P-CORE-01 + Object[State] + próximo evento + timer; **EJE X — PROCESOS** `[Todos]`…P-SUP-09; **HITOS PF-CORE-01** H0–H6 + salidas alternas; workspace central; **ATENCIÓN Y GOBERNANZA** (drawer); barra READ-ONLY. |
| Lectura | «La barra X y el rail Y filtran la misma unidad de negocio. El centro siempre abre en Empresa Cliente… La columna derecha es un drawer contextual». |
| Estado | **PARCIAL** + representación **incorrecta** de X/Y (ver §6 visual). |

### 6. Modo Empresa Cliente

| Campo | Contenido rector |
|-------|------------------|
| Título exacto | Modo Empresa Cliente |
| Subvistas | Monitoreo / Seguimiento / Gobernanza (contenidos distintos). |
| §6.1 Cabecera | Empresa; ClientEngagement Object[State]; CasoDiagnosticoEVE [estado]; hito actual; siguiente evento; participación; atención. |
| §6.2 KPIs | Hitos core x/7; usuarios; roles; actividades; procesos manuales; findings/rework; alertas experiencia. Porcentaje no reemplaza lectura por hito/Object[State]. |
| Estado | **PARCIAL** (cabecera contextual + 7 KPI shells `—` + subvistas; sin Object[State] engagement ni KPIs calculados). |

### 7. Eje X - Procesos de soporte

| Campo | Contenido rector |
|-------|------------------|
| Título exacto | Eje X - Procesos de soporte |
| Botones | Todos; P-SUP-01…P-SUP-09 (03/04/05 MANUAL; 07/08 agrupados) con target states Object[State]. |
| §7.1 | Status dot; contador atención; badge PLATAFORMA/MANUAL; tooltip trigger/target/evento; selection → URL + workspace. |
| Estado | **CERRADO estructural / PARCIAL operacional** — ver `RECTOR_POINT_7_SUPPORT_PROCESS_AXIS_DICTAMEN.md` |

| Campo | Contenido rector |
|-------|------------------|
| Título exacto | Eje Y - Hitos de PF-CORE-01 |
| Catálogo | H0–H6 con Object[State], espera, timer (tabla completa en rector). |
| §8.1 Estados UI | `reached`, `current_wait`, `manual_pending`, `blocked`, `not_reached`, `final_alternative`; finales bajo rail. |
| §8.2–8.3 | Tarjeta de hito; reglas de click alcanzado/actual/futuro/alternativo. |
| Estado | **CERRADO estructural / PARCIAL operacional** — rail H0–H6, detalle sincronizado, selección validada; Amber sin evidencia de logro. Ver `RECTOR_POINTS_8_9_EJE_Y_MATRIZ_DICTAMEN.md` |

### 9. Matriz de interacción X/Y

| Campo | Contenido rector |
|-------|------------------|
| Título exacto | Matriz de interacción X/Y |
| Códigos | D (directa), M (manual), P (paralela), P* (paralelo condicionado), - (sin relación causal). |
| §9.1 | Mensajes de workspace por tipo de relación. |
| Estado | **CERRADO estructuralmente.** Matriz arquitectónica visible; **no representa ejecución factual** de intersecciones. Ver `RECTOR_POINTS_8_9_EJE_Y_MATRIZ_DICTAMEN.md` |

---

## 2. Matriz maestra de puntos 1–9

| Punto | Título exacto | Exigencia rectora | Estado | Evidencia actual | Brecha | Dependencias | Acción requerida | Criterio de cierre |
|------:|---------------|-------------------|--------|------------------|--------|--------------|------------------|-------------------|
| 1 | Dictamen ejecutivo y alcance | Dos ejes X/Y; modos; profundidad; sin causalidad inventada | PARCIAL | Shell + modos en `OfficialControlPanelShell.tsx`; profundidad parcial personas/perfiles | Ejes X/Y no son P-SUP ni H0–H6 | §2–§3 | Materializar X luego Y luego matriz | Estructura visual y datos alineados a X=P-SUP y Y=H0–H6 |
| 2 | Fuentes rectoras y jerarquía de autoridad | Corpus de fuentes listadas | CERRADO | `corpus/CORPUS_MANIFEST.md` + archivos en `docs/eve/panel-control/corpus/` | N/A UI | — | Mantener corpus | Fuentes presentes y hasheadas |
| 3 | Principios de diseño y fronteras | P1–P10 + frontera experiencia | PARCIAL | Empresa primero en UI; RLS/BFF sin fuga; R2 no inventa datos | Object[State] no es autoridad UI; X/Y no ortogonales en pantalla | §1–§2 | Aplicar P3–P4 al montar ejes | Principios verificables en UI/datos |
| 4 | Arquitectura de información del panel | Jerarquía; modos/subvistas; filtros; URL process/milestone/user/role/activity | PARCIAL | Empresa→relación→caso; `milestone`/`participant`/`profile`; subvistas | Sin `process` P-SUP; sin milestone H0–H6; sin user/role/activity canónicos; engagement | §3, §5 | Extender navegación URL rector | Filtros y URL §4.3–4.4 operativos |
| 5 | Diseño visual general | Wireframe X barra + Y rail + workspace + drawer | PARCIAL | Layout 3 columnas; cabecera; KPI; drawer; status bar | X/Y incorrectos; placeholders no son P-SUP/H0–H6 | §4, §6 | Sustituir/reubicar banda y rail genéricos | Wireframe §5 legible en pantalla |
| 6 | Modo Empresa Cliente | Subvistas + cabecera §6.1 + KPI §6.2 | PARCIAL | Combobox contexto; 7 labels KPI `—`; Monitoreo activo | Engagement Object[State]; KPIs calculados; Seguimiento/Gobernanza vacíos de contenido rector | §5 | Completar cabecera/KPI tras ejes | Cabecera y KPI con semántica §6 |
| 7 | Eje X - Procesos de soporte | Botones Todos + P-SUP-01..09 | CERRADO estructural / PARCIAL operacional | Barra P-SUP; URL `process`; sin Todos; Amber sin inventar | Estado operacional Amber N/D | §5–§6 | Mantener; no inventar Amber | Barra X funcional + URL + estados |
| 8 | Eje Y - Hitos de PF-CORE-01 | Rail H0–H6 + estados §8.1 | CERRADO estructural / PARCIAL operacional | Rail H0–H6; detalle sincronizado con selección validada; KPI x/7 solo factual; estados sin heurística | Evidencia de logro Amber ausente → No disponible | §5 | Datos factuales de logro | Rail + tarjeta + selección/detalle coherentes |
| 9 | Matriz de interacción X/Y | Códigos D/M/P/P*/- | CERRADO estructural; ejecución por celda N/D | Matriz 8×7 + frontera; intersección arquitectónica; columna/fila/celda seleccionadas | No hay ejecución factual de intersecciones | §7 + §8 | Fuente de ejecución por celda (futuro) | Matriz conforme §9 sin causalidad inventada |

---

## 3. Revisión específica de lo ya implementado

### 3.1 Contexto Empresa → Relación → Caso

| Pregunta | Respuesta |
|----------|-----------|
| ¿A qué punto pertenece? | Principalmente **§4** (jerarquía/filtros), **§5** (cabecera), **§6.1** (empresa/caso). Relación activa: **No sustentado explícitamente** como combobox intermedio en el wireframe §5 (el rector habla Empresa/Caso); la relación es evidencia de autorización Unit 2, no título rector. |
| ¿Cerrado? | **No** — **PARCIAL**: autorizado y funcional para alcance consultor, pero sin ClientEngagement Object[State] ni CasoDiagnosticoEVE [estado] canónico en cabecera. |

Evidencia: `use-client-context.ts`, BFF `client-companies` / `relationships` / `cases`, tests Unit 2.

### 3.2 Shell visual

| Zona | Estado |
|------|--------|
| Cabecera | Visible + datos de contexto (parcial §6.1) |
| KPIs | Visible shell (`—`) — no funcional §6.2 |
| Subvistas Monitoreo/Seguimiento/Gobernanza | Visible; solo Monitoreo con contenido; otras vacías de contenido rector |
| Workspace | Visible; mezcla detalle hito operativo + personas (R2B) |
| Rail | Visible pero **incorrecto** (§8) |
| Drawer Atención | Visible shell colapsable — no funcional §5/§16 |
| Barra estado | Visible shell READ-ONLY |

**Distinción:** shell visual ≠ capacidad funcional.

### 3.3 Proceso e hitos genéricos

| Artefacto | Correspondencia rector | Clasificación |
|-----------|------------------------|---------------|
| `case_main_processes` + `MainProcessBand` / `MainProcessAxis` | No es P-SUP (§7) ni PF-CORE-01 | Infraestructura auxiliar **fuera de secuencia**; no debe dominar UI como eje X |
| `case_milestones` + `CaseMilestonesRail` | No es catálogo H0–H6 (§8) | Idem; no confundir con eje Y |

### 3.4 H0–H6

| Capa | Estado |
|------|--------|
| Catálogo + Object[State] esperado | Presente (persistencia histórica 4A) — cubre **datos** de §8 |
| Vínculo caso + evidencia logro | Presente |
| BFF `coreMilestoneProgress` | Presente, no enlazado a KPI UI |
| Rail Y + estados §8.1 + tarjeta §8.2 | Ausente |

→ **§8 PARCIAL**.

### 3.5 Personas y perfiles (R2A/R2B vs rector 1–9)

El rector sitúa usuarios/roles/actividades en **§1** (profundidad) y de forma plena en **§10** (fuera del alcance 1–9).  
R2A/R2B: participante + perfil funcional — **conformes parciales** con la profundidad declarada en §1, pero **IMPLEMENTADO FUERA DE SECUENCIA** respecto a la secuencia visual §§7–9 (ejes antes de recursión profunda §23 del mismo docx).  
No son sustituto de §7–§9.

---

## 4. Análisis visual obligatorio

| Zona | Visible | Placeholder | Datos | Funcional | Ausente | Incorrecta |
|------|---------|-------------|-------|-----------|---------|------------|
| Cabecera empresa/caso | Sí | — | Parcial | Parcial | Engagement Object[State] | — |
| KPI strip | Sí | Valores `—` | No | No | Semántica §6.2 | — |
| Modo Gobernanza Experiencia | Tab | Deshabilitado | No | No | Trayectorias/Soporte/Salud | — |
| Subvistas | Sí | Seguimiento/Gobernanza | Solo Monitoreo parcial | Parcial | Contenidos §6 | — |
| Banda oscura | Sí | — | Proceso genérico | Parcial | — | **Sí — no es eje X** |
| Rail izquierdo | Sí | — | `case_milestones` | Parcial | — | **Sí — no es eje Y** |
| Barra X P-SUP | — | Placeholder no montado como X | No | No | **Sí** | — |
| Rail Y H0–H6 | — | Placeholder no montado | Datos 4A sin UI | No | **UI sí** | — |
| Workspace matriz X/Y | — | — | No | No | **Sí** | — |
| Personas/perfiles | Sí | — | R2A | R2B expandible | Roles/actividades §10 | Adelantado vs §§7–9 |
| Drawer Atención | Sí | Copy vacío | No | Abrir/cerrar | Contadores/acciones §5 | — |
| Status bar | Sí | Metadatos — | No | Shell | effective_scope real | — |

### Respuestas expresas

1. **¿Qué representa hoy la banda oscura?** Status band de «Proceso principal» (`MainProcessBand`) alimentada por `case_main_processes` / estructura Unit 3 — caso, estado, próximo evento genéricos.  
2. **¿Corresponde al diseño rector?** **No.** El rector exige banda de **P-CORE-01 / CasoDiagnosticoEVE [ObjectState]** y, debajo, **EJE X — PROCESOS P-SUP**, no un “proceso principal” genérico.  
3. **¿Qué representa hoy el rail izquierdo?** Lista de hitos operativos del caso (`CaseMilestonesRail` ← `case_milestones`).  
4. **¿Corresponde al eje requerido?** **No.** El eje Y rector es **Hitos PF-CORE-01 H0–H6**.  
5. **¿Dónde debería aparecer el eje X?** Barra horizontal de procesos bajo la cabecera/banda core (§5 wireframe).  
6. **¿Dónde debería aparecer el eje Y?** Rail vertical izquierdo de H0–H6 (§5).  
7. **¿Dónde debe vivir la interacción X/Y?** Workspace central filtrado + matriz §9 (códigos D/M/P/P*/-), sin inventar causalidad.  
8. **¿Qué función tiene Atención y gobernanza?** Drawer contextual derecho (§5): timers, usuarios detenidos, ROLE_ASSIGNMENT_GAP, manual pendiente, findings; acciones Abrir detalle / Ver trayectoria / Acción gobernada. Hoy: shell.  
9. **¿Qué elementos visibles son solo shells?** KPI strip; drawer; status bar; subvistas Seguimiento/Gobernanza; tab Gobernanza Experiencia deshabilitado; banda/rail actuales como *sustitutos visuales incorrectos* (tienen datos genéricos, no capacidad rector X/Y).

---

## 5. Orden de implementación (dependencias del documento)

Orden propuesto **solo** por dependencias del rector (no por numeración histórica):

### Tramo A — Cerrar lectura de shell (§§1, 3, 4 parcial, 5–6)

| Campo | Valor |
|-------|--------|
| Puntos | 1, 3, 4, 5, 6 (completitud parcial) |
| Capacidad | Mantener shell; dejar de presentar banda/rail genéricos como X/Y (desactivar visualmente o reetiquetar como auxiliar) |
| Precondiciones | Ninguna nueva |
| Datos | Contexto Unit 2 |
| Zona UI | Cabecera, KPI shells, layout |
| BFF | Existente |
| Pruebas | Regresión shell/contexto |
| Cierre | Usuario no interpreta Proceso principal / Hitos del caso como ejes rector |

### Independencia §7 / §8 / §9 (corrección 2026-07-16)

- **§7 Eje X** y **§8 Eje Y** son capacidades **independientes** (rector §1/§3 P3: ortogonales; pueden operar por separado).
- **§9 Matriz X/Y** depende de que **§7 y §8** estén implementados (ambos ejes presentes para intersección).
- Se inicia **§7 por orden práctico** (shell listo, brecha visual inmediata), **no** porque §8 dependa funcionalmente de §7.

### Tramo B — Punto 7 Eje X (próximo)

| Campo | Valor |
|-------|--------|
| Punto rector | **7. Eje X - Procesos de soporte** |
| Capacidad | Botones Todos + P-SUP-01..09; status; badge MANUAL/PLATAFORMA; tooltip; URL `process` |
| Precondiciones | Shell §5; contexto caso; catálogo P-SUP literal del rector §7 |
| Datos | Catálogo canónico; estado por caso solo si existe fuente factual (si no: No disponible) |
| Zona UI | Barra horizontal X |
| BFF | Agregado de procesos soporte del caso |
| Pruebas | Conformance botones; Amber vacío/honestidad; URL; seguridad |
| Cierre | Barra X funcional + URL; estado operacional puede quedar parcial |

### Tramo C — Punto 8 Eje Y UI

| Campo | Valor |
|-------|--------|
| Punto | 8. Eje Y - Hitos de PF-CORE-01 |
| Capacidad | Rail H0–H6 + estados §8.1 + tarjeta §8.2 |
| Precondiciones | Catálogo/logros 4A; **no requiere §7** funcionalmente (independiente) |
| Datos | Reutilizar `core_milestone_*` |
| Zona UI | Rail Y (reemplazar semántica de `CaseMilestonesRail`) |
| BFF | Extender progress + detalle hito sin filtrar evidencia sensible |
| Pruebas | H0–H6; Amber unavailable; no usar `completed` como reached |
| Cierre | Rail Y canónico + KPI x/7 enlazable según §6.2 |
| **Estado 2026-07-16** | **CERRADO estructural / PARCIAL operacional** — ver `RECTOR_POINTS_8_9_EJE_Y_MATRIZ_DICTAMEN.md` |

### Tramo D — Punto 9 Matriz

| Campo | Valor |
|-------|--------|
| Punto | 9. Matriz de interacción X/Y |
| Capacidad | Códigos D/M/P/P*/- + mensajes §9.1 |
| Precondiciones | **§7 y §8** implementados |
| Datos | Tabla de intersección del rector (fija) + estado factual por celda |
| Zona UI | Workspace / overlay de intersección |
| BFF | Intersección agregada |
| Pruebas | Sin afirmar causalidad en celdas `-`/`P` |
| Cierre | Matriz conforme §9 |
| **Estado 2026-07-16** | **CERRADO estructural / PARCIAL operacional por celda** — ver `RECTOR_POINTS_8_9_EJE_Y_MATRIZ_DICTAMEN.md` |

### Tramo E — Retomar profundidad usuarios (fuera de 1–9)

Tras §§7–9: retomar §10 con R2A/R2B como base (personas/perfiles), luego roles/actividades según rector. **No iniciar en este plan.**

---

## 6. Decisiones sobre trabajo ya realizado

| Implementación existente | Mantener | Reubicar | Desactivar visualmente | Retirar posteriormente | Justificación rectora |
|--------------------------|----------|----------|------------------------|------------------------|------------------------|
| Shell Unit 1 / ruta admin | Sí | — | — | — | §5 layout base |
| Contexto Empresa→Relación→Caso | Sí | Relación como auth (no confundir con engagement) | — | — | §4/§6.1 parcial |
| KPI shells (7 labels, —) | Sí | — | No calcular aún | — | §6.2 shells hasta reglas |
| Modos Monitoreo/Seguimiento/Gobernanza | Sí | Contenido por subvista | — | — | §6 |
| Modo Gobernanza Experiencia (tab off) | Sí (tab) | — | Mantener deshabilitado | — | §1/§5.1; frontera §3 |
| `case_main_processes` + banda | Datos sí | Semántica auxiliar | **Dejar de presentar como eje X** | UI dominante | No es §7 |
| `case_milestones` + rail | Datos sí | Auxiliar operativo | **Dejar de presentar como eje Y** | UI dominante | No es §8 |
| H0–H6 4A + BFF progress | Sí | Alimentar futuro rail Y / KPI | KPI UI off hasta §8 UI | — | §8 datos |
| Participantes/perfiles R2A/R2B | Sí | Workspace profundidad | No ocultar; no expandir a actividades aún | — | §1 profundidad; §10 fuera de 1–9 |
| Drawer Atención | Sí | — | Sin acciones mutables | — | §5 shell |
| Placeholders `ProcessAxisPlaceholder` / `CoreMilestoneRailPlaceholder` | Código | Activar como X/Y reales | — | Sustituir genéricos | §5 |

**No borrar ni modificar código en esta tarea.**

---

## 7. Próximo paso exacto

### Cierre de sincronización §§8–9 (2026-07-16, post-corrección)

| Campo | Valor |
|-------|--------|
| §8 | **Cerrado estructuralmente.** Parcial operacionalmente por ausencia de evidencia factual del caso Amber. |
| §9 | **Matriz arquitectónica cerrada estructuralmente.** No representa ejecución factual de intersecciones. |
| Sync UI | Selección efectiva = `selectedItem` validado; `initialLoading` ≠ `refreshing`; columna completa marcada; E2E exige detalle Hn, back/forward, teclado, inválidos. |
| Dictamen | `RECTOR_POINTS_8_9_EJE_Y_MATRIZ_DICTAMEN.md` |

### Próximo foco (fuera de este cierre)

Datos operacionales factuales (logros H0–H6, estado P-SUP) y profundidad §10 — **sin inventar Amber** y **sin modificar puntos posteriores al §9** en este cierre.

---

## 8. Confirmación de esta entrega

- Plan actualizado tras cierre de sincronización §§8–9.  
- Dictámenes: `RECTOR_POINTS_1_9_STATUS_DICTAMEN.md`, `RECTOR_POINTS_8_9_EJE_Y_MATRIZ_DICTAMEN.md`.

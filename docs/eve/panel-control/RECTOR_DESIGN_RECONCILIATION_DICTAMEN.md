# Dictamen — Reconciliación con diseño rector oficial

Fecha: 2026-07-16  
Fuente única rectora: `docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` (v1.0)  
**Documento excluido:** `Diseno_Panel_Control_EVE_Runtime_40_20_MBA_Ajustado_v2_RolFuncional.docx` — no es autoridad de panel oficial.  
**Alcance auditado:** Unidad 1 → R2B (sin nuevas capacidades en esta tarea).  
Staging/producción: sin cambios. **R3A: cancelado formalmente** (ver § cancelaciones).

## Veredicto ejecutivo

La implementación acumulada aporta **shell, contexto Empresa→Relación→Caso, seguridad BFF, KPIs como shells, persistencia H0–H6 (4A) y profundidad parcial §10 (R2A/R2B)**.  
**No conforma** aún los ejes rector **§7 (X P-SUP)** ni **§8 (Y H0–H6 en UI)** ni **§9 (matriz X/Y)**.  
La banda/rail actuales (**Proceso principal** + **Hitos del caso** desde `case_main_processes` / `case_milestones`) son **infraestructura auxiliar Unit 3A/3B**, no sustitutos del diseño rector.

**Siguiente bloque rector autorizado:** **§7 — Eje X: Procesos de soporte P-SUP-01 a P-SUP-09** (después de aprobación de este dictamen).

---

## 1. Clasificación preliminar (comprobada)

| Clasificación | Implementación | Evidencia |
|---------------|----------------|-----------|
| **Conforme y reutilizable** | Shell, modos, subvistas Monitoreo/Seguimiento/Gobernanza | `OfficialControlPanelShell.tsx`, `official-control-panel.types.ts` |
| | Empresa → Relación → Caso | Unit 2A/2B, `client-context-navigation.ts`, BFF contexto |
| | Seguridad, BFF, URL parcial | `official-control-panel-context-auth`, `no-store`, scope consultor |
| | KPIs como shells (7 etiquetas, valor —) | `ClientCompanyKpiStrip.tsx`, `CLIENT_COMPANY_KPI_LABELS` |
| | Contexto Amber factual | IDs canónicos; sin datos inventados |
| | H0–H6 + Object[State] (4A) | `core_milestone_definitions`, catálogo corpus §8 |
| | Participante → perfil (parcial §10) | R2A tablas + BFF; R2B UI |
| **Útil, fuera de secuencia** | R2A/R2B | §10 válido pero **antes** de materializar X, Y y matriz |
| | Staging / huérfanos | Infra transversal; no sustituye diseño visual |
| | KPI H0–H6 persistido (4A) | Derivado válido; **no debió preceder** rail Y canónico en UI |
| **No sustentado como núcleo rector** | `case_main_processes` / banda Proceso principal | No es PF-CORE-01 ni eje X |
| | `case_milestones` / rail Hitos del caso | No es catálogo H0–H6 §8 |
| | Instrucción R3A derivada de doc excluido §22.4 | **Cancelada** — no existe artefacto R3A en repo |

---

## 2. Tabla de reconciliación (§§4–17 y §23)

| Punto rector | Exigencia exacta (corpus v1.0) | Implementado | Conforme | Reutilizable | Retirar / reubicar | Brecha |
|--------------|-------------------------------|--------------|----------|--------------|-------------------|--------|
| **§4** Arquitectura de información | Modos superiores; filtros proceso/hito/usuario/rol/actividad; URL persistente `process`, `milestone`, `user`, `role`, `activity`; conservar contexto al cambiar subvista | Modos `client-company` (+ governance deshabilitado); filtros `company`, `relationship`, `case`, `milestone`, `participant`, `profile`; jerarquía observación en BFF contexto | **Parcial** | Sí (navegación, shell) | Renombrar/ampliar query keys hacia contrato §18.2 (`process_id`, `milestone_id`, `user_id`, `role_runtime_session_id`, `activity_id`) | Faltan params rector X/Y/usuario/rol/actividad; `participant`/`profile` ≠ contrato canónico de URL |
| **§5** Diseño visual general | Cabecera, KPIs, **Eje X horizontal**, **Rail Y vertical**, workspace, drawer atención, barra estado | Cabecera, KPIs, workspace, `AttentionGovernancePanel`, `OfficialControlPanelStatusBar` presentes | **Parcial** | Sí (layout matriz 3 columnas) | **Reubicar:** `MainProcessBand` + `MainProcessAxis` → no son eje X; `CaseMilestonesRail` → no es rail H0–H6 | Sin `ProcessAxisBar` P-SUP; sin `CoreMilestoneRail` H0–H6; placeholders Unit 1 (`CoreMilestoneRailPlaceholder`, `ProcessAxisPlaceholder`) no usados en shell activo |
| **§6** Modo Empresa Cliente | Cabecera empresa/caso; **7 KPI** con semántica §6.2; Monitoreo/Seguimiento/Gobernanza | Cabecera contextual; 7 labels KPI; 3 subvistas; valores KPI todos **—** | **Parcial** | Sí | Mantener KPI shells hasta fases posteriores | KPIs sin cálculo; cabecera sin Object[State] engagement/caso completos del diseño |
| **§6.1** Cabecera | Empresa, engagement Object[State], caso, hito actual, siguiente evento, participación, atención | Empresa/relación/caso en combobox; chips estado/próximo paso parciales | **Parcial** | Sí | — | Sin lectura canónica engagement/hito actual/next event del core |
| **§6.2** KPIs | x/7 hitos core; usuarios; roles; actividades; manual; findings; alertas experiencia | Etiquetas las 7; sin conteos | **Parcial** (shell) | Sí | No activar hasta reglas BFF §6.2 | `coreMilestoneProgress` en BFF (4A) no enlazado a UI por diseño |
| **§7** Eje X | `[Todos]` + **P-SUP-01…09** con estado, contador atención, PLATAFORMA/MANUAL, target state, trigger, selección URL | Banda **«Proceso principal»** + eje genérico `case_main_processes` | **No** | Infra 3A como auxiliar | **No presentar como eje X**; conservar tablas solo si §7 las reutiliza explícitamente | Cero botones P-SUP; sin badges MANUAL; sin tooltips MBA |
| **§8** Eje Y | **H0–H6** fijos PF-CORE-01, Object[State], espera/timer, estados `reached`/`current_wait`/`manual_pending`/`blocked`/`not_reached`, finales alternativos bajo rail | Rail **«Hitos del caso»** desde `case_milestones`; catálogo H0–H6 solo en DB 4A | **No** (UI) / **Parcial** (persistencia) | Catálogo 4A + regla Object[State] | **No usar `case_milestones` como rail Y**; implementar `CoreMilestoneRail` | UI muestra hitos operativos; KPI x/7 no activo; sin finales alternativos en rail |
| **§9** Matriz X/Y | Códigos **D, M, P, P\*, -**; intersección sin causalidad inventada | No hay componente matriz ni BFF intersección | **No** | — | — | Matriz no iniciada (correcto no afirmar causalidad) |
| **§10** Monitoreo recursivo | Empresa → Usuario → Rol → Actividad (4 niveles, misma pantalla) | R2A/R2B: Empresa/caso → **Persona participante** → **Perfil funcional** | **Parcial** | Sí (R2A/B) | Completar después de §§7–9 | Sin responsabilidades, actividades, Runtime; tabla usuarios §10.1 ausente |
| **§11** Selección actividades | Panel cobertura elegibles/seleccionadas, modos competitive/non-competitive | No implementado | **No** | — | — | Fuera de alcance actual |
| **§12** Runtime 40+20 | Detalle bloques B0–B7, readiness, gaps | No en panel oficial | **No** | Runtime existe en otro módulo legacy | No importar legacy `/admin/consultant-control-panel` | — |
| **§13** Manual P-SUP-03/04/05 | Panel manual, estados `manual_tracking_status`, artefactos | No implementado | **No** | — | — | — |
| **§14** Producción Paralela / QA | P-SUP-06/07/08/09, readiness, findings | No implementado | **No** | — | — | — |
| **§15** Gobernanza Experiencia | Modo separado; trayectorias, soporte, salud pantallas | Modo visible pero **deshabilitado** | **No** | Shell tab | — | Sin instrumentación experience |
| **§16** Intervención soporte | Acciones auditadas (mensaje, reentry, etc.) | Drawer atención placeholder | **No** | Shell drawer | — | Sin acciones mutables |
| **§17** Estados y alertas | Vocabularios separados; jerarquía empresa; alertas ROLE_ASSIGNMENT_GAP, timers, etc. | Parcial en copy R2 (resolución perfil); sin motor alertas | **Parcial** | Tipos resolución R2A | — | Sin agregación §17.2 ni alertas §17.3 |
| **§23** Fases | Secuencia 0→7: shell+lectura **X,Y** antes de recursión profunda, manualidad, PP, experiencia | Fases 0–1 parciales; **salto** a 3A/3B genérico, 4A, R2 antes de §7–9 | **Fuera de secuencia** | Artefactos por fase | Reordenar roadmap: **§7 → §8 → §9 → retomar §10** | No habilitar intervención ni manual hasta instrumentación |

---

## 3. Estado real de ejes y matriz

| Artefacto rector | Estado real |
|------------------|-------------|
| **Eje X (§7)** | **Ausente.** UI muestra «Proceso principal» genérico (`MainProcessBand`, `MainProcessAxis`). No hay P-SUP-01…09. |
| **Eje Y (§8)** | **Ausente en UI.** Rail activo = hitos operativos Unit 3A. Persistencia H0–H6 (4A) lista para futuro rail canónico. |
| **Matriz X/Y (§9)** | **No implementada** (correcto: no hay UI que afirme D/M/P/P*). |

---

## 4. `CaseMainProcess` y `case_milestones` — impacto de retiro/reubicación

| Estructura | Rol actual | Riesgo si se domina la UI | Plan (sin borrado en esta tarea) |
|------------|----------|---------------------------|----------------------------------|
| `case_main_processes` | Un proceso principal etiquetado por caso (Unit 3A); opcional `core_process_code=PF-CORE-01` (4A) | Confundido con PF-CORE-01 o con P-SUP | **Reubicar** como registro operativo auxiliar; ocultar semántica «eje rector» en UI |
| `case_milestones` | Hitos operativos secuenciales (espera, timer, soporte) | Sustituto falso de H0–H6 | **No contar** para KPI x/7; **no** mostrar en rail Y canónico; mantener para trazabilidad operativa si hace falta |
| `core_milestone_definitions` + logros 4A | Catálogo H0–H6 + evidencia Object[State] | Ninguno si se usa solo para §8 | **Reutilizar** como fuente del futuro `CoreMilestoneRail` |
| `case_participants` + perfiles R2A | Participación explícita caso ↔ usuario ↔ perfil | Ninguno | **Reutilizar** al retomar §10 tras §§7–9 |

**Dependencias:** Unit 3B UI, tests 3A/3B, BFF `process-structure`, Amber vacío factual. Retiro de UI no exige migración down inmediata.

---

## 5. Capacidades conformes (conservar)

- Ruta `/admin/official-consultant-control-panel` y shell Unit 1  
- Contexto autorizado Empresa → Relación → Caso (2A/2B)  
- BFF oficial con bearer, `Cache-Control: no-store`, mensajes de acceso sin fuga  
- Siete KPI como placeholders  
- Persistencia y BFF agregado `coreMilestoneProgress` (4A), sin UI KPI  
- Persistencia participantes/perfiles (R2A) + navegación UI (R2B)  
- Amber: vacíos factuales preservados  

---

## 6. Capacidades adelantadas (fuera de secuencia §23)

| Tramo | Motivo |
|-------|--------|
| Unit 3A/3B proceso/hitos genéricos | Anticipó workspace antes de X/Y canónicos |
| Unit 4A H0–H6 persistencia | Anticipó datos Y antes de rail §8 |
| R2A/R2B participantes/perfiles | Anticipó §10 parcial antes de §§7–9 |

---

## 7. Cancelaciones formales

| Ítem | Estado |
|------|--------|
| **R3A** (cualquier derivación de doc excluido §22.4) | **CANCELADO.** No hay migración, rama ni spec R3A en repo. No iniciar sin nueva instrucción alineada a corpus v1.0. |
| **Doc excluido v2 RolFuncional** como autoridad de panel oficial | **RECHAZADO** para dictamen rector. Permanece solo en legacy `/admin/consultant-control-panel` y docs históricos `docs/consultant-control-panel/` (fuera del módulo oficial). |

---

## 8. Referencias al documento equivocado — saneamiento

| Ubicación | Acción en esta reconciliación |
|-----------|------------------------------|
| `docs/eve/panel-control/TRAMO_R2*.md`, `R2A*.md`, `R2B*.md` citando `design_v2` §22 | **Corregir** → corpus v1.0 **§10** (y MR-008/009 solo como criterios UX, no como fuente paralela) |
| `docs/consultant-control-panel/` replacement plan v3 | **No modificado** (legacy histórico); módulo oficial no depende de él |
| `tests/regression/consultant-control-panel/consultant-control-panel.test.mjs` | Referencia legacy docx; **fuera** del panel oficial — anotado, no borrado |

---

## 9. Placeholders que permanecen abiertos

- `CoreMilestoneRailPlaceholder` / rail Y canónico H0–H6  
- `ProcessAxisPlaceholder` / barra X P-SUP  
- KPI numéricos (todos —)  
- Matriz X/Y  
- Modo Gobernanza Experiencia (deshabilitado)  
- Seguimiento / Gobernanza subvistas (copy vacío sin datos)  
- Responsabilidades, actividades, Runtime en workspace  
- Acciones drawer y manual work  

---

## 10. Archivos revisados (muestra representativa)

**UI oficial:** `OfficialControlPanelShell.tsx`, `MainProcessBand.tsx`, `MainProcessAxis.tsx`, `CaseMilestonesRail.tsx`, `CaseParticipantsPanel.tsx`, `ClientCompanyKpiStrip.tsx`, `AttentionGovernancePanel.tsx`  

**Estado/URL:** `client-context-navigation.ts`, `milestone-navigation.ts`, `participant-profile-navigation.ts`, `official-control-panel-navigation.ts`  

**BFF:** `official-consultant-control-panel/**/route.ts`, `official-control-panel-participants-service.ts`, `official-control-panel-process-structure-service.ts`  

**Persistencia:** migraciones Unit 2A, 3A, 4A, R2A  

**Docs:** `docs/eve/panel-control/UNIT_*`, `TRAMO_R2*`, `corpus/CORPUS_MANIFEST.md`  

**Corpus:** extracción textual de `Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`  

---

## 11. Pruebas y regresiones (esta auditoría)

- **No** se alteró comportamiento de producto en esta tarea.  
- Regresiones existentes Unit 1–4A, R2A/R2B permanecen válidas hasta implementar §7.  
- Próxima validación: tests de conformidad §7 cuando se implemente eje X.  

---

## 12. Confirmaciones

| Control | Estado |
|---------|--------|
| Sin nuevas capacidades en esta tarea | Sí |
| Sin borrado de migraciones | Sí |
| Sin cambios staging/producción | Sí |
| R3A cancelado | Sí |
| Siguiente bloque: **§7 Eje X P-SUP-01…09** | Declarado |
| Perfil → Responsabilidades → Actividades | **No iniciado** |

---

## 13. Brecha siguiente (después de §7 → §8 → §9)

Retomar **§10** completo usando R2A/R2B como capa adelantada (participante/perfil), añadiendo responsabilidades, actividades y Runtime según corpus — **solo tras aprobación explícita** y sin reactivar R3A del documento excluido.

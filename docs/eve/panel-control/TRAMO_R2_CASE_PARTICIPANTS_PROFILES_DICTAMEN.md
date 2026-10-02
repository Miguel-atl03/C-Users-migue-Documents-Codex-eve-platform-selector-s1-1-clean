# Dictamen de entrega — Tramo rector R2

Fecha: 2026-07-16  
Alcance: Empresa → Caso → **Usuario físico (persona participante)** → **Perfil funcional**  
Subtramos: **R2A** (persistencia + BFF) + **R2B** (navegación UI)  
Caso canónico: Cervecería Amber `19fc9eff-4219-43f0-854c-e2b3350f23f2`  
Staging/producción: **sin cambios**

## Veredicto

**Tramo R2 aceptado en local.**

| Capa | Estado |
|------|--------|
| Caso → Usuario participante (factual) | R2A `case_participants` |
| Usuario → Perfil funcional (factual) | R2A `case_participant_profiles` |
| BFF agregado sin PII | R2A |
| UI expandible Persona → Perfil (MR-008) | R2B |
| Amber vacío factual | 0 participantes / 0 perfiles |
| KPI Usuarios / Roles funcionales | **—** (inactivos) |
| Responsabilidades / actividades / Runtime | **no iniciados** |

---

## 1. Trazabilidad de diseño

| Fuente | Sección / requisito | Ejecución |
|--------|---------------------|-----------|
| Corpus v1.0 **§10** (monitoreo recursivo) | Empresa → Usuario → Rol → Actividad; persona con 1..* perfiles | R2A persistencia + R2B presentación (hasta perfil) |
| Corpus v1.0 **§10** jerarquía | empresa → caso → usuario → perfil → actividad → run | R2 ejecuta hasta **perfil**; actividad/run fuera de alcance hasta §§7–9 |
| `ui_v1_1` | Usuario físico expandible en perfiles funcionales | R2B `CaseParticipantsPanel` |
| **MR-008** | Panel muestra usuario físico expandible por perfiles | **Cumplido** (R2B) |
| **MR-009** | Reasignación auditada; no sobrescribir evidencia | **Cumplido** (R2A: trigger anti-silencio + RPC `reassign` + audit) |
| MR-001…007, MR-010 | Runtime, selector, Significado, descargas | **Fuera de alcance R2** |

### Partes ya cerradas (no reabrir en R2)

- Unidad 2A/2B — contexto Consultor→Empresa→Relación→Caso  
- Unidad 3A/3B — proceso principal + hitos operativos UI  
- Unidad 4A — H0–H6 persistencia (KPI visual aún —)  
- Dictamen histórico `TRAMO_R2_BLOCKED_…` — superado por R2A+R2B

### Brecha que queda después de R2

**Perfil funcional → Responsabilidades → Actividades** (y selección primaria, Runtime 40+20, KPI Usuarios/Roles).  
**No iniciar sin nueva aprobación.**

---

## 2. Inspección factual (obligatoria)

### Encontrado

| Elemento | Evidencia | Uso R2 |
|----------|-----------|--------|
| Participación caso↔usuario | `case_participants` (`case_id`, `user_id`, `display_label`, `participation_status`, `enabled`) | **Contrato canónico** |
| Perfil funcional | `case_participant_profiles` (`case_participant_id`, `display_label`, `resolution_status`) | **Contrato canónico** |
| Usuario físico | `usuarios` + `auth.users` (reutilizado; un login) | Vinculado vía `user_id` en participación |
| `role_runtime_session` | Existe (Runtime P3); **sin** `case_participant_id` | **No usado** como fuente R2 |
| `sesiones_llenado.usuario_id` | Dueño de captura (Amber: seed Unit 2) | **≠** participante R2 |
| BFF | `GET .../participants`, `GET .../profiles` | Agregados; `Cache-Control: no-store` |
| RLS | Lectura consultor bajo `eve_consultant_can_access_case` | Escritura admin/service_role |
| Auditoría | `official_control_panel_context_audit` acciones `case_participant_*` | MR-009 |
| Estados resolución | `resolved`, `mixed_unresolved`, `reentry_required`, `manual_review_required`, `unavailable` | DB + BFF UI kebab-case |

### No utilizado (conforme instrucción)

empresa del usuario como filtro participación; correo en BFF/UI; Runtime; WorkMap; fixtures Ventas/Finanzas/Logística; `sesiones_llenado.usuario_id` como participante.

### Amber (DB local)

| Métrica | Valor |
|---------|-------|
| `case_participants` enabled | **0** |
| `case_participant_profiles` | **0** |
| `role_runtime_session` | **0** |
| UI esperada | «Este caso no tiene personas participantes registradas.» (empty, no error) |

---

## 3. Separación conceptual

- **Persona participante** = fila `case_participants` + etiqueta administrativa (`display_label`).  
- **Perfil funcional** = fila `case_participant_profiles`; contexto operativo interno; **no** cuenta ni diagnóstico.  
- Un `user_id` puede tener N perfiles en el mismo caso sin N logins.

---

## 4. Persistencia R2A

Migraciones:

- `20260715200000_eve_official_control_panel_tramo_r2a_case_participants.sql`
- `20260715201000_eve_official_control_panel_r2a_drop_participant_company_affiliation.sql`

Integridad: unicidad participante activo por `(case_id, user_id)`; perfil activo por `(case_participant_id, lower(label))`; trigger `eve_prevent_silent_profile_reassignment`; FK participante→caso; perfiles→participante.

Admin: `manage-case-participants.mjs` (`--confirm=R2A_ADMIN`).  
Verificador: `verify-tramo-r2a-integrity.mjs`.  
Inspector: `inspect-tramo-r2-case-participants.mjs` → `TRAMO_R2A_PERSISTENCE_PRESENT`.

---

## 5. BFF R2A (reutilizado por R2B)

```typescript
// GET .../participants
{ participants: CaseParticipantSummary[] }  // vacío [] = factual OK

// GET .../participants/:participantId/profiles  
{ profiles: FunctionalProfileSummary[] }
```

Autorización: `assertConsultantCaseParticipantAccess` (Consultor ∧ empresa ∧ relación ∧ caso [∧ participante [∧ perfil]]).  
Fallo: «No fue posible abrir la participación solicitada.»

---

## 6. UI R2B

Zona: workspace central Monitoreo (`OfficialControlPanelShell` → `monitoringStack`).  
Orden: **Personas participantes** arriba; detalle de hito debajo. Rail de hitos intacto.

Componentes: `CaseParticipantsPanel`, `CaseParticipantItem`, `FunctionalProfileList`, `FunctionalProfileItem`, `ParticipantProfileDetail`, `use-case-participants`, `participant-profile-navigation`, `participant-profile-presentation`.

URL: `participant=<id>`, `profile=<id>`; limpieza al cambiar empresa/relación/caso/persona.

Estados: idle, loading-participants, empty, loading-profiles, partial, active, error.

Traducciones UI (sin enums técnicos): Confirmado, Asignación no resuelta, Requiere revisión, Revisión del consultor, etc.

Detalle perfil: Cobertura / Responsabilidades / Actividades = **No disponible(s)**.

---

## 7. KPI

`ClientCompanyKpiStrip`: Usuarios = **—**, Roles funcionales = **—**.  
No `auth.users` count; no etiquetas globales.

---

## 8. Pruebas

| Suite | Resultado |
|-------|-----------|
| `official-control-panel-tramo-r2a.test.mjs` | pass |
| `official-control-panel-tramo-r2b.test.mjs` | pass |
| Regresión 2B / 3B / 4A / R2-blocked | pass |
| Playwright `official-consultant-control-panel-tramo-r2b.spec.ts` | 4/4 (+ capturas `reports/local/r2b/screenshots/`) |

---

## 9. Criterios de cierre (checklist)

- [x] Vínculo Caso → Usuario factual (`case_participants`)
- [x] Usuario y perfil separados
- [x] Varios perfiles, un login
- [x] UI expandible (MR-008)
- [x] Perfiles no como diagnóstico
- [x] Asignaciones ambiguas visibles (partial / etiquetas)
- [x] BFF filtra por alcance
- [x] Amber sin datos inventados
- [x] KPI inactivos
- [x] Sin actividades ni Runtime
- [x] Staging/producción intactos

---

## 10. Archivos clave

Ver bundles:

- `tramo_r2a_case_participant_persistence_bundle.zip` (R2A)
- `tramo_r2b_participant_profile_navigation_bundle.zip` (R2B)

Documentación: `TRAMO_R2A_*`, `TRAMO_R2B_*`, `R2A_PARTICIPANT_COMPANY_AFFILIATION_DICTAMEN.md`, este dictamen.

---

## 11. Riesgos / limitaciones

- Inspector `inspect-tramo-r2-case-participants.mjs` marca `uiPersonasParticipantesActive: false` por diseño conservador; la UI R2B está montada en shell.
- Participantes solo vía admin local; Amber permanece vacío hasta evidencia real.
- KPI Usuarios/Roles requiere tramo derivado posterior.

---

## 12. Siguiente punto rector (no autorizado)

**Perfil funcional → Responsabilidades → Actividades**

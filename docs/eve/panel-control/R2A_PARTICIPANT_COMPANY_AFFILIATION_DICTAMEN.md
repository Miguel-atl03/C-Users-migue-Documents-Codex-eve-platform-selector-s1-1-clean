# Dictamen — Regla de pertenencia empresarial de participantes (previo a R2B)

Fecha: 2026-07-15  
Alcance: confirmación factual de la constraint R2A  
`usuarios.empresa_id = sesiones_llenado.client_company_id`  
**R2B: aceptado (navegación visual).** KPI Usuarios/Roles: —. Staging/producción: sin cambios.

## Veredicto

**B. Regla no confirmada.**

No existe soporte inequívoco en el diseño rector ni en el modelo operativo del panel oficial para exigir que todo participante del caso pertenezca jurídicamente a la misma empresa cliente del caso.

La constraint / trigger `eve_enforce_case_participant_company_scope` (**`participant_company_case_mismatch`**) se **elimina** mediante migración correctiva local.

---

## 1. Pregunta factual

**¿Todo participante de un caso debe pertenecer obligatoriamente a la misma empresa cliente del caso, o basta con que exista una participación explícita y autorizada?**

| Respuesta | **Basta participación explícita y autorizada** (`case_participants` habilitado bajo alcance Consultor→Empresa→Relación→Caso). |
|-----------|-------------------------------------------------------------------------------------------------------------------------------|
| Nivel de certeza | **Alto** respecto al modelo Unit 2A del panel oficial; **medio-alto** respecto a que el corpus **§10** no impone igualdad de `empresa_id`. |

### Interpretación

- **Participar en un caso** ≠ **pertenecer a la empresa cliente** como empleador/tenant administrativo.
- `usuarios.empresa_id` es pertenencia administrativa / puente de tenant histórico; **no** es el vínculo de contexto del caso.
- El vínculo autorizado del caso es `client_company_id` + `client_relationship_id`.
- Un participante externo, interempresa, temporal o de otra afiliación administrativa **puede** existir si hay fila válida en `case_participants` (gobernada por admin/service role).

---

## 2. Fuentes

| Fuente | Ruta | Sección / línea | Hallazgo | Certeza |
|--------|------|-----------------|----------|---------|
| Unit 2A autorización | `docs/eve/panel-control/UNIT_2A_DATA_AUTHORIZATION.md` | §Modelo persistente L16–17; §Vínculo caso–empresa L57–58 | `usuarios.empresa_id` **no** determina la empresa del caso. Un caso **puede** pertenecer a empresa distinta de la del usuario de la sesión; probado en local. | Alta |
| Amber recovery | `docs/eve/panel-control/AMBER_REPOSITORY_RECOVERY_EVIDENCE.md` | L51–58 | `usuario_id` no sustituye `client_company_id`. Regla: **caso ≠ empresa del participante**; vínculo operativo = company + relationship. | Alta |
| Orphans staging | `docs/eve/panel-control/STAGING_ORPHAN_CASES_REMEDIATION_PLAN.md` | L36 | Inferir empresa desde `usuarios.empresa_id` **contaminaría** el panel (**prohibido**). | Alta |
| Inventario orphans | `docs/eve/panel-control/STAGING_ORPHAN_CASES_MASTER_INVENTORY.md` | L12 | `usuarios.empresa_id` **prohibido** como evidencia suficiente aislada de empresa del caso. | Alta |
| RLS Unit 2A | `docs/eve/panel-control/UNIT_2A_RLS_COMPATIBILITY_REPORT.md` | L67 | Autorización del panel **no** usa `usuarios.empresa_id`. | Alta |
| Corpus v1.0 **§10** | `docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` | §10 | Exige jerarquía empresa→caso→usuario→perfil; habla de usuarios en contexto de empresa cliente. **No** establece `participante.empresa_id = caso.empresa_id`. Distingue usuario (login) de perfil funcional. | Media-alta (silencio = no mandato de igualdad) |
| UI extract | `…/_extract/ui_v1_1/spec.txt` | L750 | user/role/activity/run deben pertenecer **causalmente al case autorizado** — no a igualdad de `empresa_id` del empleador. | Media |
| Constraint R2A (pre-corrección) | `supabase/migrations/20260715200000_…tramo_r2a….sql` | trigger `eve_enforce_case_participant_company_scope` | Implementó igualdad `empresa_id`↔`client_company_id` como anti-cruce; **sobreinterpretación** de “impedir cruces entre empresas”. | N/A (hecho de implementación) |
| Runtime tenant | `eve_current_tenant_id` / P3 closeout | `usuarios.empresa_id` como tenant JWT | Significado **Runtime/tenant**, no contrato de participación del panel oficial Unit 2/R2A. | Media (no transferible a R2A) |

### Significado de `usuarios.empresa_id` (sin inferir solo por nombre)

Evidencia de uso en repo:

1. FK administrativa a `empresas` (bridge Unit 2A).
2. Tenant Runtime / `eve_current_tenant_id` en Capa 1 / P3.
3. **Explícitamente descartado** como determinante de empresa del caso del panel.

Conclusión: **empleador / tenant / pertenencia administrativa**, no “afiliación jurídica obligatoria al caso cliente”.

---

## 3. Escenarios

| Escenario | ¿Debe bloquearse por `empresa_id` ≠ caso? | Tratamiento correcto |
|-----------|-------------------------------------------|----------------------|
| Empleado interno empresa cliente | No por esa igualdad; sí requiere `case_participants` | Participación explícita |
| Usuario con `empresa_id` distinta (caso Unit 2A) | **No** | Ya autorizado por diseño Unit 2A |
| Consultor del panel | No es participante del caso por ser consultor | `consultant_company_assignments`, no `case_participants` |
| Proveedor / externo / temporal | No hay catálogo factual de tipos; **no inventar categorías** | Si hay evidencia, alta admin en `case_participants` |
| Cruces no autorizados | Sí bloquear | Ausencia de participación + RLS/BFF por caso |

### Riesgo de exclusión falsa (constraint previa)

Impediría registrar participantes reales cuya `empresa_id` administrativa no coincida con `client_company_id` del caso — escenario **explícitamente permitido y probado** en Unit 2A. Riesgo: **alto** de falsos negativos antes de R2B.

---

## 4. Decisión sobre la constraint

| Acción | Detalle |
|--------|---------|
| Eliminar | Trigger `trg_case_participants_enforce_company` y función `eve_enforce_case_participant_company_scope` |
| Conservar | FKs caso/usuario; unicidad participación activa; perfiles; RLS select por `eve_consultant_can_access_case`; escrituras solo admin/service role |
| Scope | Consultor ∧ empresa ∧ relación ∧ caso ∧ (opcional) participante/perfil vía `case_participants` |
| No modelar aún | Taxonomía interno/externo/proveedor sin fuente canónica |

Migración correctiva:

`supabase/migrations/20260715201000_eve_official_control_panel_r2a_drop_participant_company_affiliation.sql`

---

## 5. Pruebas / docs afectadas

- `official-control-panel-tramo-r2a.test.mjs` — deja de exigir `participant_company_case_mismatch`; verifica drop correctivo.
- `TRAMO_R2A_CASE_PARTICIPANT_PERSISTENCE.md` — actualiza integridad.
- Rollback R2A — deja de depender del drop de esa función si ya no existe (idempotente).

---

## 6. Confirmaciones

| Control | Estado |
|---------|--------|
| R2B aceptado (navegación) | Sí |
| UI sin cambios | Sí |
| KPI Usuarios/Roles = — | Sí |
| Staging/producción | Intactos |
| Amber sin participantes inventados | Sí |

**Continuar con R2B** tras aceptación de este dictamen; la corrección de constraint es prerrequisito factual ya aplicado.

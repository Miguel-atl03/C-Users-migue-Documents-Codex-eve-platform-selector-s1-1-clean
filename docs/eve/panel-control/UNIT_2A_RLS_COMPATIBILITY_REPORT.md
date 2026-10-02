# Unidad 2A — Compatibilidad RLS

## Evidencia inspeccionada

Fecha: 2026-07-15.

Se consultó `pg_policies` en el proyecto Supabase remoto conectado antes de
aplicar Unidad 2A y en Supabase local después de la migración. La migración se
aplicó solo en local.

## Políticas previas remotas

### `empresas`

- `empresas_authenticated_own`, `SELECT`, `authenticated`: permite leer la
  empresa del `usuarios.auth_user_id = auth.uid()`.
- `empresas_authenticated_insert`, `INSERT`, `authenticated`: permite insertar
  cuando existe identidad autenticada.
- `empresas_authenticated_update_own`, `UPDATE`, `authenticated`: limita
  `USING` y `WITH CHECK` a la empresa del usuario.
- `empresas_authenticated_delete_own`, `DELETE`, `authenticated`: limita la
  eliminación a la empresa del usuario.

### `sesiones_llenado`

- `sesiones_llenado_authenticated_own`, `ALL`, `authenticated`: limita lectura
  y escritura a sesiones cuyo `usuario_id` pertenece al `auth.uid()`.

### `usuarios`

- `usuarios_authenticated_own`, `ALL`, `authenticated`: limita por
  `auth_user_id = auth.uid()`.

No existían remotamente tablas ni políticas para
`consultant_company_assignments`, `client_relationships` u
`official_control_panel_context_audit`.

El esquema local previo no contenía estas políticas owner porque las
migraciones locales disponibles representan un subconjunto del esquema remoto.
Esta diferencia quedó explícita; no se interpretó como ausencia en remoto.

## Políticas agregadas

### `consultant_company_assignments`

- `consultant_company_assignments_own_current_select`, `SELECT`,
  `authenticated`.
- Exige `consultant_user_id = auth.uid()`, estado habilitado y vigencia.
- La tabla tiene RLS forzado.

### `client_relationships`

- `client_relationships_assigned_current_select`, `SELECT`, `authenticated`.
- Exige relación habilitada/vigente y asignación vigente a su empresa.
- La tabla tiene RLS forzado.

### `empresas`

- `empresas_consultant_assigned_select`, `SELECT`, `authenticated`.
- Agrega exclusivamente lectura para consultores asignados.
- No altera políticas previas de propietario ni concede escritura.

### `sesiones_llenado`

- `sesiones_llenado_consultant_assigned_select`, `SELECT`, `authenticated`.
- Exige empresa y relación explícitas y autorización acumulativa.
- No usa `usuarios.empresa_id`.
- No altera `sesiones_llenado_authenticated_own` ni concede escritura al
  consultor.

### Auditoría

`official_control_panel_context_audit` tiene RLS forzado, sin política para
`anon` o `authenticated`; sus privilegios se revocan. Solo RPCs
`security definer` controladas por service role escriben auditoría.

## Compatibilidad y conflictos

- No se usa `DROP POLICY`.
- No se reemplaza ninguna política remota previa.
- Las políticas nuevas de `empresas` y `sesiones_llenado` son aditivas porque
  PostgreSQL combina políticas permisivas con OR.
- La ampliación resultante es deliberadamente solo de lectura y solo para un
  consultor con asignación vigente.
- No existe política `USING (true)`.
- No se concede `INSERT`, `UPDATE` o `DELETE` a `authenticated` sobre las
  estructuras nuevas.
- Las escrituras previas del participante en `sesiones_llenado` permanecen
  gobernadas por `sesiones_llenado_authenticated_own`.

No se detectó conflicto que requiriera reemplazo. El `GRANT SELECT` explícito
es necesario porque la configuración local no autoexpone tablas; RLS sigue
filtrando las filas.

## Matriz de autorización probada

| Actor | Empresa | Relación | Caso | Resultado |
|---|---|---|---|---|
| Consultor A asignado | A | A vigente | A vinculado | 1 fila visible |
| Consultor A | B no asignada | — | — | 0 filas |
| Consultor A | A | relación B | — | denegado |
| Consultor A | A | A | caso ajeno/inválido | denegado |
| Consultor B sin asignación | A | A | A | 0 filas |
| `authenticated` sin asignación | — | — | — | 0 filas |
| `service_role` | RPC administrativa | RPC | RPC | controlado y auditado |

La prueba local usó un caso cuya empresa explícita era A mientras el
participante pertenecía a B. El Consultor A autorizado vio el caso; el
Consultor B no lo vio. Esto demuestra que la autorización no depende del
participante.

## Riesgos fuera de alcance

La inspección remota reportó 23 tablas con RLS deshabilitado, entre ellas
`closure_results`, `error_alerts`, `support_activity_requests` y otras. No se
habilitó RLS automáticamente: hacerlo sin políticas compatibles bloquearía o
alteraría módulos ajenos a Unidad 2A. Requiere una revisión de seguridad
separada.

La política previa `empresas_authenticated_insert` permite insertar a cualquier
usuario autenticado. Unidad 2A no amplía ese permiso, pero conviene revisarlo en
un dictamen específico porque modificarlo podría cambiar flujos existentes.

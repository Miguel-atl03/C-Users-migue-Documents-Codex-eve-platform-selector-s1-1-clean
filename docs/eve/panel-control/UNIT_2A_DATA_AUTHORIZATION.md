# Unidad 2A — Datos y autorización del contexto consultor

## Alcance final

Unidad 2A materializa únicamente:

`Consultor autorizado → Empresa cliente → Relación activa → Caso en curso`

No modifica la UI ni activa la Unidad 2 visual. Supabase es la fuente de verdad.

## Modelo persistente

Estructuras reutilizadas:

- `public.empresas`: empresa cliente.
- `public.usuarios`: participante; su `empresa_id` no determina la empresa del
  caso.
- `public.sesiones_llenado`: caso operativo.
- `auth.users` y `auth.uid()`: identidad del consultor y actor administrativo.

Estructuras de Unidad 2A:

- `consultant_company_assignments`: asignación temporal Consultor–Empresa.
- `client_relationships`: relación verificable, perteneciente a una empresa.
- `official_control_panel_context_audit`: auditoría de mutaciones
  administrativas.

El bridge
`20260715072000_eve_official_context_company_bridge.sql` crea
`public.empresas` únicamente si falta en un entorno local incompleto y asegura
la FK `usuarios.empresa_id → empresas.id`. No reemplaza una tabla existente.

## Vínculo explícito caso–empresa

`sesiones_llenado` contiene:

- `client_company_id`;
- `client_relationship_id`;
- `display_name`.

La integridad no depende del participante. Se aplica mediante:

```text
(sesiones_llenado.client_relationship_id,
 sesiones_llenado.client_company_id)
  →
(client_relationships.id,
 client_relationships.client_company_id)
```

La FK compuesta impide casos cruzados entre empresas. El check
`sesiones_llenado_explicit_context_check` solo permite:

- ambos IDs nulos durante el backfill controlado; o
- ambos IDs presentes con una etiqueta operativa no vacía.

Un caso puede pertenecer a una empresa distinta de la empresa del usuario que
participa en la sesión. Esto fue probado expresamente en Supabase local.

## Vigencia e integridad

Una asignación o relación es efectiva cuando:

```text
status = enabled
AND valid_from <= instante consultado
AND (valid_until IS NULL OR valid_until >= instante consultado)
```

La exclusión
`consultant_company_assignments_no_overlapping_enabled` impide ventanas
habilitadas superpuestas para el mismo Consultor–Empresa. FKs, checks e índices
protegen empresa, relación, caso, vigencia y auditoría en PostgreSQL.

## Autorización

Las funciones fail-closed son:

- `eve_consultant_has_company_access`;
- `eve_consultant_can_access_relationship`;
- `eve_consultant_can_access_case`.

La última exige simultáneamente que el caso tenga empresa y relación explícitas,
que la empresa esté asignada y que la relación esté vigente y autorizada.

Matriz final:

| Actor | Empresa asignada | Relación válida | Caso válido | Resultado |
|---|---:|---:|---:|---|
| Consultor A | Sí | Sí | Sí | Permitido |
| Consultor A | No | Sí | Sí | Denegado |
| Consultor A | Sí | No | Sí | Denegado |
| Consultor A | Sí | Sí | No | Denegado |
| Consultor B | Empresa de A | — | — | Denegado |
| Authenticated sin asignación | — | — | — | Denegado |
| Service role | Según RPC administrativa | Según RPC | Según RPC | Controlado |

No se concede escritura de contexto a `authenticated`. El BFF y RLS usan un
mensaje genérico para IDs inexistentes o fuera de scope.

El análisis completo de políticas está en
`UNIT_2A_RLS_COMPATIBILITY_REPORT.md`.

## BFF mínimo

- `GET /api/eve/official-consultant-control-panel/client-companies`
- `GET /api/eve/official-consultant-control-panel/client-companies/:companyId/relationships`
- `GET /api/eve/official-consultant-control-panel/relationships/:relationshipId/cases`

Todos autentican el JWT, consultan con el cliente del usuario, vuelven a validar
el scope acumulativo y responden `private, no-store`. Solo retornan opciones
operativas mínimas. No retornan personas, Runtime, WorkMap, actividades, roles
ni objetos completos.

## Administración

Script:

`scripts/eve/official-control-panel/manage-client-context.mjs`

Las escrituras requieren `--actor`, `--confirm=UNIT2A_ADMIN`, service role y
RPC atómica. `link-case` requiere empresa explícita:

```powershell
node scripts/eve/official-control-panel/manage-client-context.mjs link-case --actor=<uuid> --case=<uuid> --company=<uuid> --relationship=<uuid> --name="Nombre verificado" --confirm=UNIT2A_ADMIN
```

Todas las operaciones admiten `--dry-run` sin confirmación ni escritura. Para
validar un vínculo sin inferir empresa:

```powershell
node scripts/eve/official-control-panel/manage-client-context.mjs link-case --case=<uuid> --relationship=<uuid> --dry-run
```

El script rechaza relaciones cruzadas, duplicados solapados, vigencias
inválidas y registros inexistentes. Las escrituras registran auditoría.

## Verificación reproducible

```powershell
node scripts/eve/official-control-panel/verify-unit-2a-integrity.mjs
```

El verificador ejecuta una RPC de solo lectura autorizada y reporta tablas
materializadas, constraints, índices, políticas, huérfanos, cruces de empresa,
vigencias inválidas y duplicados.

Prueba SQL local:

```powershell
Get-Content tests/regression/consultant-control-panel/official-control-panel-unit2a-local.sql -Raw |
  docker exec -i supabase_db_eve-platform psql -v ON_ERROR_STOP=1 -U postgres -d postgres
```

## Migración validada

Entorno: Supabase local en Docker, PostgreSQL 17, proyecto local
`eve-platform`.

Procedimiento ejecutado:

1. `npx supabase db reset --local`;
2. aplicación completa de todas las migraciones, incluidas `072000` y `073000`;
3. prueba SQL de constraints, RPC, auditoría y aislamiento RLS;
4. ejecución del verificador;
5. reversión controlada;
6. reparación local del historial como `reverted`;
7. reaplicación de `073000`;
8. nueva verificación.

Resultados:

- up: aprobado;
- reset desde cero: aprobado;
- caso con empresa distinta al participante: aprobado;
- caso cruzado empresa–relación: rechazado;
- asignación solapada: rechazada;
- aislamiento Consultor A/B: aprobado;
- rollback: aprobado con tablas de contexto vacías;
- reapply: aprobado;
- verificador final: `pass`.

No se aplicó la migración al proyecto remoto conectado ni a producción.

## Reversión

Archivo:

`scripts/eve/official-control-panel/rollback-unit-2a.sql`

La reversión falla si existen asignaciones, relaciones, vínculos o auditoría.
Con datos reales se requiere exportación, autorización y plan específico; no se
elimina automáticamente información. El bridge de `empresas` no se revierte
porque puede corresponder a una estructura canónica preexistente.

## Backfill y huérfanos

1. Ejecutar `report-orphans`.
2. Verificar evidencia contractual fuera del sistema.
3. Crear relación con empresa explícita.
4. Vincular cada caso con `--company` y `--relationship`.
5. Ejecutar el verificador.

No inferir por usuario, nombre, fecha, Runtime, WorkMap, actividad o similitud.
El resultado local actual está en `UNIT_2A_ORPHAN_CASES_REPORT.md`.

## Riesgos residuales

- El proyecto remoto presenta 23 tablas ajenas a Unidad 2A con RLS
  deshabilitado. No se modificaron porque habilitar RLS sin diseñar sus
  políticas podría interrumpir otros módulos.
- La migración sigue pendiente de staging/desarrollo remoto autorizado antes de
  producción.
- La política canónica para excluir estados de caso del futuro selector visual
  aún no está aprobada.
- El backfill real debe ejecutarse en el entorno que contenga casos históricos;
  el local validado no contenía datos de negocio.

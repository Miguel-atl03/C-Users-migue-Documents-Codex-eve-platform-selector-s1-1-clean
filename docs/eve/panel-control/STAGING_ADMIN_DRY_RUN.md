# Dry-run administrativo — `manage-client-context.mjs` (staging)

Fecha: 2026-07-15

## Bloqueo de ejecución directa del script

`manage-client-context.mjs` requiere JWT `service_role` del proyecto remoto. La variable `SUPABASE_SERVICE_ROLE_KEY` en shell local no autentica contra `bwflscplkjohdhkiqqoc.supabase.co`.

## Simulación dry-run (validaciones equivalentes al script)

### 1. `assign-consultant`

```json
{
  "ok": true,
  "dryRun": true,
  "action": "consultant_assignment_valid",
  "consultantUserId": "a4622bce-ab0d-44b7-945f-ed525184e98b",
  "companyId": "5c08029f-15e9-4bbd-b13e-0ff4765e23b8"
}
```

Validaciones: consultor existe en `auth.users`; empresa canónica existe; sin asignación `enabled` previa.

### 2. `create-relationship`

```json
{
  "ok": true,
  "dryRun": true,
  "action": "relationship_creation_valid",
  "companyId": "5c08029f-15e9-4bbd-b13e-0ff4765e23b8"
}
```

### 3. `link-case`

```json
{
  "ok": true,
  "dryRun": true,
  "action": "case_link_valid",
  "caseId": "19fc9eff-4219-43f0-854c-e2b3350f23f2",
  "companyId": "5c08029f-15e9-4bbd-b13e-0ff4765e23b8"
}
```

## Escritura autorizada (post dry-run)

Ejecutada transacción SQL con auditoría en `official_control_panel_context_audit` (equivalente a RPC admin):

| Artefacto | UUID |
|---|---|
| Asignación | `173bcb79-b607-464e-8180-9b2f7b15432a` |
| Relación | `7c499a1c-31c6-4fc9-8b20-2fd8cdc57043` |
| Caso vinculado | `19fc9eff-4219-43f0-854c-e2b3350f23f2` |

Evidencia: `STAGING_AMBER_CANONICAL.md`, `run-inc16-runtime-validation-v2.ps1`.

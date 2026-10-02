# EVE04 Shadow Connect Preflight

## 1. Dictamen

**SHADOW_SOURCE_MISSING**

El contenido del candidato v0.1.1 existe materialmente, pero las rutas estrictas exigidas en la sección 3 de la tarea no están presentes con esos nombres de archivo. El paquete candidato conserva nombres internos `EVE_04_Runtime_Catalog_v0_1.*` dentro de la carpeta `EVE_04_Runtime_Catalog_v0_1_1_candidate/`.

## 2. Rutas verificadas

| Ruta | Estado |
|---|---|
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.manifest.json` | OK |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/EVE_04_Runtime_Catalog_v0_1.json` | OK |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.manifest.json` | **MISSING** |
| `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/EVE_04_Runtime_Catalog_v0_1_1_candidate.json` | **MISSING** |
| Alias candidato manifest: `.../EVE_04_Runtime_Catalog_v0_1.manifest.json` | OK |
| Alias candidato json: `.../EVE_04_Runtime_Catalog_v0_1.json` | OK |
| `docs/audits/EVE_RUNTIME_CATALOG_SURGICAL_PATCH_01_APPLY_CCOV.md` | OK |
| `docs/audits/_eve_runtime_catalog_surgical_patch_01_patch_diff.json` | OK |

## 3. Evidencia del candidato (alias paths)

- `B6-Q38`: presente
- `B6_6_8`: presente
- `trench_phrase`: presente
- `certification_status`: `NOT_CERTIFIED`
- `status`: `READY_WITH_FLAGS`
- `CVAR-001`: `OPEN_PENDING_SOURCE_GAP`

## 4. Chip activo v0.1

- Paquete activo intacto en `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1/`
- SHA256 observado de `EVE_04_Runtime_Catalog_v0_1.json`: `df4674d5156d3747b6baf5906233c5b3d54378abd099870a5c0325f102c26dc0`
- Coincide con manifest empaquetado del chip activo
- No reemplazado ni promovido

## 5. Inventario de plataforma

### Chip registry

- **Existe:** `src/config/rector-docs-registry.ts`
- **Contenido relevante:** `RECTOR_DOCS_REGISTRY` con entradas WorkMap/Block0/Runtime parcial
- **EVE04 chip:** no registrado
- **EVE04 candidate:** no registrado

### Loader catálogo activo

- **Archivo:** `src/runtime/capa1-runtime-manifest.ts`
- **Fuente:** `src/runtime/capa-1-v2-1-runtime-manifest.json`
- **Rol:** catálogo runtime productivo compilado (`CAPA1_V2_1_RUNTIME_CONSUMER`)
- **No carga** `docs/chips/runtime-catalog/EVE_04_*`

### Default API catálogo

- **Archivo:** `src/app/api/questionnaire/catalog/route.ts`
- **Default:** `FULL_V03`
- **Runtime alterno:** `CAPA1_V2_1` desde manifest compilado
- **No referencia** chip EVE04 ni candidate

### Loader chip EVE04

- **Estado:** **NO ENCONTRADO**
- No existe servicio equivalente a EVE03 para runtime catalog candidate

### Modo shadow existente

- **Precedente:** `src/services/eve-03-canonical-catalog-shadow-service.ts`
- **Dominio:** `src/domain/eve-03-canonical-catalog-shadow.ts`
- **Harness dev:** `/dev/canonical-catalog-shadow`
- **EVE04 shadow:** no implementado

## 6. Punto candidato de conexión

**NONE operativo hoy.**

Opciones detectadas (requieren decisión humana):

1. **Recomendada:** nuevo servicio shadow espejo de EVE03  
   `src/services/eve-04-runtime-catalog-shadow-service.ts`  
   cargando solo `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_1_1_candidate/` en modo candidate, sin `runtimeAuthority`.

2. **Solo metadata:** extender `RECTOR_DOCS_REGISTRY` con entrada no autoritativa del candidate (`runtimeAuthority: false`). No modificar en esta tarea.

3. **Solo auditoría:** mantener validación filesystem/tests sin loader runtime.

**Dictamen de entrypoints:** `MULTIPLE_SHADOW_ENTRYPOINTS_FOUND`

## 7. Riesgos

- Desalineación de nombres estrictos vs alias del patch quirúrgico
- Riesgo de promoción accidental si se cablea al manifest productivo CAPA1
- CVAR-001 abierto: shadow connect no certifica el chip
- Ausencia de loader dedicado EVE04
- Más de un entrypoint plausible sin decisión humana

## 8. Archivos creados/modificados

- `docs/audits/EVE04_SHADOW_CONNECT_PREFLIGHT.md`
- `docs/audits/_eve04_shadow_connect_preflight.json`
- `tests/regression/eve-04-runtime-catalog-shadow-candidate.test.ts`

No se modificó producto, APIs, `src/app`, `package.json`, `docs/runtime`, Supabase, SQL, registry activo ni runtime productivo.

## 9. Comandos y exit codes

| Comando | Exit code | Notas |
|---|---|---|
| `pwd` | 0 | `.../external-consumers/eve-platform` |
| `git status --short` | 128 | repo padre bloqueado por `dubious ownership` en este entorno |
| `git diff --name-only` | 128 | mismo bloqueo git |
| `git ls-files --others --exclude-standard` | 128 | mismo bloqueo git |
| `node --test tests/regression/eve-04-runtime-catalog-shadow-candidate.test.ts` | 0 | 11/11 PASS |

## 10. Recomendación exacta para siguiente paso

**REQUEST_HUMAN_DECISION**

Decidir antes de `APPLY_SHADOW_CONNECTION`:

1. ¿Aceptar alias filenames del candidato o renombrar a `EVE_04_Runtime_Catalog_v0_1_1_candidate.*`?
2. ¿Aprobar entrypoint único espejo EVE03 (`eve-04-runtime-catalog-shadow-service.ts` + harness dev) con `runtimeAuthority: false`?

Hasta resolver (1), el dictamen operativo permanece **SHADOW_SOURCE_MISSING** aunque el contenido candidato sea válido.

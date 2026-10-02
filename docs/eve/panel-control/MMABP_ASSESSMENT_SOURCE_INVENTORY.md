# MMABP Assessment Source Inventory

Fecha: 2026-07-23

Alcance: S0 - inventario real de fuentes para el sustrato factual MMABP. No ejecuta conformance, consistency, ACA, diagramas ni export.

## Parallel Production Package

| Campo | Tipo de referencia | Almacenamiento real actual | Formato | Schema | Productor | Contenido resoluble | Versionamiento | Hash existente | Scope empresa/caso | Clasificacion |
|---|---|---|---|---|---|---|---|---|---|---|
| `source_bundle_ref` | referencia textual | `parallel_production_package.source_bundle_ref` | texto | `mmabp-design-source-bundle.schema.json` cuando se materializa como paquete | upstream paralelo / fixture autorizado | No desde el campo actual; si se ingesta a `mmabp_source_package_version`, si | `parallel_production_package.version` y version del paquete materializado | No en el campo; si en `content_sha256` | `company_id`, `case_id` | REFERENCIA SIN CONTENIDO |
| `facts_ref` | referencia textual | `parallel_production_package.facts_ref` | texto | `structural-fact.schema.json`/paquete `client_mmabp_structural_facts` | upstream paralelo / fixture autorizado | No desde el campo actual; si se ingesta a `mmabp_source_package_version`, si | paquete materializado por version | No en el campo; si en `content_sha256` | `company_id`, `case_id` | REFERENCIA SIN CONTENIDO |
| `registries_ref` | referencia textual | `parallel_production_package.registries_ref` | texto | `quadrant-registry.schema.json` | upstream paralelo / fixture autorizado | No desde el campo actual; si se ingesta a `mmabp_source_package_version`, si | paquete materializado por version | No en el campo; si en `content_sha256` | `company_id`, `case_id` | REFERENCIA SIN CONTENIDO |
| `inventory_ref` | referencia textual | `parallel_production_package.inventory_ref` | texto | `inventory-readiness.schema.json` | upstream paralelo / fixture autorizado | No desde el campo actual; si se ingesta a `mmabp_source_package_version`, si | paquete materializado por version | No en el campo; si en `content_sha256` | `company_id`, `case_id` | REFERENCIA SIN CONTENIDO |
| `ir_ref` | referencia textual | `parallel_production_package.ir_ref` | texto | `mmabp-ir.schema.json` | upstream paralelo / fixture autorizado | No desde el campo actual; si se ingesta a `mmabp_source_package_version`, si | paquete materializado por version | No en el campo; si en `content_sha256` | `company_id`, `case_id` | REFERENCIA SIN CONTENIDO |
| `version` | version del paquete observacional | `parallel_production_package.version` | integer | constraint SQL | acciones del panel / transiciones | Si, pero solo versiona el paquete observacional, no el contenido referido | Si | No | `company_id`, `case_id` | RESOLUBLE SIN HASH |

## Nueva persistencia tecnica

La migracion `20260723052000_eve_mmabp_assessment_data_substrate.sql` agrega:

- `mmabp_source_package`
- `mmabp_source_package_version`
- `mmabp_assessment_source_snapshot`
- `mmabp_model_element_index`
- `mmabp_source_lineage_index`
- `mmabp_rule_input_readiness`
- `mmabp_assessment_data_substrate_audit`

Estas tablas no sustituyen los objetos metodologicos. Almacenan versiones inmutables de los paquetes ya definidos y permiten resolver contenido real, hash y lineage.

## Dictamen S0

Los campos actuales de `parallel_production_package` no son contenido disponible. El sustrato requiere materializar versiones resolubles con contenido JSON validado y hash server-side antes de ejecutar cualquier productor CP-012.

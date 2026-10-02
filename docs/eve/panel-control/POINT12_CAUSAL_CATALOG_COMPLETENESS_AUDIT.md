# POINT12 — Auditoría de completitud del catálogo causal C01–C20

**Catálogo efectivo:** `point12-catalog-v1`  
**Fuente:** EVE_04_Runtime_Catalog_v0_2 + matriz Runtime + EVE_06 IIN-015 (C11)

| Causal | Cierre obligatorio documental | Variables canónicas | Operador | Representable | Modo |
|--------|------------------------------|---------------------|----------|---------------|------|
| C01 | variación / excepción | frequency_hint; variation_mode×2; exception_signature×2 | all_of + one_of | Sí | required_variables |
| C02 | beneficio/daño / cliente | 3 vars EVE04 | all_of | Sí | required_variables |
| C03 | disparador ambiguo | 3 vars | all_of | Sí | required_variables |
| C04 | dimensiones MoC | AB, AC, BC | **all_of** (corregido) | Sí | required_variables |
| C05 | excepción transformación | 2 vars | all_of | Sí | required_variables |
| C06 | cambios ocultos | 2 vars | all_of | Sí | required_variables |
| C07 | iteraciones | iteration_count | all_of | Sí | required_variables |
| C08 | excepción entrega | 3 vars | all_of | Sí | required_variables |
| C09 | feedback receptor | 3 vars core | all_of | Sí | required_variables |
| C10 | receptores secundarios | secondary_receivers | all_of | Sí | required_variables |
| C11 | Process State / Timer | deadlock_resolution, awaited_event, release_condition, timer_or_timeout, resolver_owner, exit_path | all_of | Sí (expandido) | required_variables |
| C12 | batching | iteration_batching_mode | all_of | Sí | required_variables |
| C13 | rutas alternativas | count en EVE04; condiciones en B4-Q26 | — | Parcial en variables | **explicit_state_only** |
| C14 | secuencia real | 3 vars | all_of | Sí | required_variables |
| C15 | variedad residual | 3 vars | all_of | Sí | required_variables |
| C16 | retrabajo | 3 vars | all_of | Sí | required_variables |
| C17 | info faltante / informal | 3 vars | all_of | Sí | required_variables |
| C18 | desgaste | 3 vars | all_of | Sí | required_variables |
| C19 | falla repetitiva | 3 vars | all_of | Sí | required_variables |
| C20 | frontera CR-B7 | 3 preclassification | all_of | Sí | required_variables |

`local-seed-v1` queda `superseded` (no usable para publicar).

# AUDIT - EVE-06-EXECUTION-ENGINE-D8-SOURCE-REALITY-REPAIR-V0

## 1. Resumen

Dictamen: `D8_READABLE_RESTORED`

El bloqueo previo de D8 no era corrupcion, ausencia real, permisos ni nombre con caracteres invisibles. La causa probable es manejo de path largo en Windows/PowerShell normal.

D8 abre correctamente usando ruta extendida `\\?\...`, y tambien mediante una ruta corta temporal `V:` creada con `subst` solo para diagnostico y eliminada al terminar.

## 2. Estado previo

Se leyeron:

- `docs/audits/CLOSEOUT_EVE_06_EXECUTION_ENGINE_SOURCE_PREFLIGHT_V0.md`
- `docs/audits/AUDIT_EVE_06_EXECUTION_ENGINE_SOURCE_PREFLIGHT_V0.md`
- `docs/audits/_eve_06_execution_engine_source_preflight_matrix_v0.json`
- `docs/audits/_eve_06_execution_engine_resolved_source_inventory_v0.json`

Confirmado:

- dictamen previo: `EXECUTION_ENGINE_SOURCE_MISSING_OR_UNREADABLE`
- unica fuente bloqueante: D8

No se detecto otro bloqueo de fuente.

## 3. Ruta D8 esperada

Ruta esperada:

`docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx`

Nombre esperado:

`EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx`

## 4. Diagnostico tecnico

Directory listing normal encontro D8:

- size: 225608 bytes
- created UTC: `2026-06-18T17:44:01.3686748Z`
- last write UTC: `2026-06-03T06:29:47.4408126Z`
- attributes: `Archive`

Comparacion de nombre:

- detected name length: 52
- expected name length: 52
- equals expected: true
- invisible characters detected: false
- Unicode/code points match expected: true

PowerShell normal:

- `Test-Path`: false
- `Get-Item`: path-not-found
- `Get-FileHash`: path-not-found
- `[System.IO.File]::OpenRead`: path-not-found
- `Get-Content -Encoding Byte -TotalCount 8`: path-not-found

Windows extended path:

- `Test-Path`: true
- `Get-Item`: 225608 bytes
- `Get-FileHash`: `09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2`
- first 8 bytes: `504b030414000000`

Node:

- `fs.existsSync`: true
- `fs.statSync`: 225608 bytes
- `fs.readFileSync` first bytes: `504b030414000000`

Path-length workaround:

- temporary `subst V:` test succeeded
- hash matched D8
- first bytes matched XLSX ZIP header
- `subst` was removed after test

## 5. Workbook

D8 opened as XLSX through Windows extended path.

- sha256: `09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2`
- readMethod: `windows_extended_path_xlsx_zip_workbook_xml_sheet_scan`
- sheetCount: 17

Sheets:

- `Version_Control`
- `Corpus_Documental`
- `Resumen_por_Bloque`
- `Catalogo_Madre_Nodos`
- `Source_Question_Registry`
- `Runtime_Classification`
- `UX_Copy_View`
- `Epistemic_Governance`
- `MMABP_Mapping`
- `Canonical_Variables`
- `Critical_Routes`
- `Trigger_Branching_Rules`
- `Readiness_Reentry_Gaps`
- `VSM_AHE_Prep`
- `Variables_Canonicas_Source`
- `Implementation_Dictionaries`
- `Audit_Issues`

Representative dimensions/headers are recorded in:

`docs/audits/_eve_06_execution_engine_d8_source_reality_matrix_v0.json`

## 6. Causa probable

Cause probable: path largo Windows en herramientas PowerShell/.NET usando ruta normal.

Descartado por evidencia:

- nombre invisible o normalizacion Unicode;
- archivo corrupto;
- archivo fantasma/listado stale;
- permisos;
- ruta esperada incorrecta;
- archivo realmente ausente;
- necesidad de fuente equivalente.

## 7. Equivalentes

Busqueda dentro de `docs/chips` y `docs/runtime` encontro:

- D8 esperado: readable por ruta extendida.
- `docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/EVE_03_Canonical_Catalog_v0_1.xlsx`: readable, pero es artifact de paquete, no reemplazo de D8.

No se requiere equivalente ni aprobacion para usar fuente alternativa porque D8 esperado fue restaurado para lectura.

## 8. No-cableado

Confirmado:

- no `src/**`
- no `tests/**`
- no `docs/chips/**` modificado
- no `docs/runtime/**` modificado
- no `docs/workmap/**`
- no `docs/significado/**`
- no `package.json`
- no `package-lock.json`
- no SQL
- no Supabase
- no runtimeAuthority
- no registry
- no EVE brain connection

## 9. Archivos creados

- `docs/audits/AUDIT_EVE_06_EXECUTION_ENGINE_D8_SOURCE_REALITY_REPAIR_V0.md`
- `docs/audits/CLOSEOUT_EVE_06_EXECUTION_ENGINE_D8_SOURCE_REALITY_REPAIR_V0.md`
- `docs/audits/_eve_06_execution_engine_d8_source_reality_matrix_v0.json`
- `docs/audits/_eve_06_execution_engine_d8_candidate_equivalents_v0.json`

## 10. Que no se hizo

No se hizo:

- modificar contenido del XLSX;
- modificar EVE-06;
- modificar chips previos;
- copiar fuentes;
- crear nueva fuente rectora;
- conectar EVE brain;
- runtimeAuthority;
- registry;
- Runtime productivo;
- WorkMap;
- Significado;
- Supabase;
- SQL;
- package.json.

## 11. Recomendacion

Reejecutar `EVE-06-EXECUTION-ENGINE-SOURCE-PREFLIGHT-V0_1` usando ruta extendida Windows o ruta corta temporal solo como mecanismo tecnico de lectura.


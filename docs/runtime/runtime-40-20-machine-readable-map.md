# Runtime 40/20 Machine-Readable Map

## Estado Actual

La base machine-readable actual cubre parcialmente Runtime 40/20:

- B0 tiene snapshot TS operativo en `src/features/runtime/block0-catalog-snapshot.ts`.
- B0 tiene counterpart JSON en `src/features/runtime/block0/block0.catalog.json`.
- B0 tiene tipos y validador en `src/features/runtime/block0/`.
- B0 response bundle R1 existe en `src/domain/runtime-block0-response.ts` y `src/services/runtime-block0-response-model.ts`.
- WorkMap -> B0 prefill existe en `src/services/workmap-to-block0-prefill.ts`.

El Runtime 40/20 completo todavia no esta completamente materializado como fuente machine-readable ejecutable.

## Que Sigue Editorial

Siguen como fuentes editoriales/historicas:

- `docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx`
- `docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx`

Estos archivos no deben ser leidos directamente por runtime.

## Riesgos De Mantener DOCX/XLSX Como Fuentes Vivas

- Ambiguedad por cambios de columnas o redaccion.
- Falta de tipado y validacion automatica.
- Imposibilidad de probar invariantes finos.
- Riesgo de revivir versiones editoriales obsoletas.
- Mezcla de metadata tecnica con ayuda visible.

## Plan Incremental

1. B0: mantener snapshot TS operativo, validar counterpart JSON y decidir en V2 si adapter migra al JSON.
2. B0.5: crear catalogo machine-readable antes de implementar flujo.
3. B1-B7: migrar bloque por bloque con schema, JSON, tipos, validator y tests.
4. Causales 20: separar reglas adaptativas, criterios de disparo y presupuesto.
5. Budget: manifestar limites, decrementos y condiciones de extension.
6. Readiness: tipar gates de cierre, warnings y bloqueos.
7. Branching: declarar rutas, precondiciones y salidas.
8. Response ingest: formalizar envelopes por bloque antes de integrarlos al runtime engine.

## Criterio De Listo Para Runtime

Un bloque esta listo para runtime cuando tiene:

- catalogo `.json` o politica `.ts`;
- tipos;
- validador;
- adapter o snapshot ejecutable;
- tests de contrato;
- documentacion humana `.md`;
- registro en `src/config/rector-docs-registry.ts`.

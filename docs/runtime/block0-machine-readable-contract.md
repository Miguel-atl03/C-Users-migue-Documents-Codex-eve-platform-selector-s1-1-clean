# Block0 Machine-Readable Contract

## Origen De B0

B0 proviene del snapshot operativo:

`src/features/runtime/block0-catalog-snapshot.ts`

Ese snapshot sigue siendo la autoridad ejecutable del adapter en V1.

## Representacion JSON

El counterpart machine-readable vive en:

`src/features/runtime/block0/block0.catalog.json`

Contiene B0-Q01 a B0-Q04 con:

- `runtimeInteractionId`
- `sourceRuntimeInteractionId`
- `block`
- `runtimeOrder`
- `questionText`
- `helpTextKind`
- `canonicalHelpStatus`
- `technicalLabel`
- `uiComponent`
- `responseKind`
- `subfields`
- variables canonicas
- source refs
- reglas de storage/riesgo cuando existen

## Validacion

El validador vive en:

`src/features/runtime/block0/block0.catalog.validator.ts`

Valida IDs exactos, orden, textos visibles, estados de ayuda, subcampos, source refs y que `technicalLabel` no sea usado como `helpText`.

## Adapter Y View Model

En V1 el adapter `src/services/runtime-block0-catalog-adapter.ts` sigue consumiendo `src/features/runtime/block0-catalog-snapshot.ts`. El JSON queda como counterpart validado y base de migracion V2.

## Consumo Por Significado

Significado consume preguntas canonicas de B0 a traves del adapter y del draft state. Significado no redefine el catalogo ni selecciona actividades.

## WorkMap Prefill No Es Evidencia

`src/services/workmap-to-block0-prefill.ts` puede precargar B0-Q01 desde WorkMap, pero lo hace con estados no confirmados. No emite `captured_user_evidence` ni completa B0 automaticamente.

## Subcampos Protegidos

- B0-Q01 conserva accion, objeto, regla/procedimiento, resultado y correccion libre.
- B0-Q03 conserva frecuencia, contexto tipico y actor inmediato.
- B0-Q04 conserva metadata suficiente para separar inicio y cierre mediante el response model.

## Metadata Interna

Metadata como labels tecnicos, rutas, source refs y reglas de storage no debe mostrarse como ayuda visible al usuario. La ayuda visible se controla con `questionText`, `helpText`, `helpTextKind` y `canonicalHelpStatus`.

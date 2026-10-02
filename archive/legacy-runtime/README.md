# Retiro controlado de catalogo runtime legacy

Este directorio conserva artefactos historicos que ya no pueden operar como fuente runtime.

`question-catalog-v2-1.NO_RUNTIME_SOURCE.json` fue retirado de `src/rules/` porque Capa 1 v2.1 se consume desde el runtime manifest compilado:

`src/runtime/capa-1-v2-1-runtime-manifest.json`

Reglas:

- no importar este archivo desde `src/`;
- no usarlo como fallback;
- no servirlo desde rutas API runtime;
- no reconstruir Capa 1 v2.1 desde este JSON;
- cualquier reactivacion debe fallar con `npm run check:no-legacy-runtime-catalog`.

El archivo se mantiene solo como referencia historica reversible. La fuente runtime activa es el manifest compilado.
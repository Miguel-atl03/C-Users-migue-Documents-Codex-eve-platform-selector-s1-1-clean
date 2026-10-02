# Capa 2.5 - Agregacion causal por cliente

Fecha: 2026-05-15

## Frontera epistemologica

Capa 2.5 integra hipotesis causales por sesion para producir una sola lectura causal agregada por cliente. No reemplaza Capa 3 y no produce verdad final.

- Capa 1 estructura hechos por sesion/escena.
- Capa 2 produce hipotesis causales auditables por sesion.
- Capa 2.5 integra multiples lentes observacionales de una misma empresa/cliente.
- Capa 3 compone juicio experto final, narrativa consultiva final e intervencion.

## Unidad cliente y lentes de rol

La unidad final de interpretacion de Capa 2.5 es el cliente/empresa, no el rol aislado.

Cada sesion por rol debe tratarse como una perspectiva recursiva parcial del mismo sistema cliente. `role_label`, `usuario_id` y `sesion_id` no son solo identificadores operativos: preservan la posicion observacional desde la que una parte del sistema describe su experiencia causal.

Por eso, Capa 2.5 no hace:

```text
cliente = suma de sesiones
```

Hace:

```text
cliente = sistema observado desde multiples roles,
cuyas lecturas locales se integran en una sola hipotesis causal agregada
```

La agregacion debe conservar:

- convergencias entre roles;
- contradicciones entre posiciones observacionales;
- diferencias de nivel, funcion o alcance por rol;
- posibles ecos recursivos del mismo nodo en distintos roles;
- sesiones que sostienen y sesiones que debilitan la lectura cliente.

El resultado no es una lista apilada de diagnosticos por rol. Es una pelicula causal agregada del cliente, construida desde observaciones parciales trazables.

## Fuente primaria

La fuente primaria de Capa 2.5 es `session_causal_outputs`.

Fuentes secundarias permitidas para trazabilidad:

- `scene_causal_activations`
- `causal_rule_executions`
- `scene_canonical_records`, solo para volver a evidencia estructural puntual
- `session_intermediate_output`, solo como respaldo contextual

Capa 2.5 no debe volver a leer respuestas sueltas ni recalcular Capa 1.

## Contrato de entrada

La unidad de entrada es:

```ts
ClientSessionCausalInput
```

Campos principales:

- `empresa_id`
- `sesion_id`
- `usuario_id`
- `role_label`
- `role_observation_position`
- `session_causal_output_id`
- `output: PreliminaryDiagnosticOutput`

`role_observation_position` explicita que la sesion representa una lente causal parcial del sistema cliente. Debe conservar:

- el rol o etiqueta funcional observada;
- la sesion concreta que produjo la lectura;
- el usuario asociado si existe;
- la nota de que se trata de una observacion parcial, no de una verdad cliente completa.

La relacion cliente se resuelve por:

```text
empresas.id -> usuarios.empresa_id -> sesiones_llenado.usuario_id -> session_causal_outputs.sesion_id
```

## Modelo de agregacion

La agregacion trabaja con lecturas locales por rol, pero su objetivo es una sola lectura cliente. Un nodo puede ser localmente dominante en una sesion y aun asi quedar como sintoma, eco recursivo o tension en el nivel cliente.

### Nodos nucleares y complementarios

Capa 2.5 organiza la pelicula cliente con una distincion explicita:

Nodos nucleares:

- `N02` Brecha Intencional
- `N06` Tortura Causal
- `N10` Promesa Imposible

Nodos complementarios:

- `N03` Anarquia Operacional
- `N04` Violacion Causal
- `N13` Incoherencia Total

Regla operativa:

```text
los nodos nucleares estructuran la pelicula;
los nodos complementarios la manifiestan, modulan, tensionan o localizan
```

Un nodo complementario puede ser transversal y relevante, pero no se convierte automaticamente en raiz cliente unica si un nodo nuclear explica mejor la configuracion total.

### Modos de agregacion causal

`single_nuclear_root`: un solo nodo nuclear domina claramente, los complementarios quedan subordinados o no son relevantes.

`nuclear_root_with_complements`: un nodo nuclear organiza la pelicula y uno o mas complementarios explican manifestaciones, localizaciones o compensaciones por rol.

`compound_nuclear_configuration`: dos nodos nucleares tienen soporte estructural fuerte y no es metodologicamente honesto colapsarlos en una causa simple. Este modo fuerza revision experta y confianza cauta.

### Nodo recurrente

Nodo que aparece en varias sesiones con soporte suficiente, aunque no necesariamente como raiz en todas.

Criterio MVP:

- aparece en al menos 2 sesiones; o
- cobertura >= 40% de sesiones evaluadas.

### Nodo local

Nodo que aparece con soporte claro en una sola sesion o rol.

No se descarta: puede indicar una ruptura situada en un actor especifico.

### Nodo dominante transversal

Nodo con presencia multisesion y bundles fuertes, con buen margen frente a nodos competidores.

Criterios MVP:

- cobertura >= 50%;
- soporte ponderado alto;
- no esta dominado por contradicciones fuertes.

### Nodo contradictorio

Nodo sostenido por algunas sesiones y debilitado por otras, o con lecturas incompatibles entre roles.

Ejemplos:

- una sesion muestra N04 como breach fuerte;
- otra sesion muestra N06 como bloqueo temporal que explica la misma friccion;
- o el mismo nodo aparece con confianza alta en una sesion y baja/ambigua en otra.

### Nodo recursivo

Nodo que aparece en distintos roles o niveles, pero con funcion causal distinta.

Ejemplo:

- N03 aparece localmente como workaround operativo en un rol;
- pero aparece transversalmente como arquitectura informal en otro conjunto de sesiones.

La recursividad no significa repetir el mismo diagnostico. Significa observar si el mismo nodo opera como raiz, consecuencia, amortiguador o eco en distintas posiciones del sistema cliente.

### Nodo sintomatico transversal

Nodo muy repetido que puede ser consecuencia o amortiguador, no raiz cliente.

Regla clave:

```text
repeticion != raiz agregada
```

Un nodo repetido por compensacion o sacrificio puede quedar como sintoma transversal si otro nodo explica mejor la causa estructural.

## Reglas de agregacion MVP

### 1. Cobertura transversal

Cada nodo recibe una cobertura:

```text
session_coverage_ratio = sesiones_con_soporte / sesiones_evaluadas
```

La cobertura aumenta recurrencia, pero no decide raiz por si sola.

### 2. Peso por confianza

El soporte de una sesion se pondera por confianza:

```text
high = 1.0
medium = 0.65
low = 0.35
```

Una raiz local con `low` no debe dominar sobre un patron transversal `medium/high` sin revision experta.

### 3. Bundles dominantes por sesion

Capa 2.5 debe leer:

- raiz de sesion;
- nodos secundarios;
- bundles dominantes;
- evidencia que sostiene/debilita;
- posicion observacional del rol;
- `needs_expert_review`;
- contradicciones/gaps.

No suma solo raices.

### 4. Penalizacion por contradiccion

Un nodo pierde fuerza agregada si:

- aparece como raiz en una sesion pero es debilitado por varias;
- hay conflicto entre raiz local y bundles dominantes de otro nodo;
- la confianza alta aparece con evidencia debil o tensionada.

### 5. Sintoma transversal vs raiz cliente

Si un nodo se repite sobre todo por:

- workaround;
- sacrificio;
- compensacion;
- absorcion residual;
- informal operation;

entonces puede clasificarse como `symptom_transversal`, salvo que exista evidencia de arquitectura raiz o breach fuerte.

### 6. Prevalencia estructural

Un nodo menos frecuente puede prevalecer si:

- tiene bundles mas estructurales;
- explica a otros nodos como consecuencias;
- aparece como condicion de posibilidad de los patrones locales.

## Contrato de salida

La salida propuesta queda tipada como:

```ts
ClientCausalAggregationOutput
```

Campos principales:

- `client_root_node_probable`
- `client_interpretation_unit`
- `role_perspective_map`
- `recursive_role_contribution_map`
- `aggregation_mode`
- `cross_session_nodes_recurrent`
- `cross_session_nodes_local`
- `cross_session_nodes_dominant_transversal`
- `cross_session_nodes_recursive`
- `cross_session_nodes_symptom_transversal`
- `cross_session_contradictions`
- `cross_session_support_map`
- `client_causal_path_probable`
- `sessions_that_support`
- `sessions_that_weaken`
- `confidence_level_client`
- `needs_reentry_client`
- `needs_expert_review_client`
- `preliminary_client_narrative`
- `primary_nuclear_node`
- `secondary_nuclear_node`
- `complementary_nodes`
- `symptom_transversal_nodes`
- `local_manifestation_nodes`

`client_root_node_probable`, `client_causal_path_probable`, `cross_session_support_map` y `cross_session_contradictions` representan una sola lectura causal agregada del cliente, no resultados paralelos por rol. `role_perspective_map` conserva desde donde se observo el sistema; `recursive_role_contribution_map` explica como cada rol contribuyo, tensiono o localizo la pelicula causal agregada.

## Persistencia preparada

Archivo SQL:

```text
sql/capa2_5_client_causal_outputs.sql
```

Tablas:

- `client_causal_aggregation_runs`
- `client_causal_outputs`
- `client_node_aggregation`
- `client_contradiction_map`

Estas tablas guardan el resultado agregado, el mapa por nodo y las contradicciones inter-sesion.

## Narrativa preliminar cliente

Capa 2.5 puede generar una narrativa preliminar agregada con esta disciplina:

- patron transversal emergente;
- sesiones que sostienen;
- sesiones que tensionan;
- rol o lente que aporta cada lectura parcial;
- rol o lente que contradice o debilita la lectura agregada;
- nodos locales relevantes;
- contradicciones abiertas;
- necesidad de revision experta.

No debe generar:

- teorema de inevitabilidad final;
- narrativa final cliente;
- recomendacion final de intervencion;
- juicio experto conclusivo.

## Plan de implementacion por tramos

### Tramo 1 - Contrato y persistencia

Estado: preparado.

- tipos en `src/domain/client-causal.ts`;
- SQL en `sql/capa2_5_client_causal_outputs.sql`;
- documento de arquitectura en este archivo.

### Tramo 2 - Loader de sesiones por empresa

Crear servicio que lea:

- `empresas`
- `usuarios`
- `sesiones_llenado`
- `session_causal_outputs`

Debe seleccionar la salida Capa 2 mas reciente por sesion o por criterio explicito.

### Tramo 3 - Motor de agregacion MVP

Construir:

- mapa nodo -> sesiones;
- mapa rol -> perspectiva observacional;
- mapa rol -> contribucion recursiva;
- soporte ponderado;
- nodos recurrentes/locales/transversales;
- contradicciones;
- raiz cliente probable;
- camino causal cliente probable.

### Tramo 4 - Persistencia runtime

Persistir:

- corrida;
- output agregado;
- agregacion por nodo;
- mapa de contradicciones.

### Tramo 5 - API interna

Ruta sugerida:

```text
POST /api/causal/client-aggregation
```

Body:

```json
{
  "empresaId": "...",
  "sessionIds": ["..."],
  "persist": true
}
```

### Tramo 6 - Validacion con cliente manufactura

Usar las sesiones por rol ya creadas para probar:

- agregacion transversal;
- nodos locales;
- contradicciones entre roles;
- narrativa preliminar cliente.

## Nota de frontera

Capa 2.5 hace:

- integracion causal auditable por cliente desde multiples lentes de rol;
- identifica recurrencia, transversalidad, contradiccion y rutas probables;
- preserva la contribucion parcial y recursiva de cada rol;
- produce narrativa preliminar agregada.

Capa 3 conserva:

- juicio experto final;
- composicion consultiva;
- teorema de inevitabilidad final;
- lenguaje maestro EVE;
- recomendacion/intervencion final.

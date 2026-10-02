# Alineacion Capa 1 v2.1 con Arbol de Decision Causal

Documento fuente analizado:

- `C:\Users\migue\Desktop\Plataforma Digital\Arbol de Decision Causal para conectar nodos en caminos de inevitabilidad.docx`

Archivo de extraccion usado para inspeccion:

- `C:\Users\migue\Documents\Codex\2026-05-12\quiero-que-realices-una-tarea-de\arbol-decision-causal-extraido.txt`

Estado de este entregable: analisis tecnico de compatibilidad. No implementa cambios de motor.

## 1. Veredicto ejecutivo

Si. Era conveniente leer este documento antes de construir `scene_canonical_records`.

La razon principal es que el registro canonico no debe limitarse a consolidar respuestas y derivaciones. Debe quedar preparado para alimentar dos capas posteriores:

1. La Tabla de Transduccion Causal.
2. El Arbol de Decision Causal.

El documento del punto 3 define que el motor no debe operar como formulario lineal, sino como arbol generativo recursivo. Eso afecta directamente el contenido minimo del dossier canonico por escena.

Conclusion:

> `scene_canonical_records` debe guardar una ficha estructural integral: evidencia, variables canonicas, relaciones, cobertura MMABP, lectura VSM, lectura AHE, reglas transversales, validaciones de calidad, gaps, flags y readiness.

No debe guardar todavia el diagnostico causal final ni los caminos de inevitabilidad confirmados. Eso pertenece al motor de transduccion y al arbol causal posterior.

## 2. Compatibilidad general

El documento del punto 3 es compatible con la ruta Capa 1 v2.1, pero requiere una traduccion importante.

El documento esta escrito desde la herramienta de 50 preguntas legacy. Capa 1 v2.1 ya evoluciono hacia escenas, bloques canonicos y derivaciones. Por eso, la implementacion no debe copiar reglas usando IDs legacy de pregunta. Debe traducir cada regla a:

- variables canonicas;
- derivaciones por bloque;
- flags de consistencia;
- relaciones estructurales;
- lectura MMABP/VSM/AHE;
- readiness para transduccion.

Esto confirma la decision tomada en el punto 2:

> Las reglas no deben leer preguntas sueltas. Deben leer `scene_canonical_records`.

## 3. Lo que el punto 3 exige de `scene_canonical_records`

El documento pide que cada actividad/escena pueda representarse como una ficha integral:

- PM;
- PF;
- MoC;
- OLC;
- lectura VSM;
- lectura AHE;
- alertas de inconsistencia.

Traducido al modelo EVE actual, `scene_canonical_records.canonical_json` debe incluir al menos:

| Seccion del dossier | Proposito | Fuente principal |
|---|---|---|
| `scene_metadata` | Identificar escena, rango, profundidad y origen | `scene_registry` |
| `evidence` | Respuestas capturadas y visibles | `scene_question_answers` |
| `provenance` | Separar capturado, normalizado, derivado, calculado, aclarado e inferido | `scene_answer_provenance` |
| `canonical_variables_by_block` | Variables listas para transduccion | `scene_block_derivations` |
| `structural_relations` | Relaciones actividad-objeto-estado-trigger-receptor-escalamiento | derivaciones + respuestas |
| `mmabp_map` | Cobertura de los 13 compartimentos MMABP | derivaciones + reglas de cobertura |
| `vsm_map` | Senales S1, S2, S3, S3*, S4, S5 y canal algedonico | derivaciones + flags |
| `ahe_map` | Senales intrapersonales, interpersonales y organizacionales | derivaciones + flags |
| `cross_validations` | Reglas R1-R15 y V1-V10 evaluadas como consistencia estructural | motor de consistencia |
| `pathway_hints` | Senales preliminares de familias A-H, sin diagnostico final | derivaciones + flags |
| `readiness` | Estado de aptitud para transduccion | cobertura + flags + gaps |
| `traceability` | IDs de respuestas, derivaciones, flags e inferencias usadas | todas las tablas de escena |

## 4. Lo que no debe ir todavia en `scene_canonical_records`

Para no mezclar Capa 1 con la transduccion causal, el registro canonico no debe guardar como hechos finales:

- nodos causales activados;
- camino de inevitabilidad confirmado;
- diagnostico causal final;
- teorema de inevitabilidad;
- interpretacion experta final;
- conclusion narrativa cerrada.

Puede guardar senales preparatorias, por ejemplo:

- `possible_structural_pathway`;
- `candidate_vsm_signal`;
- `candidate_ahe_signal`;
- `requires_reentry`;
- `requires_manual_review`;
- `insufficient_evidence_for_transduction`.

Pero deben quedar marcadas como senales estructurales o preclasificaciones, no como diagnostico.

## 5. Traduccion de la cadena recursiva del documento

El documento define esta cadena:

```text
Actividad / PM
-> Objeto / MoC
-> Dependencias / sincronizacion PM-PF
-> Coordinacion / PF
-> Comportamiento / OLC vivido
-> Tensiones, sacrificios y materialidad / AHE + VSM
-> Cierre recursivo hacia Actividad
```

En Capa 1 v2.1 esto debe traducirse asi:

| Cadena del arbol | Bloques Capa 1 v2.1 | Destino canonico |
|---|---|---|
| Actividad / PM | Bloque 0, 0.5, 1 | `structural_relations.activity`, `mmabp_map.PM` |
| Objeto / MoC | Bloque 2 | `structural_relations.object`, `mmabp_map.MoC` |
| Dependencias PM-PF | Bloque 1, 3, 4 | `structural_relations.dependencies`, `mmabp_map.PM_PF` |
| Coordinacion / PF | Bloque 3, 4 | `structural_relations.coordination`, `mmabp_map.PF` |
| OLC vivido | Bloque 2, 4, 6 | `structural_relations.object_lifecycle`, `mmabp_map.OLC` |
| AHE + VSM | Bloque 5, 6, 7 | `vsm_map`, `ahe_map` |
| Cierre recursivo | Bloque 7 + consistencia | `readiness`, `cross_validations`, `pathway_hints` |

## 6. Reglas transversales que deben alimentar consistencia

El documento lista 15 reglas transversales. Estas reglas no deben implementarse como diagnostico causal todavia; deben implementarse primero como generadoras de `scene_consistency_flags` y como parte de `cross_validations` dentro de `scene_canonical_records`.

| Regla | Lectura estructural | Donde debe vivir |
|---|---|---|
| R1 Actividad sin objeto no avanza | gap ontologico | `scene_consistency_flags`, `cross_validations` |
| R2 Objeto sin estados no cierra causalidad | gap de OLC | `scene_consistency_flags`, `mmabp_map` |
| R3 Dependencia declarada obliga sincronizacion explicita | cadena rota | `scene_consistency_flags`, `structural_relations.dependencies` |
| R4 Receptor downstream exige empatia operativa | riesgo de handoff extractivo | `ahe_map`, `cross_validations` |
| R5 Autonomia declarada se invalida por persecucion | autonomia falsa | `vsm_map.S1/S3`, `cross_validations` |
| R6 Coordinacion formal se invalida por shadow operation | sistema oficial desacoplado | `vsm_map.S2`, `cross_validations` |
| R7 Nunca falla es hipotesis sospechosa | contradiccion defensiva | `scene_consistency_flags` |
| R8 S2 se prueba por descoordinacion residual | S2 nominal vs real | `vsm_map.S2` |
| R9 S3* se prueba por visibilidad del error | canal de verdad | `vsm_map.S3_star`, `vsm_map.algedonic_channel` |
| R10 S4 se prueba por adaptacion y experimentacion | adaptabilidad | `vsm_map.S4` |
| R11 S5 se prueba bajo sacrificio | identidad real | `vsm_map.S5`, `ahe_map` |
| R12 Costo humano es dato estructural | variedad no absorbida | `ahe_map`, `vsm_map` |
| R13 Subsidiariedad | autonomia suficiente | `vsm_map.S3/S1` |
| R14 Materialidad tecnologica cambia lectura ontologica | herramienta no representa trabajo | `mmabp_map.MoC_OLC_PF`, `vsm_map` |
| R15 KPIs reescriben el flujo | conflicto de metricas | `vsm_map.S2/S3/S5`, `ahe_map` |

## 7. Validaciones V1-V10 y calidad de dato

El documento tambien define validaciones de inevitabilidad sistemica y calidad de dato. En Capa 1 deben entrar como validaciones estructurales, no como decision causal final.

| Validacion | Resultado esperado en Capa 1 |
|---|---|
| V1 Estrategia vs operacion | flag de mezcla de recursiones o captura de S4 |
| V2 Friccion oculta | flag de contradiccion defensiva |
| V3 Objeto obligatorio | gap critico si faltan objeto, atributo, estado inicial/final/falla |
| V4 Dependencia coherente | flag si independencia declarada contradice dependencias |
| V5 Coordinacion coherente | flag si coordinacion/no coordinacion se contradice |
| V6 Shadow IT | flag de sistema formal desacoplado |
| V7 Proceso zombi | flag de valor incierto |
| V8 Canal algedonico bloqueado | riesgo sistemico elevado |
| V9 Identidad traicionada | ruptura S5 |
| V10 Competencia causal | problema estructural, no interpersonal |

Estas validaciones deben influir en:

- `readiness_for_transduction`;
- `requires_clarification`;
- `requires_support_reentry`;
- `requires_manual_review`;
- `consistency_flag_ids`.

## 8. Mapeo MMABP que debe preservar el dossier canonico

El punto 3 exige que el expediente permita reconstruir los 13 compartimentos MMABP.

`scene_canonical_records.canonical_json.mmabp_map` deberia tener esta estructura logica:

```json
{
  "PM": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "PF": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "MoC": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "OLC": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "PM_PF": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "MoC_OLC": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "PM_MoC": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "PF_OLC": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "PM_PF_MoC": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "MoC_OLC_PM": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "PM_PF_OLC": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "MoC_OLC_PF": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] },
  "PM_PF_MoC_OLC": { "coverage": "complete|partial|missing", "variables": [], "gaps": [] }
}
```

Esto no requiere una tabla nueva por ahora. Puede vivir dentro de `canonical_json`.

## 9. Mapeo VSM que debe preservar el dossier canonico

El documento exige senales para:

- S1;
- S2;
- S3;
- S3*;
- S4;
- S5;
- canal algedonico.

`scene_canonical_records.canonical_json.vsm_map` deberia incluir:

```json
{
  "S1": { "signals": [], "evidence": [], "confidence": null },
  "S2": { "signals": [], "evidence": [], "confidence": null },
  "S3": { "signals": [], "evidence": [], "confidence": null },
  "S3_star": { "signals": [], "evidence": [], "confidence": null },
  "S4": { "signals": [], "evidence": [], "confidence": null },
  "S5": { "signals": [], "evidence": [], "confidence": null },
  "algedonic_channel": { "signals": [], "evidence": [], "confidence": null }
}
```

Esto sera insumo para la transduccion, pero no debe activar nodos por si solo.

## 10. Mapeo AHE que debe preservar el dossier canonico

El punto 3 distingue tres niveles AHE:

- intrapersonal;
- interpersonal;
- organizacional.

`scene_canonical_records.canonical_json.ahe_map` deberia incluir:

```json
{
  "intrapersonal": { "signals": [], "evidence": [], "confidence": null },
  "interpersonal": { "signals": [], "evidence": [], "confidence": null },
  "organizational": { "signals": [], "evidence": [], "confidence": null }
}
```

Este mapa debe leer tensiones, sacrificios, compensacion humana, desgaste, poder, seguridad psicologica, arbitrariedad, competencia y contradiccion identidad-practica.

## 11. Familias de caminos A-H

El documento define ocho familias de caminos diagnosticos:

| Camino | Nombre operacional | Como debe entrar a Capa 1 |
|---|---|---|
| A | Actividad viable y bien regulada | `pathway_hints.viable_regulated` |
| B | S2 debil | `pathway_hints.weak_s2` |
| C | S3 hipertrofico | `pathway_hints.hypertrophic_s3` |
| D | Ontologia rota | `pathway_hints.broken_ontology` |
| E | Causalidad rota | `pathway_hints.broken_causality` |
| F | Actividad zombi o valor incierto | `pathway_hints.zombie_or_uncertain_value` |
| G | Actividad adaptativamente muerta | `pathway_hints.adaptively_dead` |
| H | Suma cero | `pathway_hints.zero_sum` |

Estas familias son preparatorias. No son todavia los nodos N1-N6 de la Tabla de Transduccion. Deben servir como pistas estructurales para el motor causal posterior.

## 12. Impacto sobre el siguiente tramo

Antes de implementar `scene_canonical_records`, el shape debe quedar mas rico que el inicialmente previsto.

El siguiente tramo debe construir un servicio que:

1. lea `scene_registry`;
2. lea `scene_question_answers`;
3. lea `scene_answer_provenance`;
4. lea `scene_block_derivations`;
5. lea `scene_consistency_flags`;
6. lea `scene_clarifications`;
7. lea `scene_light_inferences`;
8. construya `canonical_json`;
9. calcule `readiness_for_transduction`;
10. persista `scene_canonical_records`.

`canonical_json` deberia quedar con esta forma base:

```json
{
  "schemaVersion": "scene_canonical_record_v1",
  "instrumentVersion": "CAPA1_V2_1",
  "sceneMetadata": {},
  "evidence": {},
  "provenance": {},
  "canonicalVariablesByBlock": {},
  "structuralRelations": {},
  "mmabpMap": {},
  "vsmMap": {},
  "aheMap": {},
  "crossValidations": [],
  "pathwayHints": {},
  "readiness": {},
  "traceability": {}
}
```

## 13. Riesgos si no se considera el punto 3

Si se implementa `scene_canonical_records` solo como resumen de derivaciones, se perderian:

- cobertura MMABP;
- lectura VSM;
- lectura AHE;
- reglas transversales;
- validaciones V1-V10;
- relaciones estructurales entre actividad, objeto, estados, trigger, receptor y escalamiento;
- capacidad de conectar despues nodos en caminos de inevitabilidad.

Eso obligaria a rehacer el dossier canonico cuando se construya el motor causal.

## 14. Decision recomendada

No implementar todavia reglas causales ni caminos de inevitabilidad.

Siguiente paso correcto:

> Construir `scene_canonical_records` como dossier estructural integral, ya preparado para Tabla de Transduccion y Arbol de Decision, pero sin diagnosticar causalmente todavia.

Esto mantiene limpia la frontera:

- Capa 1: captura, normaliza, deriva, valida y consolida estructura.
- Punto 2: transduce senales estructurales hacia nodos causales.
- Punto 3: conecta nodos en caminos de inevitabilidad.
- Punto 4: genera narrativa preliminar.
- Punto 5: conserva composicion final en manos del experto.


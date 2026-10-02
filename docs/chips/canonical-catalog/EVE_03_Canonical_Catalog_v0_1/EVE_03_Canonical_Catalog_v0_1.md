# EVE 03 Canonical Catalog v0.1

**Chip ID:** `EVE-03-CANONICAL-CATALOG`  
**Package ID:** `EVE_03_Canonical_Catalog_v0_1`  
**Package aliases:** `EVE_03_Canonical_Catalog_Chip_v0_1`  
**not_a_prompt:** `true`  
**Estado:** `READY_WITH_FLAGS`  
**Etapa:** `03_canonical_catalog`  

## Propósito

Preservar y volver ejecutable la genealogía canónica de Capa 1: nodos, códigos originales, variables, rutas críticas y política epistemológica. Este chip no reduce el catálogo a 40+20, no diagnostica y no fija una estructura VSM.

## Autoridad documental

| ID | Autoridad | Uso |
|---|---|---|
| D8 | EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx | primary_canonical_source: Nodos, códigos originales, variables fuente, rutas críticas, gobernanza epistemológica, mappings MMABP y preparación VSM/AHE. |
| D7 | Arquitectura_Runtime_40_20_EVE_MMABP.docx | supporting_architecture_boundary: Preserva Catálogo Madre; define que la reducción 40+20 ocurre en runtime y no por eliminación de genealogía. |
| D5 | Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx | supporting_normative_boundary: Autoridad entre artefactos, reglas de frontera, gates, QA y uso del Catálogo Madre. |
| D6 | Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx | supporting_executable_compatibility: Comprueba que los 40+20 referencian códigos y nodos existentes; aporta política epistemológica operativa y enforcement de rutas. |
| VSM1 | Organizational Systems Managing Complexity with the Viable System model.pdf | vsm_methodological_guard: Identidad, ingeniería de variedad, funciones sistémicas, recursión, desdoblamiento de complejidad, discreción e información. |

Regla de autoridad aplicada:

1. D8 conserva la genealogía canónica.
2. D7 impide que la reducción runtime destruya el catálogo madre.
3. D5 gobierna fronteras y reglas normativas.
4. D6 comprueba compatibilidad con el catálogo ejecutable 40+20.
5. VSM1 solo gobierna conceptos VSM; en esta etapa se conservan señales preparatorias, no diagnósticos.

## Módulos

| Módulo | Registros | Contrato |
|---|---:|---|
| `source_node_registry` | 164 | Un registro por nodo canónico, con IDs, código, documento fuente, ruta, política epistemológica, MMABP y preparación VSM/AHE. |
| `source_code_registry` | 164 | Índice exacto de códigos originales; no renombra ni reutiliza códigos. |
| `canonical_variables` | 257 | Registro de variables fuente, referencias pendientes y patrones; conserva variantes y linaje. |
| `node_variable_map` | 213 | Mapeo entre nodos y referencias de variables. |
| `critical_routes` | 4 | Rutas canónicas que no pueden cerrarse por inferencia libre. |
| `epistemic_policy` | 174 | 10 reglas globales y 164 políticas por nodo. |
| `vsm_prep_guard` | 8 reglas + 7 términos | Impide convertir señales de Capa 1 en diagnóstico VSM cerrado. |

## Inventario

| Bloque | Nodos |
|---|---:|
| 0 | 17 |
| 0.5 | 13 |
| 1 | 11 |
| 2 | 26 |
| 3 | 19 |
| 4 | 21 |
| 5 | 20 |
| 6 | 30 |
| 7 | 7 |

Tipos de nodo: `base_question`=78, `causal_probe`=11, `clarification_node`=27, `conditional_question`=39, `confirmation_card`=4, `internal_derivation`=5

## Rutas críticas

| Ruta | Expresión | Miembros | Bloqueo | Variables pendientes |
|---|---|---:|---|---|
| `CR-B0-WorkMapIntake-semantic-entry` | 0.0 → 0.1 → 0.1a/0.D | 5 | No consolidar actividad como evidencia dura; conservar weak_context o activar reconstrucción guiada. | activity_semantic_completion; activity_semantic_structure_corrected |
| `CR-B2-V3-transformation_exception` | 2.9 / transformation_exception_type → transformation_exception_exists → transformation_exception_description | 4 | CanonicalRouteException / ready_with_flags; no generar candidato PF/OLC si falta ruta. | Ninguna |
| `CR-B3-R9-receiver_feedback` | 3.10 → 3.13 → 3.13a → receiver_feedback_exists → receiver_feedback | 4 | receiver_feedback_route_missing / CanonicalRouteException / no crear rework desde satisfacción subjetiva. | Ninguna |
| `CR-B7-AHE-boundary_guard` | 7.0 → 7.0a → 7.3 → 7.3a → 7.4 | 5 | ManualReviewRequest / EvidenceInsufficiency / TransductionBlocker según caso. | Ninguna |

## Política epistemológica mínima

- **No inferencia dura:** Una inferencia IA no entra como captured_user_evidence sin confirmación/corrección del usuario. Efecto: `enforce_or_block`.
- **Confirmación de preload:** WorkMapIntake puede prellenar, pero debe ser editable y confirmable. Efecto: `enforce_or_block`.
- **Ruta canónica primero:** Variables críticas solo cierran desde rutas canónicas. Efecto: `enforce_or_block`.
- **B7 no diagnostica:** B7 solo transporta señal preclasificatoria y confidence. Efecto: `enforce_or_block`.
- **Gaps visibles:** Si falta evidencia, se marca gap/reentry/manual_review; no se maquilla para avanzar. Efecto: `enforce_or_block`.
- **Audit log:** Cualquier cierre por derivación, corrección, ruta crítica o reentry queda auditado. Efecto: `enforce_or_block`.
- **Texto libre no cierra hecho estructural:** Texto libre o inferencia IA requiere estado epistemológico, trazabilidad y ruta/gate aplicable antes de cerrar una variable estructural. Efecto: `enforce_or_block`.
- **MMABP antes de diagnóstico:** Toda salida estructural pasa por candidato, conformance, consistencia y readiness antes de cualquier interpretación diagnóstica o Producción Paralela. Efecto: `enforce_or_block`.
- **VSM como preparación no diagnóstica:** Las asignaciones S1-S5, S3* o canal algedónico conservadas en Capa 1 son señales candidatas; no constituyen diagnóstico VSM ni fijan recursión. Efecto: `enforce_or_block`.
- **Genealogía inmutable:** capture_node_id, master_node_id, source_block, source_question_code_intact y source_document se preservan; cualquier cambio crea nueva versión, no sobreescritura. Efecto: `enforce_or_block`.

## Guardia VSM

VSM se incorpora desde esta fase como lente rectora cuando corresponde, pero se mantiene separado de MMABP. Los códigos S1-S5, S3* y canal algedónico son señales candidatas. No fijan identidad, recursión, desdoblamiento de complejidad ni arquetipo sin evidencia y etapa VSM específica.

- **Señal preparatoria, no diagnóstico:** Los candidatos S1-S5, S3* y canal algedónico del Catálogo Madre se conservan como preparación. No fijan una estructura viable, una recursión ni un arquetipo.
- **Identidad antes de asignación sistémica:** Antes de interpretar funciones VSM deben estar delimitados el sistema en foco, la transformación y los actores relevantes.
- **Desdoblamiento como hipótesis:** Las relaciones entre actividades primarias, secundarias y reguladoras se tratan como hipótesis de desdoblamiento de complejidad hasta validación con actores y evidencia.
- **Funciones sistémicas no equivalen a cuadrantes MMABP:** Implementación, coordinación, cohesión, inteligencia y política son funciones VSM; PM, MoC, PF y OLC son vistas MMABP. No deben fusionarse ni sustituirse.
- **Variedad sustentada en evidencia:** Una señal de desbalance de variedad requiere evidencia de demanda, capacidad de respuesta, perturbación, coordinación o regulación; no basta una etiqueta intuitiva.
- **Discreción exige información y canales:** La discrecionalidad reguladora debe trazarse junto con información apropiada y canales de comunicación; la ausencia se registra como gap, no como función viable.
- **Recursión explícita:** Toda asignación VSM posterior debe declarar nivel de recursión y sistema en foco. La Capa 1 solo conserva señales de posible función.
- **Canal algedónico como excepción crítica:** La mención de canal algedónico se conserva como candidato de señal crítica y no como evidencia automática de que el canal exista o funcione.

## QA y dictamen

**Dictamen:** `READY_WITH_FLAGS`.

- 164/164 nodos preservados y 164/164 códigos originales únicos.
- 4/4 rutas críticas preservadas; 18/18 miembros resueltos.
- Las 60 interacciones runtime de D6 referencian nodos/códigos existentes.
- 246 filas fuente de variables preservadas, consolidadas en 223 nombres únicos.
- 33 variables referenciadas por nodos no están definidas en `Variables_Canonicas_Source`; se mantienen como `referenced_not_defined_in_variables_source`, sin inventar definición.
- 23 nombres están duplicados en la fuente; 5 contienen variantes de definición. Se conserva el conflicto, no se aplana.
- 58 variables fuente no están nombradas explícitamente en expresiones de salida de nodos; se conservan como posible derivación, bundle o preload.

No declarar este chip `CERTIFIED` o `COMPLETE` mientras existan definiciones pendientes o conflictos no resueltos.

## Consumo permitido

- Cargar nodos y códigos como registros versionados.
- Resolver interacción runtime a nodos madre sin perder IDs.
- Materializar variables con provenance y estado epistemológico.
- Evaluar rutas críticas y reentry.
- Preparar señales VSM/AHE como candidatos no diagnósticos.

## Usos prohibidos

- Renombrar códigos fuente o sobreescribir genealogía.
- Cerrar variables críticas desde texto libre sin ruta y confirmación.
- Usar B7 para diagnóstico, IR, registry, export o VSM/AHE cerrado.
- Convertir candidatos S1-S5 en estructura viable confirmada.
- Reducir los 164 nodos eliminando filas del catálogo madre.

## Archivos

- `EVE_03_Canonical_Catalog_v0_1.xlsx`: registro operativo auditable.
- `EVE_03_Canonical_Catalog_v0_1.json`: chip completo.
- `EVE_03_Canonical_Catalog_v0_1.ts`: módulo TypeScript.
- `03_canonical_catalog/*.json`: módulos desacoplados.
- `EVE_03_Canonical_Catalog_v0_1.manifest.json`: integridad y checksums.
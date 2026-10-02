# MMABP Rule to Repository Feasibility Matrix

Fecha: 2026-07-23

Alcance: CP-012, auditoria semantica previa. No se implemento codigo, migracion, RPC ni productor. R4 y R5 permanecen bloqueados.

## Corpus confirmado

| Fuente | Rol | Ruta | SHA-256 |
|---|---|---|---|
| Fundamentals of Business Architecture Modeling.pdf | Libro MMABP; autoridad metodologica primaria | `docs/chips/method-kernel/EVE_00_Method_Kernel_v0_2/sources/Fundamentals of Business Architecture Modeling.pdf` | `3dd3485afa518244cb600b4c479cad0ea11f242e88e4204b9422739ddf843147` |
| Instrucciones Maestras | Marco operativo | `docs/eve/panel-control/corpus/Instrucciones_Maestras_y_Exhaustivas_para_IA_Arquitectura_Minima_de_Negocio_(MMABP)_y_Diagnostico_EVE (1).docx` | `6f519acd2af9b179fe8e94595d53be33328a9c8809a32e008ffa6334cfc38140` |
| Diseno Panel Control EVE | Autoridad funcional del Panel | `docs/eve/panel-control/corpus/Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx` | `8d18675cfbd0f370ddba5391313d2558703266ed9d67123319dc31ffb477dff2` |

Nota factual: el archivo de Instrucciones Maestras existe fisicamente con acentos, simbolo de marca y sufijo `(1)`. La ruta exacta sin sufijo `(1)` no existe en disco.

## Lectura minima del libro

Se leyeron las secciones del PDF:

- 4.1 Conformance Evaluation, paginas PDF 194-195.
- 4.2 Consistency Evaluation, paginas PDF 195-196.
- 4.3 Basic Factual Consistency Rules, paginas PDF 196-215.
- 4.4 Basic Temporal Consistency Rules, paginas PDF 215-219.
- 4.5 Basic Structural Consistency Rules, paginas PDF 219-223.

## Inventario tecnico disponible

| Capa | Disponible | Brecha |
|---|---|---|
| Esquemas de artefacto | `structural-fact.schema.json`, `quadrant-registry.schema.json`, `mmabp-ir.schema.json`, `conformance-report.schema.json`, `consistency-report.schema.json` | Son contratos de JSON; no son tablas productivas con snapshot consultable. |
| Panel oficial | `parallel_production_package` con `source_bundle_ref`, `facts_ref`, `registries_ref`, `ir_ref`, `inventory_ref`, `version`, estados de conformance/consistency y `parallel_production_qa_finding` | Guarda referencias y estados, no el contenido estructurado versionado/hash de PM/MoC/PF/OLC. |
| Validador local | `scripts/validate-parallel-production.mjs` | Valida forma/referencias de fixtures; no produce findings desde realidad. |
| Productor actual | Ninguno canonicamente aceptable para CP-012 | `assessment-run.mjs` y scripts `run-phase3b-*` son ensayo/derivacion local, no productor oficial factual. |

## Conformance - modelo contra realidad

| ruleId | Texto/parafrasis fiel | Fuente y seccion | Modelo(s) implicados | Hechos necesarios | Objetos/tablas disponibles | Campos disponibles | Productor existente | Brecha de datos | Brecha de algoritmo | Implementable sin invencion |
|---|---|---|---|---|---|---|---|---|---|---|
| CONF-PM-REALITY-COMPLETE | El process map debe incluir todos los productos especificados y cada evento reconocido debe disparar alguna accion/proceso. | Libro MMABP 4.1 | PM | productos reales, eventos reconocidos, procesos, acciones disparadas | `parallel_production_package`, schemas de registry/IR | `source_bundle_ref`, `facts_ref`, `registries_ref`, `ir_ref`, `version`; en schema: `business_process`, `trigger_event`, `target_state` | No | No hay tabla productiva de productos/eventos/procesos ni snapshot PM consultable por version/hash. | Falta regla ejecutable para comparar PM contra realidad y detectar omisiones. | No |
| CONF-PM-REALITY-CORRECT | Cada proceso debe cumplir su target principal y sus propiedades/relaciones deben ser validas para todas sus instancias posibles. | Libro MMABP 4.1 | PM | target real, instancias del proceso, relaciones con otros procesos, evidencia de cumplimiento | `parallel_production_package`, `parallel_production_qa_finding` | estados agregados y refs | No | No hay instancias de proceso ni relacion PM materializada como datos consultables. | Falta evaluador de cumplimiento de target y validez universal. | No |
| CONF-PF-REALITY-COMPLETE | El process flow debe comenzar con eventos disparadores y cubrir todos los finales relevantes al target del proceso. | Libro MMABP 4.1 | PF | eventos iniciales reales, tareas, ends, target del proceso, rutas alternativas | refs de paquete, schemas PF/IR | refs y estados; en schema: `task`, `process_state`, `timer_event`, `gateway`, `handoff` | No | No hay grafo PF productivo versionado ni lista de ends por target. | Falta traversal de grafo y comparacion contra realidad/target. | No |
| CONF-PF-REALITY-CORRECT | El flujo debe cumplir propiedades algoritmicas esenciales: correccion, unicidad, finitud, apertura y generalidad; valido para todas las instancias. | Libro MMABP 4.1 | PF | grafo ejecutable, reglas de terminacion, gateways, loops, excepciones, evidencia de instancias | refs de paquete, fixtures/validator | estados agregados y refs | No | No hay grafo PF formal consultable ni trazas suficientes de instancias. | Falta analizador de propiedades algoritmicas y universalidad. | No |
| CONF-MOC-REALITY-COMPLETE | En el modelo de conceptos debe existir al menos una via entre cualquier par de clases. | Libro MMABP 4.1 | MoC | clases, relaciones, grafo conceptual completo | schemas registry/IR; refs | `object_class`, `attribute`, `operation`, `relationship`; refs | No | No hay grafo MoC productivo consultable desde la DB. | Falta algoritmo de conectividad sobre MoC materializado. | No |
| CONF-MOC-REALITY-CORRECT | Cada clase debe corresponder a objetos reales/existentes y cada relacion debe modelar una posible relacion real, valida para todas las instancias. | Libro MMABP 4.1 | MoC | evidencia de clases reales, objetos, relaciones posibles, instancias | refs y schemas | refs, `source_fact_ids` en schema | No | No hay tabla de clases/relaciones con evidencia literal resoluble. | Falta comparador realidad-conceptos y criterio de validez. | No |
| CONF-OLC-REALITY-COMPLETE | El OLC debe cubrir la vida completa del objeto e incluir constructor, destructor y transformer. | Libro MMABP 4.1 | OLC | objeto, estados, constructor, destructor, transformer, eventos reales | refs y schemas | `object_state`, `transition`, `operation`, `self_loop` en schema | No | No hay OLC productivo consultable ni estereotipos obligatorios materializados. | Falta detector de cobertura de ciclo de vida completo. | No |
| CONF-OLC-REALITY-CORRECT | El OLC debe corresponder a acciones reales y secuencias objetivas de la vida del objeto, validas para todas sus instancias. | Libro MMABP 4.1 | OLC | secuencias reales de estados, eventos/acciones, instancias de objeto | refs y schemas | refs y estados agregados | No | No hay trazas de vida de objetos ni secuencias versionadas. | Falta evaluador de secuencia real vs OLC. | No |

## Consistency - factual

| ruleId | Texto/parafrasis fiel | Fuente y seccion | Modelo(s) implicados | Hechos necesarios | Objetos/tablas disponibles | Campos disponibles | Productor existente | Brecha de datos | Brecha de algoritmo | Implementable sin invencion |
|---|---|---|---|---|---|---|---|---|---|---|
| FACT-PM-MOC-OBJECT-REFS | Los objetos mencionados en nombres de eventos y target states del PM deben corresponder a clases del MoC. | Libro MMABP 4.3.1 | PM, MoC | objetos en eventos/targets PM, clases MoC, sinonimia controlada | refs paquete, schemas registry/IR | `trigger_event`, `target_state`, `object_class`, `source_fact_ids` | No | No hay PM/MoC materializados ni indice de nombres/objetos. | Falta normalizador semantico y comparador PM-MoC. | No |
| FACT-PM-PF-TRIGGERS | Los eventos disparadores de cada proceso deben ser identicos en PM y PF. | Libro MMABP 4.3.2 Rule #1 | PM, PF | proceso, triggering events PM, start events PF | refs paquete, schemas | `business_process`, `trigger_event`, `task`/PF elements | No | No hay mapeo proceso->PF por version. | Falta comparador de identidad semantica de eventos. | No |
| FACT-PM-PF-TARGET-STATE | El target state del PM debe aparecer en el PF como estado de objeto producido por una tarea correspondiente. | Libro MMABP 4.3.2 Rule #2 | PM, PF | target PM, tareas PF, estados de objeto resultantes | refs, schemas | `target_state`, `task`, `object_state`, `source_fact_ids` | No | No hay tarea->estado resultante en tabla productiva. | Falta trazado target->task->object state. | No |
| FACT-PM-PF-SUPPORT-SYNC | Los support processes registrados en PM deben aparecer en el PF del proceso soportado como sincronizaciones, y viceversa. | Libro MMABP 4.3.2 Rule #3 | PM, PF | procesos soporte, proceso soportado, puntos de espera/sincronizacion | refs, schemas | `support_process`, `process_state`, `handoff` | No | No hay relacion soporte/sincronizacion consultable. | Falta comparador bidireccional PM-PF. | No |
| FACT-PM-PF-SYNC-EVENT | En una sincronizacion, al menos un evento esperado por el proceso soportado debe corresponder a un estado de objeto producido por el soporte. | Libro MMABP 4.3.2 Rule #4 | PM, PF | evento esperado, estado objetivo del soporte, tarea que produce estado | refs, schemas | `process_state`, `trigger_event`, `object_state`, `support_process` | No | No hay eventos esperados ni estados producidos materializados. | Falta trazado wait-event -> support target state. | No |
| FACT-MOC-PF-OBJECT-REFS | Objetos referidos por eventos, process states, estados asociados a tareas y condiciones de split en PF deben existir como clases en MoC. | Libro MMABP 4.3.3 | MoC, PF | nombres de objeto en PF, clases MoC, condiciones de split | refs, schemas | `object_class`, `process_state`, `gateway`, `task`, `object_state` | No | No hay parse estructurado de condiciones ni clases en DB. | Falta resolucion semantica de referencias PF->MoC. | No |
| FACT-PF-PF-SUPPORT-TRIGGER | Si un proceso inicia un soporte, el evento que dispara el soporte debe corresponder al estado de objeto producido en el PF soportado. | Libro MMABP 4.3.4 Rule #1 | PF, PF | proceso soportado, soporte, evento de inicio, estado producido | refs, schemas | `support_process`, `trigger_event`, `object_state`, `task` | No | No hay dos PF enlazados en datos productivos. | Falta comparador entre modelos PF. | No |
| FACT-PF-PF-SUPPORTED-WAIT-EVENTS | Los eventos que espera el proceso soportado deben corresponder a cambios de estado producidos por tareas del soporte, salvo time events o eventos externos. | Libro MMABP 4.3.4 Rule #2 | PF, PF | wait events, tareas soporte, cambios de estado, clasificacion time/external | refs, schemas | `process_state`, `timer_event`, `task`, `object_state` | No | No hay clasificacion de eventos esperados ni origen interno/externo. | Falta matching con excepciones temporales/externas. | No |
| FACT-PF-OLC-EVENT-REASON | Cada evento que inicia una tarea PF debe corresponder a una razon de transicion OLC hacia el estado resultante asociado a esa tarea. | Libro MMABP 4.3.5 Rule #1 | PF, OLC | evento PF, tarea, estado resultante, transicion OLC, reason | refs, schemas | `trigger_event`, `task`, `object_state`, `transition`, `related_event` | No | No hay reason estructurado ni tarea->estado resultante en DB. | Falta comparador event/reason/task/state. | No |
| FACT-PF-OLC-SPLIT-STATES | Los estados de objeto usados en condiciones de split PF deben existir en el OLC correspondiente. | Libro MMABP 4.3.5 Rule #2 | PF, OLC | condiciones de gateway/split, estados OLC | refs, schemas | `gateway`, `object_state` | No | No hay condiciones de split parseadas como referencias a estados. | Falta parser/normalizador de condiciones. | No |
| FACT-PF-OLC-TASK-STATES | Los estados de objeto asociados a tareas PF deben existir en los OLC relevantes. | Libro MMABP 4.3.5 Rule #3 | PF, OLC | tareas PF, data/object states, OLC states | refs, schemas | `task`, `object_state`, `source_fact_ids` | No | No hay asociacion task->object state consultable. | Falta matching task-state contra OLC. | No |
| FACT-OLC-MOC-OPERATIONS | Las operaciones capturadas en transiciones OLC deben existir como operaciones de la clase correspondiente en MoC. | Libro MMABP 4.3.6 Rule #1 | OLC, MoC | clase, operaciones MoC, operaciones en transiciones OLC | refs, schemas | `operation`, `relationship`, `transition`, `related_operation` | No | No hay operaciones MoC/OLC materializadas en tablas. | Falta comparador operation OLC->MoC. | No |
| FACT-OLC-MOC-ATTR-REL-REASONS | Atributos y relaciones referidos en razones de transicion OLC deben existir en la clase MoC correspondiente. | Libro MMABP 4.3.6 Rule #2 | OLC, MoC | transition reason, atributos, relaciones, clase | refs, schemas | `attribute`, `relationship`, `transition` | No | No hay reason parseado ni atributos/relaciones consultables. | Falta parser semantico de reason y matching MoC. | No |
| FACT-OLC-OLC-CROSS-STATE | Si una transicion OLC depende del estado de otro objeto, ese estado debe existir en el OLC del objeto referenciado. | Libro MMABP 4.3.7 | OLC, OLC | estado referenciado, objeto referenciado, OLC destino | refs, schemas | `object_state`, `transition`, `related_object_state` | No | No hay dependencias OLC cruzadas materializadas. | Falta resolvedor cross-OLC. | No |

## Consistency - temporal

| ruleId | Texto/parafrasis fiel | Fuente y seccion | Modelo(s) implicados | Hechos necesarios | Objetos/tablas disponibles | Campos disponibles | Productor existente | Brecha de datos | Brecha de algoritmo | Implementable sin invencion |
|---|---|---|---|---|---|---|---|---|---|---|
| TEMP-PF-OLC-SEQUENCE | La secuencia de estados de objeto asociada a tareas PF no debe contradecir la secuencia de estados definida en OLC. | Libro MMABP 4.4 | PF, OLC | secuencia de tareas, estados resultantes, secuencia OLC | refs, schemas | `task`, `object_state`, `transition`; estados agregados `consistency_temporal_status` | No | No hay secuencias PF/OLC versionadas consultables. | Falta traversal temporal y comparacion de orden. | No |
| TEMP-PF-OLC-CONSISTENCY-TABLE | La tabla de consistencia debe comparar por fila event/reason -> action -> state en PF y OLC, considerando si el iniciador es externo o interno. | Libro MMABP 4.4 | PF, OLC | eventos/razones, acciones, estados, origen del iniciador | refs, schemas | `trigger_event`, `operation`, `task`, `object_state`, `transition` | No | No hay origen de evento ni filas normalizadas event/action/state. | Falta constructor de tabla de consistencia y criterio de mismatch. | No |

## Consistency - structural

| ruleId | Texto/parafrasis fiel | Fuente y seccion | Modelo(s) implicados | Hechos necesarios | Objetos/tablas disponibles | Campos disponibles | Productor existente | Brecha de datos | Brecha de algoritmo | Implementable sin invencion |
|---|---|---|---|---|---|---|---|---|---|---|
| STRUCT-PF-OLC-ALTERNATIVES | Si estados de un objeto aparecen como alternativas en PF, tambien deben ser alternativas en su OLC. | Libro MMABP 4.5.1 | PF, OLC | alternativas/gateways PF, estados alternativos OLC | refs, schemas | `gateway`, `object_state`, `transition` | No | No hay estructura de alternativas materializada. | Falta detector de alternativa en PF y OLC. | No |
| STRUCT-MOC-OLC-ATTR-REL-OPERATIONS | Atributos y relaciones de una clase deben reflejarse en transiciones OLC mediante operaciones que los cambian. | Libro MMABP 4.5.2 Rule #1 | MoC, OLC | atributos, relaciones, operaciones, transiciones OLC | refs, schemas | `attribute`, `relationship`, `operation`, `transition` | No | No hay operaciones que cambian atributos/relaciones en snapshot productivo. | Falta coverage checker MoC->OLC. | No |
| STRUCT-MOC-OLC-ONE-TO-MANY-ITERATION | Cada asociacion 1:N del MoC debe reflejarse como ciclo iterativo en el OLC de la clase correspondiente. | Libro MMABP 4.5.2 Rule #2 | MoC, OLC | cardinalidad 1:N, clase, transiciones iterativas/ciclos OLC | refs, schemas | `relationship`, `self_loop`, `transition` | No | No hay cardinalidad ni ciclos OLC consultables en tablas. | Falta detector de cardinalidad y ciclo iterativo. | No |

## Resultado de factibilidad

El contexto documental queda completo para revisar reglas y brechas, pero el productor sigue bloqueado en el repositorio actual porque:

- las reglas requieren contenido PM/MoC/PF/OLC estructurado y versionado;
- el panel oficial conserva referencias (`*_ref`) y estados, no los artefactos resolubles como snapshot inmutable;
- no existe productor oficial que lea realidad, facts, inventory, registry e IR de la misma version/hash;
- los validadores actuales validan fixtures y referencias, no generan findings factuales desde evidencia real;
- la consistencia compuesta no debe agregarse hasta derivarla explicitamente de los compartimentos factual, temporal y structural.

Dictamen permitido:

**CONTEXTO MMABP COMPLETO, PERO PRODUCTOR BLOQUEADO POR BRECHAS FACTUALES IDENTIFICADAS**

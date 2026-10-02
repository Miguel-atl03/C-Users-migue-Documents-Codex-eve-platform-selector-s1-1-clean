# 00_method_kernel v0.2.0

## Propósito
Kernel metodologico MMABP para validar conformance y consistencia de PM, MoC, PF y OLC antes de cualquier diagnostico, salida estructural o consumo runtime.

## Política de fuentes
- Fuente compilada principal: **D1 - Fundamentals of Business Architecture Modeling.pdf**.
- Fuentes de frontera de compatibilidad:
  - D4 - EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
  - D5 - Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx
- Estado D5: **D5_BOUNDARY_VERIFIED**. El DOCX declarado existe en repo y fue verificado como boundary source en `docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.docx`.
- D5 es fuente de frontera Runtime; no redefine MMABP, no reemplaza D1 y no implementa gates Runtime dentro del Method Kernel 00.
- FND-007/FND-008 usan D4/D5 solo como frontera de compatibilidad. No implementan gates Runtime 40/20.
- Documentos internos del asistente: **excluidos de compilación**.
- Diagnóstico EVE patológico: **deshabilitado en etapa 00**; inicia en etapa 02.

## Estados permitidos
- `ready`
- `ready_with_flags`
- `blocked_by_missing_evidence`
- `blocked_by_contradiction`
- `manual_review_required`
- `reentry_required`

Nota: `blocked_by_missing_canonical_route` pertenece a frontera Runtime y no es estado operativo del Method Kernel 00.

## Fronteras de no cableado
- No diagnostica patologias EVE.
- No produce IR.
- No exporta registry.
- No ejecuta Produccion Paralela.
- No reemplaza Runtime catalog.
- No reemplaza WorkMap.
- No decide seleccion primaria.
- No reemplaza B0.
- No debe bloquear UI directa antes de evidencia suficiente.
- No debe actuar como Runtime readiness/reentry gate.

## Módulos
### `fundamentals_mmabp_rules`
Invariantes metodologicos MMABP, frontera conceptual y orden de validacion.

| ID | Modelo | Severidad | Tipo | Regla | Fuentes |
|---|---|---|---|---|---|
| `FND-001` |  | blocker | conformance | El modelo conceptual debe representar la realidad del negocio antes de contaminarse con tecnologia, organigrama o detalles individuales de implementacion. | D1:FBA:1.3.1, D1:FBA:1.3.3 |
| `FND-002` |  | blocker | conformance | La arquitectura minima debe ser pequena en modelos y elementos, pero completa, consistente, entendible y relativamente estable. | D1:FBA:1.3.3 |
| `FND-003` |  | blocker | conformance | PM, MoC, PF y OLC son vistas complementarias de una misma realidad; ninguna vista corrige a otra por autoridad. | D1:FBA:1.3.4 |
| `FND-004` |  | blocker | conformance | Primero se valida si cada modelo representa correctamente la realidad; despues se valida si los modelos no se contradicen entre si. | D1:FBA:4.1, D1:FBA:4.2 |
| `FND-005` |  | blocker | conformance | Ante inconsistencia, no se fuerza un modelo a parecer consistente; se identifica cual representacion contradice la realidad factual y se corrige. | D1:FBA:4.7 |
| `FND-006` |  | blocker | consistency | La consistencia debe distinguir hechos, secuencia temporal y estructura; mezclar estos niveles produce falsos positivos. | D1:FBA:4.2, D1:FBA:4.3, D1:FBA:4.4, D1:FBA:4.5 |
| `FND-007` |  | blocker | conformance | Si una regla, modelo, estado, evento, clase u operacion no esta sustentada por evidencia factual o fuente metodologica permitida, el kernel debe bloquear o enviar a revision manual. | D4:RUNTIME_TECH:Epistemologia explicita |
| `FND-008` |  | blocker | conformance | Toda salida estructural debe pasar por candidatos, conformance, consistencia y readiness antes de registry, IR, export o consumo por Produccion Paralela. | D4:RUNTIME_TECH:Principios no negociables, D5:RUNTIME_CATALOG:Contrato de salida |

### `pm_rules`
Reglas de conformance para Process Map.

| ID | Modelo | Severidad | Tipo | Regla | Fuentes |
|---|---|---|---|---|---|
| `PM-001` | PM | blocker | conformance | Cada proceso de negocio debe tener al menos un evento disparador y exactamente un estado objetivo. | D1:FBA:2.2.6 |
| `PM-002` | PM | blocker | conformance | El proceso se nombra por la actividad que conduce al estado objetivo. | D1:FBA:2.2.6 |
| `PM-003` | PM | blocker | conformance | Cada proceso pertenece como maximo a una funcion de negocio. | D1:FBA:2.2.6 |
| `PM-004` | PM | blocker | conformance | Las funciones de negocio no deben solaparse ni duplicar contenido. | D1:FBA:2.2.6 |
| `PM-005` | PM | blocker | conformance | Cada proceso de negocio debe cubrir el ciclo completo desde la expresion de la necesidad del cliente hasta su satisfaccion. | D1:FBA:2.2.6 |
| `PM-006` | PM | blocker | conformance | Los procesos tercerizados se incluyen en el Process Map, pero no se describen en detalle dentro del sistema modelado. | D1:FBA:2.2.6 |
| `PM-007` | PM | blocker | conformance | Los eventos se nombran como ocurrencia de un cambio significativo en el entorno del proceso: estado de objeto, estado de cosas o paso del tiempo. | D1:FBA:2.2.6 |
| `PM-008` | PM | blocker | conformance | Los estados objetivo se nombran como estados de un objeto, no como tareas, areas o deseos abstractos. | D1:FBA:2.2.6 |
| `PM-009` | PM | blocker | conformance | Si un proceso usa servicios de procesos de soporte, esos soportes deben identificarse; la identificacion continua hasta procesos soporte elementales. | D1:FBA:2.2.5, D1:FBA:2.2.6 |
| `PM-010` | PM | blocker | conformance | El Process Map captura sincronizaciones, dependencias e intencion global; no debe convertirse en diagrama de tareas ni flujo de datos. | D1:FBA:2.2 |

### `moc_rules`
Reglas de conformance para Model of Concepts.

| ID | Modelo | Severidad | Tipo | Regla | Fuentes |
|---|---|---|---|---|---|
| `MOC-001` | MoC | blocker | conformance | Toda clase se nombra conforme a lo que representa: generalizacion de objetos especificos o superclase de clases con propiedades comunes. | D1:FBA:3.1.5 |
| `MOC-002` | MoC | blocker | conformance | Aggregation o composition se usa exclusivamente cuando existe agregacion real: un objeto X esta compuesto por objetos Y. | D1:FBA:3.1.5 |
| `MOC-003` | MoC | blocker | conformance | La clasificacion de objetos en tipos se maneja por especializaciones o roles, no por un atributo 'tipo'. | D1:FBA:3.1.5 |
| `MOC-004` | MoC | blocker | conformance | La clase no contiene identificadores o llaves artificiales como atributos conceptuales. | D1:FBA:3.1.5 |
| `MOC-005` | MoC | blocker | conformance | Cada clase se caracteriza por atributos y operaciones relevantes a su contenido conceptual. | D1:FBA:3.1.5 |
| `MOC-006` | MoC | blocker | conformance | Si un objeto puede actuar en multiples roles simultaneos, se capturan roles en asociaciones; si los roles tienen atributos, se usa patron de especializaciones agregadas. | D1:FBA:3.1.5 |
| `MOC-007` | MoC | blocker | conformance | Las operaciones de clase se especifican desde evidencia, especialmente OLC del objeto y atributos/asociaciones del propio MoC. | D1:FBA:3.1.4 |
| `MOC-008` | MoC | blocker | conformance | Los estados del OLC se capturan en MoC como especializaciones con estereotipos phase para estados y end para pseudoestados finales. | D1:FBA:3.1.4 |
| `MOC-009` | MoC | blocker | conformance | Una relacion 1:N requiere operaciones que permitan adicion y remocion iterativa de elementos del contenedor. | D1:FBA:3.1.4 |
| `MOC-010` | MoC | blocker | conformance | El Model of Concepts representa clases reales y relaciones conceptuales; no debe reducirse a tabla, ID tecnico o esquema de persistencia. | D1:FBA:3.1 |

### `pf_rules`
Reglas de conformance para Process Flow.

| ID | Modelo | Severidad | Tipo | Regla | Fuentes |
|---|---|---|---|---|---|
| `PF-001` | PF | blocker | conformance | El PF contiene solo actividades intencionales del negocio modelado; actos del cliente, procesos tercerizados o entorno se representan como eventos. | D1:FBA:2.3.6 |
| `PF-002` | PF | blocker | conformance | Cada tarea se asigna a un solo estado de objeto que representa la meta de la tarea; si tiene metas alternativas, todas deben enumerarse. | D1:FBA:2.3.6 |
| `PF-003` | PF | blocker | conformance | La sincronizacion con eventos del entorno se captura como Process State donde el proceso espera eventos. | D1:FBA:2.3.6 |
| `PF-004` | PF | blocker | conformance | La conexion entre proceso soportado y soporte se captura en el detalle del proceso soportado como Process State que sincroniza mediante eventos. | D1:FBA:2.3.6 |
| `PF-005` | PF | blocker | conformance | AND, OR y XOR se usan conforme a su significado logico, incluyendo combinaciones validas de split y merge. | D1:FBA:2.3.6 |
| `PF-006` | PF | blocker | conformance | Cuando se esperan eventos ad hoc, se debe manejar la posibilidad de que no ocurran mediante evento de tiempo o deadline. | D1:FBA:2.3.6, D5:RUNTIME_CATALOG:Process_State_Timer_Gates |
| `PF-007` | PF | blocker | conformance | El nombre del evento describe de forma breve y objetiva un cambio ocurrido fuera del proceso modelado. | D1:FBA:2.3.6 |
| `PF-008` | PF | blocker | conformance | Las tareas se nombran como acciones que conducen al estado resultante del objeto asociado. | D1:FBA:2.3.6 |
| `PF-009` | PF | blocker | conformance | Para cada decision se listan las condiciones de todos los caminos posibles. | D1:FBA:2.3.6 |
| `PF-010` | PF | blocker | conformance | Cada division y union de flujo se modela usando gates, no otro mecanismo. | D1:FBA:2.3.6 |
| `PF-011` | PF | blocker | conformance | Cada proceso inicia con evento disparador o conjunto logico de eventos y todos los flujos terminan en process ends. | D1:FBA:2.3.6 |
| `PF-012` | PF | blocker | conformance | Cada detalle de process step inicia con start point y todos sus flujos terminan con fin del process step. | D1:FBA:2.3.6 |
| `PF-013` | PF | blocker | conformance | Las condiciones de la decision posterior al process step deben corresponder con el detalle del process step. | D1:FBA:2.3.6 |
| `PF-014` | PF | blocker | conformance | El detalle del process step no captura sincronizacion con el entorno mediante Process State. | D1:FBA:2.3.6 |
| `PF-015` | PF | blocker | conformance | La normalizacion del PF puede revelar procesos de soporte ocultos; si ocurre, se corrigen tanto PM como PF. | D1:FBA:2.3.5, D1:FBA:2.3.6 |
| `PF-016` | PF | blocker | conformance | El Process Flow debe modelar la algoritmia del proceso y su contexto de tarea; roles, cargos o carriles organizacionales no deben sustituir eventos, tareas, Process States ni objetos de datos. | D1:FBA:2.3.3, D1:FBA:2.3.6 |

### `olc_rules`
Reglas de conformance para Object Life Cycle.

| ID | Modelo | Severidad | Tipo | Regla | Fuentes |
|---|---|---|---|---|---|
| `OLC-001` | OLC | blocker | conformance | El OLC cubre todas las variaciones de la vida completa de un objeto, desde creacion hasta terminacion. | D1:FBA:3.2.4 |
| `OLC-002` | OLC | blocker | conformance | El OLC captura todos los estados relevantes por los que un objeto de una clase puede pasar durante su vida. | D1:FBA:3.2.4 |
| `OLC-003` | OLC | blocker | conformance | Los estados se nombran como estados del objeto unico cuyo ciclo se modela; no se mezclan estados de otros objetos. | D1:FBA:3.2.4 |
| `OLC-004` | OLC | blocker | conformance | Todas las transiciones tienen razon de transicion y operacion, donde la operacion es propiedad del objeto. | D1:FBA:3.2.4 |
| `OLC-005` | OLC | blocker | conformance | La razon de transicion es un evento o combinacion logica de eventos. | D1:FBA:3.2.4 |
| `OLC-006` | OLC | blocker | conformance | El ciclo de vida de un objeto tiene un solo comienzo. | D1:FBA:3.2.4 |
| `OLC-007` | OLC | blocker | conformance | El ciclo de vida de un objeto tiene al menos un pseudoestado final. | D1:FBA:3.2.4 |
| `OLC-008` | OLC | blocker | conformance | Desde cada estado no final debe haber al menos dos transiciones salientes. | D1:FBA:3.2.4 |
| `OLC-009` | OLC | blocker | conformance | Para cada estado no final, al menos una transicion hacia otro estado debe estar garantizada a ocurrir. | D1:FBA:3.2.4 |
| `OLC-010` | OLC | blocker | conformance | El OLC debe capturar la vida completa de la entidad, no solo su reflejo en un sistema de informacion. | D1:FBA:3.2.3 |
| `OLC-011` | OLC | blocker | conformance | No se usan simbolos de branching/merging para partir transiciones; solo transiciones directas entre estados. | D1:FBA:3.2.3 |
| `OLC-012` | OLC | blocker | conformance | La razon de una transicion debe ser un cambio en otro objeto/estado de cosas o el paso del tiempo. | D1:FBA:3.2.3 |
| `OLC-013` | OLC | blocker | conformance | La operacion especificada en la transicion debe existir como propiedad de la clase modelada. | D1:FBA:3.2.3, D1:FBA:3.2.4 |
| `OLC-014` | OLC | blocker | conformance | No se deben fusionar ciclos de vida de objetos de clases distintas en un solo OLC; el paralelismo puede revelar otro objeto. | D1:FBA:3.2.3 |
| `OLC-015` | OLC | blocker | conformance | Cada relacion 1:N del MoC debe tener representacion iterativa en el OLC del objeto correspondiente. | D1:FBA:3.2.3, D1:FBA:4.5.2 |
| `OLC-016` | OLC | blocker | conformance | Las transiciones indican cuando una operacion puede ejecutarse; si no aparece en transiciones desde un estado, no esta permitida en ese estado. | D1:FBA:3.2.3 |
| `OLC-017` | OLC | blocker | conformance | Los cambios relevantes de atributos o relaciones del objeto deben estar cubiertos por transiciones del OLC, aunque no cambien el estado fundamental. | D1:FBA:3.2.3 |

### `consistency_rules`
Reglas de consistencia factual, temporal, estructural y compuesta entre PM, MoC, PF y OLC.

| ID | Modelo | Severidad | Tipo | Regla | Fuentes |
|---|---|---|---|---|---|
| `CONS-001` | PM↔MoC | blocker | factual_consistency | Los procesos y estados objetivo del PM deben referirse a objetos, estados y conceptos existentes o justificables en el MoC. | D1:FBA:4.3.1 |
| `CONS-002` | PM↔PF | blocker | factual_consistency | El PF de un proceso debe respetar los disparadores, fines/target states y relaciones de soporte declaradas en el PM. | D1:FBA:4.3.2, D1:FBA:4.8 |
| `CONS-003` | MoC↔PF | blocker | factual_consistency | El PF debe manipular objetos, estados y operaciones coherentes con las clases y propiedades definidas en el MoC. | D1:FBA:4.3.3 |
| `CONS-004` | PF↔PF | blocker | factual_consistency | Procesos que se sincronizan entre si deben usar eventos y estados compatibles entre el proceso soportado y el proceso soporte. | D1:FBA:4.3.4, D1:FBA:4.8 |
| `CONS-005` | PF↔OLC | blocker | factual_consistency | Los estados resultantes de tareas y las operaciones invocadas en PF deben existir y ser permitidas por el OLC correspondiente. | D1:FBA:4.3.5, D1:FBA:4.4 |
| `CONS-006` | OLC↔MoC | blocker | factual_consistency | El OLC debe usar atributos, relaciones, operaciones y estados que existan o esten reflejados en el MoC. | D1:FBA:4.3.6, D1:FBA:4.5.2 |
| `CONS-007` | OLC↔OLC | blocker | factual_consistency | Si una transicion OLC refiere el estado de otro objeto, ese estado debe existir en el OLC del objeto referenciado. | D1:FBA:4.3.7 |
| `CONS-008` | PF↔OLC | blocker | temporal_consistency | La secuencia de estados impuesta por el PF no puede contradecir la secuencia causal definida en el OLC. | D1:FBA:4.4 |
| `CONS-009` | PF↔OLC | blocker | temporal_consistency | La evaluacion temporal debe comparar la sucesion event/reason -> action -> state entre PF y OLC. | D1:FBA:4.4 |
| `CONS-010` | PF↔OLC | blocker | structural_consistency | Los estados de un objeto capturados como alternativas en PF deben ser alternativas en su OLC, y viceversa. | D1:FBA:4.5.1 |
| `CONS-011` | MoC↔OLC | blocker | structural_consistency | Cada asociacion 1:N del MoC debe reflejarse como ciclo iterativo en el OLC del objeto correspondiente. | D1:FBA:4.5.2 |
| `CONS-012` | MoC↔OLC | blocker | structural_consistency | Los cambios de atributos y relaciones definidos en MoC deben estar cubiertos por operaciones y transiciones del OLC. | D1:FBA:4.5.2 |
| `CONS-013` | PM↔MoC↔PF | blocker | composite_consistency | PM, MoC y PF deben contar la misma historia factual: proceso declarado, objetos definidos y ejecucion detallada no se contradicen. | D1:FBA:4.7 |
| `CONS-014` | PM↔PF↔OLC | blocker | composite_consistency | La intencion del proceso, su ejecucion y la causalidad de los objetos deben ser temporalmente posibles. | D1:FBA:4.4 |
| `CONS-015` | PM↔MoC↔PF↔OLC | blocker | composite_consistency | Las cuatro vistas deben formar un unico modelo de sistema de negocio sin contradicciones factuales, temporales ni estructurales. | D1:FBA:4.7 |

## Changelog v0.2
- Excluye documentos internos de instrucciones como fuentes compiladas.
- Elimina referencias a documentos internos del indice de reglas.
- Elimina referencias a la tabla diagnostica y hints patologicos de la etapa 00.
- Conserva D1 como fuente metodologica primaria.
- Mantiene D4 y D5 solo como frontera de compatibilidad runtime/readiness.
- Reafirma que diagnostico EVE inicia en etapa 02, no en 00.

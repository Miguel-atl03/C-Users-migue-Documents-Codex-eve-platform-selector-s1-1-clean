<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->



## Fuentes canónicas del proyecto

Usa el documento de “Herramienta de recopilación de actividades” como fuente canónica de preguntas, numeración y opciones de respuesta.

Usa el documento de “Árbol de decisiones exhaustivo” como marco canónico de interpretación relacional, validación cruzada y explicabilidad.

Usa el documento de arquitectura cibernética como fuente canónica de diseño de plataforma, motores, contratos de datos, criterios de cierre y salidas esperadas.

## Prioridad entre documentos

Cuando exista tensión entre documentos, prioriza así:
1. Herramienta de recopilación de actividades para preguntas y opciones.
2. Arquitectura cibernética para comportamiento del sistema y diseño de plataforma.
3. Árbol de decisiones exhaustivo para reglas de inferencia, triangulación y trazabilidad diagnóstica.

## Tratamiento de la pregunta 1.2

Implementa la pregunta 1.2 (“¿A qué misión de la empresa aporta esta actividad específica?”) como un campo de clasificación funcional inferido por la plataforma, no como una pregunta obligatoria visible para el usuario en el flujo principal del cuestionario.

### Objetivo
Reducir carga cognitiva y ruido de autoclasificación del usuario, manteniendo el valor arquitectónico de la variable para MMABP, VSM y selección funcional de actividades.

### Regla general
- La plataforma debe inferir automáticamente la respuesta de 1.2 a partir de la evidencia disponible en otras respuestas.
- La clasificación inferida debe almacenarse como dato interno del sistema.
- La pregunta 1.2 no debe mostrarse inicialmente al usuario como captura manual obligatoria.
- La plataforma solo debe pedir confirmación o corrección al usuario cuando la confianza de clasificación sea media o baja, o cuando existan señales contradictorias entre respuestas.

### Campos internos requeridos
- mission_inferred_by_ai
- mission_confidence
- mission_evidence
- mission_user_confirmation_status
- mission_user_override
- mission_final

### Definiciones
- mission_inferred_by_ai: opción inferida automáticamente por el motor.
- mission_confidence: score numérico o categórico (high / medium / low).
- mission_evidence: lista de preguntas y fragmentos usados para inferir la clasificación.
- mission_user_confirmation_status: not_requested / confirmed / corrected.
- mission_user_override: opción elegida manualmente por el usuario si corrige.
- mission_final: valor final vigente para la actividad.

### Fuente de inferencia
La clasificación de 1.2 debe derivarse principalmente de:
- 1.1 verbo y descripción de la actividad
- 1.3 rol o propósito final
- 2.1 objeto o resultado del trabajo
- 3.1 evento disparador
- 3.3 receptor o proceso que espera el resultado
- 3.4 quién nota la ausencia de la actividad
- 2.6 destino de largo plazo del objeto
- 2.9 dependencia / integración en un proceso mayor

### Regla de inferencia
- Si la evidencia apunta claramente a una sola misión, asignar mission_inferred_by_ai y marcar confidence = high.
- Si la evidencia compite entre dos misiones cercanas, marcar confidence = medium.
- Si la evidencia es insuficiente, ambigua o contradictoria, marcar confidence = low.

### Política de interacción
- Si confidence = high:
  - no mostrar la pregunta 1.2 al usuario;
  - guardar el valor inferido como mission_final;
  - registrar la trazabilidad de evidencia.
- Si confidence = medium:
  - mostrar una confirmación breve al usuario:
    “Detectamos que esta actividad probablemente aporta a: [misión inferida]. ¿Es correcto?”
  - permitir confirmación o corrección.
- Si confidence = low:
  - mostrar al usuario una versión corta de selección asistida de misión;
  - registrar el valor confirmado como mission_final.

### Regla de trazabilidad
Toda clasificación de 1.2 debe ser explicable. El sistema debe poder devolver:
- qué preguntas sirvieron de evidencia;
- qué regla produjo la clasificación;
- si el usuario la confirmó o corrigió.

### Regla de prioridad
- mission_final = mission_user_override, si existe.
- En caso contrario, mission_final = mission_inferred_by_ai.

### Uso arquitectónico
La variable mission_final debe seguir utilizándose en:
- mapeo funcional del Process Map
- priorización y selección de actividades
- inferencia de rol sistémico complementaria para VSM
- lectura de contexto de cadena de valor

Pero no debe tratarse como evidencia primaria de experiencia vivida del usuario.

### Restricción
No usar 1.2 como única fuente para clasificar S1, S2, S3, S4 o S5.
Debe funcionar como señal de contexto funcional, no como determinante exclusivo del rol regulatorio.

### Regla de consistencia
Si mission_final contradice fuertemente otras respuestas estructurales, generar alerta de inconsistencia funcional y reabrir confirmación.

### Ejemplos de inconsistencia funcional
- misión inferida de “investigar, inventar o mejorar para el futuro”, pero frecuencia diaria y carga transaccional dominante de ejecución operativa;
- misión inferida de “revisar que las cosas se hagan bien o sin riesgos”, pero el objeto, trigger y receptor muestran transformación directa de un entregable operativo;
- misión inferida de “entregar al cliente o hacer que funcione”, pero el resultado real se archiva y nadie downstream lo consume.

### Resultado esperado
La plataforma debe tratar la pregunta 1.2 como clasificación funcional asistida por IA con validación condicional, no como captura manual primaria.

## Cálculo de mission_confidence para la pregunta 1.2

Implementa un mecanismo explícito de scoring para calcular el campo mission_confidence de la clasificación funcional inferida por IA.

### Objetivo
Determinar si la clasificación inferida de la misión de la actividad puede aceptarse automáticamente, requiere confirmación ligera, o debe abrirse al usuario para corrección manual.

### Escala requerida
- high
- medium
- low

### Preguntas fuente con peso
- 1.1 verbo y descripción de la actividad
- 1.3 rol o propósito final
- 2.1 objeto o resultado del trabajo
- 2.6 destino de largo plazo del objeto
- 2.9 dependencia / integración en proceso mayor
- 3.1 evento disparador
- 3.3 receptor o proceso que espera el resultado
- 3.4 quién nota la ausencia de la actividad

### Tabla de pesos sugerida
- 1.1 = 0.20
- 1.3 = 0.15
- 2.1 = 0.15
- 2.6 = 0.10
- 2.9 = 0.10
- 3.1 = 0.10
- 3.3 = 0.10
- 3.4 = 0.10

### Regla de scoring
1. Para cada fuente, estimar la misión más probable entre las opciones canónicas de 1.2.
2. Sumar el peso de cada fuente que apunte a la misma misión dominante.
3. Restar o penalizar cuando haya conflicto fuerte entre fuentes.
4. Seleccionar como mission_inferred_by_ai la misión con mayor puntaje acumulado.

### Campos internos adicionales
- mission_score_by_option
- mission_conflict_flags
- mission_confidence_reason

### Definiciones
- mission_score_by_option: mapa de puntajes por cada opción de misión.
- mission_conflict_flags: lista de conflictos detectados entre fuentes.
- mission_confidence_reason: explicación resumida del resultado del confidence.

### Regla de clasificación del confidence
- high si:
  - una opción obtiene >= 0.70 del puntaje útil total, y
  - no existen contradicciones estructurales fuertes.
- medium si:
  - la misión dominante obtiene entre 0.45 y 0.69, o
  - existe una segunda misión cercana, o
  - hay una contradicción menor.
- low si:
  - ninguna misión supera 0.45, o
  - hay conflicto fuerte entre fuentes, o
  - faltan varias fuentes clave.

### Conflictos fuertes que reducen confidence
- 1.3 sugiere diseño futuro / monitoreo / control, pero 1.1 + 2.1 + 3.3 describen transformación operativa directa.
- 2.6 indica archivo o destrucción, pero la misión inferida apunta a entrega final al cliente.
- 2.9 indica que el resultado es insumo intermedio, pero 3.4 indica que el cliente final sería el primero en notar la ausencia.
- 3.4 indica “nadie se daría cuenta”, pero la misión inferida corresponde a una actividad central de venta, entrega o servicio al cliente.
- 1.1 describe revisión / auditoría / aprobación, pero la misión inferida es fabricación o entrega final.

### Conflictos moderados
- mezcla entre misión de soporte y misión operativa.
- mezcla entre coordinación / control y ejecución final.
- evidencia incompleta en 2.1, 2.9 o 3.3.

### Regla de desempate
Si dos misiones quedan cercanas en puntaje:
1. priorizar la que mejor coincida con 2.1 + 2.6 + 3.3;
2. si persiste empate, priorizar la que mejor represente la transformación efectiva del objeto;
3. si persiste empate, marcar mission_confidence = medium y pedir confirmación al usuario.

### Regla de aceptación automática
Si mission_confidence == high:
- no preguntar 1.2 al usuario
- guardar mission_final = mission_inferred_by_ai
- registrar evidencia y razón del confidence

### Regla de confirmación ligera
Si mission_confidence == medium:
- mostrar al usuario una confirmación corta
- permitir aceptar o corregir
- guardar resultado en mission_final

### Regla de apertura manual
Si mission_confidence == low:
- mostrar selección guiada al usuario con las opciones canónicas de 1.2
- registrar mission_user_override
- guardar resultado en mission_final

### Formato de salida esperado
- mission_inferred_by_ai: <option_id>
- mission_score_by_option: {option_id: score}
- mission_conflict_flags: [list]
- mission_confidence: high | medium | low
- mission_confidence_reason: <string>
- mission_user_confirmation_status: not_requested | confirmed | corrected
- mission_user_override: <option_id|null>
- mission_final: <option_id>

### Ejemplo de salida
```json id="9pue91"
{
  "mission_inferred_by_ai": 2,
  "mission_score_by_option": {
    "1": 0.05,
    "2": 0.74,
    "3": 0.11,
    "4": 0.00,
    "5": 0.00,
    "6": 0.00,
    "7": 0.06,
    "8": 0.02,
    "9": 0.02
  },
  "mission_conflict_flags": [],
  "mission_confidence": "high",
  "mission_confidence_reason": "La actividad, el objeto, el receptor y el destino del resultado apuntan consistentemente a transformación operativa del entregable.",
  "mission_user_confirmation_status": "not_requested",
  "mission_user_override": null,
  "mission_final": 2
}
## Selección de actividades soporte para cierre recursivo

Implementa un submotor específico para seleccionar actividades soporte cuando las actividades principales ya contestadas no logren cerrar suficientemente la cadena recursiva del rol funcional.

### Objetivo
Seleccionar la actividad soporte mínima necesaria para cerrar una brecha estructural específica en MMABP, VSM, AHE o en la cadena recursiva completa, evitando redundancia.

### Principio rector
La plataforma no debe seleccionar actividades soporte por volumen, frecuencia o criticidad aislada.  
Debe seleccionarlas por **aporte marginal al cierre arquitectónico**.

La pregunta guía del submotor debe ser:
**“¿Qué actividad adicional, si se interroga con la herramienta completa, aporta la pieza faltante para cerrar la arquitectura del rol?”**

### Regla general
- Primero, la plataforma debe intentar cerrar la arquitectura del rol funcional usando solo las actividades principales ya interrogadas.
- Después debe ejecutar el motor de cierre.
- Solo si el motor detecta brechas abiertas, se activa el submotor de selección de actividades soporte.
- La plataforma debe elegir la actividad soporte con mayor capacidad de cerrar la brecha abierta con la menor redundancia respecto a las actividades ya modeladas.

### Entradas requeridas
- lista de actividades principales ya contestadas
- lista de actividades soporte disponibles
- brechas abiertas del motor de cierre
- cobertura actual por MMABP
- cobertura actual por VSM
- cobertura actual por AHE
- relaciones ya capturadas en la cadena recursiva
- señales semánticas de cada actividad soporte candidata

### Salidas requeridas
- support_activity_selected
- support_activity_selection_reason
- support_activity_expected_gap_closure
- support_activity_redundancy_score
- support_activity_marginal_closure_score

### Definiciones
- support_activity_selected: actividad soporte elegida por el sistema.
- support_activity_selection_reason: explicación breve de por qué fue seleccionada.
- support_activity_expected_gap_closure: lista de brechas que la actividad probablemente ayudará a cerrar.
- support_activity_redundancy_score: medida de qué tanto repite estructuras ya modeladas.
- support_activity_marginal_closure_score: medida del valor esperado de cierre arquitectónico adicional.

### Regla de activación
El submotor de selección de actividades soporte solo debe activarse si:
- recursive_chain_closed == false
o
- existen gaps estructurales abiertos en MMABP, VSM o AHE.

### Regla de puntuación
Cada actividad soporte candidata debe recibir un score compuesto por cinco dimensiones:

1. **Cobertura de brecha MMABP**
   - ¿La actividad aporta objeto, estado, trigger, receptor, sincronización, excepción o relación que hoy faltan?

2. **Cobertura regulatoria VSM**
   - ¿La actividad hace visible S1, S2, S3, S3*, S4, S5 o canal algedónico que hoy no aparecen o aparecen débilmente?

3. **Cobertura AHE**
   - ¿La actividad expone tensiones intrapersonales, interpersonales u organizacionales no suficientemente trazadas?

4. **Conectividad recursiva**
   - ¿La actividad conecta un eslabón roto entre actividad, objeto, dependencia, coordinación, comportamiento y tensión?

5. **No redundancia**
   - ¿La actividad aporta variedad nueva o solo repite una estructura ya suficientemente observada?

### Score sugerido
Calcular:

support_activity_marginal_closure_score =
(
  mmabp_gap_coverage_score * 0.30 +
  vsm_gap_coverage_score * 0.25 +
  ahe_gap_coverage_score * 0.15 +
  recursive_connectivity_score * 0.20 +
  anti_redundancy_score * 0.10
)

### Regla de interpretación del score
- score alto: actividad muy recomendable como siguiente actividad soporte.
- score medio: actividad útil, pero no óptima.
- score bajo: actividad redundante o de poco valor de cierre.

### Regla de priorización por tipo de brecha

#### Si falta MoC ↔ OLC
Priorizar actividades donde el objeto cambie realmente de estado.

#### Si falta PM ↔ PF / sincronización
Priorizar actividades con espera, handoff, dependencia fuerte o recepción/entrega entre áreas.

#### Si falta S3
Priorizar actividades de revisión, validación, aprobación, firma, autorización o control.

#### Si falta S3*
Priorizar actividades donde aparezcan error, corrección, observación, auditoría real o verdad no filtrada.

#### Si falta S4
Priorizar actividades de mejora, rediseño, adaptación o respuesta a cambios externos.

#### Si falta S5
Priorizar actividades donde aparezcan sacrificio, trade-off, límite identitario o conflicto entre valor y presión.

#### Si falta canal algedónico
Priorizar actividades donde algo falle, se haga visible, se escale o genere dolor sistémico.

#### Si falta AHE interpersonal
Priorizar actividades con handoff, persecución de insumos, coordinación lateral o conflicto entre áreas.

#### Si falta AHE organizacional
Priorizar actividades donde se revelen KPIs en conflicto, arbitrariedad, shadow systems o relación con poder estructural.

### Regla de no redundancia
La plataforma debe penalizar actividades soporte que:
- repitan el mismo objeto principal ya bien modelado,
- repitan el mismo patrón de trigger y receptor ya suficientemente cubierto,
- no agreguen nuevas funciones regulatorias,
- no agreguen nuevas tensiones o sacrificios,
- no aumenten la conectividad recursiva del modelo.

### Regla de mínima intervención
La plataforma debe seleccionar la menor cantidad posible de actividades soporte necesarias para lograr cierre suficiente.

No debe incorporar actividades soporte por exhaustividad descriptiva.
Debe incorporarlas solo por necesidad arquitectónica explícita.

### Regla de reintento
Después de que el usuario conteste la actividad soporte seleccionada:
- volver a correr el motor de cierre,
- verificar si la brecha esperada realmente se cerró,
- solo si persisten gaps, seleccionar la siguiente actividad soporte.

### Regla de explicación
Cada selección de actividad soporte debe ser explicable.

La plataforma debe poder mostrar:
- qué brecha estaba abierta,
- por qué la actividad seleccionada ayuda a cerrarla,
- qué otra actividad fue descartada por redundante o menos útil,
- qué se espera aprender de la nueva actividad.

### Regla de salida esperada
El sistema debe generar una salida como esta:

- support_activity_selected: <actividad>
- support_activity_selection_reason: <texto>
- support_activity_expected_gap_closure: [lista de gaps]
- support_activity_redundancy_score: <número o nivel>
- support_activity_marginal_closure_score: <número>
- support_activity_status: selected | answered | validated | discarded

### Ejemplos de selección correcta
- Si ya existen varias actividades de elaboración pero no aparece aprobación ni firma, seleccionar una actividad de validación o autorización.
- Si ya existe ejecución y coordinación, pero no aparece cómo se corrigen errores, seleccionar una actividad de revisión o corrección.
- Si ya existe flujo operativo, pero no aparece sacrificio ni trade-off, seleccionar una actividad donde haya presión, urgencia o conflicto de prioridades.
- Si ya existen objetos y estados, pero no aparece handoff real, seleccionar una actividad de entrega, recepción o seguimiento inter-áreas.

### Restricción importante
No seleccionar una actividad soporte solo porque:
- consume muchas horas,
- ocurre todos los días,
- parece importante políticamente,
- o tiene alta criticidad superficial.

Eso puede ser útil para priorización operativa, pero no para cierre arquitectónico.

### Resultado esperado
La plataforma debe seleccionar actividades soporte por **valor de cierre estructural marginal**, no por volumen ni prominencia aparente.

## Orquestación automática de actividades soporte en el flujo de levantamiento

Implementa la incorporación de actividades soporte como una **decisión interna de la plataforma**, no como una acción de selección del usuario.

### Principio rector
La clasificación y selección de actividades soporte pertenece al sistema, no al usuario.

El usuario no debe:
- decidir cuál actividad soporte agregar,
- ver la lógica interna de selección,
- elegir entre actividades soporte candidatas,
- ni interactuar con controles tipo “Agregar soporte al cuestionario”.

La plataforma sí debe:
- detectar internamente si las actividades principales ya contestadas son suficientes,
- seleccionar la mejor actividad soporte cuando exista una brecha abierta,
- incorporarla automáticamente al flujo de preguntas,
- y notificar al usuario únicamente que se requiere información adicional para completar correctamente el levantamiento.

### Regla de experiencia de usuario
El usuario solo debe experimentar esto como:
- “terminaste las actividades principales”;
- “se requiere una actividad adicional para completar la recopilación de información”;
- “se abre el cuestionario guiado de esa actividad adicional”.

La interfaz no debe exponer explícitamente:
- el concepto de actividad soporte como decisión del usuario,
- la lógica de selección interna,
- ni el detalle arquitectónico de la brecha detectada, salvo que se requiera para trazabilidad administrativa interna.

### Flujo operativo obligatorio

1. El usuario responde las actividades principales.
2. La plataforma corre el motor de cierre.
3. Si la cadena cierra, termina el levantamiento.
4. Si no cierra, el submotor selecciona internamente la mejor actividad soporte.
5. La plataforma notifica al usuario que se requiere una actividad adicional.
6. La interfaz abre el cuestionario guiado de esa actividad soporte.
7. Al guardar, se recalcula el diagnóstico.
8. Si la brecha cierra, termina.
9. Si no cierra, la plataforma selecciona internamente la siguiente actividad soporte.

### Regla de activación del cuestionario de soporte
La actividad soporte seleccionada debe entrar automáticamente al embudo de preguntas sin requerir confirmación del usuario sobre cuál actividad se agregará.

La plataforma debe:
- crear internamente el registro de la actividad soporte seleccionada,
- marcarla como `support_activity_status = selected`,
- agregarla al conjunto de actividades a responder,
- abrirla directamente en el modo de preguntas guiadas,
- y continuar el circuito de cierre después de la respuesta.

### Regla de notificación al usuario
La notificación al usuario debe enfocarse en necesidad de información adicional, no en arquitectura interna.

Ejemplos válidos de mensaje:
- “Hemos terminado las actividades principales. Para completar correctamente la recopilación de información, necesitamos una actividad adicional.”
- “Necesitamos un poco más de información sobre una actividad adicional para completar el levantamiento.”
- “Se requiere responder una actividad adicional para cerrar la recopilación de información.”

Ejemplos no válidos:
- “Selecciona una actividad soporte”
- “Agrega una actividad soporte al cuestionario”
- “Elige cuál actividad cierra la brecha”
- “Selecciona manualmente la siguiente actividad”

### Restricción de interfaz
No implementar botones, menús o acciones del usuario con esta semántica:
- Agregar soporte al cuestionario
- Seleccionar actividad soporte
- Elegir actividad adicional candidata
- Confirmar la recomendación del submotor

La incorporación de la actividad soporte debe ejecutarse automáticamente por la plataforma.

### Regla de separación de responsabilidades
Responsabilidad del usuario:
- describir sus actividades reales cuando el flujo lo solicite;
- responder el cuestionario de las actividades que la plataforma le presente.

Responsabilidad de la plataforma:
- seleccionar actividades principales;
- correr motor de cierre;
- detectar brechas;
- seleccionar internamente la mejor actividad soporte;
- incorporarla automáticamente al flujo;
- recalcular diagnóstico y cierre después de cada nueva respuesta.

### Estados requeridos del flujo
Implementar estados explícitos para controlar el circuito:

- intake_main_activities
- questionnaire_main
- closure_check
- support_activity_selected_internal
- support_activity_questionnaire
- closure_recheck
- intake_completed

### Transiciones obligatorias

- `intake_main_activities -> questionnaire_main`
- `questionnaire_main -> closure_check`
- `closure_check -> intake_completed` si `recursive_chain_closed == true`
- `closure_check -> support_activity_selected_internal` si `recursive_chain_closed == false`
- `support_activity_selected_internal -> support_activity_questionnaire`
- `support_activity_questionnaire -> closure_recheck`
- `closure_recheck -> intake_completed` si `recursive_chain_closed == true`
- `closure_recheck -> support_activity_selected_internal` si persisten gaps

### Regla de persistencia
Cada actividad soporte incorporada automáticamente debe quedar registrada con trazabilidad completa:

- support_activity_selected
- support_activity_selection_reason
- support_activity_expected_gap_closure
- support_activity_marginal_closure_score
- support_activity_redundancy_score
- support_activity_status
- support_activity_iteration_number

### Regla de iteración
La plataforma puede incorporar más de una actividad soporte, pero solo una por ciclo de cierre.

Secuencia correcta:
- seleccionar una actividad soporte,
- mostrarla al usuario,
- recibir respuesta,
- recalcular cierre,
- decidir si hace falta otra.

No seleccionar múltiples actividades soporte simultáneamente salvo que se implemente explícitamente un modo batch, lo cual no debe ser el comportamiento por defecto.

### Regla de cierre del circuito
El submotor de actividades soporte no debe quedar como recomendación pasiva.

Debe convertirse en mecanismo operativo completo:
- detecta gap,
- selecciona actividad,
- la incorpora al flujo,
- obtiene respuesta,
- recalcula diagnóstico,
- y decide si termina o continúa.

### Regla de trazabilidad interna
Aunque la lógica no debe exponerse al usuario final, el sistema sí debe poder registrar internamente:
- qué gap estaba abierto,
- por qué se eligió esa actividad soporte,
- qué se esperaba cerrar,
- si efectivamente cerró la brecha,
- y si fue necesario continuar con otra actividad soporte.

### Resultado esperado
La incorporación de actividades soporte debe funcionar como una **orquestación automática del sistema** y no como una recomendación interactiva que dependa de decisión manual del usuario.

## Capa de consistencia antes de cierre y micro-aclaraciones en lenguaje de trinchera

Implementa una capa obligatoria de verificación de consistencia antes de declarar cerrada una actividad.

### Principio rector
La plataforma no debe confundir:
- respuestas completas,
con
- cierre arquitectónico válido.

Una actividad puede tener todas las preguntas contestadas y aun así no estar suficientemente cerrada si sus respuestas contienen contradicciones relevantes o una estructura difícil de interpretar.

### Regla general
Antes de marcar una actividad como cerrada, suficientemente explicada o completa, la plataforma debe ejecutar una capa de análisis de consistencia.

Esta capa debe:
- detectar contradicciones,
- clasificar su severidad,
- decidir si la actividad puede cerrar,
- decidir si debe cerrar con alerta,
- o decidir si debe abrir una micro-aclaración antes del cierre.

### Niveles de contradicción

#### 1. Contradicción leve o moderada
La actividad puede seguir avanzando y puede cerrarse si sigue siendo suficientemente entendible, pero el sistema debe registrar una alerta visible en el diagnóstico.

Ejemplos:
- mezcla leve entre ejecución y soporte;
- tensión menor entre misión inferida y destino del resultado;
- ambigüedad moderada entre actividad final e insumo intermedio.

Resultado esperado:
- cerrar permitido;
- estado de cierre con alerta;
- observación visible en diagnóstico.

#### 2. Contradicción importante
La actividad no debe cerrar como “completamente explicada” o equivalente.

Debe bajar a un estado como:
- requiere aclaración;
- cierre parcial;
- actividad entendible, pero inconsistente;
- cierre incompleto por inconsistencia.

Resultado esperado:
- no marcar 100%;
- mostrar observación concreta;
- dejar trazabilidad de la inconsistencia.

#### 3. Contradicción crítica
La plataforma debe abrir una micro-pregunta de aclaración antes de cerrar el levantamiento de esa actividad.

Resultado esperado:
- suspender cierre pleno;
- generar micro-aclaración contextual;
- registrar respuesta de aclaración;
- recalcular consistencia después de responder.

### Regla de consistencia antes de cierre
Toda actividad debe pasar por estas verificaciones antes de que el sistema la declare como cerrada:

- consistencia entre misión inferida y función real del resultado;
- consistencia entre rol declarado y naturaleza de la actividad;
- consistencia entre destino del resultado y posición real en la cadena;
- consistencia entre dependencia, coordinación y tipo de transformación;
- consistencia entre objeto, estados y flujo;
- consistencia entre actividad ejecutada y función organizacional inferida.

### Ejemplos de contradicción estructural
Detectar como mínimo contradicciones como estas:

- misión inferida = “crear, fabricar o armar lo que vendemos”, pero destino del resultado = “insumo para otro proceso”;
- misión inferida operativa, pero rol declarado = coordinación o revisión;
- resultado descrito como archivo o preparación intermedia, pero misión inferida = entrega final al cliente;
- verbo de ejecución, pero estructura real de la actividad corresponde más a soporte, validación o habilitación;
- trigger, receptor y destino muestran flujo intermedio, pero clasificación funcional sugiere cierre final.

### Salidas obligatorias de la capa de consistencia
Implementar campos internos como mínimo:

- consistency_check_status
- consistency_alert_level
- consistency_alerts
- closure_quality_status
- clarification_required
- clarification_prompt
- clarification_reason
- clarification_response
- consistency_recheck_status

### Definiciones
- consistency_check_status: passed | warning | failed
- consistency_alert_level: low | medium | high | critical
- consistency_alerts: lista de tensiones o contradicciones detectadas
- closure_quality_status: solid | sufficient_with_alerts | partial_requires_clarification | blocked_by_critical_contradiction
- clarification_required: true | false
- clarification_prompt: texto de micro-aclaración a mostrar
- clarification_reason: explicación interna de por qué se abrió la aclaración
- clarification_response: respuesta del usuario a la micro-aclaración
- consistency_recheck_status: pending | passed | unresolved

### Reglas de decisión

#### Si la contradicción es leve o moderada
- permitir continuar;
- permitir cierre si la actividad sigue siendo inteligible;
- registrar alerta diagnóstica;
- closure_quality_status = sufficient_with_alerts

#### Si la contradicción es importante
- no marcar cierre total ni 100%;
- closure_quality_status = partial_requires_clarification
- mostrar observación concreta;
- permitir aclaración posterior o inmediata según el flujo

#### Si la contradicción es crítica
- clarification_required = true
- abrir micro-aclaración antes del cierre final
- closure_quality_status = blocked_by_critical_contradiction

### Regla de UX para micro-aclaraciones
Toda micro-aclaración debe escribirse en lenguaje de trinchera y debe incluir obligatoriamente tres capas:

1. **Comentario de trinchera**
2. **Aterrizaje explícito**
3. **Ejemplo contextualizado**
4. **Pregunta corta de aclaración**

### Estructura obligatoria de redacción
Toda micro-aclaración debe seguir esta plantilla:

- Comentario de trinchera
- “A lo que me refiero es…”
- “Por ejemplo…”
- Pregunta breve de aclaración

### Regla de lenguaje
La plataforma debe usar lenguaje cercano, concreto y no técnico frente al usuario.

No usar en interfaz frases como:
- inconsistencia PM ∩ MoC
- tensión entre target state y función downstream
- contradicción entre clasificación funcional y OLC

Sí usar frases como:
- “Nos está saliendo cruzada esta actividad.”
- “Aquí hay una mezcla que no nos termina de cerrar.”
- “Nos falta una precisión para entender bien esta actividad.”
- “Con lo que respondiste, no queda claro si esto lo produces tú o si más bien lo preparas para otra área.”

### Regla de aterrizaje explícito
Después del comentario de trinchera, la plataforma debe agregar siempre una frase que empiece con:

- “A lo que me refiero es…”
o equivalente cercano.

Esta frase debe explicar de forma simple qué contradicción detectó el sistema.

### Regla de ejemplo contextualizado
Después del aterrizaje explícito, la plataforma debe agregar siempre una frase que empiece con:

- “Por ejemplo…”

Esta frase debe usar elementos de la actividad real del usuario, como:
- verbo,
- objeto,
- receptor,
- destino del resultado,
- tipo de rol,
- o punto de contradicción detectado.

No debe ser un ejemplo genérico. Debe ser un ejemplo construido con el contexto de esa actividad específica.

### Ejemplo de micro-aclaración correcta
“Nos está saliendo cruzada esta actividad.  
A lo que me refiero es: parece que aquí haces una parte operativa, pero también suena a que preparas algo para que otra área siga.  
Por ejemplo: si tú elaboras un documento, pero ese documento todavía pasa a revisión, firma o integración en otro proceso, entonces quizá esta actividad no es el cierre final, sino una actividad intermedia o de soporte.  
¿Cuál describe mejor esta actividad en la realidad?”

### Ejemplo alterno
“Aquí hay una mezcla que no nos termina de cerrar.  
A lo que me refiero es: la actividad parece de creación, pero el resultado que describes suena más a insumo para otro proceso.  
Por ejemplo: si haces una propuesta, pero esa propuesta todavía pasa a revisión, comité o autorización antes de convertirse en algo final, entonces quizá esta actividad no crea el resultado final, sino que habilita el siguiente paso.  
¿Qué representa mejor lo que haces?”

### Regla de no frustración cognitiva
No mostrar comentarios de trinchera aislados sin aterrizaje ni ejemplo.

Toda aclaración debe ayudar al usuario a entender exactamente:
- qué vio raro la plataforma,
- por qué lo vio raro,
- y qué tipo de precisión necesita.

### Regla de minimización
Las micro-aclaraciones deben ser cortas y quirúrgicas.
No convertirlas en una nueva entrevista ni en una pregunta larga.

La meta es:
- resolver una contradicción puntual,
- no abrir un nuevo bloque completo de levantamiento.

### Regla de recalculo
Después de que el usuario responda la micro-aclaración:
- volver a ejecutar la capa de consistencia;
- actualizar closure_quality_status;
- decidir si la actividad ya puede cerrar o sigue abierta.

### Regla de diagnóstico
El diagnóstico final no debe decir solamente:
- “no se detectaron contradicciones”
o
- “actividad cerrada”

Debe mostrar también:
- calidad del cierre;
- alertas de consistencia detectadas;
- si hubo aclaración adicional;
- si el cierre fue sólido, suficiente con alertas, parcial o bloqueado.

### Estados esperados de cierre de actividad
Implementar como mínimo estos estados:

- closed_solid
- closed_with_consistency_alerts
- partial_requires_clarification
- blocked_by_critical_contradiction

### Resultado esperado
EVE debe incorporar una capa de consistencia antes de cierre y una capa de micro-aclaraciones en lenguaje de trinchera, con aterrizaje explícito y ejemplo contextualizado, para evitar cierres falsos, reducir frustración cognitiva y mejorar la calidad arquitectónica del levantamiento.

## Mejora controlada y propuestas de optimización arquitectónica

Codex puede detectar oportunidades de mejora arquitectónica, lógica, técnica o de experiencia de usuario mientras implementa el sistema.

### Principio rector
Codex no debe ejecutar automáticamente mejoras no solicitadas que cambien el alcance funcional, la arquitectura o el comportamiento principal del sistema.

Sí puede:
- detectar puntos de mejora,
- explicarlos,
- justificar por qué convienen,
- y proponerlos de forma estructurada.

Pero solo debe implementarlos si el usuario los aprueba explícitamente.

### Regla general
Cuando Codex detecte una mejora relevante durante una tarea, debe clasificarla en una de estas categorías:

- mejora necesaria para cumplir correctamente el objetivo actual
- mejora recomendable pero no indispensable
- mejora futura / backlog

### Comportamiento esperado

#### 1. Si la mejora es necesaria para cumplir correctamente el objetivo actual
Codex debe:
- explicarlo antes de implementar;
- decir por qué el diseño actual no cierra bien sin esa mejora;
- indicar qué archivos tocaría;
- pedir aprobación antes de cambiar el alcance.

#### 2. Si la mejora es recomendable pero no indispensable
Codex debe:
- no implementarla automáticamente;
- registrarla como propuesta;
- presentarla al final o al inicio de la tarea como sugerencia opcional.

#### 3. Si la mejora corresponde a backlog o evolución futura
Codex debe:
- no implementarla;
- reportarla como recomendación futura;
- dejarla fuera del cambio actual.

### Formato obligatorio de propuesta de mejora
Toda mejora detectada por Codex debe presentarse con esta estructura:

- improvement_type
- improvement_title
- improvement_reason
- architectural_impact
- files_likely_affected
- implementation_risk
- requires_user_approval
- recommended_now_or_later

### Definiciones
- improvement_type: necessary_now | recommended_optional | future_backlog
- improvement_title: nombre corto de la mejora
- improvement_reason: por qué conviene o por qué hace falta
- architectural_impact: qué cambia en lógica, flujo, datos o UX
- files_likely_affected: archivos probables a modificar
- implementation_risk: low | medium | high
- requires_user_approval: true | false
- recommended_now_or_later: now | later

### Restricción importante
Codex no debe usar la detección de mejoras como pretexto para expandir indefinidamente el alcance de una tarea.

Debe mantenerse enfocado en el objetivo pedido y solo proponer mejoras cuando:
- afecten la corrección del diseño,
- reduzcan contradicciones,
- mejoren claramente la arquitectura,
- o eviten retrabajo importante posterior.

### Regla de aprobación
Si la mejora cambia:
- el flujo del usuario,
- la arquitectura de datos,
- los criterios de cierre,
- la lógica del motor,
- o la interpretación de la herramienta,

Codex debe pedir aprobación explícita antes de implementarla.

### Regla de autonomía limitada
Codex sí puede hacer sin pedir permiso:
- pequeños ajustes internos de código;
- refactors menores locales;
- nombres, tipados o helpers auxiliares necesarios para completar la tarea actual;
siempre que no cambien el comportamiento funcional esperado.

### Resultado esperado
Codex debe comportarse como un colaborador técnico con criterio:
- ve oportunidades de mejora,
- las expone con claridad,
- y solo las implementa si el usuario las aprueba cuando cambian alcance o arquitectura.

# EVE Agent Rules

## Product identity
EVE is not a generic form or survey tool.  
It is a structured diagnostic capture system designed to reconstruct real operational work, preserve the semantic logic of the collection instrument, and produce auditable outputs that can be used downstream in systemic diagnosis and final consulting deliverables.

## Visual and product concept (canonical)
For lienzo oficial UI work (`eve-official-canvas`), use **`docs/eve/visual/EVE_CONCEPTO_PRODUCTO_FINAL.md`** (and homologous `.docx`) as the design guide: product promise, sensation, **Hoja de trabajo monumental** concept, Instrumento pattern, visual grammar, tone, anti-patterns, and screen checklist. Do not use discarded mockups or parallel explorations as implementation reference.

## Core design principle
When implementing any export, reconstruction, or structured output:
- preserve the original semantic structure of the collection instrument;
- prioritize auditability and traceability over presentation polish;
- never invent missing information;
- keep outputs usable for consultant review and downstream diagnostic transduction.

## Source of truth
- Supabase is the source of truth for all session data.
- All outputs must be reproducible from `sessionId`.
- Session reconstruction must rely on persisted data, not transient frontend state.

## Session-aware behavior
EVE operates through a real session lifecycle.  
Any implementation touching capture, closure, export, or reconstruction must respect the actual session flow and states already used by the product.

Current operational states:
- `intake_main_activities`
- `questionnaire_main`
- `closure_check`
- `support_activity_selected_internal`
- `support_activity_questionnaire`
- `closure_recheck`
- `micro_clarification`
- `intake_completed`

## Existing product logic must be preserved
The system already decides internally:
- which activities are main;
- which support activity to request;
- whether closure is sufficient;
- whether contradictions are severe;
- whether additional support is needed.

Do not redesign this logic unless explicitly asked.
Do not expose to the user decisions that are already internally determined by EVE.

## Export principles
When generating Excel outputs:
- reuse the real Excel template whenever possible;
- do not redesign or reinterpret the collection instrument unless explicitly requested;
- preserve workbook structure, sheet names, section logic, column order, grouping, and semantic organization;
- treat the Excel export as a reconstruction of the capture process, not as a new report format.

## Data provenance
Whenever feasible, exported information should preserve or expose provenance.  
Distinguish clearly between:
- user-captured data;
- system-inferred data;
- clarification-derived data;
- closure or session metadata.

If the original template has no explicit place for provenance, add it conservatively in a complementary sheet or controlled metadata area rather than deforming the instrument.

## Missing data policy
- Never fabricate answers.
- If a field cannot be reconstructed from session data, leave it blank or use a consistent explicit marker such as `PENDIENTE` or `NO CAPTURADO`, according to the feature specification.
- Prefer conservative emptiness over false completeness.

## Mapping discipline
Every export or reconstruction feature must define an explicit mapping between:
- source data in Supabase / session model,
- transformation or inference logic,
- destination workbook sheet / section / field.

Opaque “magic” mapping is discouraged.
Prefer explicit, inspectable, configuration-driven mappings whenever practical.

## Architecture constraints
- Respect the existing Next.js + TypeScript + Supabase architecture.
- Integrate with the current session lifecycle and closure logic.
- Prefer clean service-layer implementations over embedding export logic into UI components.
- Avoid brittle hardcoded logic if configuration-based mapping is possible.

## Quality threshold
A feature is considered correct only if the output is:
- semantically faithful to the original instrument;
- auditable response by response;
- reproducible by `sessionId`;
- useful for consultant review;
- useful as input for the final client deliverable.

## Preferred implementation pattern
For export-related work, prefer this layered structure:
1. session data consolidation;
2. field provenance resolution;
3. mapping into template semantics;
4. workbook population;
5. delivery through API / server action / UI trigger.

## Change discipline
If there is ambiguity between the current data model and the historical template:
- resolve it explicitly;
- document assumptions;
- choose the most conservative and traceable interpretation;
- favor fidelity to the instrument over cosmetic convenience.

## Deliverable expectation
For non-trivial implementation tasks, provide:
- code changes;
- explicit mapping documentation;
- assumptions made;
- fields that could not be mapped directly;
- risks or gaps for future iterations.
/**
 * Bloque 4 (Cadena causal y normalización del flujo) — Madre-direct copy.
 *
 * Authority hierarchy (methodology):
 * 1) Madre B4 docx SHA B4DAB985…87C6
 * 2) semantics / options / help / clarifications (Madre fichas; Matrix slots as QA)
 * 3) Matriz SHA 5DC4E7A8…1059 (control families / interactions; NOT copy override)
 * 4) UI Instrumento shell
 *
 * Madre wins question/label/help wording. Matrix wins control-family QA mapping.
 */

export type B4SourceCode =
  | "4.1"
  | "4.2"
  | "4.3"
  | "4.4"
  | "4.5"
  | "4.5b"
  | "4.6"
  | "4.6b"
  | "4.7"
  | "4.7b"
  | "4.8"
  | "4.9"
  | "4.9b"
  | "4.10"
  | "4.10b"
  | "4.11"
  | "4.12"
  | "4.13"
  | "4.A"
  | "4.B"
  | "4.C"
;

export const B4_MADRE_QUESTION_TEXT: Record<B4SourceCode, string> = {
  "4.1": "Antes de poder iniciar esta actividad, ¿qué TIENE que haber ocurrido o qué insumo TIENE que estar listo?",
  "4.2": "Si esta actividad no se terminara hoy, ¿quién o qué quedaría detenido o no podría avanzar?",
  "4.3": "En la realidad, ¿cuánto tiempo típicamente PASA entre que terminas esta actividad y que el siguiente paso puede iniciarse?",
  "4.4": "¿Hay un momento específico (fecha, hora, día de la semana, frecuencia) que gatilla que esta actividad DEBA iniciarse?",
  "4.5": "¿Hay un escenario donde esta actividad podría quedarse BLOQUEADA esperando algo que nunca llega o que se olvidan de enviar?",
  "4.5b": "Cuando esto ocurre, ¿quién típicamente lo resuelve?",
  "4.6": "¿Esta actividad se repite múltiples veces en un ciclo?",
  "4.6b": "¿Haces todas las repeticiones de una vez o las intercalas con otras actividades?",
  "4.7": "¿Hay decisiones o puntos donde el proceso puede tomar DIFERENTES CAMINOS según la situación?",
  "4.7b": "¿Cuántos caminos diferentes hay típicamente?",
  "4.8": "Mientras tú estás haciendo esta actividad, ¿qué está pasando en paralelo?",
  "4.9": "¿Hay pasos que TÚ haces pero que NO están \"en el manual\" o que \"no deberían ser necesarios\"?",
  "4.9b": "¿Por qué haces esos pasos extras?",
  "4.10": "¿El orden en que REALMENTE haces las cosas es diferente al orden que dice el proceso?",
  "4.10b": "¿Por qué cambias el orden?",
  "4.11": "Cuando esta actividad se bloquea o se retrasa más de lo normal, ¿qué se rompe primero?",
  "4.12": "¿Hay un punto específico donde esta actividad TÍPICAMENTE se atasca o se retrasa?",
  "4.13": "¿Con qué frecuencia el flujo de esta actividad NO funciona como debería (bloqueos, cambios de orden, workarounds)?",
  "4.A": "Lo que respondiste sobre lo que tiene que estar listo antes o quién queda detenido después todavía está muy general. ¿Cuál es el ejemplo más concreto que mejor lo muestra?",
  "4.B": "Mencionaste pasos extras o cambio de orden, pero todavía no se ve bien qué pasa en la práctica. ¿Cuál es el caso típico más claro?",
  "4.C": "Veo señales de bloqueo, caminos alternativos o paralelismo, pero todavía no se entiende bien cómo se conectan. ¿Cuál sería la situación típica más representativa?",
};

export const B4_MADRE_SHORT_LABEL: Record<B4SourceCode, string> = {
  "4.1": "Dependencia previa crítica",
  "4.2": "Dependencia posterior crítica",
  "4.3": "Espera típica",
  "4.4": "Evento de tiempo",
  "4.5": "Deadlock potencial",
  "4.5b": "Quién resuelve el bloqueo",
  "4.6": "Iteración",
  "4.6b": "Modo de repetición",
  "4.7": "Rutas alternativas",
  "4.7b": "Cantidad de caminos",
  "4.8": "Paralelismo",
  "4.9": "Pasos extra",
  "4.9b": "Razón de pasos extra",
  "4.10": "Orden real vs oficial",
  "4.10b": "Razón del cambio de orden",
  "4.11": "Impacto del bloqueo",
  "4.12": "Cuello de botella",
  "4.13": "Frecuencia de desviaciones",
  "4.A": "Aclarar dependencia",
  "4.B": "Aclarar workaround",
  "4.C": "Aclarar flujo no lineal",
};

export const B4_MADRE_HELP_TEXT: Record<B4SourceCode, string> = {
  "4.1": "Marca todo lo que de verdad tenga que estar listo antes de empezar. Si hace falta, agrega un detalle concreto en texto abierto.",
  "4.2": "Piensa en quién se queda esperando de verdad si esto no termina. Puede ser un equipo, un sistema, un cliente o incluso tu propio siguiente paso.",
  "4.3": "Responde según lo que ocurre normalmente en la práctica, incluyendo esperas por revisión, aprobación o disponibilidad.",
  "4.4": "Marca la opción más cercana. Si depende de otra condición temporal específica, usa Otro y descríbela.",
  "4.5": "Piensa en bloqueos reales, no solo retrasos menores. La pregunta busca saber si el proceso puede quedar esperando indefinidamente o casi.",
  "4.5b": "Elige quién termina destrabando el proceso en la práctica. Si hace falta, especifica en texto abierto.",
  "4.6": "Piensa si dentro de un mismo ciclo haces esta actividad una sola vez o varias veces seguidas / repetidas.",
  "4.6b": "La pregunta no mide cantidad, sino patrón de ejecución: lote, intercalado o variable.",
  "4.7": "Marca las fuentes principales de variación de ruta. Si ninguna aplica, marca que siempre es el mismo camino.",
  "4.7b": "Elige la opción que mejor represente la diversidad típica de rutas.",
  "4.8": "Elige la descripción más cercana al patrón real de simultaneidad o dependencia, puede pasar en tu área o en otra área.",
  "4.9": "Piensa en verificaciones, correcciones, búsquedas o ajustes que haces para que el flujo funcione, aunque no estén formalmente en el proceso.",
  "4.9b": "Elige la razón más cercana. Si hace falta, especifica en texto abierto.",
  "4.10": "Responde según lo que haces en la práctica, no según el procedimiento ideal.",
  "4.10b": "Elige la razón principal. Si hace falta, agrega detalle.",
  "4.11": "Selecciona los primeros impactos observables cuando el flujo se atasca o se atrasa.",
  "4.12": "Marca el cuello de botella más típico. Si no está en la lista, elige Otro y descríbelo.",
  "4.13": "Piensa en la frecuencia real con la que el proceso se sale de su forma esperada.",
  "4.A": "Necesitamos un ejemplo puntual para que la dependencia no quede demasiado abstracta. Ejemplo: Antes: El cliente debe confirmar su dirección en el formulario. Después: Si no confirma, yo no puedo generar la etiqueta de envío y el repartidor se queda esperando",
  "4.B": "Queremos un ejemplo concreto del paso extra o del cambio de orden que mejor muestre la desviación real. Ejemplo: El procedimiento dice que debo esperar aprobación del jefe. Pero el jefe tarda días. Así que empiezo el trabajo sin aprobación y le aviso después",
  "4.C": "Describe la situación típica que mejor muestre el bloqueo, la espera mutua, el camino alternativo o la simultaneidad. Ejemplo: Normalmente preparo el pedido y espero a que el repartidor lo recoja. Pero a veces el repartidor no llega y yo tengo que guardar el pedido en refrigeración. Mientras espero, sigo preparando otros pedidos. Si el repartidor llega tarde, tengo que recalentar el pedido. Si no llega en todo el día, tengo que cancelarlo",
};

export const B4_MADRE_VISIBILITY_RULE: Record<B4SourceCode, string> = {
  "4.1": "Siempre visible al iniciar el bloque.",
  "4.2": "Siempre.",
  "4.3": "Siempre.",
  "4.4": "Siempre.",
  "4.5": "Siempre.",
  "4.5b": "Solo si 4.5 ≠ No.",
  "4.6": "Siempre.",
  "4.6b": "Solo si 4.6 ≠ una sola vez.",
  "4.7": "Siempre.",
  "4.7b": "Solo si 4.7 ≠ No, siempre es el mismo camino.",
  "4.8": "Siempre.",
  "4.9": "Siempre.",
  "4.9b": "Solo si 4.9 = Sí.",
  "4.10": "Siempre.",
  "4.10b": "Solo si 4.10 = Sí.",
  "4.11": "Siempre.",
  "4.12": "Siempre.",
  "4.13": "Siempre.",
  "4.A": "Por flag.",
  "4.B": "Por flag.",
  "4.C": "Por flag.",
};

export type B4MadreOption = { option_id: string; option_label: string };

export const B4_MADRE_OPTIONS: Partial<Record<B4SourceCode, readonly B4MadreOption[]>> = {
  "4.1": [
    { option_id: "una_aprobacion_o_autorizacion_de_alguien", option_label: "Una aprobación o autorización de alguien" },
    { option_id: "informacion_o_datos_de_otro_equipo", option_label: "Información o datos de otro equipo" },
    { option_id: "completacion_de_una_actividad_previa", option_label: "Completación de una actividad previa" },
    { option_id: "un_evento_externo", option_label: "Un evento externo" },
    { option_id: "un_sistema_o_herramienta_disponible", option_label: "Un sistema o herramienta disponible" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "4.2": [
    { option_id: "otro_equipo_o_area", option_label: "Otro equipo o área" },
    { option_id: "un_cliente", option_label: "Un cliente" },
    { option_id: "un_proceso_automatico_o_sistema", option_label: "Un proceso automático o sistema" },
    { option_id: "mi_propio_siguiente_paso", option_label: "Mi propio siguiente paso" },
    { option_id: "varias_personas_equipos_al_mismo_tiempo", option_label: "Varias personas/equipos al mismo tiempo" },
    { option_id: "nadie_de_inmediato_pero_se_acumula_despues", option_label: "Nadie de inmediato, pero se acumula después" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "4.3": [
    { option_id: "inmediato_sin_espera", option_label: "Inmediato (sin espera)" },
    { option_id: "horas", option_label: "Horas" },
    { option_id: "un_dia", option_label: "Un día" },
    { option_id: "varios_dias_2_5", option_label: "Varios días (2-5)" },
    { option_id: "una_semana_o_mas", option_label: "Una semana o más" },
  ],
  "4.4": [
    { option_id: "no_se_inicia_cuando_llega_el_insumo_o_se_lo_pide", option_label: "No, se inicia cuando llega el insumo o se lo pide alguien" },
    { option_id: "si_cada_dia_a_una_hora_especifica", option_label: "Sí, cada día a una hora específica" },
    { option_id: "si_cada_semana_en_un_dia_especifico", option_label: "Sí, cada semana en un día específico" },
    { option_id: "si_cada_mes_en_una_fecha_especifica", option_label: "Sí, cada mes en una fecha específica" },
    { option_id: "si_cuando_vence_un_plazo_o_sla", option_label: "Sí, cuando vence un plazo o SLA" },
    { option_id: "si_cuando_se_cumple_una_condicion_de_tiempo", option_label: "Sí, cuando se cumple una condición de tiempo" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "4.5": [
    { option_id: "no_hay_un_timeout_o_alguien_se_da_cuenta_si_se_r", option_label: "No, hay un timeout o alguien se da cuenta si se retrasa" },
    { option_id: "si_a_veces_queda_bloqueada_y_tengo_que_ir_a_preg", option_label: "Sí, a veces queda bloqueada y tengo que ir a preguntar" },
    { option_id: "si_frecuentemente_queda_bloqueada_y_nadie_se_da_", option_label: "Sí, frecuentemente queda bloqueada y nadie se da cuenta" },
    { option_id: "si_hay_momentos_donde_el_sistema_se_queda_en_un_", option_label: "Sí, hay momentos donde el sistema se queda en un ciclo infinito" },
  ],
  "4.5b": [
    { option_id: "yo_mismo", option_label: "Yo mismo" },
    { option_id: "mi_jefe_interviene", option_label: "Mi jefe interviene" },
    { option_id: "alguien_de_otro_equipo_se_da_cuenta", option_label: "Alguien de otro equipo se da cuenta" },
    { option_id: "nadie_simplemente_se_atrasa_todo", option_label: "Nadie, simplemente se atrasa todo" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "4.6": [
    { option_id: "no_se_hace_una_sola_vez", option_label: "No, se hace una sola vez" },
    { option_id: "si_pero_el_numero_de_repeticiones_varia_mucho", option_label: "Sí, pero el número de repeticiones varía mucho" },
    { option_id: "si_tipicamente_se_repite_2_5_veces", option_label: "Sí, típicamente se repite 2-5 veces" },
    { option_id: "si_tipicamente_se_repite_6_20_veces", option_label: "Sí, típicamente se repite 6-20 veces" },
    { option_id: "si_tipicamente_se_repite_mas_de_20_veces", option_label: "Sí, típicamente se repite más de 20 veces" },
  ],
  "4.6b": [
    { option_id: "todas_de_una_vez_un_lote", option_label: "Todas de una vez (un lote)" },
    { option_id: "las_intercalo_una_luego_otra_cosa_luego_otra", option_label: "Las intercalo (una, luego otra cosa, luego otra)" },
    { option_id: "depende_del_dia_o_la_urgencia", option_label: "Depende del día o la urgencia" },
  ],
  "4.7": [
    { option_id: "si_segun_el_tipo_de_cliente_o_proyecto", option_label: "Sí, según el tipo de cliente o proyecto" },
    { option_id: "si_segun_el_monto_o_importancia", option_label: "Sí, según el monto o importancia" },
    { option_id: "si_segun_si_hay_errores_o_excepciones", option_label: "Sí, según si hay errores o excepciones" },
    { option_id: "si_segun_una_decision_de_mi_jefe", option_label: "Sí, según una decisión de mi jefe" },
    { option_id: "si_segun_una_regla_o_politica", option_label: "Sí, según una regla o política" },
    { option_id: "no_siempre_es_el_mismo_camino", option_label: "No, siempre es el mismo camino" },
  ],
  "4.7b": [
    { option_id: "2_opciones", option_label: "2 opciones" },
    { option_id: "3_4_opciones", option_label: "3-4 opciones" },
    { option_id: "mas_de_4_opciones", option_label: "Más de 4 opciones" },
    { option_id: "depende_puede_haber_muchas_combinaciones", option_label: "Depende, puede haber muchas combinaciones" },
  ],
  "4.8": [
    { option_id: "nada_corre_en_paralelo", option_label: "Nada corre en paralelo" },
    { option_id: "todo_espera_este_paso", option_label: "todo espera este paso" },
    { option_id: "otras_actividades_avanzan_pero_independientes_de", option_label: "Otras actividades avanzan, pero independientes de esta" },
    { option_id: "otras_actividades_avanzan_en_paralelo_y_luego_se", option_label: "Otras actividades avanzan en paralelo y luego se integran con esta" },
    { option_id: "yo_sigo_con_otros_temas_mientras_esta_queda_en_e", option_label: "Yo sigo con otros temas mientras esta queda en espera" },
    { option_id: "hay_dependencias_cruzadas_entre_equipos_y_a_vece", option_label: "Hay dependencias cruzadas entre equipos y a veces terminamos esperándonos mutuamente" },
  ],
  "4.9": [
    { option_id: "no_sigo_exactamente_lo_que_dice_el_proceso", option_label: "No, sigo exactamente lo que dice el proceso" },
    { option_id: "si_hay_pasos_que_hago_para_que_funcione", option_label: "Sí, hay pasos que hago para que funcione" },
  ],
  "4.9b": [
    { option_id: "porque_si_no_lo_hago_los_siguientes_pasos_fallan", option_label: "Porque si no lo hago, los siguientes pasos fallan" },
    { option_id: "porque_el_sistema_no_funciona_bien_sin_ellos", option_label: "Porque el sistema no funciona bien sin ellos" },
    { option_id: "porque_hay_errores_que_tengo_que_corregir", option_label: "Porque hay errores que tengo que corregir" },
    { option_id: "porque_nadie_mas_lo_hace_y_alguien_tiene_que_hac", option_label: "Porque nadie más lo hace y alguien tiene que hacerlo" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "4.10": [
    { option_id: "no_hago_todo_en_el_orden_que_dice_el_proceso", option_label: "No, hago todo en el orden que dice el proceso" },
    { option_id: "si_hay_pasos_que_hago_en_diferente_orden", option_label: "Sí, hay pasos que hago en diferente orden" },
  ],
  "4.10b": [
    { option_id: "porque_es_mas_eficiente_asi", option_label: "Porque es más eficiente así" },
    { option_id: "porque_el_siguiente_paso_no_esta_listo_asi_que_h", option_label: "Porque el siguiente paso no está listo, así que hago otro primero" },
    { option_id: "porque_hay_una_urgencia_que_me_obliga_a_cambiar_", option_label: "Porque hay una urgencia que me obliga a cambiar el orden" },
    { option_id: "porque_el_proceso_oficial_no_funciona_en_la_prac", option_label: "Porque el proceso oficial no funciona en la práctica" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "4.11": [
    { option_id: "se_detiene_el_trabajo_de_otros_equipos", option_label: "Se detiene el trabajo de otros equipos" },
    { option_id: "el_cliente_espera_reclama_o_se_molesta", option_label: "El cliente espera, reclama o se molesta" },
    { option_id: "se_pierde_tiempo_buscando_persiguiendo_o_reexpli", option_label: "Se pierde tiempo buscando, persiguiendo o reexplicando" },
    { option_id: "se_acumula_trabajo_pendiente", option_label: "Se acumula trabajo pendiente" },
    { option_id: "mi_jefe_o_direccion_intervienen", option_label: "Mi jefe o dirección intervienen" },
    { option_id: "el_sistema_o_proceso_siguiente_se_bloquea", option_label: "El sistema o proceso siguiente se bloquea" },
    { option_id: "hay_costo_economico_o_penalizacion", option_label: "Hay costo económico o penalización" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "4.12": [
    { option_id: "no_hay_cuellos_de_botella_significativos", option_label: "No hay cuellos de botella significativos" },
    { option_id: "esperar_aprobacion_o_firma_de_alguien", option_label: "Esperar aprobación o firma de alguien" },
    { option_id: "esperar_informacion_de_otro_equipo", option_label: "Esperar información de otro equipo" },
    { option_id: "sistema_lento_o_caido", option_label: "Sistema lento o caído" },
    { option_id: "falta_de_personal_o_exceso_de_carga", option_label: "Falta de personal o exceso de carga" },
    { option_id: "cambios_constantes_en_lo_que_me_piden", option_label: "Cambios constantes en lo que me piden" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "4.13": [
    { option_id: "casi_nunca_el_proceso_funciona_bien", option_label: "Casi nunca (el proceso funciona bien)" },
    { option_id: "ocasionalmente_algunas_veces_al_mes", option_label: "Ocasionalmente (algunas veces al mes)" },
    { option_id: "frecuentemente_varias_veces_a_la_semana", option_label: "Frecuentemente (varias veces a la semana)" },
    { option_id: "constantemente_es_la_forma_normal_de_trabajar", option_label: "Constantemente (es la forma normal de trabajar)" },
  ],
};

export const B4_BLOCK_META = {
  block: "4" as const,
  canonical_name: "Cadena causal y normalización del flujo",
  mother_question:
    "¿Cómo fluye de verdad esta memoria operativa y dónde se bloquea, espera, rebota o cambia de camino?",
  purpose:
    "Reconstruir secuencia real, dependencias, esperas, eventos de tiempo, loops, alternativas, paralelismos, workarounds de flujo y desviaciones entre proceso oficial y proceso vivido.",
  frame_line:
    "Ahora miramos cómo fluye de verdad esta actividad: dependencias, esperas, bloqueos y desviaciones.",
  sequential_context:
    "Después del Bloque 3 (salida/receptor) y antes del Bloque 5 (capacidad). Puede requerir reentrada breve a B3 si el handoff quedó ambiguo — Runtime decide; UI no secuencia.",
  madre_docx_sha256:
    "B4DAB985A18B32383FC8BB968CC41CAB2781BBB50F9D53AF834CB40D182D87C6",
  matrix_sha256:
    "5DC4E7A833A2EB5FE6977D290DDBEA855743AF2E9D167245B5B55BB7C1ED1059",
} as const;

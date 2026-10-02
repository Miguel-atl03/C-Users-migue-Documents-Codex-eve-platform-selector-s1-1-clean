/**
 * Fichas canónicas Bloque 0.5 — lógica interna (no dump UI).
 * Fuente: Bloque_0_5_Documento_Madre_Capa1_v2_1_EVE (extracción tramo2).
 *
 * Uso:
 * - branching / visibility / variables / provenance / riesgo
 * - decidir qué mostrar al usuario y con qué control
 * La hoja NO presenta la ficha completa; solo pregunta + help + control.
 */

export type Block05QuestionCode =
  | "0.5.1"
  | "0.5.1a"
  | "0.5.1_rel"
  | "0.5.1b"
  | "0.5.1c"
  | "0.5.1d"
  | "0.5.2"
  | "0.5.3"
  | "0.5.4"
  | "0.5.4a"
  | "0.5.A"
  | "0.5.B"
  | "0.5.C";

export type Block05FieldType =
  | "single_choice"
  | "free_text"
  | "hybrid_choice_text"
  | "clarification";

export type Block05AnswerMode = "single_choice" | "free_text" | "clarification";

export type Block05AllowsFreeText = "no" | "yes" | "conditional";

export type Block05Option = {
  id: string;
  label: string;
};

export type Block05Ficha = {
  question_code: Block05QuestionCode;
  block_id: "0.5";
  canonical_question_text: string;
  short_ui_label: string;
  help_text: string;
  ui_answer_mode_label: "cerrada" | "libre guiada" | "aclarada";
  field_type: Block05FieldType;
  answer_mode: Block05AnswerMode;
  allows_free_text: Block05AllowsFreeText;
  free_text_condition: string | null;
  /** Catálogo dinámico declarado por ficha; null si opciones estáticas. */
  source_options: string | null;
  fallback_options: readonly string[];
  /** Opciones estáticas o fallback presentables (ids estables). */
  options: readonly Block05Option[];
  generated_from: string;
  user_can_edit_generated: boolean;
  required_rule: string;
  visibility_rule: string;
  branching_rule: string;
  canonical_variable_output: string;
  provenance_type: string;
  stored_in: string;
  used_by: string;
  risk_if_missing: string;
  /** Runtime 40/20 que esta ficha integra (lógica sistémica). */
  runtime_interaction_ids: readonly string[];
  /** Norte sistémico legible (nunca jerga en UI). */
  systemic_north:
    | "cliente_funcional"
    | "proceso_contenedor"
    | "hito_habilitador"
    | "prioridad_regulatoria"
    | "aclaracion";
  visibility: "always" | "after_dyad" | "conditional" | "flag_only";
};

function opt(id: string, label: string): Block05Option {
  return { id, label };
}

/** Fallback actor/área mientras no haya company_role_catalog / company_area_catalog. */
const ACTOR_OPTIONS: readonly Block05Option[] = [
  opt("mi_area", "Mi propia área"),
  opt("otra_area", "Otra área interna"),
  opt("mi_jefe", "Mi jefe o dirección"),
  opt("cliente_interno", "Un cliente interno"),
  opt("cliente_externo", "Cliente externo"),
  opt("proveedor", "Un proveedor"),
  opt("otro", "Otro (especificar)"),
];

const PROCESS_OPTIONS: readonly Block05Option[] = [
  opt("rrhh", "Recursos Humanos"),
  opt("finanzas", "Finanzas"),
  opt("compras", "Compras"),
  opt("ventas", "Ventas"),
  opt("atencion", "Atención al cliente"),
  opt("produccion", "Producción"),
  opt("otro", "Otro (especificar)"),
  opt("no_seguro", "No estoy seguro"),
];

const CLARITY_OPTIONS: readonly Block05Option[] = [
  opt("muy_claro", "Muy claro"),
  opt("mas_o_menos", "Más o menos claro"),
  opt("poco_claro", "Poco claro"),
  opt("no_claro", "No lo tengo claro"),
];

const PRIORITY_OPTIONS: readonly Block05Option[] = [
  opt("jefe", "Mi jefe directo"),
  opt("sistema", "Un sistema o ticket"),
  opt("cliente", "El cliente lo exige"),
  opt("yo", "Yo mismo"),
  opt("politica", "Un comité o política"),
  opt("otro", "Otro (especificar)"),
];

const PRIORITY_DISPLACEMENT_OPTIONS: readonly Block05Option[] = [
  ...PRIORITY_OPTIONS,
  opt("casi_nunca", "Casi nunca me desplazan"),
];

const REL_OPTIONS: readonly Block05Option[] = [
  opt("mismo", "Es el mismo actor"),
  opt("distintos", "Son actores distintos"),
  opt("no_seguro", "No estoy seguro"),
];

export const BLOCK05_FICHAS: readonly Block05Ficha[] = [
  {
    question_code: "0.5.1",
    block_id: "0.5",
    canonical_question_text:
      "Independientemente de a quién le entregues tu trabajo directamente, ¿quién es la persona, área o actor que finalmente se beneficia si esta actividad sale bien?",
    short_ui_label: "Quién se beneficia al final",
    help_text:
      "No pienses primero en quién recibe tu entregable inmediato, sino en quién obtiene valor real cuando esto funciona. Puede ser otra área, un cliente interno, un cliente externo o un actor más lejano en la cadena. Ejemplo: tú entregas a tesorería, pero quien finalmente se beneficia puede ser el proveedor porque recibe pago a tiempo.",
    ui_answer_mode_label: "cerrada",
    field_type: "single_choice",
    answer_mode: "single_choice",
    allows_free_text: "conditional",
    free_text_condition: "selected_option = Otro",
    source_options: "company_role_catalog / company_area_catalog",
    fallback_options: ["Cliente externo", "Otro (especificar)"],
    options: ACTOR_OPTIONS,
    generated_from: "No aplica",
    user_can_edit_generated: true,
    required_rule:
      "Obligatoria para toda escena profunda y abreviada que pase por Bloque 0.5",
    visibility_rule: "Siempre",
    branching_rule:
      "Después de responder 0.5.1 y 0.5.1a, activar 0.5.1_rel. Si la opción es Otro, abrir campo libre.",
    canonical_variable_output:
      "beneficiario_final_0_5_1 + scene_functional_client (derivable)",
    provenance_type: "capturado (captured_user_evidence)",
    stored_in: "scene_question_answers + scene_block_derivations",
    used_by:
      "PM, consolidación del cliente funcional, consistencia con Bloque 3, lectura preliminar VSM y Capa 2",
    risk_if_missing:
      "La escena queda sin conexión explícita con el valor que produce en el sistema y se vuelve fácil confundirla con una tarea autosuficiente.",
    runtime_interaction_ids: ["B05-Q05"],
    systemic_north: "cliente_funcional",
    visibility: "always",
  },
  {
    question_code: "0.5.1a",
    block_id: "0.5",
    canonical_question_text:
      "¿quién es la persona, área o actor que finalmente sufre si esta actividad sale mal o no sale?",
    short_ui_label: "Quién sufre si falla",
    help_text:
      "Aquí no preguntamos quién se entera primero ni quién te reclama primero, sino quién absorbe realmente el daño cuando la actividad falla o no ocurre. Ejemplo: si tú entregas a un jefe, pero quien sufre de verdad es el cliente final porque el servicio se retrasa, eso es lo que importa aquí.",
    ui_answer_mode_label: "cerrada",
    field_type: "single_choice",
    answer_mode: "single_choice",
    allows_free_text: "conditional",
    free_text_condition: "selected_option = Otro",
    source_options: "company_role_catalog / company_area_catalog",
    fallback_options: ["Cliente externo", "Otro (especificar)"],
    options: ACTOR_OPTIONS,
    generated_from: "No aplica",
    user_can_edit_generated: true,
    required_rule: "Obligatoria",
    visibility_rule: "Siempre",
    branching_rule:
      "Después de 0.5.1a y 0.5.1, activar 0.5.1_rel. Si la opción es Otro, abrir campo libre.",
    canonical_variable_output: "afectado_final_0_5_1a",
    provenance_type: "capturado (captured_user_evidence)",
    stored_in: "scene_question_answers + scene_block_derivations",
    used_by:
      "PM, lectura de impacto sistémico, consistencia con Bloque 4 y transducción causal posterior",
    risk_if_missing:
      "Se pierde la posibilidad de distinguir creación de valor de absorción de daño, y eso aplana la escena de una forma metodológicamente peligrosa.",
    runtime_interaction_ids: ["B05-Q05"],
    systemic_north: "cliente_funcional",
    visibility: "always",
  },
  {
    question_code: "0.5.1_rel",
    block_id: "0.5",
    canonical_question_text:
      "¿El que se beneficia cuando esto sale bien y el que sufre cuando esto sale mal son el mismo actor o son distintos?",
    short_ui_label: "Relación valor/daño",
    help_text:
      "Esta pregunta no busca sofisticar de más; busca hacer visible una diferencia que en muchas organizaciones sí existe. A veces la misma área gana cuando sale bien y pierde cuando sale mal. A veces no. Y cuando no coincide, conviene dejarlo explícito.",
    ui_answer_mode_label: "cerrada",
    field_type: "single_choice",
    answer_mode: "single_choice",
    allows_free_text: "no",
    free_text_condition: null,
    source_options: null,
    fallback_options: [],
    options: REL_OPTIONS,
    generated_from:
      "Se apoya en las respuestas previas 0.5.1 y 0.5.1a, pero la confirmación es capturada del usuario.",
    user_can_edit_generated: true,
    required_rule: "Obligatoria, una vez capturados 0.5.1 y 0.5.1a",
    visibility_rule: "Siempre después de 0.5.1 y 0.5.1a",
    branching_rule:
      "Si respuesta = Son actores distintos, activar 0.5.1b. Si respuesta = No estoy seguro, habilitar posible aclaración 0.5.A en chequeo de consistencia.",
    canonical_variable_output: "relacion_beneficiario_afectado_0_5_1_rel",
    provenance_type: "capturado (captured_user_evidence)",
    stored_in: "scene_question_answers + scene_block_derivations",
    used_by: "consistencia interna del bloque, calidad epistemológica y reglas de aclaración",
    risk_if_missing:
      "Queda sin explicitar una diferencia estructural relevante entre quién recibe el valor y quién absorbe el daño.",
    runtime_interaction_ids: ["B05-Q05"],
    systemic_north: "cliente_funcional",
    visibility: "after_dyad",
  },
  {
    question_code: "0.5.1b",
    block_id: "0.5",
    canonical_question_text:
      "Si son distintos, ¿quién recibe primero el beneficio y quién absorbe primero el daño cuando falla?",
    short_ui_label: "Asimetría entre valor y daño",
    help_text:
      "Describe brevemente cómo se reparte esa diferencia. No hace falta escribir mucho. Basta con dejar claro qué actor recibe primero el valor y qué actor siente primero el daño. Ejemplo: 'Finanzas recibe primero el beneficio porque puede cerrar el pago; el proveedor absorbe primero el daño cuando el pago no se libera'.",
    ui_answer_mode_label: "libre guiada",
    field_type: "free_text",
    answer_mode: "free_text",
    allows_free_text: "no",
    free_text_condition: null,
    source_options: null,
    fallback_options: [],
    options: [],
    generated_from:
      "Se genera como necesidad de aclaración a partir de 0.5.1_rel = Son actores distintos",
    user_can_edit_generated: true,
    required_rule: "Condicional",
    visibility_rule: "Solo si 0.5.1_rel = Son actores distintos",
    branching_rule:
      "Si la respuesta sigue confundiendo actor inmediato con actor final, sugerir 0.5.A en postvalidación.",
    canonical_variable_output: "beneficio_vs_dano_distribucion_0_5_1b",
    provenance_type: "capturado / aclarado (clarification)",
    stored_in:
      "scene_question_answers + scene_clarifications + scene_block_derivations",
    used_by:
      "lectura de desplazamiento del costo dentro del sistema, Capa 2 y narrativa estructural posterior",
    risk_if_missing:
      "Cuando valor y daño no coinciden, la escena queda simplificada en exceso y se pierde un desplazamiento sistémico importante.",
    runtime_interaction_ids: ["B05-Q05", "C02"],
    systemic_north: "cliente_funcional",
    visibility: "conditional",
  },
  {
    question_code: "0.5.1c",
    block_id: "0.5",
    canonical_question_text:
      "¿Qué tan claro tienes quién se beneficia realmente de que esta actividad salga bien?",
    short_ui_label: "Claridad sobre beneficiario",
    help_text:
      "No responde sobre la empresa; responde sobre tu claridad al verla. Si lo tienes totalmente claro, selecciónalo. Si solo lo supones o te cuesta ubicarlo, también es válido decirlo.",
    ui_answer_mode_label: "cerrada",
    field_type: "single_choice",
    answer_mode: "single_choice",
    allows_free_text: "no",
    free_text_condition: null,
    source_options: null,
    fallback_options: [],
    options: CLARITY_OPTIONS,
    generated_from: "No aplica",
    user_can_edit_generated: true,
    required_rule: "Obligatoria",
    visibility_rule: "Siempre",
    branching_rule:
      "Si respuesta = Poco claro o No lo tengo claro, elevar peso de flag para posible 0.5.A y bajar scene_frame_confidence.",
    canonical_variable_output: "claridad_beneficiario_0_5_1c",
    provenance_type: "captured_user_self_assessment",
    stored_in:
      "scene_question_answers + scene_block_derivations + scene_consistency_flags",
    used_by: "readiness, confianza del encuadre y decisiones de aclaración",
    risk_if_missing:
      "El sistema no puede distinguir ausencia de problema de ausencia de claridad.",
    runtime_interaction_ids: ["B05-Q05"],
    systemic_north: "cliente_funcional",
    visibility: "always",
  },
  {
    question_code: "0.5.1d",
    block_id: "0.5",
    canonical_question_text: "¿Y tienes claro quién sufre si esta actividad sale mal?",
    short_ui_label: "Claridad sobre afectado",
    help_text:
      "Aquí también importa tu nivel de claridad, no una respuesta 'correcta'. Si sospechas pero no lo ves del todo claro, conviene registrarlo; ese borde borroso también dice algo del sistema.",
    ui_answer_mode_label: "cerrada",
    field_type: "single_choice",
    answer_mode: "single_choice",
    allows_free_text: "no",
    free_text_condition: null,
    source_options: null,
    fallback_options: [],
    options: CLARITY_OPTIONS,
    generated_from: "No aplica",
    user_can_edit_generated: true,
    required_rule: "Obligatoria",
    visibility_rule: "Siempre",
    branching_rule:
      "Si respuesta = Poco claro o No lo tengo claro, elevar peso de flag para posible 0.5.A y bajar scene_frame_confidence.",
    canonical_variable_output: "claridad_afectado_0_5_1d",
    provenance_type: "captured_user_self_assessment",
    stored_in:
      "scene_question_answers + scene_block_derivations + scene_consistency_flags",
    used_by: "readiness, consistencia y control de sobreconfianza del expediente",
    risk_if_missing:
      "Se pierde una señal importante sobre la calidad epistemológica de la respuesta.",
    runtime_interaction_ids: ["B05-Q05"],
    systemic_north: "cliente_funcional",
    visibility: "always",
  },
  {
    question_code: "0.5.2",
    block_id: "0.5",
    canonical_question_text: "¿A qué gran proceso de la empresa pertenece esta actividad?",
    short_ui_label: "Proceso al que pertenece",
    help_text:
      "Piensa en el proceso más grande dentro del cual esta actividad tiene sentido. No nombres tu tarea; nombra el proceso contenedor. Ejemplos: Recursos Humanos, Finanzas, Compras, Ventas, Atención al cliente, Producción. Si haces nómina, probablemente pertenece a Recursos Humanos; si validas facturas, probablemente a Finanzas o Compras, según el caso.",
    ui_answer_mode_label: "cerrada",
    field_type: "single_choice",
    answer_mode: "single_choice",
    allows_free_text: "conditional",
    free_text_condition: "selected_option = Otro",
    source_options: "company_process_catalog",
    fallback_options: ["Otro (especificar)", "No estoy seguro"],
    options: PROCESS_OPTIONS,
    generated_from: "No aplica",
    user_can_edit_generated: true,
    required_rule: "Obligatoria",
    visibility_rule: "Siempre",
    branching_rule:
      "Si respuesta = Otro, abrir especificación. Si respuesta = No estoy seguro o es excesivamente local/genérica, considerar 0.5.B.",
    canonical_variable_output: "scene_macro_process",
    provenance_type: "capturado (captured_user_evidence)",
    stored_in:
      "scene_question_answers + scene_block_derivations + scene_registry",
    used_by:
      "PM, segmentación de escenas, distinción preliminar entre S1 y soporte/metasistema y transducción causal",
    risk_if_missing:
      "La escena queda sin proceso contenedor y se dificulta toda lectura de cadena de valor o relación con unidades operativas.",
    runtime_interaction_ids: ["B05-Q06"],
    systemic_north: "proceso_contenedor",
    visibility: "always",
  },
  {
    question_code: "0.5.3",
    block_id: "0.5",
    canonical_question_text:
      "Cuando terminas esta actividad con éxito, ¿qué hito importante se desbloquea en la empresa para que otros puedan avanzar?",
    short_ui_label: "Qué habilita esta actividad",
    help_text:
      "No repitas solo lo que tú entregas; describe qué se vuelve posible gracias a que esto salió bien. Piensa en el siguiente avance importante del sistema. Ejemplos: 'Se libera el presupuesto', 'El proveedor puede ser pagado', 'El cliente recibe el producto', 'Se puede iniciar producción', 'Se puede cerrar el mes'.",
    ui_answer_mode_label: "libre guiada",
    field_type: "free_text",
    answer_mode: "free_text",
    allows_free_text: "no",
    free_text_condition: null,
    source_options: null,
    fallback_options: [],
    options: [],
    generated_from: "No aplica",
    user_can_edit_generated: true,
    required_rule: "Obligatoria",
    visibility_rule: "Siempre",
    branching_rule:
      "Si la respuesta describe solo una tarea local y no un hito habilitado, considerar 0.5.C.",
    canonical_variable_output: "scene_enabled_milestone",
    provenance_type: "capturado (captured_user_evidence)",
    stored_in: "scene_question_answers + scene_block_derivations",
    used_by: "PM, hilos de dependencia entre escenas, Bloque 3, Bloque 4 y Capa 2",
    risk_if_missing:
      "La escena queda sin relación explícita con el avance que habilita y se vuelve difícil mapear su lugar en la secuencia de hitos.",
    runtime_interaction_ids: ["B05-Q07"],
    systemic_north: "hito_habilitador",
    visibility: "always",
  },
  {
    question_code: "0.5.4",
    block_id: "0.5",
    canonical_question_text:
      "Si tienes muchas cosas que hacer y no hay tiempo para todo, ¿quién o qué define que esta actividad en particular debe hacerse primero?",
    short_ui_label: "Quién define la prioridad",
    help_text:
      "Piensa en condiciones normales de presión o competencia entre tareas. ¿Quién marca la prioridad efectiva? Puede ser tu jefe, un sistema, el cliente, una política o incluso tú mismo si no hay una fuente clara arriba. Eso último también es dato.",
    ui_answer_mode_label: "cerrada",
    field_type: "single_choice",
    answer_mode: "single_choice",
    allows_free_text: "conditional",
    free_text_condition: "selected_option = Otro",
    source_options: null,
    fallback_options: ["Otro (especificar)"],
    options: PRIORITY_OPTIONS,
    generated_from: "No aplica",
    user_can_edit_generated: true,
    required_rule: "Obligatoria",
    visibility_rule: "Siempre",
    branching_rule:
      "Después de 0.5.4, mostrar 0.5.4a. Si opción = Yo mismo, registrar posible señal de vacío regulatorio o subsidiariedad invertida para lectura posterior, sin diagnosticar aquí.",
    canonical_variable_output: "scene_priority_source",
    provenance_type: "capturado (captured_user_evidence)",
    stored_in:
      "scene_question_answers + scene_block_derivations + scene_consistency_flags",
    used_by: "lectura VSM posterior, señales sobre S3/S5, Capa 2 y consistencia con Bloque 5",
    risk_if_missing:
      "No queda claro quién ordena el trabajo cuando la escena compite con otras exigencias.",
    runtime_interaction_ids: ["B05-Q07"],
    systemic_north: "prioridad_regulatoria",
    visibility: "always",
  },
  {
    question_code: "0.5.4a",
    block_id: "0.5",
    canonical_question_text:
      "Si ya estás trabajando en esta actividad y te entra otra urgencia que la desplaza, ¿de quién o de dónde suele venir esa nueva prioridad?",
    short_ui_label: "De dónde viene la urgencia que desplaza",
    help_text:
      "Aquí ya no hablamos de prioridad normal, sino de quién reordena el sistema cuando aparece una urgencia competidora. A veces coincide con la prioridad normal; a veces no. Y cuando no coincide, ahí suele haber una señal estructural valiosa.",
    ui_answer_mode_label: "cerrada",
    field_type: "single_choice",
    answer_mode: "single_choice",
    allows_free_text: "conditional",
    free_text_condition: "selected_option = Otro",
    source_options: null,
    fallback_options: ["Otro (especificar)"],
    options: PRIORITY_DISPLACEMENT_OPTIONS,
    generated_from: "No aplica",
    user_can_edit_generated: true,
    required_rule: "Obligatoria",
    visibility_rule: "Siempre, después de 0.5.4",
    branching_rule:
      "Si la fuente difiere de 0.5.4, derivar scene_priority_pattern = prioridad fragmentada o desplazamiento competitivo. Si responde Casi nunca me desplazan, registrar estabilidad relativa.",
    canonical_variable_output:
      "scene_priority_displacement_source + scene_priority_pattern (derivable)",
    provenance_type:
      "capturado + derivado (captured_user_evidence / canonical_derivation)",
    stored_in:
      "scene_question_answers + scene_block_derivations + scene_consistency_flags",
    used_by:
      "lectura de tensiones entre prioridad normal y urgencia competidora, VSM posterior, Capa 2 y Bloque 5",
    risk_if_missing:
      "Se pierde la diferencia entre prioridad estable y prioridad que irrumpe, y con ello una fuente importante de ruido regulatorio.",
    runtime_interaction_ids: ["B05-Q07"],
    systemic_north: "prioridad_regulatoria",
    visibility: "always",
  },
  {
    question_code: "0.5.A",
    block_id: "0.5",
    canonical_question_text:
      "Para no confundirlo: más allá de a quién le entregas directamente, ¿quién dirías que obtiene el beneficio real al final y quién absorbe el problema real si esto falla?",
    short_ui_label: "Aclarar quién gana y quién pierde",
    help_text:
      "Úsala cuando la respuesta anterior se haya ido hacia el receptor inmediato o cuando todavía no quede clara la diferencia entre quien recibe tu trabajo y quien finalmente gana o pierde por él. Ejemplo: le entregas a tesorería, pero el beneficio final puede ser para el proveedor y el daño final también puede caer en él o en el cliente.",
    ui_answer_mode_label: "aclarada",
    field_type: "clarification",
    answer_mode: "clarification",
    allows_free_text: "no",
    free_text_condition: null,
    source_options: null,
    fallback_options: [],
    options: [],
    generated_from:
      "Se dispara por flags de ambigüedad entre beneficiario, afectado y receptor inmediato",
    user_can_edit_generated: true,
    required_rule: "Nunca en flujo base",
    visibility_rule: "Solo por flag",
    branching_rule: "No dispara nuevas preguntas; alimenta clarificación y consistencia.",
    canonical_variable_output: "scene_functional_client + clarifications_bundle_0_5_A",
    provenance_type: "aclarado (clarification)",
    stored_in: "scene_clarifications + scene_block_derivations",
    used_by:
      "consistencia fina del bloque, Bloque 3 y revisión manual si persiste contradicción",
    risk_if_missing:
      "Una confusión semántica pequeña puede contaminar la lectura completa del cliente funcional.",
    runtime_interaction_ids: ["C02"],
    systemic_north: "aclaracion",
    visibility: "flag_only",
  },
  {
    question_code: "0.5.B",
    block_id: "0.5",
    canonical_question_text:
      "La respuesta sobre el proceso quedó demasiado amplia o demasiado pegada a la tarea. ¿En qué proceso más grande vive realmente esta actividad dentro de la empresa?",
    short_ui_label: "Aclarar proceso contenedor",
    help_text:
      "Sirve cuando el usuario responde con algo demasiado local como 'revisar pagos' o demasiado vago como 'operación'. La idea es subir o bajar un nivel hasta encontrar el proceso contenedor correcto. Ejemplos: Compras, Finanzas, Nómina, Atención al cliente, Producción.",
    ui_answer_mode_label: "aclarada",
    field_type: "clarification",
    answer_mode: "clarification",
    allows_free_text: "no",
    free_text_condition: null,
    source_options: null,
    fallback_options: [],
    options: [],
    generated_from: "Flag de granularidad inadecuada o incertidumbre alta en 0.5.2",
    user_can_edit_generated: true,
    required_rule: "Nunca en flujo base",
    visibility_rule: "Solo por flag",
    branching_rule: "No abre más preguntas; corrige precisión de proceso.",
    canonical_variable_output: "scene_macro_process + clarifications_bundle_0_5_B",
    provenance_type: "aclarado (clarification)",
    stored_in: "scene_clarifications + scene_block_derivations",
    used_by: "PM, consistencia documental y preparación para Bloque 1",
    risk_if_missing:
      "El proceso contenedor puede quedar mal segmentado, afectando luego agrupación de escenas y lectura de cadena.",
    runtime_interaction_ids: ["B05-Q06"],
    systemic_north: "aclaracion",
    visibility: "flag_only",
  },
  {
    question_code: "0.5.C",
    block_id: "0.5",
    canonical_question_text:
      "Lo que escribiste parece describir tu tarea, pero no el hito que se habilita. Cuando esto sale bien, ¿qué cosa importante ya puede avanzar o desbloquearse para otros?",
    short_ui_label: "Aclarar hito habilitado",
    help_text:
      "Se usa cuando la respuesta se queda en algo como 'entrego el reporte' o 'termino la revisión'. Lo que buscamos es el siguiente avance importante que eso habilita. Ejemplos: 'se aprueba el pago', 'se libera la orden', 'producción puede arrancar', 'el cliente recibe el servicio', 'se puede cerrar el mes'.",
    ui_answer_mode_label: "aclarada",
    field_type: "clarification",
    answer_mode: "clarification",
    allows_free_text: "no",
    free_text_condition: null,
    source_options: null,
    fallback_options: [],
    options: [],
    generated_from: "Flag de respuesta local o insuficiente en 0.5.3",
    user_can_edit_generated: true,
    required_rule: "Nunca en flujo base",
    visibility_rule: "Solo por flag",
    branching_rule:
      "No abre más preguntas; mejora el nivel de abstracción correcta del hito.",
    canonical_variable_output: "scene_enabled_milestone + clarifications_bundle_0_5_C",
    provenance_type: "aclarado (clarification)",
    stored_in: "scene_clarifications + scene_block_derivations",
    used_by: "PM, Bloque 3, Bloque 4 y transducción causal posterior",
    risk_if_missing:
      "El bloque puede quedarse en un handoff local y no en el hito que la escena realmente habilita.",
    runtime_interaction_ids: ["B05-Q07", "C02"],
    systemic_north: "aclaracion",
    visibility: "flag_only",
  },
] as const;

export function getBlock05Ficha(
  code: Block05QuestionCode,
): Block05Ficha | undefined {
  return BLOCK05_FICHAS.find((ficha) => ficha.question_code === code);
}

/** Orden de despliegue fuente según documento madre §8. */
export const BLOCK05_FICHA_ORDER: readonly Block05QuestionCode[] = [
  "0.5.1",
  "0.5.1a",
  "0.5.1_rel",
  "0.5.1b",
  "0.5.1c",
  "0.5.1d",
  "0.5.2",
  "0.5.3",
  "0.5.4",
  "0.5.4a",
  "0.5.A",
  "0.5.B",
  "0.5.C",
] as const;

/** Framing sistémico visible (lenguaje de trinchera, sin jerga). */
export const BLOCK05_SYSTEMIC_BANDS = [
  {
    id: "cliente_funcional",
    runtimeIds: ["B05-Q05"] as const,
    kicker: "PARA QUIÉN EXISTE ESTO",
    guide:
      "No el receptor inmediato: quién gana de verdad si sale bien y quién absorbe el daño si falla.",
  },
  {
    id: "proceso_contenedor",
    runtimeIds: ["B05-Q06"] as const,
    kicker: "A QUÉ PROCESO PERTENECE",
    guide: "El proceso grande donde esta actividad tiene sentido, no la tarea suelta.",
  },
  {
    id: "hito_y_prioridad",
    runtimeIds: ["B05-Q07"] as const,
    kicker: "QUÉ HABILITA Y QUIÉN PRIORIZA",
    guide:
      "Qué avance desbloquea para otros, y quién marca la prioridad normal frente a la que desplaza.",
  },
] as const;

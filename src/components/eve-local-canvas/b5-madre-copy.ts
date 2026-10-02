/**
 * Bloque 5 (Capacidad y discrecionalidad) — Madre-direct copy.
 *
 * Authority hierarchy (methodology):
 * 1) Madre B5 rev3 docx SHA 43C1D19E…6488 (user Downloads path)
 * 2) semantics / options / help / clarifications (Madre fichas)
 * 3) Matriz SHA 5DC4E7A8…1059 (control families / interactions; NOT copy override)
 * 4) UI Instrumento shell
 *
 * Cross-block (Madre): after B4, before B6; inherits dimension_dominante from B2.
 * Continuity/show-hide across blocks = X4/Runtime — not this UI wave.
 */

export type B5SourceCode =
  | "5.0"
  | "5.0_auto"
  | "5.1"
  | "5.2"
  | "5.3"
  | "5.4"
  | "5.5"
  | "5.6"
  | "5.7"
  | "5.8"
  | "5.9"
  | "5.10"
  | "5.11"
  | "5.12"
  | "5.13"
  | "5.14"
  | "5.14b"
  | "5.A"
  | "5.B"
  | "5.C";

export const B5_MADRE_QUESTION_TEXT: Record<B5SourceCode, string> = {
  "5.0":
    "¿Normalmente trabajas con muchos {X} en el mismo periodo, o cada {X} requiere atención individual / cada vez que la haces es diferente?",
  "5.0_auto":
    "Inferencia automática de métrica comparativa a partir de dimensión dominante y naturaleza 5.0.",
  "5.1":
    "Según la métrica de esta memoria operativa, ¿cuál es la capacidad que normalmente se espera (capacidad nominal)?",
  "5.2":
    "En la misma métrica, ¿cuál es la capacidad que realmente logras hoy (capacidad real)?",
  "5.3": "Brecha de capacidad calculada automáticamente.",
  "5.4": "¿Con cuántas PERSONAS cuentas realmente para hacer esta actividad?",
  "5.5": "¿Qué sistemas o herramientas tienes disponibles para hacer esta actividad?",
  "5.6": "¿Cuánto tiempo OFICIALMENTE se te asigna para esta actividad?",
  "5.7":
    "Para hacer esta actividad bien y sin sacrificios recurrentes, ¿cuál de estas situaciones se parece más a lo que necesitarías?",
  "5.8": "¿Cuánto tiempo REALMENTE necesitarías para hacer esto bien?",
  "5.9":
    "¿En qué decisiones tienes libertad para actuar? ¿En cuáles estás constreñido?",
  "5.10":
    "¿Hay límites o restricciones que NO PUEDES cruzar bajo ninguna circunstancia?",
  "5.11":
    "Para hacer esta actividad dentro de los límites que tienes, ¿qué tienes que sacrificar?",
  "5.12":
    "¿Hay casos o situaciones que simplemente NO puedes absorber? ¿Qué se escapa?",
  "5.13": "Cuando algo se escapa de tu capacidad, ¿qué pasa?",
  "5.14":
    "Con los recursos que tienes hoy, ¿qué tan sostenible es cumplir esta actividad sin sacrificar otras cosas?",
  "5.14b": "¿Qué tendría que cambiar para que fuera justo o sostenible?",
  "5.A":
    "Ayúdanos a precisar si aquí pesa más la cantidad de casos, la cantidad de personas o entidades que atiendes, o la complejidad de cada ejecución.",
  "5.B":
    "Ayúdanos a entender mejor si esa tensión es ocasional o si ya forma parte normal de cómo esta actividad logra salir.",
  "5.C":
    "Mencionaste situaciones que se escapan de tu capacidad, pero todavía no quedó claro qué sucede con ellas. Ayúdanos a precisar si se atrasan, se quedan sin hacer, las absorbe otra persona o equipo, o terminan resolviéndose de otra manera.",
};

export const B5_MADRE_SHORT_LABEL: Record<B5SourceCode, string> = {
  "5.0": "Naturaleza de la actividad",
  "5.0_auto": "Métrica comparativa",
  "5.1": "Capacidad esperada",
  "5.2": "Capacidad real",
  "5.3": "Brecha",
  "5.4": "Personas disponibles",
  "5.5": "Sistemas y herramientas",
  "5.6": "Tiempo oficial asignado",
  "5.7": "Personas requeridas",
  "5.8": "Tiempo realmente necesario",
  "5.9": "Libertad de decisión",
  "5.10": "Límites no cruzables",
  "5.11": "Sacrificios / compensación",
  "5.12": "Variedad residual",
  "5.13": "Destino de lo que se escapa",
  "5.14": "Sostenibilidad del pacto",
  "5.14b": "Qué tendría que cambiar",
  "5.A": "Aclarar comparabilidad",
  "5.B": "Aclarar tensión sacrificio",
  "5.C": "Aclarar destino residual",
};

export const B5_MADRE_HELP_TEXT: Record<B5SourceCode, string> = {
  "5.0":
    "Piensa en cómo se vive esta actividad en la práctica. Queremos saber si normalmente trabajas con muchos casos parecidos en un mismo periodo, si cada caso requiere atención más individual, o si pasa un poco de ambas cosas.",
  "5.0_auto":
    "Nodo interno, no visible. Formaliza la regla de decisión para evitar improvisación en plataforma.",
  "5.1":
    "Responde según lo que normalmente se supone que deberías poder sacar adelante en condiciones normales. Si la pregunta aparece en cantidad, piensa en cuántos casos se espera que atiendas; si aparece en tiempo, piensa en cuánto debería tardar cada caso cuando todo funciona como se espera.",
  "5.2":
    "Responde con lo que realmente logras hacer hoy, considerando interrupciones, carga paralela, cambios de prioridad, herramientas disponibles y cualquier limitación habitual.",
  "5.3":
    "Nodo interno. Si la métrica es numérica, usar (nominal - real) / nominal × 100. Si la métrica es temporal, usar (real - nominal) / nominal × 100 y etiquetar la salida como sobretiempo o exceso temporal para evitar ambigüedad semántica.",
  "5.4":
    "Cuenta a las personas que realmente ayudan a sacar adelante esta actividad. Elige la opción que más se parezca a tu realidad habitual.",
  "5.5":
    "Selecciona las herramientas o sistemas con los que realmente cuentas para hacer esta actividad.",
  "5.6":
    "No respondas con lo que terminas dedicándole de verdad, sino con lo que en teoría te asignan o esperan que dediques.",
  "5.7":
    "Elige la opción que más se acerque a lo que haría falta para hacer esta actividad bien y sin tener que compensar de forma recurrente.",
  "5.8":
    "Ahora responde con el tiempo que realmente necesitarías para hacer esta actividad bien, sin apuros crónicos ni sacrificios repetidos.",
  "5.9": "Marca las decisiones que realmente puedes tomar sin pedir permiso cada vez.",
  "5.10":
    "Selecciona los límites que realmente no puedes cruzar, aunque quisieras resolver mejor la actividad. Pueden ser restricciones de presupuesto, tiempo, proceso, herramientas, horario o margen de decisión.",
  "5.11":
    "Piensa en lo que terminas cediendo para poder cumplir con esta actividad dentro de los límites actuales. Puede ser tiempo, calidad, descanso, otras responsabilidades o algo más.",
  "5.12":
    "Queremos identificar qué tipos de casos, situaciones o variaciones rebasan tu capacidad normal. Marca lo que se te escapa o te deja sin margen, aunque ocurra solo en ciertos momentos.",
  "5.13":
    "Cuando algo rebasa tu capacidad, queremos saber qué pasa en la práctica. ¿Se queda pendiente, lo absorbe alguien más, se retrasa, o termina resolviéndolo otro actor?",
  "5.14":
    "Piensa en si esta actividad puede sostenerse en el tiempo con los recursos actuales, sin que tú tengas que compensar constantemente con sacrificios o tensiones.",
  "5.14b":
    "Elige qué tendría que cambiar para que esta actividad fuera más justa y sostenible.",
  "5.A":
    "Ayúdanos a precisar si aquí pesa más la cantidad de casos, la cantidad de personas o entidades que atiendes, o la complejidad de cada ejecución.",
  "5.B":
    "Ayúdanos a entender mejor si esa tensión es ocasional o si ya forma parte normal de cómo esta actividad logra salir.",
  "5.C":
    "Mencionaste situaciones que se escapan de tu capacidad, pero todavía no quedó claro qué sucede con ellas. Ayúdanos a precisar si se atrasan, se quedan sin hacer, las absorbe otra persona o equipo, o terminan resolviéndose de otra manera.",
};

export const B5_MADRE_VISIBILITY_RULE: Record<B5SourceCode, string> = {
  "5.0": "Visible al abrir el bloque, con redacción dinámica.",
  "5.0_auto": "Nunca visible al usuario.",
  "5.1": "Visible después de 5.0_auto.",
  "5.2": "Visible después de 5.1.",
  "5.3":
    "No visible como pregunta; visible como resultado derivado si la UI lo requiere.",
  "5.4": "Siempre visible.",
  "5.5": "Siempre visible.",
  "5.6": "Siempre visible.",
  "5.7": "Siempre visible.",
  "5.8": "Siempre visible.",
  "5.9": "Siempre visible.",
  "5.10": "Siempre visible.",
  "5.11": "Siempre visible.",
  "5.12": "Siempre visible.",
  "5.13": "Solo si 5.12 indica algo se escapa.",
  "5.14": "Siempre visible.",
  "5.14b": "Solo si 5.14 indica tensión, sacrificio o insostenibilidad.",
  "5.A": "Condicional (flag de comparabilidad).",
  "5.B": "Condicional (contradicción 5.11 vs 5.14).",
  "5.C": "Condicional (variedad residual sin destino claro).",
};

export type B5MadreOption = { option_id: string; option_label: string };

/** Madre time_scale_enum (heuristic_time_scale_v1). */
export const B5_TIME_SCALE_OPTIONS: readonly B5MadreOption[] = [
  { option_id: "lt_1h", option_label: "Menos de 1 hora" },
  { option_id: "1_4h", option_label: "1 a 4 horas" },
  { option_id: "1_day", option_label: "Un día" },
  { option_id: "2_5_days", option_label: "2 a 5 días" },
  { option_id: "gt_5_days", option_label: "Más de 5 días" },
] as const;

/**
 * Stub quantity bands for volume/count metrics until X4 supplies number_with_unit metadata.
 * Documented PARTIAL — not a Madre fixed enum.
 */
export const B5_VOLUME_STUB_OPTIONS: readonly B5MadreOption[] = [
  { option_id: "lt_5", option_label: "Menos de 5" },
  { option_id: "5_10", option_label: "5 a 10" },
  { option_id: "11_20", option_label: "11 a 20" },
  { option_id: "21_50", option_label: "21 a 50" },
  { option_id: "gt_50", option_label: "Más de 50" },
  { option_id: "variable", option_label: "Variable / no estable" },
] as const;

export const B5_MADRE_OPTIONS: Partial<
  Record<B5SourceCode, readonly B5MadreOption[]>
> = {
  "5.0": [
    { option_id: "repetitivo", option_label: "Repetitivo" },
    { option_id: "discrecional", option_label: "Discrecional" },
    { option_id: "mezcla", option_label: "Mezcla" },
  ],
  "5.1": B5_VOLUME_STUB_OPTIONS,
  "5.2": B5_VOLUME_STUB_OPTIONS,
  "5.4": [
    { option_id: "solo_yo", option_label: "Solo yo" },
    {
      option_id: "yo_1_parcial",
      option_label: "Yo + 1 persona a tiempo parcial",
    },
    {
      option_id: "yo_1_completo",
      option_label: "Yo + 1 persona a tiempo completo",
    },
    { option_id: "yo_2_3", option_label: "Yo + 2-3 personas" },
    { option_id: "yo_4_mas", option_label: "Yo + 4 o más personas" },
    { option_id: "rotativo", option_label: "Rotativo (varía mucho)" },
  ],
  "5.5": [
    {
      option_id: "automatizado",
      option_label: "Un sistema automatizado que lo hace casi todo",
    },
    {
      option_id: "ayuda_manual",
      option_label: "Un sistema que ayuda pero requiere trabajo manual",
    },
    {
      option_id: "multiples_manual",
      option_label: "Múltiples sistemas que tengo que conectar manualmente",
    },
    {
      option_id: "hojas",
      option_label: "Hojas de cálculo o herramientas improvisadas",
    },
    {
      option_id: "manual",
      option_label: "Principalmente trabajo manual sin sistema",
    },
    { option_id: "otro", option_label: "Otro" },
  ],
  "5.6": [
    { option_id: "100", option_label: "100% de mi tiempo" },
    { option_id: "75", option_label: "75%" },
    { option_id: "50", option_label: "50%" },
    { option_id: "25", option_label: "25%" },
    { option_id: "lt_25", option_label: "Menos del 25%" },
    { option_id: "no_claro", option_label: "No está claro" },
  ],
  "5.7": [
    {
      option_id: "bien",
      option_label: "Estoy bien con las personas actuales",
    },
    {
      option_id: "apoyo_picos",
      option_label: "Necesitaría apoyo parcial en picos o urgencias",
    },
    {
      option_id: "una_mas",
      option_label: "Necesitaría una persona más de forma estable",
    },
    {
      option_id: "dos_mas",
      option_label: "Necesitaría 2 o más personas más",
    },
    {
      option_id: "no_solo_personas",
      option_label:
        "No es solo un tema de personas, también falta sistema/tiempo/proceso",
    },
  ],
  "5.8": [
    { option_id: "100", option_label: "100%" },
    { option_id: "75", option_label: "75%" },
    { option_id: "50", option_label: "50%" },
    { option_id: "25", option_label: "25%" },
    { option_id: "lt_25", option_label: "Menos del 25%" },
  ],
  "5.9": [
    { option_id: "orden", option_label: "Puedo decidir el orden" },
    {
      option_id: "como",
      option_label: "Puedo decidir cómo hacer cada tarea",
    },
    {
      option_id: "urgente",
      option_label: "Puedo decidir si algo es urgente",
    },
    { option_id: "delego", option_label: "Puedo decidir si delego" },
    {
      option_id: "bien_hecho",
      option_label: "Puedo decidir si algo está bien hecho",
    },
    {
      option_id: "decir_no",
      option_label: "Puedo decidir si le digo no a una solicitud",
    },
    {
      option_id: "poca",
      option_label: "Tengo muy poca decisión sobre esto",
    },
  ],
  "5.10": [
    {
      option_id: "presupuesto",
      option_label: "No puedo gastar más de X presupuesto",
    },
    {
      option_id: "contratar",
      option_label: "No puedo contratar más personas",
    },
    { option_id: "proceso", option_label: "No puedo cambiar el proceso" },
    {
      option_id: "rechazar",
      option_label: "No puedo rechazar una solicitud",
    },
    {
      option_id: "horario",
      option_label: "No puedo trabajar fuera de X horario",
    },
    {
      option_id: "sistemas",
      option_label: "No puedo usar ciertos sistemas",
    },
    {
      option_id: "sin_claros",
      option_label: "No hay constreñimientos claros",
    },
    { option_id: "otro", option_label: "Otro" },
  ],
  "5.11": [
    { option_id: "tiempo_personal", option_label: "Tiempo personal" },
    { option_id: "calidad", option_label: "Calidad" },
    {
      option_id: "otras_resp",
      option_label: "Otras responsabilidades",
    },
    {
      option_id: "salud_estres",
      option_label: "Salud mental o estrés",
    },
    { option_id: "relaciones", option_label: "Relaciones" },
    { option_id: "descanso", option_label: "Descanso o sueño" },
    { option_id: "nada", option_label: "No sacrifico nada" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "5.12": [
    { option_id: "excepcionales", option_label: "Casos excepcionales" },
    { option_id: "urgencias", option_label: "Urgencias sin aviso" },
    {
      option_id: "cambios",
      option_label: "Cambios de requisitos",
    },
    { option_id: "volumen", option_label: "Volumen inesperado" },
    { option_id: "calidad", option_label: "Problemas de calidad" },
    { option_id: "nada", option_label: "Nada se escapa" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "5.13": [
    { option_id: "sin_hacer", option_label: "Se queda sin hacer" },
    { option_id: "jefe", option_label: "Lo hace mi jefe" },
    { option_id: "otro_equipo", option_label: "Lo hace otro equipo" },
    {
      option_id: "atrasa",
      option_label: "Se atrasa indefinidamente",
    },
    { option_id: "cliente", option_label: "El cliente lo resuelve" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "5.14": [
    { option_id: "sostenible", option_label: "Sostenible" },
    {
      option_id: "tenso",
      option_label: "Tenso pero manejable",
    },
    {
      option_id: "sacrificios",
      option_label: "Se cumple, pero a costa de sacrificios frecuentes",
    },
    {
      option_id: "insostenible",
      option_label: "Es insostenible en el tiempo",
    },
    {
      option_id: "no_claro",
      option_label: "No está claro porque cambia demasiado",
    },
  ],
  "5.14b": [
    { option_id: "mas_personas", option_label: "Más personas" },
    { option_id: "mejor_tech", option_label: "Mejor tecnología" },
    {
      option_id: "menos_resp",
      option_label: "Menos responsabilidades",
    },
    { option_id: "mas_tiempo", option_label: "Más tiempo" },
    { option_id: "mas_autonomia", option_label: "Más autonomía" },
    { option_id: "otro", option_label: "Otro" },
  ],
};

export const B5_BLOCK_META = {
  block: "5" as const,
  canonical_name: "Capacidad y discrecionalidad",
  mother_question:
    "¿Con qué recursos realmente cuentas, dónde tienes margen de decisión y qué tienes que sacrificar para sostener esta memoria operativa?",
  purpose:
    "Medir la brecha entre exigencia esperada y capacidad real en la dimensión que realmente limita la memoria operativa, junto con recursos asignados, recursos requeridos, discrecionalidad, constreñimientos, compensación, variedad residual y sostenibilidad del resource bargain.",
  frame_line:
    "Ahora miramos con qué recursos cuentas de verdad, dónde tienes margen y qué sacrificas para sostener esta memoria operativa.",
  sequence_after: "4",
  sequence_before: "6",
  inherits_from_block: "2",
  inherits_variable: "dimension_dominante",
  madre_docx_sha256:
    "43C1D19EC3FD4E50F769DBD60D06685176C946A6364E3010B417CFFFF4266488",
  matrix_sha256_expected:
    "5DC4E7A833A2EB5FE6977D290DDBEA855743AF2E9D167245B5B55BB7C1ED1059",
} as const;

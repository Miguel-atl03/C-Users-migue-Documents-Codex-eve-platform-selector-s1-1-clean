/**
 * Bloque 1 (Disparador) — Madre-direct copy.
 * Source: Bloque_1_Documento_Madre_Capa1_v2_1_EVE.docx (fixtures extract).
 * Madre wins over fichas / matrix visible_text composites for question wording.
 */

export type B1SourceCode =
  | "1.1"
  | "1.2"
  | "1.3"
  | "1.4"
  | "1.5"
  | "1.6"
  | "1.7"
  | "1.8"
  | "1.A"
  | "1.B"
  | "1.C";

export const B1_MADRE_QUESTION_TEXT: Record<B1SourceCode, string> = {
  "1.1": "¿De dónde viene normalmente la señal que te indica empezar?",
  "1.2":
    "Cuando esto comienza, ¿es algo que esperas que ocurra o es algo que te sorprende?",
  "1.3":
    "Cuando esto debe comenzar, ¿está muy claro para ti que es el momento, o hay ambigüedad?",
  "1.4":
    "¿Con qué frecuencia ocurre este disparador y si hay un patrón que puedas predecir?",
  "1.5": "¿Por qué medio te llega la noticia de que debes comenzar?",
  "1.6": "Para que este disparador ocurra, ¿qué debe haber ocurrido antes?",
  "1.7": "¿Hay momentos en que esto debería comenzar pero no comienza?",
  "1.8":
    "Si respondiste “Sí” en la pregunta anterior, ¿qué ocurre en esos momentos? ¿Cómo te das cuenta de que algo no funcionó?",
  "1.A":
    "Cuando no está claro si debe empezar, ¿qué señal usas tú para decidir si comienzas o esperas?",
  "1.B": "Cuando debería empezar y no empieza, ¿qué es lo primero que notas?",
  "1.C":
    "Si la señal viene por varias fuentes o canales, ¿cuál manda realmente cuando se contradicen?",
};

export const B1_MADRE_SHORT_LABEL: Record<B1SourceCode, string> = {
  "1.1": "Origen de la señal",
  "1.2": "Tipo de disparador",
  "1.3": "Claridad del inicio",
  "1.4": "Frecuencia del disparador",
  "1.5": "Canal del disparador",
  "1.6": "Precondiciones del inicio",
  "1.7": "Excepciones del inicio",
  "1.8": "Descripción de la excepción",
  "1.A": "Aclaración sobre ambigüedad",
  "1.B": "Aclaración de silencio",
  "1.C": "Aclaración de jerarquía de señal",
};

export const B1_MADRE_HELP_TEXT: Record<B1SourceCode, string> = {
  "1.1":
    "Piensa en qué te avisa normalmente que esta actividad ya puede o debe comenzar. No preguntamos todavía qué haces después, sino de dónde viene la señal inicial. Ejemplos: un cliente lo solicita, un sistema lo notifica, tu jefe lo ordena o tú mismo lo disparas por rutina.",
  "1.2":
    "Aquí nos interesa saber si el inicio es previsible o reactivo. No es una evaluación de tu desempeño. Es una manera de entender si esta actividad vive en una rutina esperable o en un régimen de sorpresa. Ejemplo: “sé que cada fin de mes pasa” versus “me cae de repente”.",
  "1.3":
    "Piensa si normalmente sabes con claridad “ya es momento de empezar” o si muchas veces dudas si debes comenzar ahora, esperar, o revisar algo antes. Ejemplo claro: una notificación con hora definida. Ejemplo ambiguo: señales incompletas o mensajes contradictorios.",
  "1.4":
    "Queremos saber si esto ocurre con un ritmo reconocible o si aparece sin patrón. Responde pensando en cómo suele pasar la mayor parte del tiempo. Ejemplos: diaria, semanal, mensual, bajo demanda, continuo o completamente irregular.",
  "1.5":
    "Piensa en el medio concreto por el que te enteras normalmente. Puedes marcar más de uno si en la práctica llega por varios canales. Ejemplos: email, sistema, mensaje, presencial o reunión. Si marcas “Otro”, escribe cuál.",
  "1.6":
    "Escribe la condición previa mínima para que la actividad sí tenga sentido empezar. No describas todo el proceso; solo lo que necesariamente debe haber pasado antes. Ejemplos: “el cliente debe haber pagado”, “debe ser fin de mes”, “debe existir stock”, “debe llegar aprobación”.",
  "1.7":
    "Piensa en los casos en que, en teoría, ya debería haber empezado, pero algo falla y no arranca. No importa si pasa poco o mucho; importa registrarlo. Ejemplo: el cliente sí solicita algo, pero nadie lo registra; el sistema debería avisar, pero la notificación no llega.",
  "1.8":
    "Describe brevemente qué pasa cuando la actividad debería iniciar y no inicia, y cuál es la primera señal de que algo falló. Ejemplos: “el email nunca llega”, “el sistema no genera ticket”, “me doy cuenta porque otro equipo reclama”, “la fecha vence y nadie movió nada”.",
  "1.A":
    "Esta aclaración aparece solo si dijiste que el inicio es ambiguo. Nos ayuda a entender qué haces tú para resolver esa falta de claridad. Ejemplos: esperas confirmación, revisas sistema, preguntas a alguien, o comienzas por experiencia propia.",
  "1.B":
    "Esta aclaración busca el primer síntoma visible de que el inicio falló. No pedimos una explicación larga, sino la primera evidencia concreta. Ejemplos: no llegó notificación, el ticket no aparece, nadie confirma, el cliente insiste o la fecha ya venció.",
  "1.C":
    "A veces la misma actividad se activa por varias fuentes o llega por varios medios. Esta aclaración identifica cuál manda cuando no coinciden. Ejemplo: el sistema dice una cosa, pero tu jefe te pide otra; o llega correo y también llamada, pero una de las dos define la acción real.",
};

export type B1MadreOption = { option_id: string; option_label: string };

export const B1_MADRE_OPTIONS: Partial<Record<B1SourceCode, readonly B1MadreOption[]>> = {
  "1.1": [
    { option_id: "cliente_solicita", option_label: "Un cliente (interno o externo) me lo solicita" },
    { option_id: "sistema_notifica", option_label: "Un sistema o aplicación me lo notifica" },
    { option_id: "jefe_ordena", option_label: "Mi jefe o superior me lo ordena" },
    { option_id: "companero_pasa", option_label: "Un compañero me lo pasa" },
    { option_id: "yo_decido", option_label: "Yo mismo lo decido" },
    { option_id: "combinacion", option_label: "Una combinación de los anteriores" },
  ],
  "1.2": [
    {
      option_id: "planificado",
      option_label: "Es planificado: sé que va a ocurrir y más o menos cuándo",
    },
    {
      option_id: "reactivo",
      option_label: "Es reactivo: me sorprende, no lo veo venir",
    },
    {
      option_id: "mezcla",
      option_label: "Es una mezcla: a veces es planificado, a veces es sorpresa",
    },
  ],
  "1.3": [
    { option_id: "muy_claro", option_label: "Muy claro" },
    { option_id: "claro", option_label: "Claro" },
    { option_id: "ambiguo", option_label: "Ambiguo" },
    { option_id: "muy_ambiguo", option_label: "Muy ambiguo" },
  ],
  "1.4": [
    { option_id: "diaria", option_label: "Diaria" },
    { option_id: "semanal", option_label: "Semanal" },
    { option_id: "mensual", option_label: "Mensual" },
    { option_id: "bajo_demanda", option_label: "Bajo demanda" },
    { option_id: "continuo", option_label: "Continuo" },
    { option_id: "irregular", option_label: "Irregular" },
  ],
  "1.5": [
    { option_id: "email", option_label: "Email" },
    { option_id: "telefono_mensaje", option_label: "Teléfono o mensaje de texto" },
    { option_id: "sistema_aplicacion", option_label: "Un sistema o aplicación" },
    { option_id: "presencial", option_label: "Presencial" },
    { option_id: "reunion_llamada", option_label: "Reunión o llamada de equipo" },
    { option_id: "otro", option_label: "Otro (especificar)" },
  ],
  "1.7": [
    { option_id: "no_siempre_funciona", option_label: "No, siempre funciona como debería" },
    { option_id: "si_raro", option_label: "Sí, a veces ocurre pero es raro" },
    { option_id: "si_regularmente", option_label: "Sí, ocurre regularmente" },
    { option_id: "si_frecuentemente", option_label: "Sí, ocurre frecuentemente" },
  ],
};

export const B1_BLOCK_META = {
  block: "1" as const,
  canonical_name: "Disparador",
  mother_question: "¿Qué gatilla que esta memoria operativa comience?",
  purpose:
    "Reconstruir qué evento o estímulo inicia la cadena causal de la memoria operativa.",
  frame_line:
    "Ahora miramos qué gatilla que esta actividad comience. Responde lo que ves abajo.",
} as const;

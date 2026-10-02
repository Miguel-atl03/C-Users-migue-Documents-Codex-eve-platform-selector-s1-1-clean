/**
 * Bloque 3 (Salida) — Madre-direct copy.
 *
 * Canonical authority (this wave):
 * `C:/Users/migue/Downloads/Diseno Estructural de la Arquitectura de Entrerprise Viability Engine - Strategy and Operations/Bloques de preguntas/Bloque_3_Documento_Madre_Capa1_v2_1_EVE_rev3_alineado.docx`
 * SHA256: 1A89CFF41291EC47FF29852A4F074DD1B4095FDC3772A8B98F568DC7DE921B8E
 *
 * Madre wins over matrix visible_text composites for question wording.
 * Cross-block continuity: Madre couples B3 after B2 (handoff vs 2.6 state).
 * B0.5 situates the scene upstream in the assembly chain; it is not B3's local sequencer.
 */

export type B3SourceCode =
  | "3.1"
  | "3.2"
  | "3.3"
  | "3.4"
  | "3.5"
  | "3.6"
  | "3.7"
  | "3.8"
  | "3.9"
  | "3.10"
  | "3.11"
  | "3.12"
  | "3.13"
  | "3.13a"
  | "3.14"
  | "3.A"
  | "3.B"
  | "3.C"
  | "3.D";

export const B3_MADRE_QUESTION_TEXT: Record<B3SourceCode, string> = {
  "3.1": "¿Qué es exactamente lo que entregas o pones a disposición de otro al terminar?",
  "3.2": "¿Quién es la persona, equipo o sistema que recibe directamente lo que entregas?",
  "3.3": "¿Cuál es la naturaleza del receptor?",
  "3.4": "Si el receptor no recibe esto a tiempo, ¿qué pasa normalmente con su trabajo?",
  "3.5": "¿Qué hace el receptor con lo que le entregas? ¿Cuál es su siguiente paso?",
  "3.6": "¿Hay otros actores que también reciben o necesitan acceso a lo que entregas?",
  "3.7": "¿Qué criterios o estándares debe cumplir lo que entregas para que el receptor esté satisfecho?",
  "3.8": "¿Cómo entregas lo que haces? ¿Por qué medio?",
  "3.9": "¿Con qué frecuencia entregas esto?",
  "3.10": "¿Hay momentos en que lo que entregas no cumple lo esperado o no llega al receptor?",
  "3.11": "Si respondiste \"Sí\" en la pregunta anterior, ¿cuál es el problema típico?",
  "3.12": "Cuando esto ocurre, ¿cuál es el impacto en el receptor? ¿Qué tiene que hacer para compensar?",
  "3.13": "En general, cuando entregas esto, ¿el receptor lo acepta, pide ajustes menores, solicita correcciones o lo rechaza/devuelve?",
  "3.13a": "Cuando lo que entregas llega incompleto, duplicado, tarde, con error o no coincide con lo esperado, ¿cómo te enteras o qué hace el receptor para avisarlo?",
  "3.14": "¿Ha cambiado algo recientemente en cómo entregas, a quién entregas o qué criterios se esperan?",
  "3.A": "Mencionaste un receptor inmediato, pero todavía no queda claro quién recibe primero ni quién solo tiene acceso después. ¿Quién es el primer receptor real de la entrega?",
  "3.B": "Los criterios de calidad todavía se oyen muy generales. ¿Qué tendría que faltar o salir mal para que el receptor diga que esto no está bien entregado?",
  "3.C": "Ya sabemos que la entrega falla a veces, pero todavía no se entiende bien qué se rompe ni quién compensa. ¿Qué hace exactamente el receptor cuando eso ocurre?",
  "3.D": "¿El receptor solo queda insatisfecho o además avisa, rechaza, devuelve, corrige, pide cambio o detiene el siguiente paso? ¿Cómo se ve eso en la operación?",
};

export const B3_MADRE_SHORT_LABEL: Record<B3SourceCode, string> = {
  "3.1": "Qué entregas",
  "3.2": "Receptor inmediato",
  "3.3": "Tipo de receptor",
  "3.4": "Dependencia del receptor",
  "3.5": "Siguiente paso del receptor",
  "3.6": "Receptores secundarios",
  "3.7": "Criterios de calidad",
  "3.8": "Mecanismo de entrega",
  "3.9": "Frecuencia de entrega",
  "3.10": "Fallas de entrega",
  "3.11": "Tipo de problema",
  "3.12": "Impacto de la falla",
  "3.13": "Aceptación del receptor",
  "3.13a": "Aviso operativo del receptor",
  "3.14": "Cambios recientes",
  "3.A": "Aclarar receptor inmediato",
  "3.B": "Aclarar calidad esperada",
  "3.C": "Aclarar compensación del receptor",
  "3.D": "Aclarar aviso del receptor",
};

export const B3_MADRE_HELP_TEXT: Record<B3SourceCode, string> = {
  "3.1": "Habla del entregable o handoff. Puede ser un pedido procesado, una factura validada, un reporte, una aprobación, un acceso habilitado o algo equivalente.",
  "3.2": "Nos interesa quién lo recibe primero, no todavía quién se beneficia al final. Si hay varios, elige la opción más cercana y especifica.",
  "3.3": "No preguntamos el nombre, sino qué tipo de actor es: persona, equipo, área, sistema o actor externo.",
  "3.4": "Piensa en la consecuencia observable para el receptor, no en una opinión general.",
  "3.5": "Describe lo que el receptor hace a continuación con lo que recibe. Ejemplos: lo registra, lo valida, lo presenta, lo envía, lo procesa, lo usa para continuar otra tarea.",
  "3.6": "Selecciona solo los que realmente reciben o necesitan acceso, no todos los interesados que solo lo necesitan de manera secundaria. Máximo recomendado: tres.",
  "3.7": "Elige lo que realmente espera el receptor para considerar que la entrega está bien. Si hace falta, agrega otro criterio específico.",
  "3.8": "Piensa en el medio principal por el que el receptor accede a la salida: sistema, email, reunión, carpeta compartida, documento físico, transferencia de datos u otro.",
  "3.9": "Responde según la cadencia real más normal, no según una semana excepcional.",
  "3.10": "Piensa en la realidad operativa, no en el procedimiento ideal.",
  "3.11": "Elige el problema más típico. Si no aparece, usa Otro y descríbelo.",
  "3.12": "Describe qué se rompe y qué hace el receptor para seguir adelante: esperar, retrabajar, corregir, llamar, escalar, improvisar u otra compensación.",
  "3.13": "Piensa en la aceptación habitual del receptor: si lo recibe sin cambios, pide aclaraciones menores, solicita correcciones o lo rechaza/devuelve. No describas aquí cómo avisa un error operativo; eso se captura en la siguiente pregunta.",
  "3.13a": "No preguntamos si el receptor queda satisfecho. Queremos saber si da una señal operativa: avisa, rechaza, devuelve, corrige, pide cambio, bloquea el siguiente paso, recontacta, actualiza algo o escala el problema.",
  "3.14": "Marca la opción que más se acerque. Si hubo múltiples cambios, especifícalos brevemente.",
  "3.A": "Esta aclaración busca separar el receptor inmediato de receptores secundarios o de acceso posterior.",
  "3.B": "Lo que lo haría rechazar tu Entrega. Ejemplo: Si la factura llega sin el número de referencia del cliente, el receptor no puede procesarla. Si el documento no tiene firma de autorización, el siguiente paso no puede comenzar",
  "3.C": "Qué trabajo extra hace el receptor para que el flujo siga. Ejemplo: Si la factura llega sin número de referencia, el que recibe tiene que llamar para aclarar antes de poder pagar.",
  "3.D": "Esta aclaración separa evaluación del receptor de feedback operativo. Queremos saber si existe una señal visible que active corrección, devolución, recontacto, espera, rework o escalamiento.",
};

export type B3MadreOption = { option_id: string; option_label: string };

export const B3_MADRE_OPTIONS: Partial<
  Record<B3SourceCode, readonly B3MadreOption[]>
> = {
  "3.2": [
    { option_id: "un_companero_de_mi_equipo", option_label: "Un compañero de mi equipo" },
    { option_id: "mi_jefe_o_superior", option_label: "Mi jefe o superior" },
    { option_id: "otro_equipo_o_departamento", option_label: "Otro equipo o departamento" },
    { option_id: "un_cliente_externo", option_label: "Un cliente externo" },
    { option_id: "un_sistema_o_aplicacion", option_label: "Un sistema o aplicación" },
    { option_id: "multiples_receptores", option_label: "Múltiples receptores" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "3.3": [
    { option_id: "una_persona_especifica", option_label: "Una persona específica" },
    { option_id: "un_equipo_o_grupo", option_label: "Un equipo o grupo" },
    { option_id: "un_departamento_o_area", option_label: "Un departamento o área" },
    { option_id: "un_sistema_o_aplicacion", option_label: "Un sistema o aplicación" },
    { option_id: "un_cliente_o_proveedor_externo", option_label: "Un cliente o proveedor externo" },
    { option_id: "multiples_tipos", option_label: "Múltiples tipos" },
  ],
  "3.4": [
    { option_id: "no_puede_continuar", option_label: "No puede continuar" },
    { option_id: "continua_pero_con_retraso_o_retrabajo", option_label: "Continúa, pero con retraso o retrabajo" },
    { option_id: "puede_avanzar_parcialmente", option_label: "Puede avanzar parcialmente" },
    { option_id: "casi_no_afecta", option_label: "Casi no afecta" },
  ],
  "3.6": [
    { option_id: "auditoria_o_compliance", option_label: "Auditoría o compliance" },
    { option_id: "finanzas_o_contabilidad", option_label: "Finanzas o contabilidad" },
    { option_id: "gerencia_o_direccion", option_label: "Gerencia o dirección" },
    { option_id: "cliente_final", option_label: "Cliente final" },
    { option_id: "proveedor_o_socio", option_label: "Proveedor o socio" },
    { option_id: "otro_equipo", option_label: "Otro equipo" },
    { option_id: "no_solo_el_receptor_principal", option_label: "No, solo el receptor principal" },
  ],
  "3.7": [
    { option_id: "completo", option_label: "Completo" },
    { option_id: "exacto", option_label: "Exacto" },
    { option_id: "a_tiempo", option_label: "A tiempo" },
    { option_id: "validado", option_label: "Validado" },
    { option_id: "formateado", option_label: "Formateado" },
    { option_id: "documentado", option_label: "Documentado" },
    { option_id: "confidencial", option_label: "Confidencial" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "3.8": [
    { option_id: "email_o_mensaje", option_label: "Email o mensaje" },
    { option_id: "sistema_o_aplicacion", option_label: "Sistema o aplicación" },
    { option_id: "documento_fisico_o_impreso", option_label: "Documento físico o impreso" },
    { option_id: "reunion_o_presentacion_verbal", option_label: "Reunión o presentación verbal" },
    { option_id: "acceso_a_base_de_datos_o_carpeta_compartida", option_label: "Acceso a base de datos o carpeta compartida" },
    { option_id: "transferencia_de_datos", option_label: "Transferencia de datos" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "3.9": [
    { option_id: "una_sola_vez", option_label: "Una sola vez" },
    { option_id: "diaria", option_label: "Diaria" },
    { option_id: "semanal", option_label: "Semanal" },
    { option_id: "mensual", option_label: "Mensual" },
    { option_id: "segun_demanda_o_urgencia", option_label: "Según demanda o urgencia" },
    { option_id: "continuo", option_label: "Continuo" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "3.10": [
    { option_id: "no_siempre_llega_como_se_espera", option_label: "No, siempre llega como se espera" },
    { option_id: "si_a_veces_hay_problemas_pero_es_raro", option_label: "Sí, a veces hay problemas pero es raro" },
    { option_id: "si_hay_problemas_regularmente", option_label: "Sí, hay problemas regularmente" },
    { option_id: "si_hay_problemas_frecuentemente", option_label: "Sí, hay problemas frecuentemente" },
  ],
  "3.11": [
    { option_id: "no_llega_a_tiempo", option_label: "No llega a tiempo" },
    { option_id: "llega_incompleto", option_label: "Llega incompleto" },
    { option_id: "llega_con_errores", option_label: "Llega con errores" },
    { option_id: "llega_en_formato_incorrecto", option_label: "Llega en formato incorrecto" },
    { option_id: "no_llega_a_todos_los_receptores_que_deberian", option_label: "No llega a todos los receptores que deberían" },
    { option_id: "llega_pero_el_receptor_no_sabe_que_hacer_con_ell", option_label: "Llega pero el receptor no sabe qué hacer con ello" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "3.13": [
    { option_id: "lo_acepta_sin_cambios", option_label: "Lo acepta sin cambios" },
    { option_id: "a_veces_pide_aclaraciones_menores", option_label: "A veces pide aclaraciones menores" },
    { option_id: "pide_correcciones_con_cierta_frecuencia", option_label: "Pide correcciones con cierta frecuencia" },
    { option_id: "frecuentemente_lo_rechaza_o_lo_devuelve", option_label: "Frecuentemente lo rechaza o lo devuelve" },
  ],
  "3.14": [
    { option_id: "no_todo_sigue_igual", option_label: "No, todo sigue igual" },
    { option_id: "si_cambio_quien_recibe", option_label: "Sí, cambió quién recibe" },
    { option_id: "si_cambio_como_se_entrega", option_label: "Sí, cambió cómo se entrega" },
    { option_id: "si_cambiaron_los_criterios_de_calidad_esperada", option_label: "Sí, cambiaron los criterios de calidad esperada" },
    { option_id: "si_cambio_la_frecuencia", option_label: "Sí, cambió la frecuencia" },
    { option_id: "si_multiples_cambios", option_label: "Sí, múltiples cambios" },
  ],
};

export const B3_MADRE_VISIBILITY_RULE: Record<B3SourceCode, string> = {
  "3.1": "Siempre visible al iniciar el bloque.",
  "3.2": "Siempre visible después de 3.1.",
  "3.3": "Siempre visible después de 3.2.",
  "3.4": "Siempre visible.",
  "3.5": "Siempre visible.",
  "3.6": "Siempre visible.",
  "3.7": "Siempre visible.",
  "3.8": "Siempre visible.",
  "3.9": "Siempre visible.",
  "3.10": "Siempre visible.",
  "3.11": "Solo visible si 3.10 indica falla.",
  "3.12": "Solo visible si 3.10 indica falla.",
  "3.13": "Siempre visible.",
  "3.13a": "Visible si 3.10 indica que la entrega falla, llega incompleta, llega tarde, llega duplicada, no cumple criterios, genera corrección o requiere compensación del receptor. También visible si 3.13 contiene una señal de rechazo/devolución/corrección que no puede quedar absorbida por receiver_satisfaction.",
  "3.14": "Siempre visible al cierre del bloque.",
  "3.A": "Solo por flag.",
  "3.B": "Solo por flag.",
  "3.C": "Solo por flag.",
  "3.D": "Visible si 3.10 indica falla de entrega y 3.13a está vacía, genérica o responde solo satisfacción/insatisfacción sin indicar si el receptor avisa, devuelve, corrige, bloquea, recontacta o pide cambio.",
};

export const B3_BLOCK_META = {
  block: "3" as const,
  canonical_name: "Salida",
  mother_question: "¿Qué sale de esta memoria operativa y quién lo recibe?",
  purpose:
    "Hacer visible qué sale de la memoria operativa, cómo se considera válido, a quién pasa, quién depende de ello, qué criterios debe cumplir y qué ocurre cuando la entrega falla.",
  frame_line:
    "Ahora miramos qué sale de esta actividad y quién lo recibe. Responde lo que ves abajo.",
  continuity_note:
    "Madre: B3 continúa después de B2 (entregable/handoff ≠ estado final 2.6). Cadena de ensamblaje incluye B0 → B0.5 → B1 → B2 → B3; Runtime/X4 posee continuidad cross-block.",
  madre_docx_sha256:
    "1A89CFF41291EC47FF29852A4F074DD1B4095FDC3772A8B98F568DC7DE921B8E",
} as const;

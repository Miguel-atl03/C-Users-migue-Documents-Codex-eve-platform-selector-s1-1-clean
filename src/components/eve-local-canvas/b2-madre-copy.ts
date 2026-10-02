/**
 * Bloque 2 (Transformación) — Madre-direct copy.
 *
 * Canonical authority (this wave):
 * `C:/Users/migue/Downloads/Diseno Estructural de la Arquitectura de Entrerprise Viability Engine - Strategy and Operations/Bloques de preguntas/Bloque_2_Documento_Madre_Capa1_v2_1_EVE.docx`
 * SHA256: 0E134EE7E73DBB4B5B54A833712E2D15B5F03BCAF84219A50B21AB0E7CCD38CC
 *
 * Madre wins over matrix visible_text composites for question wording.
 * 2.2_* options remain stub catalogs until Runtime dynamic metadata (X4).
 */

export type B2SourceCode =
  | "2.1"
  | "2.1a"
  | "2.1b"
  | "2.1c"
  | "2.1_AB_Relacion"
  | "2.1_AC_Relacion"
  | "2.1_BC_Relacion"
  | "2.1_ABC_Relacion"
  | "2.1_ABC_Prioridad"
  | "2.2_obj"
  | "2.2_suj"
  | "2.2_acc"
  | "2.3"
  | "2.4a"
  | "2.4b"
  | "2.5"
  | "2.6"
  | "2.7"
  | "2.8"
  | "2.9"
  | "2.10"
  | "2.11"
  | "2.12"
  | "2.A"
  | "2.B"
  | "2.C";

export const B2_MADRE_QUESTION_TEXT: Record<B2SourceCode, string> = {
  "2.1": "¿Qué es lo principal que creas, cambias o afectas con esta actividad?",
  "2.1a": "¿Cuál es ese objeto?",
  "2.1b": "¿Cuál es ese sujeto?",
  "2.1c": "¿Cuál es la acción principal?",
  "2.1_AB_Relacion": "¿Cuál de estos dos es el limitante principal?",
  "2.1_AC_Relacion": "¿La acción es el cuello de botella o el objeto?",
  "2.1_BC_Relacion": "¿Qué limita más tu capacidad?",
  "2.1_ABC_Relacion":
    "En esta actividad, ¿cuál de estos tres es el obstáculo principal?",
  "2.1_ABC_Prioridad":
    "Si tuvieras que ordenarlos por importancia, ¿cuál va primero?",
  "2.2_obj":
    "De ese {OBJETO}, ¿cuáles de estas propiedades o características cambian?",
  "2.2_suj":
    "De ese {SUJETO}, ¿cuáles de estas propiedades o características cambian?",
  "2.2_acc": "De esa {ACCIÓN}, ¿cuáles de estas características cambian?",
  "2.3":
    "Cuando haces esta actividad, ¿qué tanto cambia lo principal con respecto a cómo llegó?",
  "2.4a": "¿Qué acción o cambio haces tú directamente sobre lo principal?",
  "2.4b": "¿Qué es lo que normalmente provoca que hagas ese cambio?",
  "2.5":
    "Justo antes de que comience esta actividad, ¿en qué estado o condición se encuentra lo principal?",
  "2.6":
    "Después de que termina esta actividad, ¿en qué estado o condición queda lo principal?",
  "2.7":
    "¿Lo principal se transforma una sola vez o hay múltiples ciclos de transformación?",
  "2.8":
    "Si respondiste 'Pocas veces' o 'Muchas veces', ¿cuántos ciclos típicamente ocurren?",
  "2.9":
    "¿Hay momentos en que no se transforma aunque debería, o se transforma de forma incorrecta?",
  "2.10":
    "Si respondiste 'Sí' en la pregunta anterior, ¿cómo falla la transformación? ¿Qué ocurre exactamente?",
  "2.11":
    "¿Hay cambios que ocurren en lo principal pero que no son oficiales o esperados?",
  "2.12":
    "Si respondiste 'Sí', ¿cuáles son esos cambios no oficiales y quién los hace?",
  "2.A":
    "Veo que marcaste varias dimensiones o atributos, pero todavía no queda claro qué es lo que realmente limita más esta transformación. ¿Dirías que el problema principal está en el objeto, en el sujeto, en la acción o en una combinación concreta?",
  "2.B":
    "Mencionaste que la transformación falla, pero todavía no queda claro cómo falla exactamente. ¿Qué es lo primero que ves que sale mal o no cambia cómo debería?",
  "2.C":
    "Mencionaste cambios no oficiales, pero todavía no queda claro cuál es el cambio concreto o quién lo hace. ¿Qué cambia fuera del procedimiento normal y desde dónde ocurre?",
};

export const B2_MADRE_SHORT_LABEL: Record<B2SourceCode, string> = {
  "2.1": "Qué cambia",
  "2.1a": "Objeto principal",
  "2.1b": "Sujeto principal",
  "2.1c": "Acción principal",
  "2.1_AB_Relacion": "Qué limita más",
  "2.1_AC_Relacion": "Objeto o acción",
  "2.1_BC_Relacion": "Sujeto o acción",
  "2.1_ABC_Relacion": "Obstáculo principal",
  "2.1_ABC_Prioridad": "Ranking de dimensiones",
  "2.2_obj": "Atributos del objeto",
  "2.2_suj": "Atributos del sujeto",
  "2.2_acc": "Características de la acción",
  "2.3": "Magnitud del cambio",
  "2.4a": "Acción directa",
  "2.4b": "Qué lo provoca",
  "2.5": "Estado inicial",
  "2.6": "Estado final",
  "2.7": "Ciclos de cambio",
  "2.8": "Cuántos ciclos",
  "2.9": "Fallos de transformación",
  "2.10": "Cómo falla",
  "2.11": "Cambios ocultos",
  "2.12": "Qué cambios y quién",
  "2.A": "Aclarar qué domina",
  "2.B": "Aclarar el fallo",
  "2.C": "Aclarar cambio oculto",
};

export const B2_MADRE_HELP_TEXT: Record<B2SourceCode, string> = {
  "2.1":
    "Piensa en aquello que realmente sale distinto después de que haces esta actividad. Puede ser una cosa concreta como una factura o un pedido; puede ser una persona o entidad como un cliente o proveedor; o puede ser la propia acción/proceso si lo que cambia de verdad es coordinar, validar, revisar o comunicar. Puedes elegir una, dos o tres dimensiones.",
  "2.1a":
    "Lo concreto que cambia en tu actividad. Cuando terminas, ¿qué cosa es diferente? Nota: Si cambias el registro del cliente (su cuenta, expediente), es \"Cliente\". Si cambió de un estado a otro (de \"pendiente\" a \"completado\"), es “Estado”. Si no está en la lista, elige \"Otro\".",
  "2.1b":
    "Nombra la persona, entidad o unidad que realmente cambia o es afectada de forma central por esta actividad. Nota: usa SUJETO cuando lo relevante en esta actividad sea la persona o entidad misma.",
  "2.1c":
    "Nombra el verbo o proceso que realmente se ejecuta como núcleo de la transformación. Ejemplos: coordinar, validar, comunicar, preparar, revisar, autorizar. Si no aparece en la lista, elige Otro y escríbelo.",
  "2.1_AB_Relacion":
    "Qué te limita más en la práctica: el volumen del objeto o la cantidad/gestión del sujeto. Ejemplo ¿Te limita la cantidad de pedidos que llegan o la cantidad de personal que tienes? ¿Te limita el número de facturas a emitir o el número de vendedores disponibles? ¿Te limita la cantidad de paquetes o la cantidad de repartidores?",
  "2.1_AC_Relacion":
    "Ayuda a distinguir si el problema central es que hay muchos objetos o que la acción misma es compleja.",
  "2.1_BC_Relacion":
    "Ayuda a distinguir si limita más la cantidad/diversidad de sujetos o la complejidad de la acción.",
  "2.1_ABC_Relacion":
    "Tienes tres cosas: lo que haces (acción), lo que procesas (objeto) y quién lo hace (sujeto). ¿Cuál te detiene más? Ejemplo: Acción: Preparar platos, Objeto: 50 pedidos diarios, Sujeto: 3 cocineros",
  "2.1_ABC_Prioridad":
    "Ordena objeto, sujeto y acción según su peso real en esta memoria operativa. Sirve para saber qué domina más.",
  "2.2_obj":
    "Selecciona las propiedades que sí cambian en ese objeto. Ejemplo para factura: estado, monto, propietario, fecha, información, validación, relación.",
  "2.2_suj":
    "Selecciona las propiedades que sí cambian en ese sujeto. Ejemplo para proveedor: estado, información, propietario, relación, clasificación, validación, acuerdo.",
  "2.2_acc":
    "Selecciona qué características de la acción cambian realmente. Ejemplo para coordinar: frecuencia, complejidad, participantes, duración, resultado, documentación, escalamiento.",
  "2.3":
    "Selecciona pequeño si cambia solo un atributo. Ejemplo: Cambias el estado de una factura de \"pendiente\" a \"pagada\". Medio si cambian varios. Ejemplo: Una solicitud pasa de \"recibida\" a \"aprobada\" Y se asigna responsable Y se establece fecha límite. Grande si cambian muchos. Ejemplo: Un proyecto pasa de \"propuesta\" a \"activo\" Y se asigna equipo Y presupuesto Y cronograma Y recursos Y prioridad. Radical si cambia la naturaleza de lo principal. Ejemplo: Una orden de compra se convierte en devolución (de \"a recibir\" a \"a devolver\") o Un cliente se convierte en proveedor (cambia su rol fundamental en el sistema)",
  "2.4a":
    "Preguntamos por tu acción directa sobre lo que estas trabajando. Ejemplo: Crear una nueva factura en el Sistema, Revisar un documento antes de enviarlo, Corregir datos incorrectos en un registro.",
  "2.4b": "Qué provoca específicamente que hagas este cambio sobre lo principal",
  "2.5":
    "Describe cómo llega lo principal justo antes de tu intervención. Ejemplos: pedido recibido sin validar, factura sin aprobar, proveedor sin verificar. Evita respuestas genéricas como 'normal' o 'pendiente' sin contexto.",
  "2.6":
    "Describe cómo queda lo principal después de la actividad. Ejemplos: pedido validado y asignado, factura aprobada, proveedor activo y verificado.",
  "2.7":
    "Piensa si la transformación ocurre una sola vez o si suele haber revisiones, rechazos, correcciones, reenvíos o rondas repetidas. Ejemplo: se revisa, se corrige y se revisa otra vez.",
  "2.8":
    "Elige el rango que mejor represente la cantidad típica de ciclos. No buscamos precisión matemática absoluta, sino una escala comparable entre memorias operativas.",
  "2.9":
    "Piensa en momentos en que lo principal debería cambiar y no cambia, o cambia mal. Queremos saber por la existencia del fallos.",
  "2.10":
    "Describe el síntoma concreto del fallo. Ejemplos: el sistema no registra el cambio, queda en estado incorrecto, vuelve atrás, alguien corrige después, sale incompleto. Evita respuestas vagas como 'falla' o 'sale mal'.",
  "2.11":
    "Piensa en cambios que sí ocurren pero quedan fuera del procedimiento formal, de la autorización esperada o del registro normal. Ejemplos: alguien cambia el precio sin autorización, actualiza el estado sin documentarlo o modifica datos por fuera del flujo.",
  "2.12":
    "Describe el cambio no oficial y, si puedes, quién lo hace o desde dónde ocurre. Ejemplos: ventas cambia el precio; otra área actualiza el estado; alguien corrige datos por fuera del sistema. Evita respuestas donde solo diga 'pasa' sin actor ni cambio identificable.",
  "2.A":
    "Ejemplo: Tengo pocos cocineros Y llegan muchos pedidos, pero el verdadero problema es que no hay coordinación entre ellos.",
  "2.B":
    "Guíate por el síntoma observable. Lo que ves que no funciona. Ejemplo: El pedido llega sin la información del cliente, el documento queda en estado 'pendiente' cuando debería estar 'aprobado, el proceso se detiene y nadie sabe por qué.",
  "2.C":
    "Ejemplo: El coordinador de entregas anota cambios en Excel en lugar de registrarlos en el sistema porque el sistema no refleja cambios de última hora.",
};

export type B2MadreOption = { option_id: string; option_label: string };

export const B2_MADRE_OPTIONS: Partial<Record<B2SourceCode, readonly B2MadreOption[]>> = {
  "2.1": [
    { option_id: "objeto", option_label: "Un OBJETO (cosa)" },
    { option_id: "sujeto", option_label: "Un SUJETO (persona/entidad)" },
    { option_id: "accion", option_label: "Una ACCIÓN/PROCESO" },
  ],
  "2.1a": [
    { option_id: "factura", option_label: "Factura" },
    { option_id: "pedido", option_label: "Pedido" },
    { option_id: "documento", option_label: "Documento" },
    { option_id: "inventario", option_label: "Inventario" },
    { option_id: "cliente", option_label: "Cliente" },
    { option_id: "producto", option_label: "Producto" },
    { option_id: "estado", option_label: "Estado" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "2.1b": [
    { option_id: "cliente", option_label: "Cliente" },
    { option_id: "proveedor", option_label: "Proveedor" },
    { option_id: "empleado", option_label: "Empleado" },
    { option_id: "departamento", option_label: "Departamento" },
    { option_id: "gerencia", option_label: "Gerencia" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "2.1c": [
    { option_id: "coordinar", option_label: "Coordinar" },
    { option_id: "validar", option_label: "Validar" },
    { option_id: "comunicar", option_label: "Comunicar" },
    { option_id: "preparar", option_label: "Preparar" },
    { option_id: "revisar", option_label: "Revisar" },
    { option_id: "autorizar", option_label: "Autorizar" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "2.1_AB_Relacion": [
    { option_id: "objeto_limita", option_label: "El OBJETO limita" },
    { option_id: "sujeto_limita", option_label: "El SUJETO limita" },
    { option_id: "ambos_igual", option_label: "Ambos limitan igual" },
  ],
  "2.1_AC_Relacion": [
    { option_id: "objeto_limita", option_label: "El OBJETO limita" },
    { option_id: "accion_limita", option_label: "La ACCIÓN limita" },
    { option_id: "ambos_igual", option_label: "Ambos limitan igual" },
  ],
  "2.1_BC_Relacion": [
    { option_id: "sujeto_limita", option_label: "El SUJETO limita" },
    { option_id: "accion_limita", option_label: "La ACCIÓN limita" },
    { option_id: "ambos_igual", option_label: "Ambos limitan igual" },
  ],
  "2.1_ABC_Relacion": [
    { option_id: "objeto", option_label: "El OBJETO" },
    { option_id: "sujeto", option_label: "El SUJETO" },
    { option_id: "accion", option_label: "La ACCIÓN" },
    { option_id: "tres_igual", option_label: "Los tres limitan igual" },
  ],
  "2.1_ABC_Prioridad": [
    { option_id: "objeto", option_label: "Objeto" },
    { option_id: "sujeto", option_label: "Sujeto" },
    { option_id: "accion", option_label: "Acción" },
  ],
  /** Stub mínimo Madre entity_type→attribute_options (Factura) until X4 dynamic catalog. */
  "2.2_obj": [
    { option_id: "estado", option_label: "Estado" },
    { option_id: "monto", option_label: "Monto" },
    { option_id: "propietario", option_label: "Propietario" },
    { option_id: "fecha", option_label: "Fecha" },
    { option_id: "informacion", option_label: "Información" },
    { option_id: "validacion", option_label: "Validación" },
    { option_id: "relacion", option_label: "Relación" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "2.2_suj": [
    { option_id: "estado", option_label: "Estado" },
    { option_id: "informacion", option_label: "Información" },
    { option_id: "propietario", option_label: "Propietario" },
    { option_id: "relacion", option_label: "Relación" },
    { option_id: "clasificacion", option_label: "Clasificación" },
    { option_id: "validacion", option_label: "Validación" },
    { option_id: "acuerdo", option_label: "Acuerdo" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "2.2_acc": [
    { option_id: "frecuencia", option_label: "Frecuencia" },
    { option_id: "complejidad", option_label: "Complejidad" },
    { option_id: "participantes", option_label: "Participantes" },
    { option_id: "duracion", option_label: "Duración" },
    { option_id: "resultado", option_label: "Resultado" },
    { option_id: "documentacion", option_label: "Documentación" },
    { option_id: "escalamiento", option_label: "Escalamiento" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "2.3": [
    { option_id: "pequeno", option_label: "Pequeño" },
    { option_id: "medio", option_label: "Medio" },
    { option_id: "grande", option_label: "Grande" },
    { option_id: "radical", option_label: "Radical" },
  ],
  "2.4a": [
    { option_id: "crear", option_label: "Crear" },
    { option_id: "revisar", option_label: "Revisar" },
    { option_id: "corregir", option_label: "Corregir" },
    { option_id: "aprobar", option_label: "Aprobar" },
    { option_id: "registrar", option_label: "Registrar" },
    { option_id: "enviar", option_label: "Enviar" },
    { option_id: "combinar", option_label: "Combinar" },
    { option_id: "rechazar", option_label: "Rechazar" },
    { option_id: "pausar", option_label: "Pausar o suspender" },
    { option_id: "otra", option_label: "Otra" },
  ],
  "2.4b": [
    { option_id: "solicitud", option_label: "Una solicitud o instrucción" },
    { option_id: "error", option_label: "Un error detectado" },
    { option_id: "fecha_plazo", option_label: "Una fecha o plazo" },
    { option_id: "aprobacion", option_label: "Una aprobación recibida" },
    { option_id: "evento_otro_objeto", option_label: "Un evento o cambio en otro objeto" },
    { option_id: "urgencia", option_label: "Una urgencia o prioridad" },
    { option_id: "estandar", option_label: "Un estándar o política" },
    { option_id: "combinacion", option_label: "Una combinación de los anteriores" },
    { option_id: "otro", option_label: "Otro" },
  ],
  "2.7": [
    { option_id: "una_vez", option_label: "Una sola vez" },
    { option_id: "pocas", option_label: "Pocas veces" },
    { option_id: "muchas", option_label: "Muchas veces" },
    { option_id: "continuo", option_label: "Continuo" },
  ],
  "2.8": [
    { option_id: "2_3", option_label: "2-3 ciclos" },
    { option_id: "4_5", option_label: "4-5 ciclos" },
    { option_id: "6_10", option_label: "6-10 ciclos" },
    { option_id: "mas_10", option_label: "Más de 10 ciclos" },
    { option_id: "variable", option_label: "Variable" },
  ],
  "2.9": [
    {
      option_id: "no_siempre_ok",
      option_label: "No, siempre se transforma correctamente",
    },
    { option_id: "si_raro", option_label: "Sí, a veces falla pero es raro" },
    { option_id: "si_regular", option_label: "Sí, falla regularmente" },
    { option_id: "si_frecuente", option_label: "Sí, falla frecuentemente" },
  ],
  "2.11": [
    { option_id: "no_oficial", option_label: "No, todo lo que ocurre es oficial" },
    {
      option_id: "si_a_veces",
      option_label: "Sí, a veces ocurren cambios no autorizados",
    },
    {
      option_id: "si_frecuente",
      option_label: "Sí, ocurren frecuentemente",
    },
  ],
};

export const B2_BLOCK_META = {
  block: "2" as const,
  canonical_name: "Transformación",
  mother_question: "¿Qué cambia realmente en esta memoria operativa?",
  purpose:
    "Reconstruir sobre qué entidad se trabaja y qué cambio real ocurre en ella, distinguiendo objeto, sujeto, acción, atributos, magnitud, causalidad, estados, iteraciones, excepciones y cambios ocultos.",
  frame_line:
    "Ahora miramos qué cambia realmente en esta actividad. Responde lo que ves abajo.",
  madre_docx_sha256:
    "0E134EE7E73DBB4B5B54A833712E2D15B5F03BCAF84219A50B21AB0E7CCD38CC",
} as const;

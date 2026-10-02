import {
  isCanvasWorkMapArea,
  normalizeCanvasWorkMapAreaLabel,
  type CanvasWorkMapArea,
} from "@/config/canvas-work-map-areas";

/** Placeholders genéricos — islas adicionales del mismo rol o roles no listados. */
export const WORKMAP_GENERIC_RESPONSIBILITY_PLACEHOLDER =
  "Redacta una responsabilidad concreta de tu trabajo";

export const WORKMAP_GENERIC_ACTIVITY_PLACEHOLDER =
  "Redacta una actividad concreta de tu trabajo";

export type WorkMapRoleRedactionExample = {
  responsibility: string;
  activities: [string, string];
};

/**
 * Ejemplos canónicos por rol — Guía de ejemplos para definir roles funcionales.
 * Referencia de forma y alcance; no se precargan como valor del usuario.
 */
export const WORKMAP_ROLE_REDACTION_EXAMPLES = {
  "Marketing / Comunicación": {
    responsibility:
      "Yo defino los mensajes y prioridades de comunicación que orientan la generación de oportunidades comerciales, conforme al posicionamiento y al mercado objetivo de la empresa, sin prometer capacidades que la operación no pueda sostener.",
    activities: [
      "Analizar el perfil del cliente y la oferta disponible utilizando información comercial y criterios de posicionamiento, para establecer mensajes y contenidos dirigidos al mercado objetivo.",
      "Coordinar la publicación de contenidos y campañas utilizando el calendario de comunicación y los materiales aprobados, para generar contactos comerciales trazables.",
    ],
  },
  "Ventas / Comercial": {
    responsibility:
      "Yo gestiono las oportunidades comerciales y las propuestas para convertir las necesidades del cliente en pedidos viables, conforme a las políticas comerciales y al margen objetivo, sin comprometer condiciones que la empresa no pueda cumplir.",
    activities: [
      "Levantar los requerimientos del cliente utilizando el formato comercial y los criterios de entrevista, para generar una solicitud de propuesta completa.",
      "Elaborar la cotización utilizando los costos disponibles, los precios de referencia y el margen objetivo, para presentar una propuesta comercial al cliente.",
    ],
  },
  "Diseño / Ingeniería": {
    responsibility:
      "Yo traduzco los requerimientos del cliente en soluciones visuales y técnicas fabricables, conforme a las especificaciones aprobadas y a las restricciones de producción, sin liberar información que contenga inconsistencias.",
    activities: [
      "Interpretar los requerimientos y medidas del proyecto utilizando la información comercial y los criterios de diseño, para generar una propuesta visual alineada con la necesidad del cliente.",
      "Desarrollar el constructivo y los detalles técnicos conforme a la propuesta aprobada y a las condiciones de fabricación, para entregar documentación lista para revisión y producción.",
    ],
  },
  "I+D / Innovación": {
    responsibility:
      "Yo priorizo mejoras y nuevas soluciones que incrementan el valor entregado al cliente o la capacidad de respuesta de la empresa, conforme a la estrategia y a la evidencia disponible, sin desviar recursos de las necesidades operativas críticas.",
    activities: [
      "Investigar materiales, soluciones y prácticas utilizando fuentes técnicas y referencias del mercado, para formular alternativas de mejora evaluables.",
      "Prototipar una solución utilizando los criterios técnicos y las restricciones identificadas, para obtener evidencia de desempeño antes de recomendar su adopción.",
    ],
  },
  "Compras / Abastecimiento": {
    responsibility:
      "Yo aseguro la disponibilidad de materiales, productos y servicios requeridos por los pedidos, conforme a las especificaciones aprobadas, los costos autorizados y los tiempos comprometidos, sin aceptar condiciones que pongan en riesgo la rentabilidad o la entrega.",
    activities: [
      "Solicitar cotizaciones de materiales y servicios utilizando la requisición y las especificaciones del proyecto, para integrar alternativas comparables de abastecimiento.",
      "Confirmar la compra utilizando la opción autorizada, la orden de compra y las condiciones negociadas, para generar un compromiso de suministro verificable.",
    ],
  },
  "Operaciones / Producción": {
    responsibility:
      "Yo coordino la transformación de materiales y componentes en productos conformes con el diseño aprobado, conforme a la capacidad, los estándares de fabricación y la prioridad de los pedidos, sin liberar unidades que incumplan los criterios de calidad.",
    activities: [
      "Preparar la orden de trabajo utilizando el constructivo, los materiales disponibles y la programación operativa, para habilitar la fabricación del pedido.",
      "Verificar el producto elaborado utilizando los criterios de inspección y las especificaciones aprobadas, para liberar una unidad lista para entrega o registrar una corrección.",
    ],
  },
  "Logística / Entrega": {
    responsibility:
      "Yo coordino la entrega e instalación de los pedidos con base en la programación operativa y los compromisos acordados con el cliente, sin exceder la capacidad disponible.",
    activities: [
      "Confirmar el pedido, la dirección y la fecha comprometida utilizando la orden aprobada y el formato de confirmación, para generar una agenda de instalación actualizada.",
      "Programar la salida de materiales y la cuadrilla utilizando la agenda de instalación y la disponibilidad logística, para emitir una orden de entrega lista para ejecución.",
    ],
  },
  "Servicio al Cliente / Postventa": {
    responsibility:
      "Yo resuelvo los requerimientos posteriores a la entrega que correspondan a la empresa, conforme a las condiciones ofrecidas y a los criterios de atención, sin asumir fallas o compromisos que no hayan sido verificados.",
    activities: [
      "Registrar la solicitud del cliente utilizando el canal de atención y los datos del pedido, para generar un caso de postventa con trazabilidad.",
      "Diagnosticar la incidencia utilizando la evidencia disponible y los criterios de garantía o servicio, para definir una respuesta y una acción de atención verificable.",
    ],
  },
  "Dirección / Gobierno": {
    responsibility:
      "Yo establezco las decisiones y prioridades que mantienen integrada la operación de la empresa, conforme a su propósito, capacidades y compromisos, sin sustituir innecesariamente la discrecionalidad de quienes ejecutan.",
    activities: [
      "Revisar el desempeño de la empresa utilizando indicadores, excepciones y reportes de operación, para identificar decisiones de conducción requeridas.",
      "Autorizar prioridades y cursos de acción utilizando los criterios estratégicos y las restricciones vigentes, para orientar la respuesta coordinada de las áreas.",
    ],
  },
  "Planeación / Estrategia": {
    responsibility:
      "Yo defino y actualizo las prioridades que orientan la adaptación futura de la empresa, conforme a las señales del entorno, la identidad organizacional y las capacidades disponibles, sin separar la estrategia de las condiciones reales de ejecución.",
    activities: [
      "Analizar tendencias, clientes y capacidades utilizando información interna y señales del entorno, para identificar oportunidades, riesgos y supuestos estratégicos.",
      "Traducir las prioridades estratégicas en objetivos y criterios de seguimiento utilizando la capacidad operativa disponible, para generar una agenda de adaptación verificable.",
    ],
  },
  "Finanzas / Tesorería / Contabilidad": {
    responsibility:
      "Yo preservo la disponibilidad y trazabilidad de los recursos financieros que sostienen la operación, conforme a los presupuestos, compromisos y obligaciones aplicables, sin autorizar movimientos que carezcan de respaldo verificable.",
    activities: [
      "Registrar ingresos, egresos y compromisos utilizando los comprobantes y criterios contables establecidos, para mantener información financiera actualizada.",
      "Programar pagos y cobros utilizando el flujo de efectivo y las fechas comprometidas, para coordinar las obligaciones financieras prioritarias.",
    ],
  },
  "Gestión de Talento (RRHH)": {
    responsibility:
      "Yo aseguro que la empresa cuente con personas capaces y condiciones de trabajo coherentes con sus necesidades operativas, conforme a los perfiles, acuerdos y normas aplicables, sin incorporar o sostener asignaciones que excedan la capacidad de gestión disponible.",
    activities: [
      "Identificar requerimientos de personal utilizando los perfiles funcionales y la planeación operativa, para generar una solicitud de cobertura priorizada.",
      "Dar seguimiento al desempeño y desarrollo utilizando acuerdos de responsabilidad y evidencias de trabajo, para definir acciones de acompañamiento o mejora.",
    ],
  },
  "Tecnología / Infraestructura": {
    responsibility:
      "Yo mantengo disponibles las herramientas tecnológicas y la información que habilitan la operación, conforme a las necesidades de los procesos y a los criterios de seguridad, sin introducir soluciones que no puedan sostenerse o integrarse.",
    activities: [
      "Revisar las necesidades de usuarios y procesos utilizando incidencias y requerimientos documentados, para priorizar ajustes o soluciones tecnológicas.",
      "Configurar o mantener la herramienta utilizando los parámetros autorizados y controles de seguridad, para entregar un servicio tecnológico disponible y verificable.",
    ],
  },
  "Mantenimiento / Facilities": {
    responsibility:
      "Yo mantengo disponibles las instalaciones, equipos y espacios necesarios para la operación, conforme a los programas de mantenimiento y a las condiciones de seguridad establecidas, sin permitir que una falla detenga la continuidad operativa.",
    activities: [
      "Inspeccionar las instalaciones y los equipos utilizando el programa de mantenimiento y la lista de verificación, para generar un reporte de condiciones y fallas detectadas.",
      "Ejecutar el mantenimiento preventivo o correctivo conforme a las especificaciones técnicas y prioridades operativas, para restablecer la disponibilidad del equipo o espacio intervenido.",
    ],
  },
  "Calidad / Mejora Continua": {
    responsibility:
      "Yo sostengo los criterios de conformidad y mejora que permiten aprender de las desviaciones de la operación, conforme a las especificaciones, acuerdos y evidencias disponibles, sin convertir el control en una barrera que impida responder al cliente.",
    activities: [
      "Analizar las desviaciones de productos y procesos utilizando registros de inspección y criterios de causa, para identificar oportunidades de corrección y aprendizaje.",
      "Verificar la eficacia de las acciones utilizando indicadores y evidencias posteriores a la intervención, para actualizar el estándar o cerrar la desviación.",
    ],
  },
} satisfies Record<CanvasWorkMapArea, WorkMapRoleRedactionExample>;

export type WorkMapRoleRedactionPlaceholders = {
  responsibility: string;
  activities: [string, string];
};

export function isWorkMapRoleRedactionExampleVisible(
  area: string,
  areaResponsibilityIndex: number,
): boolean {
  if (areaResponsibilityIndex > 0) return false;
  return isCanvasWorkMapArea(area);
}

export function getWorkMapRoleRedactionPlaceholders(
  area: string,
  areaResponsibilityIndex: number,
): WorkMapRoleRedactionPlaceholders {
  if (areaResponsibilityIndex > 0) {
    return {
      responsibility: WORKMAP_GENERIC_RESPONSIBILITY_PLACEHOLDER,
      activities: [
        `1. ${WORKMAP_GENERIC_ACTIVITY_PLACEHOLDER}`,
        `2. ${WORKMAP_GENERIC_ACTIVITY_PLACEHOLDER}`,
      ],
    };
  }

  const normalized = normalizeCanvasWorkMapAreaLabel(area);
  const example =
    WORKMAP_ROLE_REDACTION_EXAMPLES[normalized as CanvasWorkMapArea] ?? null;

  if (!example) {
    return {
      responsibility: WORKMAP_GENERIC_RESPONSIBILITY_PLACEHOLDER,
      activities: [
        `1. ${WORKMAP_GENERIC_ACTIVITY_PLACEHOLDER}`,
        `2. ${WORKMAP_GENERIC_ACTIVITY_PLACEHOLDER}`,
      ],
    };
  }

  return {
    responsibility: `Ej. ${example.responsibility}`,
    activities: [
      `1. Ej. ${example.activities[0]}`,
      `2. Ej. ${example.activities[1]}`,
    ],
  };
}

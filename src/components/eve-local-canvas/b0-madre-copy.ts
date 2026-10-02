/**
 * Madre-authoritative visible copy for Bloque 0 codes.
 * Source: Bloque_0_Documento_Madre_Capa1_v2_1_EVE_rev4_redisenado_robusto.docx
 * Materialization order / composition: Arquitectura_Runtime_40_20 (B0-Q01…Q04).
 */

/** Runtime B0-Q04 ← Madre 0.6 */
export const B0_Q06 = {
  code: "0.6",
  question: "¿Qué recibes, ves o necesitas para empezar esta actividad?",
  shortLabel: "Para empezar",
  help: "Piensa en la señal mínima. Ejemplos: llega una solicitud, aparece una factura, recibes una alerta, se aprueba un caso, alguien te pide corrección.",
} as const;

/** Runtime B0-Q04 ← Madre 0.7 */
export const B0_Q07 = {
  code: "0.7",
  question: "¿Qué queda listo para darla por terminada?",
  shortLabel: "Para terminar",
  help: "No hace falta explicar todavía quién lo recibe. Solo qué debe quedar listo. Ejemplos: factura validada, cita confirmada, pedido liberado, reporte enviado, caso marcado para revisión.",
} as const;

/** Runtime B0-Q04 aclaración ← Madre 0.B */
export const B0_QB = {
  code: "0.B",
  question:
    "Parece que el inicio y el cierre se mezclan. Completa: empieza cuando ___ y termina cuando ___.",
  shortLabel: "Aclarar inicio y cierre",
  help: "Buscamos el borde práctico de la actividad, no una explicación perfecta. Ejemplo: “empieza cuando recibo la factura; termina cuando queda marcada para pago”.",
  trenchLead: "Nos está saliendo cruzada esta actividad.",
  landing:
    "A lo que me refiero es: el inicio y el cierre se parecen tanto que no queda claro dónde empieza ni dónde termina.",
} as const;

export type B0BoundariesConfirmPayload = {
  start_condition: string;
  end_result: string;
  clarification_0b: string | null;
  clarification_required: boolean;
};

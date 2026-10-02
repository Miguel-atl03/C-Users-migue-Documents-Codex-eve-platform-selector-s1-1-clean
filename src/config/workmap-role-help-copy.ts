/** Copy inscrito — IBM Plex Mono; ayuda contextual del portal de rol funcional. */

/** Tipografía canónica (referencia visual): IBM Plex Mono 400 · 11px · line-height 1.22 · letter-spacing 0 */
export const WORKMAP_ROLE_HELP_TYPOGRAPHY = {
  fontFamily: "IBM Plex Mono",
  fontSize: "11px",
  lineHeight: 1.22,
  letterSpacing: "0",
  paragraphGap: "28px",
  closeMarginTop: "36px",
  closeFontSize: "7px",
} as const;

export const WORKMAP_ROLE_HELP_PARAGRAPHS = [
  "Elige el rol funcional que mejor describa las decisiones y resultados que produces en la empresa. Puedes seleccionar uno o varios si desempeñas funciones diferentes.",
  "Escribe qué decides o sostienes en ese rol usando: Yo (tú, dentro de ese rol) + verbo verificable (acción concreta que puedes comprobar) + asunto u objeto que queda bajo tu criterio o responsabilidad + reglas y condiciones que debes seguir + límites que debes respetar. Esto te ayudará a expresar las responsabilidades que asumes dentro de tu rol funcional.",
  "Describe qué haces para cumplir esa responsabilidad usando: Verbo operativo (acción que realizas) + información o elemento sobre el que trabajas + cómo lo haces (procedimiento / estándar o forma establecida de realizarlo) + producto o resultado que generas o entregas. Esto te ayudará a identificar las actividades que realizas para responder por esa responsabilidad.",
] as const;
/** Opción 1: materialidad en perímetro del portal, mapa visible. Opción 2: void total. */
export type WorkMapRoleHelpVariant = "edges" | "voidTotal";

/** Lienzo oficial — void total (opción 2). */
export const WORKMAP_ROLE_HELP_CANVAS_VARIANT: WorkMapRoleHelpVariant = "voidTotal";

export type WorkMapRoleHelpMaterialityShard = {
  id: string;
  label: string;
  placement: string;
  emphasis?: boolean;
};

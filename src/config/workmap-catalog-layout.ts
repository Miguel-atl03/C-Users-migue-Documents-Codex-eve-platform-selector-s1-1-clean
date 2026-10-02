import {
  CANVAS_WORK_MAP_PRIMARY_AREAS,
  CANVAS_WORK_MAP_SECONDARY_AREAS,
  normalizeCanvasWorkMapAreaLabel,
  type CanvasWorkMapArea,
  type CanvasWorkMapPrimaryArea,
  type CanvasWorkMapSecondaryArea,
} from "@/config/canvas-work-map-areas";

export const WORKMAP_UBICACION_QUESTION =
  "¿Qué función realizas directamente?";

export const WORKMAP_UBICACION_WHISPER =
  "Marca las funciones que realizas habitualmente, no las áreas con las que colaboras.";

export const WORKMAP_CATALOG_EXTENDED_WHISPER =
  "Estas funciones también forman parte del catálogo.";

export const WORKMAP_CATALOG_UNLISTED_WHISPER =
  "Usa esto solo si tu rol no aparece en el catálogo.";

export const WORKMAP_MAX_DECLARED_AREAS = 3;

export type WorkMapCatalogView = "primary" | "secondary";

/**
 * Cuadrantes autorizados del mock v6 secuencial — sin redefinir coordenadas.
 * @see deliverables/design/eve-v6-secuencial-mock.html
 */
export type WorkMapCatalogInscriptionLayout =
  | "catM1"
  | "catM2"
  | "catM3"
  | "catM4"
  | "catM5"
  | "catM6"
  | "catM7"
  | "catM8"
  | "catM9"
  | "catM10"
  | "catM11";

/** Primarios — cuadrantes fijos del mock v6; entradas nuevas ocupan slots libres (catM6, catM7). */
const WORKMAP_PRIMARY_LAYOUT: Record<CanvasWorkMapPrimaryArea, WorkMapCatalogInscriptionLayout> = {
  "Operaciones / Producción": "catM1",
  "Ventas / Comercial": "catM2",
  "Logística / Entrega": "catM3",
  "Diseño / Ingeniería": "catM4",
  "Compras / Abastecimiento": "catM5",
  "I+D / Innovación": "catM6",
  "Servicio al Cliente / Postventa": "catM7",
  "Marketing / Comunicación": "catM9",
};

/** Secundarios — mismos cuadrantes heredados del catálogo anterior. */
const WORKMAP_SECONDARY_LAYOUT: Record<
  CanvasWorkMapSecondaryArea,
  WorkMapCatalogInscriptionLayout
> = {
  "Dirección / Gobierno": "catM8",
  "Planeación / Estrategia": "catM10",
  "Finanzas / Tesorería / Contabilidad": "catM6",
  "Gestión de Talento (RRHH)": "catM5",
  "Tecnología / Infraestructura": "catM7",
  "Mantenimiento / Facilities": "catM1",
  "Calidad / Mejora Continua": "catM2",
};

/** Conmutador Otra área / [ − ] — hereda catM11 del mock autorizado. */
export const WORKMAP_CATALOG_TOGGLE_INSCRIPTION: WorkMapCatalogInscriptionLayout = "catM11";

/** Rol no listado — solo en vista extendida; cuadrante catM3 (libre en secundarios). */
export const WORKMAP_CATALOG_UNLISTED_INSCRIPTION: WorkMapCatalogInscriptionLayout = "catM3";

/** @deprecated Usar WORKMAP_CATALOG_TOGGLE_INSCRIPTION */
export const WORKMAP_CATALOG_OTHER_INSCRIPTION = WORKMAP_CATALOG_TOGGLE_INSCRIPTION;

function isDeclaredArea(area: string, declaredAreas: readonly string[]): boolean {
  const normalized = normalizeCanvasWorkMapAreaLabel(area);
  return declaredAreas.some(
    (declared) => normalizeCanvasWorkMapAreaLabel(declared) === normalized,
  );
}

export function listWorkMapCatalogPrimaryAreas(
  declaredAreas: readonly string[],
): CanvasWorkMapPrimaryArea[] {
  return CANVAS_WORK_MAP_PRIMARY_AREAS.filter((area) => !isDeclaredArea(area, declaredAreas));
}

export function listWorkMapCatalogSecondaryAreas(
  declaredAreas: readonly string[],
): CanvasWorkMapSecondaryArea[] {
  return CANVAS_WORK_MAP_SECONDARY_AREAS.filter((area) => !isDeclaredArea(area, declaredAreas));
}

/** @deprecated Usar listWorkMapCatalogPrimaryAreas / listWorkMapCatalogSecondaryAreas */
export function listWorkMapCatalogAreas(
  declaredAreas: readonly string[],
): CanvasWorkMapArea[] {
  return [
    ...listWorkMapCatalogPrimaryAreas(declaredAreas),
    ...listWorkMapCatalogSecondaryAreas(declaredAreas),
  ];
}

export function getWorkMapCatalogInscriptionLayout(
  area: CanvasWorkMapArea | string,
): WorkMapCatalogInscriptionLayout {
  const normalized = normalizeCanvasWorkMapAreaLabel(area);
  if ((CANVAS_WORK_MAP_PRIMARY_AREAS as readonly string[]).includes(normalized)) {
    return WORKMAP_PRIMARY_LAYOUT[normalized as CanvasWorkMapPrimaryArea];
  }
  if ((CANVAS_WORK_MAP_SECONDARY_AREAS as readonly string[]).includes(normalized)) {
    return WORKMAP_SECONDARY_LAYOUT[normalized as CanvasWorkMapSecondaryArea];
  }
  return WORKMAP_CATALOG_UNLISTED_INSCRIPTION;
}

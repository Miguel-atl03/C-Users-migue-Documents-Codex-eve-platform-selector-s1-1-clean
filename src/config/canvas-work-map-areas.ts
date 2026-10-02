/**
 * Catálogo canónico de rol funcional — lienzo oficial WorkMap.
 * Fuente rectora: Guía de ejemplos para definir roles funcionales (Organimuebles · EVE Fase 1).
 * Primarios = procesos macro · Secundarios = procesos de soporte (void extendido vía "Otra área").
 */
export const CANVAS_WORK_MAP_PRIMARY_AREAS = [
  "Marketing / Comunicación",
  "Ventas / Comercial",
  "Diseño / Ingeniería",
  "I+D / Innovación",
  "Compras / Abastecimiento",
  "Operaciones / Producción",
  "Logística / Entrega",
  "Servicio al Cliente / Postventa",
] as const;

export const CANVAS_WORK_MAP_SECONDARY_AREAS = [
  "Dirección / Gobierno",
  "Planeación / Estrategia",
  "Finanzas / Tesorería / Contabilidad",
  "Gestión de Talento (RRHH)",
  "Tecnología / Infraestructura",
  "Mantenimiento / Facilities",
  "Calidad / Mejora Continua",
] as const;

export const CANVAS_WORK_MAP_AREAS = [
  ...CANVAS_WORK_MAP_PRIMARY_AREAS,
  ...CANVAS_WORK_MAP_SECONDARY_AREAS,
] as const;

export type CanvasWorkMapPrimaryArea = (typeof CANVAS_WORK_MAP_PRIMARY_AREAS)[number];
export type CanvasWorkMapSecondaryArea = (typeof CANVAS_WORK_MAP_SECONDARY_AREAS)[number];
export type CanvasWorkMapArea = (typeof CANVAS_WORK_MAP_AREAS)[number];

/** Etiquetas históricas → forma canónica del catálogo vigente. */
const CANVAS_WORK_MAP_AREA_LEGACY_ALIASES: Record<string, CanvasWorkMapArea> = {
  "Finanzas y Tesorería": "Finanzas / Tesorería / Contabilidad",
  "Finanzas / Tesorería": "Finanzas / Tesorería / Contabilidad",
  "Tecnología e Infraestructura": "Tecnología / Infraestructura",
  "Planeación y Estrategia": "Planeación / Estrategia",
  "Gestión de Talento": "Gestión de Talento (RRHH)",
  "Administración / Legal": "Dirección / Gobierno",
  "Marketing Estratégico": "Marketing / Comunicación",
};

export function normalizeCanvasWorkMapAreaLabel(area: string): string {
  const trimmed = area.trim();
  return CANVAS_WORK_MAP_AREA_LEGACY_ALIASES[trimmed] ?? trimmed;
}

export function isCanvasWorkMapArea(area: string): boolean {
  const normalized = normalizeCanvasWorkMapAreaLabel(area);
  return (CANVAS_WORK_MAP_AREAS as readonly string[]).includes(normalized);
}

export function isCanvasWorkMapPrimaryArea(area: string): boolean {
  const normalized = normalizeCanvasWorkMapAreaLabel(area);
  return (CANVAS_WORK_MAP_PRIMARY_AREAS as readonly string[]).includes(normalized);
}

export function isCanvasWorkMapSecondaryArea(area: string): boolean {
  const normalized = normalizeCanvasWorkMapAreaLabel(area);
  return (CANVAS_WORK_MAP_SECONDARY_AREAS as readonly string[]).includes(normalized);
}

export function getCanvasWorkMapAreaTier(
  area: string,
): "primary" | "secondary" | "custom" {
  if (isCanvasWorkMapPrimaryArea(area)) return "primary";
  if (isCanvasWorkMapSecondaryArea(area)) return "secondary";
  return "custom";
}

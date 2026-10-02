export const PREDEFINED_WORK_MAP_AREAS = [
  "Venta",
  "Logística",
  "Producción",
  "Administración",
  "Recursos humanos",
] as const;

export type WorkMapPredefinedArea = (typeof PREDEFINED_WORK_MAP_AREAS)[number];

/** Conmutador del void: muestra catálogo secundario. No es selección de rol. */
export const OTHER_AREA_CHIP_LABEL = "Otra área";

/** Entrada libre cuando el rol no está en el catálogo canónico. */
export const UNLISTED_ROLE_CHIP_LABEL = "Rol no listado";

/** @deprecated Usar PREDEFINED_WORK_MAP_AREAS */
export const WORK_MAP_PREDEFINED_AREAS = PREDEFINED_WORK_MAP_AREAS;

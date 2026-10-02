import type { WorkMapRoleHelpMaterialityShard } from "@/config/workmap-role-help-copy";
import { OTHER_AREA_CHIP_LABEL } from "@/config/work-map-areas";
import { WORKMAP_UBICACION_QUESTION } from "@/config/workmap-catalog-layout";

const PLACEMENTS = {
  top: ["workmapRoleHelpShardT1", "workmapRoleHelpShardT2", "workmapRoleHelpShardT3", "workmapRoleHelpShardT4", "workmapRoleHelpShardT5"],
  bottom: ["workmapRoleHelpShardB1", "workmapRoleHelpShardB2", "workmapRoleHelpShardB3", "workmapRoleHelpShardB4"],
  left: ["workmapRoleHelpShardL1", "workmapRoleHelpShardL2", "workmapRoleHelpShardL3"],
  right: ["workmapRoleHelpShardR1", "workmapRoleHelpShardR2", "workmapRoleHelpShardR3"],
} as const;

function distributeLabels(
  labels: string[],
  placements: readonly string[],
  emphasisIndexes: Set<number> = new Set(),
): WorkMapRoleHelpMaterialityShard[] {
  if (labels.length === 0) {
    return [];
  }

  return labels.slice(0, placements.length).map((label, index) => ({
    id: `${placements[index]}-${label}`,
    label,
    placement: placements[index]!,
    emphasis: emphasisIndexes.has(index),
  }));
}

export function buildWorkMapRoleHelpMaterialityShards(input: {
  catalogAreas: string[];
  declaredAreas: string[];
  activeArea: string | null;
  footerWhisper: string;
}): WorkMapRoleHelpMaterialityShard[] {
  const { catalogAreas, declaredAreas, activeArea, footerWhisper } = input;

  const topLabels = catalogAreas.slice(0, PLACEMENTS.top.length);
  const bottomLabels = [
    "Redacta Una Actividad Concreta",
    "+ Agregar Actividad",
    "Responsabilidad",
    footerWhisper.length > 48 ? "Guardar" : footerWhisper,
  ];

  const leftLabels = [
    declaredAreas[0] ?? "Funciones Que Realizas",
    WORKMAP_UBICACION_QUESTION.slice(0, 28),
    OTHER_AREA_CHIP_LABEL,
  ];

  const rightLabels = [
    declaredAreas[1] ?? declaredAreas[0] ?? "De Qué Respondes",
    "De Qué Respondes",
    activeArea ? `Isla · ${activeArea}` : "Isla Latente",
  ];

  const topEmphasis = new Set<number>(declaredAreas[0] ? [1] : []);
  const bottomEmphasis = new Set<number>([1]);
  const leftEmphasis = new Set<number>(declaredAreas[0] ? [0] : []);
  const rightEmphasis = new Set<number>(declaredAreas[1] ? [0] : declaredAreas[0] ? [0] : []);

  return [
    ...distributeLabels(topLabels, PLACEMENTS.top, topEmphasis),
    ...distributeLabels(bottomLabels, PLACEMENTS.bottom, bottomEmphasis),
    ...distributeLabels(leftLabels, PLACEMENTS.left, leftEmphasis),
    ...distributeLabels(rightLabels, PLACEMENTS.right, rightEmphasis),
  ];
}

export type WorkMapRoleHelpShardPlacement =
  (typeof PLACEMENTS)[keyof typeof PLACEMENTS][number];

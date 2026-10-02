import {
  buildDeclaredAreaContext,
  getActivityText,
  type ActivityDeclaredContext,
  type WorkMapData,
} from "@/domain/local-work-map";
import type { Activity } from "@/lib/types";

export type FlattenedWorkMapActivity = Activity & {
  declaredContext: ActivityDeclaredContext;
};

export function flattenWorkMapToActivities(
  workMap: WorkMapData,
): FlattenedWorkMapActivity[] {
  const timestamp = Date.now();
  const declaredAreaContext = buildDeclaredAreaContext(workMap);
  let activityIndex = 0;

  return workMap.responsibilities.flatMap((responsibility) => {
    const declaredResponsibilityContext = responsibility.text.trim();

    return responsibility.activities
      .map((activity) => getActivityText(activity).trim())
      .filter(Boolean)
      .map((title) => {
        const currentIndex = activityIndex;
        activityIndex += 1;

        return {
          id: `wm-${timestamp}-${currentIndex}`,
          title,
          narrativeAnchor: title,
          origin: "usuario_redactada" as const,
          accepted: true,
          critical: false,
          interconnectionScore: Math.max(1, 5 - currentIndex),
          declaredContext: {
            declared_area_context: declaredAreaContext,
            declared_responsibility_context: declaredResponsibilityContext,
            responsibility_id: responsibility.id,
            area_status: "declared_unconfirmed" as const,
            responsibility_status: "declared_unconfirmed" as const,
          },
        };
      });
  });
}

import { buildOperationalDescriptionCoachMessage } from "./build-coach-message.ts";
import { inferCyberneticComponentsFromScan } from "./cybernetic-coach-fallback.ts";
import { hasEstablishedActivityContext } from "./narrative-coach-policy.ts";
import { scanOperationalDescription } from "./scan-operational-description.ts";
import type {
  OperationalDescriptionCoachResult,
  OperationalDescriptionContext,
} from "./types.ts";

const MIN_TEXT_LENGTH_FOR_COACH = 8;

export function evaluateOperationalDescriptionCoach(
  text: string,
  context: OperationalDescriptionContext = {},
): OperationalDescriptionCoachResult {
  const trimmed = text.trim();
  const scan = scanOperationalDescription(trimmed);

  if (!trimmed) {
    return {
      scan,
      message: null,
      exampleFragment: null,
    };
  }

  if (trimmed.length < MIN_TEXT_LENGTH_FOR_COACH && scan.sufficiency === "insufficient") {
    return {
      scan,
      message: null,
      exampleFragment: null,
    };
  }

  const { message, exampleFragment } = buildOperationalDescriptionCoachMessage(
    scan,
    context,
    trimmed,
  );

  const cyberneticEvaluation = hasEstablishedActivityContext(context)
    ? inferCyberneticComponentsFromScan(scan, trimmed)
    : undefined;

  return {
    scan,
    message,
    exampleFragment,
    cyberneticEvaluation,
  };
}

export { scanOperationalDescription } from "./scan-operational-description.ts";
export type {
  OperationalDescriptionCoachResult,
  OperationalDescriptionContext,
  OperationalDescriptionScan,
} from "./types.ts";

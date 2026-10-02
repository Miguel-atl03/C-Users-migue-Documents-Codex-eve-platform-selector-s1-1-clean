import {
  inferCyberneticComponentsFromScan,
  isCyberneticPathComplete,
} from "./cybernetic-coach-fallback.ts";
import type { OperationalDescriptionScan } from "./types.ts";

export function isPedagogicalPathComplete(
  scan: OperationalDescriptionScan,
  draftText = "",
): boolean {
  return isCyberneticPathComplete(scan, draftText);
}

export { inferCyberneticComponentsFromScan };

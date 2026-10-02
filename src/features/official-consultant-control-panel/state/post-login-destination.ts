/**
 * Post-login destination resolution for official platform auth.
 * Consultant capability = ≥1 enabled row in consultant_company_assignments
 * (surfaced via GET client-companies). Not a role flag, not email-based.
 */

import { OFFICIAL_PANEL_PATH_PREFIX } from "./official-panel-login-redirect";

export { OFFICIAL_PANEL_PATH_PREFIX };

export type PostLoginAccessKind =
  | "consultant"
  | "operative"
  | "unauthorized";

export type PostLoginDestination = {
  kind: PostLoginAccessKind;
  href: string;
};

export const OFFICIAL_PANEL_DEFAULT_HREF =
  "/admin/official-consultant-control-panel";

export const ACCESS_DENIED_HREF = "/access-denied";

export function classifyConsultantAccessFromCompanies(
  companies: unknown,
): PostLoginAccessKind {
  if (!Array.isArray(companies)) return "unauthorized";
  if (companies.length > 0) return "consultant";
  return "operative";
}

/**
 * Resolve where the authenticated user should go.
 * - panelReturnPath only honored for consultants (capability validated)
 * - operative users never enter the official panel via returnTo
 */
export function resolvePostLoginDestination(input: {
  kind: PostLoginAccessKind;
  panelReturnPath: string | null;
}): PostLoginDestination {
  if (input.kind === "consultant") {
    return {
      kind: "consultant",
      href: input.panelReturnPath ?? OFFICIAL_PANEL_DEFAULT_HREF,
    };
  }
  if (input.kind === "operative") {
    if (input.panelReturnPath) {
      return { kind: "unauthorized", href: ACCESS_DENIED_HREF };
    }
    return { kind: "operative", href: "/" };
  }
  return { kind: "unauthorized", href: ACCESS_DENIED_HREF };
}

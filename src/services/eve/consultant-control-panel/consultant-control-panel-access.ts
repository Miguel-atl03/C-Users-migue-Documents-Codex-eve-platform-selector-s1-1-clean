import type { ConsultantControlPanelRole } from "./consultant-control-panel-types";

export const CONSULTANT_ACCESS_HEADER = "x-eve-consultant-access";
export const CONSULTANT_ROLE_HEADER = "x-eve-consultant-role";
export const CLIENT_SURFACE_HEADER = "x-eve-surface";

const ALLOWED_ROLES = new Set<ConsultantControlPanelRole>([
  "consultant",
  "operator",
  "supervisor",
  "auditor",
]);

export type ConsultantAccessResult =
  | {
      ok: true;
      role: ConsultantControlPanelRole;
      mode: "token";
    }
  | {
      ok: false;
      status: 401 | 403;
      error: "client_access_blocked" | "missing_consultant_access" | "invalid_consultant_access";
      consultant_safe_message: string;
    };

export function parseConsultantRole(value: string | null): ConsultantControlPanelRole | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase() as ConsultantControlPanelRole;
  return ALLOWED_ROLES.has(normalized) ? normalized : null;
}

/**
 * Private consultant/operator gate for control panel BFF and page.
 * Client surface is always rejected. No service_role. No production mutation.
 * Access only via expected access-token match — no role-header-only bypass.
 */
export function assertConsultantControlPanelAccess(
  request: Request,
  env?: NodeJS.ProcessEnv,
): ConsultantAccessResult {
  const surface = (request.headers.get(CLIENT_SURFACE_HEADER) ?? "").trim().toLowerCase();
  if (surface === "client" || surface === "cliente") {
    return {
      ok: false,
      status: 403,
      error: "client_access_blocked",
      consultant_safe_message:
        "Esta superficie es interna del consultor experto EVE. El usuario cliente no puede acceder.",
    };
  }

  const roleHeader = parseConsultantRole(request.headers.get(CONSULTANT_ROLE_HEADER));
  const accessToken = request.headers.get(CONSULTANT_ACCESS_HEADER)?.trim() ?? "";
  const expectedToken = (
    env
      ? env.EVE_CONSULTANT_CONTROL_PANEL_ACCESS_TOKEN
      : process.env.EVE_CONSULTANT_CONTROL_PANEL_ACCESS_TOKEN
  )?.trim() || undefined;

  if (expectedToken) {
    if (!accessToken || accessToken !== expectedToken) {
      return {
        ok: false,
        status: 401,
        error: "invalid_consultant_access",
        consultant_safe_message: "Se requiere acceso de consultor/operador interno autorizado.",
      };
    }
    return {
      ok: true,
      role: roleHeader ?? "consultant",
      mode: "token",
    };
  }

  return {
    ok: false,
    status: 401,
    error: "missing_consultant_access",
    consultant_safe_message: "Se requiere acceso de consultor/operador interno autorizado.",
  };
}

export function assertPageConsultantAccess(input: {
  surface?: string | null;
  role?: string | null;
  accessToken?: string | null;
  env?: NodeJS.ProcessEnv;
}): ConsultantAccessResult {
  const headers = new Headers();
  if (input.surface) headers.set(CLIENT_SURFACE_HEADER, input.surface);
  if (input.role) headers.set(CONSULTANT_ROLE_HEADER, input.role);
  if (input.accessToken) headers.set(CONSULTANT_ACCESS_HEADER, input.accessToken);
  if (input.env) {
    return assertConsultantControlPanelAccess(
      new Request("https://eve.local/admin/consultant-control-panel", { headers }),
      input.env,
    );
  }
  return assertConsultantControlPanelAccess(
    new Request("https://eve.local/admin/consultant-control-panel", { headers }),
  );
}

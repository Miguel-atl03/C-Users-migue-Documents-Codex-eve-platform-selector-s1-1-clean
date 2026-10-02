/**
 * Official platform login entry for the consultant control panel.
 * No local bypass — redirects to the real ClientAuthScreen on `/`.
 */

export const OFFICIAL_PLATFORM_LOGIN_PATH = "/";

export const OFFICIAL_PANEL_PATH_PREFIX =
  "/admin/official-consultant-control-panel";

/** Safe return path after real login (panel only). */
export function isSafeOfficialPanelReturnPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  const pathname = path.split("?")[0]?.split("#")[0] ?? "";
  return (
    pathname === OFFICIAL_PANEL_PATH_PREFIX ||
    pathname.startsWith(`${OFFICIAL_PANEL_PATH_PREFIX}/`)
  );
}

export function buildOfficialPanelLoginRedirect(returnPath: string): string {
  const next = isSafeOfficialPanelReturnPath(returnPath)
    ? returnPath
    : OFFICIAL_PANEL_PATH_PREFIX;
  const params = new URLSearchParams();
  params.set("next", next);
  return `${OFFICIAL_PLATFORM_LOGIN_PATH}?${params.toString()}`;
}

export function readSafeNextFromSearchParams(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  return isSafeOfficialPanelReturnPath(decoded) ? decoded : null;
}

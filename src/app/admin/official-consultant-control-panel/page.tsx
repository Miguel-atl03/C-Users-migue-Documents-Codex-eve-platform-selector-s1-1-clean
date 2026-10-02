import Link from "next/link";
import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  OFFICIAL_CONTROL_PANEL_STATUS,
  officialConsultantControlPanelShellEnabled,
  parseOfficialControlPanelNavigation,
} from "@/features/official-consultant-control-panel";
import { OfficialControlPanelShell } from "@/features/official-consultant-control-panel/components/OfficialControlPanelShell";
import { buildOfficialPanelLoginRedirect } from "@/features/official-consultant-control-panel/state/official-panel-login-redirect";
import { CLIENT_SURFACE_HEADER } from "@/services/eve/consultant-control-panel/consultant-control-panel-access";
import { resolveOfficialConsultantAccess } from "@/services/eve/official-control-panel/resolve-official-consultant-access";

export const dynamic = "force-dynamic";

const PANEL_PATH = "/admin/official-consultant-control-panel";

/**
 * Official EVE Control Panel.
 * Route: /admin/official-consultant-control-panel
 *
 * Server Component gate (before shell):
 * - anonymous → redirect official login with safe returnTo
 * - authenticated without consultant_company_assignments → /access-denied
 * - authorized → render OfficialControlPanelShell
 *
 * BFF Bearer + RLS remain the data authorization boundary.
 * No role-cookie bypass. No local-session. No privileged-role auth.
 */
export default async function OfficialConsultantControlPanelPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!officialConsultantControlPanelShellEnabled) {
    return (
      <main className="min-h-screen bg-[#f7f7f2] text-neutral-950">
        <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
          <header className="border-b border-neutral-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              EVE · Panel de Control
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              {OFFICIAL_CONTROL_PANEL_STATUS.label}
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              El shell oficial está deshabilitado por feature flag
              (`officialConsultantControlPanelShellEnabled`).
            </p>
          </header>
          <Link
            className="mt-6 inline-block text-sm font-medium text-emerald-800 hover:underline"
            href="/"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const resolvedSearch = (await searchParams) ?? {};
  const { mode, view, shellState } = resolvedSearch;
  const headerStore = await headers();
  const cookieStore = await cookies();

  const surface =
    headerStore.get(CLIENT_SURFACE_HEADER) ??
    cookieStore.get("eve_surface")?.value ??
    null;

  const surfaceNormalized = (surface ?? "").trim().toLowerCase();
  if (surfaceNormalized === "client" || surfaceNormalized === "cliente") {
    return (
      <main className="min-h-screen bg-[#f7f7f2] text-neutral-950">
        <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
          <header className="border-b border-neutral-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              EVE · Panel de Control
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Acceso restringido</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Esta superficie es interna del consultor experto EVE. El usuario
              cliente no puede acceder.
            </p>
          </header>
          <Link
            className="mt-6 inline-block text-sm font-medium text-emerald-800 hover:underline"
            href="/"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const returnPath = buildPanelReturnPath(resolvedSearch);
  const access = await resolveOfficialConsultantAccess();

  if (access.status === "anonymous") {
    redirect(buildOfficialPanelLoginRedirect(returnPath));
  }

  if (access.status === "forbidden") {
    redirect("/access-denied");
  }

  const navigation = parseOfficialControlPanelNavigation(
    { mode, view, shellState },
    {
      allowShellStateOverride: false,
    },
  );

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f2] p-6 text-sm">
          Cargando panel oficial…
        </main>
      }
    >
      <OfficialControlPanelShell
        initialMode={navigation.mode}
        initialView={navigation.view}
        initialShellState={navigation.shellState}
      />
    </Suspense>
  );
}

function buildPanelReturnPath(
  search: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(search)) {
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      for (const value of raw) params.append(key, value);
    } else {
      params.set(key, raw);
    }
  }
  const query = params.toString();
  return query ? `${PANEL_PATH}?${query}` : PANEL_PATH;
}

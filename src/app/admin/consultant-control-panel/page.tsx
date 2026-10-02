import Link from "next/link";
import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import { ConsultantControlPanelPMShell } from "@/components/consultant/control-panel/ConsultantControlPanelPMShell";
import {
  assertPageConsultantAccess,
  CONSULTANT_ACCESS_HEADER,
  CONSULTANT_ROLE_HEADER,
  CLIENT_SURFACE_HEADER,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-access";
import {
  buildConsultantControlPanelState,
  parseControlPanelFilters,
  resolveControlPanelFixtureQuery,
  validateAmbarFixtureState,
} from "@/services/eve/consultant-control-panel/consultant-control-panel-service";

export const dynamic = "force-dynamic";

/**
 * LEGACY / DRAFT MODULE
 *
 * Este Consultant Control Panel es un borrador histórico no oficial.
 * No debe utilizarse como fuente conceptual, funcional o visual
 * para el nuevo Panel de Control EVE.
 *
 * Solo pueden reutilizarse posteriormente piezas técnicas neutrales
 * después de revisión explícita: theme, auth guard, layout genérico,
 * cliente BFF, utilidades y componentes sin semántica de negocio.
 *
 * Legacy route (preserved): /admin/consultant-control-panel
 * Alias: /consultant/control-panel redirects here. Not the official EVE Control Panel.
 */
export default async function ConsultantControlPanelPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const headerStore = await headers();
  const cookieStore = await cookies();

  const surface =
    (typeof params.surface === "string" ? params.surface : null) ??
    headerStore.get(CLIENT_SURFACE_HEADER) ??
    cookieStore.get("eve_surface")?.value ??
    null;

  const role =
    (typeof params.consultant_role === "string" ? params.consultant_role : null) ??
    headerStore.get(CONSULTANT_ROLE_HEADER) ??
    cookieStore.get("eve_consultant_role")?.value ??
    "consultant";

  const accessToken =
    headerStore.get(CONSULTANT_ACCESS_HEADER) ??
    cookieStore.get("eve_consultant_access")?.value ??
    null;

  const access = assertPageConsultantAccess({
    surface,
    role,
    accessToken,
  });

  if (!access.ok) {
    return (
      <main className="min-h-screen bg-[#f7f7f2] text-neutral-950">
        <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
          <header className="border-b border-neutral-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Consultoría EVE
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Acceso restringido</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              {access.consultant_safe_message}
            </p>
          </header>
          <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            Esta pantalla es privada del consultor/operador interno. El usuario cliente no puede
            acceder.
          </section>
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

  const filters = parseControlPanelFilters(params);
  const fixtureQuery = resolveControlPanelFixtureQuery(params);
  const state = buildConsultantControlPanelState({
    filters,
    role: access.role,
    fixtureQuery,
    include: "run-detail",
  });

  const fixtureValidation = validateAmbarFixtureState({ fixtureQuery, state });
  if (fixtureValidation.requested && !fixtureValidation.ok) {
    throw new Error(
      `BLOCKED_FIXTURE_NOT_RENDERING: fixtureQuery=${JSON.stringify(fixtureQuery)}; ${fixtureValidation.failures.join("; ")}`,
    );
  }

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f2] p-6 text-sm">Cargando panel…</main>
      }
    >
      <ConsultantControlPanelPMShell initialState={state} />
    </Suspense>
  );
}

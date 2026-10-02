import Link from "next/link";

/**
 * Shared unauthorized surface after official login without a valid capability
 * for the requested destination (e.g. Panel without consultant assignment).
 */
export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-neutral-950">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <header className="border-b border-neutral-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            EVE · Acceso
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Acceso no autorizado</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Su sesión es válida, pero no tiene una asignación vigente de
            Consultor para abrir el Panel de Control. Si necesita acceso,
            solicite la asignación a un administrador. La creación de cuenta
            nunca concede privilegios de Consultor.
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

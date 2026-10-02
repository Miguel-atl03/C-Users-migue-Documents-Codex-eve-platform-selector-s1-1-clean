"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignificadoTraceLookupPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = sessionId.trim();
    if (!trimmed) return;
    router.push(`/admin/significado-trace/${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-neutral-950">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <header className="border-b border-neutral-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Consultoría EVE
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Trazabilidad Significado</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Consulta la descripción operativa final y las trazas del coach inline de
            B0-Q02 para una sesión específica.
          </p>
        </header>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-neutral-800">
            Session ID
            <input
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none ring-emerald-600 focus:ring-2"
              onChange={(event) => setSessionId(event.target.value)}
              placeholder="uuid de sesiones_llenado"
              value={sessionId}
            />
          </label>
          <button
            className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!sessionId.trim()}
            type="submit"
          >
            Ver trazabilidad
          </button>
        </form>

        <p className="mt-8 text-sm text-neutral-600">
          También puedes abrir directamente{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">
            /admin/significado-trace/&lt;sessionId&gt;
          </code>
          .
        </p>

        <Link
          className="mt-6 inline-block text-sm font-medium text-emerald-800 hover:underline"
          href="/admin/runtime-vsm"
        >
          Volver al cuadro VSM
        </Link>
      </div>
    </main>
  );
}

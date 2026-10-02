"use client";

type Props = {
  onComplete: () => void;
};

export function MicroS4Pause({ onComplete }: Props) {
  return (
    <section className="mx-auto max-w-3xl rounded-md border border-neutral-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
        Micro-momento S4
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
        Pausa de contexto
      </h1>
      <p className="mt-4 text-base leading-7 text-neutral-600">
        Hasta ahora aparecen dos senales: dependencia de personas clave y
        sacrificio de revision bajo presion. No tienes que resolverlo aqui; solo
        registramos el patron antes de entrar al modo ruptura.
      </p>
      <button
        className="mt-6 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
        onClick={onComplete}
        type="button"
      >
        Entrar a modo ruptura
      </button>
    </section>
  );
}

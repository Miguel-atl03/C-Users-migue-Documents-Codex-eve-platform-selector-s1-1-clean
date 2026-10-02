"use client";

type Props = {
  onReport: () => void;
};

export function AlgedonicChannel({ onReport }: Props) {
  return (
    <aside className="fixed bottom-5 right-5 z-20 w-[min(360px,calc(100vw-40px))] rounded-md border border-red-200 bg-white p-4 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
        Canal algedonico
      </p>
      <p className="mt-2 text-sm text-neutral-700">
        Disponible en cualquier momento para registrar cuando todo se salio de
        control.
      </p>
      <button
        className="mt-3 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white"
        onClick={onReport}
        type="button"
      >
        Reportar evento critico
      </button>
    </aside>
  );
}

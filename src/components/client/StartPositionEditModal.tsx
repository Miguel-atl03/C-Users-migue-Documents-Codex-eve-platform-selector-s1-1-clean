"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  DECISION_PROXIMITY_OPTIONS,
  isStartPositionContextComplete,
  PARTICIPATION_PLACE_OPTIONS,
  type StartPositionContext,
} from "@/domain/start-position-context";

type StartPositionEditModalProps = {
  initialContext: StartPositionContext;
  onCancel: () => void;
  onSave: (context: StartPositionContext) => void;
};

function RadioOption({
  checked,
  label,
  name,
  onChange,
  value,
}: {
  checked: boolean;
  label: string;
  name: string;
  onChange: () => void;
  value: string;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer items-start gap-1.5 rounded-md border px-2.5 py-1.5 transition",
        checked
          ? "border-2 border-[#3d3d47] bg-[rgba(61,61,71,0.03)]"
          : "border-[rgba(61,61,71,0.12)] bg-white hover:border-[rgba(61,61,71,0.22)]",
      ].join(" ")}
    >
      <input
        checked={checked}
        className="sr-only"
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
      />
      <span
        aria-hidden="true"
        className={[
          "inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border",
          checked ? "border-[#3d3d47]" : "border-[rgba(61,61,71,0.24)]",
        ].join(" ")}
      >
        {checked ? (
          <span className="h-1.5 w-1.5 rounded-full bg-[#3d3d47]" />
        ) : null}
      </span>
      <span className="text-[11px] leading-snug text-[#272a32]">{label}</span>
    </label>
  );
}

export function StartPositionEditModal({
  initialContext,
  onCancel,
  onSave,
}: StartPositionEditModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<StartPositionContext>(initialContext);

  useEffect(() => {
    setDraft(initialContext);
  }, [initialContext]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const canSave = isStartPositionContextComplete(draft);

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(39,42,50,0.32)] px-4"
      role="dialog"
    >
      <div
        className="max-h-[90vh] w-full max-w-[640px] overflow-auto rounded-lg border border-[rgba(61,61,71,0.14)] bg-white shadow-[0_16px_48px_rgba(39,42,50,0.12)]"
        ref={dialogRef}
      >
        <div className="border-b border-[rgba(61,61,71,0.1)] px-5 py-4">
          <h2
            className="text-[1rem] font-semibold text-[#272a32]"
            id={titleId}
          >
            Editar tu lugar en la empresa
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6f7280]">
            Puedes ajustar desde qué lugar participas y qué tan cerca estás de
            las decisiones. Tu mapa de trabajo se mantiene.
          </p>
        </div>

        <div className="space-y-5 px-5 py-4">
          <fieldset>
            <legend className="text-[11px] font-semibold text-[#272a32]">
              ¿Desde qué lugar participas normalmente en la empresa?
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {PARTICIPATION_PLACE_OPTIONS.map((option) => (
                <RadioOption
                  checked={draft.participationPlace === option.id}
                  key={option.id}
                  label={option.label}
                  name="editParticipationPlace"
                  onChange={() =>
                    setDraft({
                      ...draft,
                      participationPlace: option.id,
                      participationPlaceOther:
                        option.id === "other"
                          ? draft.participationPlaceOther
                          : "",
                    })
                  }
                  value={option.id}
                />
              ))}
            </div>
            {draft.participationPlace === "other" ? (
              <label className="mt-2 block">
                <span className="sr-only">
                  Especifica desde qué lugar participas
                </span>
                <input
                  className="w-full rounded-sm border border-[rgba(61,61,71,0.18)] bg-white px-2.5 py-1.5 text-[11px] text-[#272a32] outline-none transition placeholder:text-[#a8abb4] focus:border-[#3d3d47]"
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      participationPlaceOther: event.target.value,
                    })
                  }
                  placeholder="Especifica tu lugar de participación"
                  type="text"
                  value={draft.participationPlaceOther}
                />
              </label>
            ) : null}
          </fieldset>

          <fieldset>
            <legend className="text-[11px] font-semibold text-[#272a32]">
              ¿Qué tan cerca estás de las decisiones?
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {DECISION_PROXIMITY_OPTIONS.map((option) => (
                <RadioOption
                  checked={draft.decisionProximity === option.id}
                  key={option.id}
                  label={option.label}
                  name="editDecisionProximity"
                  onChange={() =>
                    setDraft({
                      ...draft,
                      decisionProximity: option.id,
                    })
                  }
                  value={option.id}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[rgba(61,61,71,0.1)] px-5 py-4">
          <button
            className="rounded-sm border border-[rgba(61,61,71,0.18)] bg-white px-4 py-2 text-[13px] font-medium text-[#272a32] transition hover:bg-[#fafafa]"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="rounded-sm border border-transparent bg-[#1f2430] px-4 py-2 text-[13px] font-medium text-[#f5f5f5] transition hover:bg-[#2f333a] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSave}
            onClick={() => onSave(draft)}
            type="button"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

type ClientSafeNextAction = {
  kind: string;
  label: string;
  enabled: boolean;
};

type ClientAssessmentCompleteProps = {
  title?: string;
  message: string;
  secondaryMessage?: string;
  visibleState?: string;
  visibleNextAction?: ClientSafeNextAction;
};

export function ClientAssessmentComplete({
  title = "Levantamiento completo",
  message,
  secondaryMessage,
  visibleState,
  visibleNextAction,
}: ClientAssessmentCompleteProps) {
  const resolvedTitle =
    visibleState === "resultado_en_revision"
      ? "Resultado en revisión"
      : visibleState === "necesitamos_aclarar_algo"
        ? "Necesitamos aclarar algo"
        : visibleState === "bloqueado_seguro"
          ? "No podemos continuar por ahora"
          : visibleState === "puedes_corregir"
            ? "Puedes corregir"
            : visibleState === "informacion_en_revision"
              ? "Información en revisión"
              : title;

  return (
    <section className="mx-auto max-w-2xl rounded border border-[rgba(61,61,71,0.14)] bg-white px-8 py-10">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#6f7280]">
        Recopilación finalizada
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-[#272a32]">{resolvedTitle}</h1>
      <p className="mt-4 text-sm leading-7 text-[#6f7280]">{message}</p>
      {secondaryMessage ? (
        <p className="mt-3 text-sm leading-7 text-[#6f7280]">{secondaryMessage}</p>
      ) : null}
      {visibleNextAction ? (
        <p className="mt-6 text-sm font-medium text-[#272a32]">
          {visibleNextAction.enabled
            ? `Siguiente paso sugerido: ${visibleNextAction.label}`
            : "Por ahora no hay una acción adicional disponible."}
        </p>
      ) : null}
    </section>
  );
}

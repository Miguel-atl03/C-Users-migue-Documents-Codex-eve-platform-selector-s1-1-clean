import type { ReactNode } from "react";

type ClientFlowHeaderProps = {
  backLabel?: string;
  onBack?: () => void;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  userMenu?: ReactNode;
  className?: string;
};

export function ClientFlowHeader({
  backLabel,
  onBack,
  eyebrow,
  title,
  subtitle,
  userMenu,
  className = "",
}: ClientFlowHeaderProps) {
  return (
    <header
      className={[
        "flex items-start justify-between gap-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0 flex-1">
        {backLabel && onBack ? (
          <button
            className="mb-2 inline-flex items-center text-[12px] font-normal text-[#6f7280] underline decoration-[rgba(111,114,128,0.35)] underline-offset-[3px] transition hover:text-[#272a32]"
            onClick={onBack}
            type="button"
          >
            {backLabel}
          </button>
        ) : null}

        {eyebrow ? (
          <p className="mb-0.5 text-[12px] leading-normal text-[#6f7280]">{eyebrow}</p>
        ) : null}

        <h1 className="text-[16px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#272a32]">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-1 max-w-[640px] text-[12px] leading-[1.5] text-[#6f7280]">
            {subtitle}
          </p>
        ) : null}
      </div>

      {userMenu ? <div className="shrink-0 pt-0.5">{userMenu}</div> : null}
    </header>
  );
}

import type { ReactNode } from "react";
import { EveBrandSidebar } from "./EveBrandSidebar";

type ClientShellVariant = "landing" | "default";

type ClientShellProps = {
  children: ReactNode;
  withSidebar?: boolean;
  variant?: ClientShellVariant;
};

export function ClientShell({
  children,
  withSidebar = true,
  variant = "default",
}: ClientShellProps) {
  if (!withSidebar) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#272a32]">{children}</div>
    );
  }

  if (variant === "landing") {
    return (
      <div className="box-border min-h-screen flex-1 bg-[#f5f5f5] text-[#272a32]">
        <div className="m-4 grid min-h-[calc(100vh-32px)] grid-cols-[224px_minmax(0,1fr)] overflow-hidden rounded-[14px] bg-white shadow-[0_10px_35px_rgba(16,24,40,0.08)]">
          <EveBrandSidebar variant="landing" />
          <div className="flex min-h-0 min-w-0 flex-col overflow-auto px-5 pb-6 pt-[18px] sm:px-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f5f5] text-[#272a32]">
      <EveBrandSidebar variant="default" />
      <div className="relative min-w-0 flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-px bg-[rgba(61,61,71,0.14)]"
        />
        <div className="min-h-screen px-6 py-7 sm:px-10 lg:px-14">{children}</div>
      </div>
    </div>
  );
}

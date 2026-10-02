import { EveLogo } from "../EveLogo";

type EveBrandSidebarVariant = "landing" | "default";

type EveBrandSidebarProps = {
  variant?: EveBrandSidebarVariant;
};

function EveSidebarBrand({ variant }: { variant: EveBrandSidebarVariant }) {
  return (
    <EveLogo
      size={variant === "landing" ? "sm" : "md"}
      variant={variant === "default" ? "on-dark" : "muted"}
    />
  );
}

export function EveBrandSidebar({ variant = "default" }: EveBrandSidebarProps) {
  if (variant === "landing") {
    return (
      <aside className="flex min-h-full flex-col self-stretch bg-[#dedede] pb-5 text-[#4d4d4d]">
        <div className="mb-8 px-5 pt-5">
          <EveSidebarBrand variant="landing" />
        </div>

        <div className="mt-auto border-t border-[rgba(77,77,77,0.18)] px-5 pt-5">
          <p className="m-0 pt-3.5 text-[10px] font-medium leading-[1.55] tracking-[0.04em] text-[rgba(77,77,77,0.55)]">
            Strategic &amp; Operational Architecture
            <br />
            Enterprise Viability Engine
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative flex w-[140px] shrink-0 flex-col bg-[#2f333a] text-white">
      <div className="px-6 pt-8">
        <EveSidebarBrand variant="default" />
      </div>
      <div className="mt-auto px-6 pb-8">
        <p className="text-[9px] font-medium leading-[1.45] tracking-[0.22em] text-white/55">
          ENTERPRISE
          <br />
          VIABILITY
          <br />
          ENGINE<span className="text-[8px]">™</span>
        </p>
      </div>
    </aside>
  );
}

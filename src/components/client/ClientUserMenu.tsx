"use client";

import { useEffect, useId, useRef, useState } from "react";

type ClientUserMenuProps = {
  displayName: string;
  initials?: string;
  onSignOut: () => void;
};

function resolveInitials(displayName: string, initials?: string): string {
  const trimmedInitials = initials?.trim();
  if (trimmedInitials) {
    return trimmedInitials.charAt(0).toUpperCase();
  }

  const trimmedName = displayName.trim();
  return trimmedName ? trimmedName.charAt(0).toUpperCase() : "U";
}

export function ClientUserMenu({
  displayName,
  initials,
  onSignOut,
}: ClientUserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const avatarInitial = resolveInitials(displayName, initials);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const handleSignOut = () => {
    setOpen(false);
    onSignOut();
  };

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-sm px-1 py-1 text-[11px] text-[#272a32] transition hover:bg-[rgba(61,61,71,0.04)]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3d3d47] text-[11px] font-medium text-white"
        >
          {avatarInitial}
        </span>
        {/* text-[11px] explícito: tamaño de subtítulo del proyecto (.sectionSubtitle)
            y evita que un reset global de <button> vuelva a agrandar el nombre */}
        <span className="max-w-[180px] truncate text-[11px] font-normal">
          {displayName}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex items-center text-[#6f7280]"
        >
          <svg fill="none" height="12" viewBox="0 0 24 24" width="12">
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-20 mt-1 min-w-[168px] rounded border border-[rgba(61,61,71,0.14)] bg-white py-1 shadow-[0_8px_24px_rgba(16,24,40,0.08)]"
          id={menuId}
          role="menu"
        >
          <button
            className="block w-full px-4 py-1.5 text-left text-[11px] text-[#272a32] transition hover:bg-[#fafafa]"
            onClick={handleSignOut}
            role="menuitem"
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}

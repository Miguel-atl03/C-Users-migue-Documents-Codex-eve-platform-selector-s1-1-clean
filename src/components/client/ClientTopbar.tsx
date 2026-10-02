import { ClientUserMenu } from "./ClientUserMenu";

type ClientTopbarVariant = "landing" | "default";

type ClientTopbarProps = {
  userEmail?: string | null;
  userName?: string;
  onSignOut?: () => void;
  showSignOut?: boolean;
  variant?: ClientTopbarVariant;
};

function resolveDisplayLabel(userName?: string, userEmail?: string | null): string {
  const trimmedUserName = userName?.trim();
  const safeUserName =
    trimmedUserName && !trimmedUserName.includes("@") ? trimmedUserName : "";
  return safeUserName || userEmail?.trim() || "Usuario";
}

export function ClientTopbar({
  userEmail,
  userName,
  onSignOut,
  showSignOut = false,
  variant = "default",
}: ClientTopbarProps) {
  if (variant === "landing" && showSignOut && onSignOut) {
    const displayLabel = resolveDisplayLabel(userName, userEmail);

    return (
      <header className="mb-[18px] flex shrink-0 items-start justify-end">
        <ClientUserMenu displayName={displayLabel} onSignOut={onSignOut} />
      </header>
    );
  }

  return (
    <header className="flex items-start justify-end gap-4">
      {showSignOut && onSignOut ? (
        <button
          className="rounded border border-[rgba(61,61,71,0.14)] bg-white px-4 py-2 text-[12px] font-medium text-[#272a32] transition hover:bg-[#fafafa]"
          onClick={onSignOut}
          type="button"
        >
          Cerrar sesión
        </button>
      ) : (
        <span
          aria-hidden="true"
          className="max-w-[220px] truncate text-[12px] text-[#6f7280]"
        >
          {userEmail ?? ""}
        </span>
      )}
    </header>
  );
}

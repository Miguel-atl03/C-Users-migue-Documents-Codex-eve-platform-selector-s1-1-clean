export type GreetingNameProfile = {
  nombre?: string | null;
  name?: string | null;
  full_name?: string | null;
};

export type GreetingAuthUser = {
  user_metadata?: Record<string, unknown> | null;
};

function readMetadataString(
  metadata: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getFirstNameForGreeting(
  userProfile?: GreetingNameProfile | null,
  authUser?: GreetingAuthUser | null,
): string {
  const metadata = authUser?.user_metadata ?? {};
  const raw =
    userProfile?.nombre ??
    userProfile?.name ??
    userProfile?.full_name ??
    readMetadataString(metadata, "nombre") ??
    readMetadataString(metadata, "name") ??
    readMetadataString(metadata, "full_name") ??
    "";

  if (!raw || raw.includes("@")) {
    return "";
  }

  const firstToken = raw.trim().split(/\s+/)[0];
  return firstToken || "";
}

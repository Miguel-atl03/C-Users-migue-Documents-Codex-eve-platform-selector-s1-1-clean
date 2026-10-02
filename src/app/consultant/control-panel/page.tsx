import { redirect } from "next/navigation";

/**
 * Instruction path alias for the LEGACY / DRAFT Consultant Control Panel.
 * Redirects to /admin/consultant-control-panel. Not the official EVE Control Panel.
 */
export default async function ConsultantControlPanelAliasPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      query.set(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
    }
  }

  const suffix = query.toString();
  redirect(
    suffix
      ? `/admin/consultant-control-panel?${suffix}`
      : "/admin/consultant-control-panel",
  );
}

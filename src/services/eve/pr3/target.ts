export const PR3_PROJECT_REF = "keqrkyumfyhfivllvdbl";
export const PR3_SUPABASE_URL = `https://${PR3_PROJECT_REF}.supabase.co`;

export function validatePr3DatabaseTarget(connectionString: string, expectedProjectRef: string | undefined) {
  if (!expectedProjectRef) throw new Error("pr3_expected_project_ref_not_configured");
  if (expectedProjectRef !== PR3_PROJECT_REF) throw new Error("pr3_clean_database_target_mismatch");
  let target: URL;
  try { target = new URL(connectionString); }
  catch { throw new Error("pr3_clean_database_target_mismatch"); }
  const direct = target.hostname === `db.${PR3_PROJECT_REF}.supabase.co`;
  const pooler = target.hostname.endsWith(".pooler.supabase.com") &&
    decodeURIComponent(target.username).endsWith(`.${PR3_PROJECT_REF}`);
  if (!["postgres:", "postgresql:"].includes(target.protocol) || (!direct && !pooler) ||
      target.searchParams.get("sslmode") === "disable") {
    throw new Error("pr3_clean_database_target_mismatch");
  }
}

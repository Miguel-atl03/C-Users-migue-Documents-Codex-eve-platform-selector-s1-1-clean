#!/usr/bin/env node
/**
 * Smoke BFF endpoints for canonical Amber after local recovery.
 * Requires Next dev on http://127.0.0.1:3000 and local Supabase auth.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = "unit2b-consultant@example.invalid";
const TEST_PASSWORD = process.env.EVE_UNIT2B_TEST_PASSWORD;
const APP_BASE = process.env.EVE_LOCAL_APP_URL ?? "http://127.0.0.1:3000";
const API_ROOT = `${APP_BASE}/api/eve/official-consultant-control-panel`;

const CANONICAL_COMPANY = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
const CANONICAL_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const CANONICAL_RELATIONSHIP = "7c499a1c-31c6-4fc9-8b20-2fd8cdc57043";
const DUPLICATE_CASE = "cc983357-dd4a-42e9-b2f7-fa54364184df";

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "amber_bff_smoke_failed",
    }),
  );
  process.exitCode = 1;
});

async function main() {
  if (!SUPABASE_ANON_KEY || !TEST_PASSWORD) {
    throw new Error("amber_bff_environment_missing");
  }

  const token = await getAccessToken();
  const companies = await getJson(`${API_ROOT}/client-companies`, token);
  const amberCompany = companies.find((item) => item.id === CANONICAL_COMPANY);
  if (!amberCompany || amberCompany.label !== "Cervecería Amber") {
    throw new Error("amber_company_missing");
  }

  const relationships = await getJson(
    `${API_ROOT}/client-companies/${CANONICAL_COMPANY}/relationships`,
    token,
  );
  const relationship = relationships.find(
    (item) => item.id === CANONICAL_RELATIONSHIP,
  );
  if (!relationship) throw new Error("amber_relationship_missing");

  const cases = await getJson(
    `${API_ROOT}/relationships/${CANONICAL_RELATIONSHIP}/cases`,
    token,
  );
  const canonicalCase = cases.find((item) => item.id === CANONICAL_CASE);
  if (!canonicalCase) throw new Error("amber_case_missing");
  if (cases.some((item) => item.id === DUPLICATE_CASE)) {
    throw new Error("duplicate_amber_case_visible");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        company: amberCompany,
        relationship,
        case: canonicalCase,
        duplicateExcluded: true,
      },
      null,
      2,
    ),
  );
}

async function getAccessToken() {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    },
  );
  if (!response.ok) throw new Error("consultant_auth_failed");
  const body = await response.json();
  if (!body.access_token) throw new Error("consultant_token_missing");
  return body.access_token;
}

async function getJson(path, token) {
  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`bff_request_failed:${path}`);
  const body = await response.json();
  if (!Array.isArray(body)) throw new Error(`invalid_bff_response:${path}`);
  return body;
}

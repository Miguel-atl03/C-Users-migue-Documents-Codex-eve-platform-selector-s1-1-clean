import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");
const migrationPath =
  "supabase/migrations/20260727090000_eve_onboarding_case_participants_and_invitations.sql";

function read(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

const sql = read(migrationPath);

test("B5 migration creates only the approved onboarding surface", () => {
  for (const expected of [
    "create table public.case_sponsors",
    "create table public.case_participants",
    "create table public.case_participant_profiles",
    "create table public.case_profile_runtime_session_links",
    "create table public.participant_invitations",
    "create table public.participant_invitation_audit_events",
    "references public.role_runtime_session (role_runtime_session_id)",
    "references public.sesiones_llenado (id)",
    "case_sponsors_one_primary_active_per_case_idx",
    "case_sponsors_one_active_per_case_user_idx",
    "participant_invitations_one_active_per_case_email_kind_idx",
    "participant_invitations_token_hash_unique_idx",
    "participant_invitation_audit_events_append_only",
  ]) {
    assert.ok(sql.includes(expected), `Missing onboarding contract: ${expected}`);
  }

  assert.doesNotMatch(sql, /official_control_panel_context_audit_action_check/i);
  assert.doesNotMatch(sql, /alter\s+table\s+public\.official_control_panel_context_audit/i);
  assert.doesNotMatch(sql, /create\s+extension\s+if\s+not\s+exists\s+citext/i);
  assert.doesNotMatch(sql, /role_runtime_session\s*\(\s*id\s*\)/i);
});

test("B5 migration enables force RLS and avoids direct frontend writes", () => {
  for (const table of [
    "case_sponsors",
    "case_participants",
    "case_participant_profiles",
    "case_profile_runtime_session_links",
    "participant_invitations",
    "participant_invitation_audit_events",
  ]) {
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} enable row level security`, "i"),
    );
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} force row level security`, "i"),
    );
    assert.match(
      sql,
      new RegExp(`revoke all on table public\\.${table} from anon, authenticated`, "i"),
    );
  }

  assert.doesNotMatch(
    sql,
    /grant\s+(insert|update|delete)[^;]*to\s+authenticated/i,
  );
  assert.doesNotMatch(sql, /create\s+policy[\s\S]*?using\s*\(\s*true\s*\)/i);
});

test("B5 RPCs are explicit, audited, and never return token_hash", () => {
  for (const rpc of [
    "create_participant_invitation",
    "mark_participant_invitation_sent",
    "revoke_participant_invitation",
    "accept_participant_invitation",
    "list_case_invitations",
    "set_primary_case_sponsor",
    "link_participant_profile_to_runtime_session",
  ]) {
    assert.match(
      sql,
      new RegExp(
        `create or replace function public\\.${rpc}\\([\\s\\S]*?security definer[\\s\\S]*?set search_path = public`,
        "i",
      ),
    );
    assert.match(
      sql,
      new RegExp(`grant execute on function public\\.${rpc}`, "i"),
    );
  }

  assert.match(sql, /eve_onboarding_require_consultant_case_access/);
  assert.match(sql, /eve_onboarding_insert_invitation_audit/);
  assert.match(sql, /revoke all on function public\.eve_onboarding_enforce_context_integrity\(\)/);
  assert.match(sql, /revoke all on function public\.eve_participant_invitation_audit_append_only\(\)/);
  assert.match(sql, /to_jsonb\(v_before\) - 'token_hash'/);
  assert.match(sql, /to_jsonb\(v_after\) - 'token_hash'/);
  for (const match of sql.matchAll(/returns table\s*\(([\s\S]*?)\)\s*language/gi)) {
    assert.doesNotMatch(match[1], /token_hash/i);
  }
});

test("B5 migration has no remote execution commands or data changes", () => {
  assert.doesNotMatch(sql, /\b(db\s+push|db\s+pull|db\s+reset|migration\s+up|migration\s+repair)\b/i);
  assert.doesNotMatch(sql, /\binsert\s+into\s+auth\.users\b/i);
  assert.doesNotMatch(sql, /\binsert\s+into\s+public\.empresas\b/i);
  assert.doesNotMatch(sql, /\binsert\s+into\s+public\.sesiones_llenado\b/i);
});

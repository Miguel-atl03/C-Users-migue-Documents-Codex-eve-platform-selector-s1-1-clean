#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

loadEnvLocal();

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const pass = (process.env.EVE_UNIT2B_TEST_PASSWORD || "").trim();
let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
if (!key) {
  const s = spawnSync("npx", ["supabase", "status", "-o", "env"], {
    encoding: "utf8",
    shell: true,
  });
  const m = /SERVICE_ROLE_KEY=(.+)/.exec(s.stdout || "");
  if (m) key = m[1].trim().replace(/^"|"$/g, "");
}

if (!url || !anon || !pass || !key) {
  console.error(JSON.stringify({ ok: false, error: "missing_env" }));
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const emails = [
  "unit2b-consultant@example.invalid",
  "access-consultant-b@example.invalid",
  "access-operative@example.invalid",
  "access-norole@example.invalid",
];

const list = await admin.auth.admin.listUsers({ perPage: 1000 });
const results = [];

for (const email of emails) {
  const u = list.data?.users?.find((x) => x.email === email);
  if (!u) {
    results.push({ email, status: "missing" });
    continue;
  }
  const upd = await admin.auth.admin.updateUserById(u.id, {
    password: pass,
    email_confirm: true,
  });
  if (upd.error) {
    results.push({ email, status: "reset_fail", error: upd.error.message });
    continue;
  }
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  const j = await r.json();
  results.push({
    email,
    status: j.access_token ? "login_ok" : "login_fail",
    http: r.status,
    detail: j.error_description || j.msg || j.error || null,
  });
}

console.log(JSON.stringify({ ok: true, password: pass, results }, null, 2));

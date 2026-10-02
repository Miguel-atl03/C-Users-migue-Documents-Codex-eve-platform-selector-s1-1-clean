import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Pr3CommandOperation } from "./contracts";

type ActionTokenPayload = {
  v: 1;
  principal_ref: string;
  operation: Exclude<Pr3CommandOperation, "ISSUE_ACTION_TOKEN" | "INTERNAL_AI" | "HUMAN_EXCEPTION" | "HANDOFF">;
  client_event_id: string;
  scope_ref?: string | null;
  activity_ref?: string | null;
  chain_run_id?: string | null;
  object_run_id?: string | null;
  interaction_key?: string | null;
  context_revision?: string | null;
  issued_at: string;
  expires_at: string;
};

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}
function secret() {
  const value = process.env.EVE_PR3_ACTION_TOKEN_SECRET;
  if (!value || value.length < 32) throw new Error("pr3_action_token_secret_missing_or_weak");
  return value;
}
function signature(encodedPayload: string) {
  return createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}

export function issueActionToken(payload: Omit<ActionTokenPayload, "v" | "issued_at" | "expires_at">, ttlSeconds = 300) {
  const now = new Date();
  const expires = new Date(now.getTime() + ttlSeconds * 1000);
  const full: ActionTokenPayload = { ...payload, v: 1, issued_at: now.toISOString(), expires_at: expires.toISOString() };
  const encoded = b64url(JSON.stringify(full));
  return { action_token: `${encoded}.${signature(encoded)}`, payload: full };
}

export function verifyActionToken(token: string): ActionTokenPayload {
  const [encoded, supplied] = token.split(".");
  if (!encoded || !supplied) throw new Error("pr3_action_token_invalid");
  const expected = signature(encoded);
  const a = Buffer.from(supplied); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("pr3_action_token_invalid");
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ActionTokenPayload;
  if (payload.v !== 1 || Date.parse(payload.expires_at) <= Date.now()) throw new Error("pr3_action_token_expired");
  return payload;
}

import "server-only";
import { createHash } from "node:crypto";

function canonicalValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("pr3_non_finite_number_forbidden");
    if (!Number.isInteger(value)) throw new Error("pr3_identity_binary_float_forbidden");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return value;
  return canonicalJson(value);
}

export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  throw new Error("pr3_unsupported_canonical_json_value");
}

export function sha256Utf8(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function sha256CanonicalJson(value: unknown): string {
  return sha256Utf8(canonicalJson(value));
}

export function identityPreimage(fields: readonly string[], values: Record<string, unknown>): string {
  return fields.map((field) => `${field}=${canonicalValue(values[field])}`).join("\n");
}

export function deriveIdentity(prefix: string, fields: readonly string[], values: Record<string, unknown>) {
  const preimage = identityPreimage(fields, values);
  const identity_sha256 = sha256Utf8(preimage);
  return { preimage, identity_sha256, record_id: `${prefix}-${identity_sha256.slice(0, 24)}` };
}

export function utcTimestamp(date = new Date()): string {
  // A07 requires UTC RFC3339 with exactly six fractional digits. JS Date
  // carries millisecond precision, so the remaining three digits are zero.
  return date.toISOString().replace(/\.(\d{3})Z$/, ".$1000Z");
}

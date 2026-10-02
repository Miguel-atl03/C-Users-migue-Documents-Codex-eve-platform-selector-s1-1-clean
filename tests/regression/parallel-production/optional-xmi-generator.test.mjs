import assert from "node:assert/strict";
import test from "node:test";
import { generateXmiOptional } from "../../../scripts/parallel-production/generators/generate-xmi-optional.mjs";

test("optional XMI generator emits warning instead of low-fidelity XMI", () => {
  const output = generateXmiOptional();

  assert.equal(output.generated, false);
  assert.equal(output.warnings[0].warning_type, "xmi_optional_not_generated");
  assert.ok(output.warnings[0].reason.includes("evitar degradar semantica MMABP"));
});

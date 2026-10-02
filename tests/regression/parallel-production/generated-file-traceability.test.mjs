import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

test("all generated candidate files contain candidate and source traceability markers", () => {
  const packageJson = readJson("tests/fixtures/parallel-production/candidate-export-package.json");

  for (const exportItem of packageJson.exports) {
    const content = fs.readFileSync(path.join(root, exportItem.file_path), "utf8");
    assert.ok(content.includes("candidate_only"), `${exportItem.export_id} missing candidate_only`);
    assert.ok(content.includes("source_ir_element_ids"), `${exportItem.export_id} missing IR trace`);
    assert.ok(content.includes("source_registry_element_ids"), `${exportItem.export_id} missing registry trace`);
    assert.ok(content.includes("source_fact_ids"), `${exportItem.export_id} missing fact trace`);
  }
});

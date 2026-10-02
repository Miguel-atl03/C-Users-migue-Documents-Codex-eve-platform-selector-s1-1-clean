import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = path.resolve(import.meta.dirname, "../..");
fs.mkdirSync(path.join(root, ".tmp"), { recursive: true });
const out = fs.openSync(path.join(root, ".tmp/p4-local.log"), "a");
const err = fs.openSync(path.join(root, ".tmp/p4-local-error.log"), "a");
const child = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "3001"], {
  cwd: root, detached: true, windowsHide: true, stdio: ["ignore", out, err],
});
child.unref();
console.log(`PR3 local server PID=${child.pid}; URL=http://127.0.0.1:3001/pr3-pilot`);

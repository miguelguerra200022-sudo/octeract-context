#!/usr/bin/env node

/**
 * TESSERACT-CONTEXT CLI Launcher
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const srcEntry = path.join(projectRoot, "src", "index.ts");

const child = spawn(
  process.execPath,
  ["--experimental-strip-types", srcEntry, ...process.argv.slice(2)],
  {
    stdio: "inherit",
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

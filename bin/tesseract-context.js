#!/usr/bin/env node

/**
 * TESSERACT-CONTEXT CLI Launcher
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const distEntry = path.join(projectRoot, 'dist', 'index.js');
const srcEntry = path.join(projectRoot, 'src', 'index.ts');

if (fs.existsSync(distEntry)) {
  await import(distEntry);
} else {
  // Ejecución directa de TypeScript con soporte nativo de Node.js
  const child = spawn(
    process.execPath,
    ['--experimental-strip-types', srcEntry, ...process.argv.slice(2)],
    {
      stdio: 'inherit',
    }
  );

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

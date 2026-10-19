/**
 * TESSERACT-CONTEXT: Pruebas Unitarias del Analizador Diferencial de Cizallamiento 4D
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { DifferentialShearAnalyzer } from '../src/core/diff.ts';

test('DifferentialShearAnalyzer: Analiza cambios frente a HEAD en el repositorio', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const report = DifferentialShearAnalyzer.analyzeDiff(root, 'HEAD');

  assert.ok(report);
  assert.ok(typeof report.isSafe === 'boolean');
  assert.ok(['SAFE_TO_COMMIT', 'BLOCKED_BY_DIFF_SHEAR', 'CLEAN_NO_CHANGES'].includes(report.verdict));
  assert.ok(Array.isArray(report.changedFiles));
  assert.ok(typeof report.deltaShearDistance === 'number');
});

test('DifferentialShearAnalyzer: Instala hook pre-commit de forma segura', () => {
  const tempGitDir = path.join(import.meta.dirname, 'temp_hook_test');
  const dotGit = path.join(tempGitDir, '.git');
  fs.mkdirSync(dotGit, { recursive: true });

  const res = DifferentialShearAnalyzer.installPreCommitHook(tempGitDir);
  assert.equal(res.success, true);
  assert.ok(fs.existsSync(res.hookPath));

  const hookContent = fs.readFileSync(res.hookPath, 'utf-8');
  assert.ok(hookContent.includes('TESSERACT-CONTEXT 4D Autonomous Pre-Commit Shield'));

  fs.rmSync(tempGitDir, { recursive: true, force: true });
});

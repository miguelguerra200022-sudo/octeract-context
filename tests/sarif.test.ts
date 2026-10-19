/**
 * TESSERACT-CONTEXT: Pruebas Unitarias del Exportador OASIS SARIF 2.1.0
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { SarifExporter } from '../src/core/sarif.ts';
import type { AuditReport, TopologicalFracture } from '../src/core/types.ts';

test('SarifExporter: Genera formato SARIF 2.1.0 válido para GitHub Code Scanning', () => {
  const mockFractures: TopologicalFracture[] = [
    {
      id: 'fracture-broken-1',
      type: 'BROKEN_IMPORT',
      severity: 'CRITICAL',
      source: 'src/services/auth.ts',
      target: 'src/utils/missing.ts',
      importerLine: "import { hash } from '../utils/missing.ts';",
      importerLineNumber: 14,
      description: "El archivo 'src/services/auth.ts' importa un módulo inexistente.",
      rippleImpact: 3,
      affectedDependents: ['src/app.ts'],
      healingStrategy: "Crear el archivo 'missing.ts' o corregir la ruta.",
      synthesizedPatch: "// Fix import",
    },
    {
      id: 'fracture-floating-2',
      type: 'FLOATING_PROMISE',
      severity: 'HIGH',
      source: 'src/cli/worker.ts',
      importerLine: 'startProcess();',
      importerLineNumber: 45,
      description: 'Promesa asíncrona flotante no sincronizada.',
      rippleImpact: 1,
      affectedDependents: [],
      healingStrategy: "Anteponer 'await ' o agregar '.catch()'.",
    },
  ];

  const mockReport: AuditReport = {
    timestamp: Date.now(),
    rootDir: '.',
    healthScore: 82,
    status: 'MINOR_FRACTURES',
    totalFilesAudited: 25,
    totalFractures: 2,
    fracturesByType: {
      BROKEN_IMPORT: 1,
      FLOATING_PROMISE: 1,
    },
    fractures: mockFractures,
  };

  const sarif = SarifExporter.generateSarif(mockReport, '.');

  assert.equal(sarif.version, '2.1.0');
  assert.ok(sarif.$schema.includes('sarif-schema-2.1.0.json'));
  assert.equal(sarif.runs.length, 1);

  const run = sarif.runs[0];
  assert.equal(run.tool.driver.name, 'Tesseract-Context');
  assert.equal(run.tool.driver.version, '1.1.0');
  assert.ok(run.tool.driver.rules.length >= 10);

  // Validar resultados
  assert.equal(run.results.length, 2);

  const res1 = run.results[0];
  assert.equal(res1.ruleId, 'TESS-001');
  assert.equal(res1.level, 'error');
  assert.ok(res1.message.text.includes('módulo inexistente'));
  assert.equal(res1.locations[0].physicalLocation.artifactLocation.uri, 'src/services/auth.ts');
  assert.equal(res1.locations[0].physicalLocation.region.startLine, 14);
  assert.ok(res1.fixes && res1.fixes.length > 0);

  const res2 = run.results[1];
  assert.equal(res2.ruleId, 'TESS-004');
  assert.equal(res2.level, 'error');
  assert.equal(res2.locations[0].physicalLocation.region.startLine, 45);
});

test('SarifExporter: Escribe archivo .sarif en disco con persistencia válida', () => {
  const tempDir = path.join(import.meta.dirname, 'temp_sarif_test');
  const tempFile = path.join(tempDir, 'results.sarif');

  const mockReport: AuditReport = {
    timestamp: Date.now(),
    rootDir: '.',
    healthScore: 100,
    status: 'PERFECT_SYMMETRY',
    totalFilesAudited: 10,
    totalFractures: 0,
    fracturesByType: {},
    fractures: [],
  };

  SarifExporter.writeSarifToFile(mockReport, tempFile, '.');

  assert.ok(fs.existsSync(tempFile));
  const content = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
  assert.equal(content.version, '2.1.0');
  assert.equal(content.runs[0].results.length, 0);

  fs.rmSync(tempDir, { recursive: true, force: true });
});

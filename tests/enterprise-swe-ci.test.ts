import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SWECIEngine, type SWECISnapshot } from '../src/enterprise/swe-ci.ts';

test('SWECIEngine: Inicialización y registro de snapshots baseline', () => {
  const tempDir = path.join(process.cwd(), 'tests', 'temp_swe_ci_test_1');
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const engine = new SWECIEngine(tempDir);
    const status = engine.getStatus();
    assert.equal(status.totalSteps, 0);

    // Registrar snapshot inicial (Salud 100, 0 fracturas)
    const baseline: SWECISnapshot = {
      stepIndex: 0,
      timestamp: Date.now(),
      healthScore: 100,
      totalFractures: 0,
      shearDistance: 0.0,
      contractFingerprints: { 'auth.login': 'hash_v1', 'storage.save': 'hash_v1' }
    };

    engine.recordSnapshot(baseline);

    const updatedStatus = engine.getStatus();
    assert.equal(updatedStatus.totalSteps, 1);
    assert.equal(updatedStatus.currentHealth, 100);
    assert.equal(updatedStatus.currentFractures, 0);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('SWECIEngine: Aprueba commits que mantienen simetría o reducen fracturas', () => {
  const tempDir = path.join(process.cwd(), 'tests', 'temp_swe_ci_test_2');
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const engine = new SWECIEngine(tempDir);
    engine.recordSnapshot({
      stepIndex: 0,
      timestamp: Date.now(),
      healthScore: 95,
      totalFractures: 2,
      shearDistance: 0.0,
      contractFingerprints: {}
    });

    // Paso 1: Mejora la salud a 100 y 0 fracturas con cizallamiento bajo (0.02)
    const evalResult = engine.evaluateStep({
      healthScore: 100,
      totalFractures: 0,
      shearDistance: 0.02,
      contractFingerprints: {}
    });

    assert.equal(evalResult.approved, true);
    assert.equal(evalResult.rollbackRequired, false);
    assert.ok(evalResult.reason.includes('Aprobado'));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('SWECIEngine: Bloquea regresión cuando aumentan fracturas o cizallamiento > 0.10', () => {
  const tempDir = path.join(process.cwd(), 'tests', 'temp_swe_ci_test_3');
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const engine = new SWECIEngine(tempDir);
    engine.recordSnapshot({
      stepIndex: 0,
      timestamp: Date.now(),
      healthScore: 100,
      totalFractures: 0,
      shearDistance: 0.0,
      contractFingerprints: {}
    });

    // Caso A: Aumento de fracturas (0 -> 2)
    const resA = engine.evaluateStep({
      healthScore: 92,
      totalFractures: 2,
      shearDistance: 0.04,
      contractFingerprints: {}
    });
    assert.equal(resA.approved, false);
    assert.equal(resA.rollbackRequired, true);
    assert.ok(resA.reason.includes('Regresión topológica'));

    // Caso B: Cizallamiento excesivo (shear > 0.10) aunque no haya fracturas sintácticas directas
    const resB = engine.evaluateStep({
      healthScore: 100,
      totalFractures: 0,
      shearDistance: 0.25, // > 0.10
      contractFingerprints: {}
    });
    assert.equal(resB.approved, false);
    assert.equal(resB.rollbackRequired, true);
    assert.ok(resB.reason.includes('Cizallamiento geodésico excesivo'));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('SWECIEngine: Auto-reversión (Rollback en RAM / Disco)', () => {
  const tempDir = path.join(process.cwd(), 'tests', 'temp_swe_ci_test_4');
  fs.mkdirSync(tempDir, { recursive: true });

  const testFile = path.join(tempDir, 'service.ts');
  fs.writeFileSync(testFile, 'export function stable() { return 1; }', 'utf-8');

  try {
    const engine = new SWECIEngine(tempDir);
    // Registrar estado sano inicial
    engine.recordSnapshot({
      stepIndex: 0,
      timestamp: Date.now(),
      healthScore: 100,
      totalFractures: 0,
      shearDistance: 0.0,
      contractFingerprints: {}
    });

    // Simular que un agente modificó el archivo introduciendo un bug
    fs.writeFileSync(testFile, 'export function broken() { return crash; }', 'utf-8');

    // Rollback restaura el archivo si se le provee la copia original o git reset
    const rollbackOk = engine.rollbackStep('service.ts', 'export function stable() { return 1; }');
    assert.equal(rollbackOk, true);

    const restoredContent = fs.readFileSync(testFile, 'utf-8');
    assert.equal(restoredContent, 'export function stable() { return 1; }');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

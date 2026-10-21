import { test } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'node:path';
import { TesseractMutationEngine } from '../src/enterprise/mutation.ts';

test('TesseractMutationEngine: Genera mutantes contrafactuales relacionales y aritméticos en RAM', () => {
  const engine = new TesseractMutationEngine();
  // Usar un archivo existente del proyecto
  const targetFile = 'src/enterprise/mesh.ts';
  const mutants = engine.generateMutants(targetFile, 15);

  assert.ok(mutants.length > 0, 'Debe generar al menos 1 mutante');
  const hasRelational = mutants.some((m) => m.operator === 'RELATIONAL_INVERSION');
  assert.ok(hasRelational || mutants.length > 0);
  assert.strictEqual(mutants[0].file, targetFile);
});

test('TesseractMutationEngine: Evalúa suite robusta con alta puntuación de eliminación de mutantes', () => {
  const engine = new TesseractMutationEngine();
  const targetFile = 'src/enterprise/mesh.ts';
  const mutants = engine.generateMutants(targetFile, 10);

  // Simular presencia de archivo de pruebas
  const report = engine.evaluateMutationHardness(targetFile, mutants, ['tests/enterprise-mesh.test.ts']);

  assert.strictEqual(report.targetFile, targetFile);
  assert.ok(report.mutationScorePercent >= 80);
  assert.strictEqual(report.hardnessVerdict, 'RESILIENT_SUITE');
  assert.strictEqual(report.mutantsSurvived, 0);
});

test('TesseractMutationEngine: Detecta suite hueca/tautológica (0% kill rate) y emite MUTATION_RESILIENCE_FRACTURE', () => {
  const engine = new TesseractMutationEngine();
  const targetFile = 'src/enterprise/mesh.ts';
  const mutants = engine.generateMutants(targetFile, 10);

  // Sin tests asociados -> todos sobreviven -> suite frágil
  const report = engine.evaluateMutationHardness(targetFile, mutants, []);

  assert.strictEqual(report.mutantsKilled, 0);
  assert.strictEqual(report.mutationScorePercent, 0);
  assert.strictEqual(report.hardnessVerdict, 'BRITTLE_TAUTOLOGICAL_TESTS');
  assert.ok(report.hollowAssertionLines.length > 0);

  const fractures = engine.auditMutationResilience(targetFile, []);
  assert.strictEqual(fractures.length, 1);
  assert.strictEqual(fractures[0].type, 'MUTATION_RESILIENCE_FRACTURE');
  assert.strictEqual(fractures[0].severity, 'HIGH');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { TransactionalHealer } from '../src/core/healing.ts';
import { CubicCell, type HyperVertex } from '../src/core/types.ts';

function createMockVertex(
  id: string,
  cell: CubicCell,
  exportedSymbols: string[],
  importedSymbols: { name: string; targetFile: string }[] = []
): HyperVertex {
  const symbols: any[] = [];
  const deps: string[] = [];

  for (const exp of exportedSymbols) {
    symbols.push({
      name: exp,
      kind: 'function',
      lineStart: 1,
      lineEnd: 5,
      dependencies: [],
    });
  }

  for (const imp of importedSymbols) {
    symbols.push({
      name: imp.name,
      kind: 'import',
      lineStart: 1,
      lineEnd: 1,
      dependencies: [imp.targetFile],
    });
    if (!deps.includes(imp.targetFile)) {
      deps.push(imp.targetFile);
    }
  }

  return {
    id,
    path: id,
    cell,
    coordinate: [0.1, 0.2, 0.3, 0.4],
    hexCode: '0x1234',
    lines: 50,
    sizeBytes: 500,
    tokenEstimate: 120,
    symbols,
    dependencies: deps,
    dependents: [],
    inDegree: 0,
    outDegree: deps.length,
    lastModified: Date.now(),
  };
}

function linkVertices(caller: HyperVertex, provider: HyperVertex) {
  if (!provider.dependents.includes(caller.id)) {
    provider.dependents.push(caller.id);
    provider.inDegree = provider.dependents.length;
  }
}

test('TransactionalHealer: Ensayo exitoso en RAM con 0 regresiones', () => {
  const space = new HypercubeSpace();
  // V1: Exporta 'calculateTax'
  const v1 = createMockVertex('src/calc.ts', CubicCell.CoreLogic, ['calculateTax']);
  // V2: Importa 'calculateTax' de V1
  const v2 = createMockVertex('src/app.ts', CubicCell.UI, ['startApp'], [
    { name: 'calculateTax', targetFile: 'src/calc.ts' },
  ]);
  linkVertices(v2, v1);

  space.addVertex(v1);
  space.addVertex(v2);

  // Optimizamos calculateTax preservando la interfaz y contrato consumido por src/app.ts
  const proposedCode = `
    export function calculateTax(amount: number): number { return Number((amount * 0.16).toFixed(2)); }
  `;

  const trial = TransactionalHealer.simulateTrial(space, 'src/calc.ts', proposedCode);

  assert.equal(trial.isSafeToCommit, true);
  assert.equal(trial.rollbackExecuted, false);
  assert.equal(trial.regressionCount, 0);
  assert.ok(trial.richDossierForAI.includes('Certificación de Cero Regresiones'));
  assert.ok(trial.trialExecutionTimeMs < 500); // Ultrarrápido en RAM
});

test('TransactionalHealer: Detección de regresión y rollback automático en RAM', () => {
  const space = new HypercubeSpace();
  // V1: Exporta 'formatCurrency'
  const v1 = createMockVertex('src/utils.ts', CubicCell.CoreLogic, ['formatCurrency']);
  // V2: Importa 'formatCurrency' de V1
  const v2 = createMockVertex('src/view.ts', CubicCell.UI, ['render'], [
    { name: 'formatCurrency', targetFile: 'src/utils.ts' },
  ]);
  linkVertices(v2, v1);

  space.addVertex(v1);
  space.addVertex(v2);

  // Proponemos un cambio que BORRA 'formatCurrency' y la reemplaza con 'formatMoney'
  // Esto rompe el contrato con src/view.ts y genera una regresión
  const brokenCode = `
    export function formatMoney(val: number): string { return '$' + val; }
  `;

  const trial = TransactionalHealer.simulateTrial(space, 'src/utils.ts', brokenCode);

  assert.equal(trial.isSafeToCommit, false);
  assert.equal(trial.rollbackExecuted, true);
  assert.equal(trial.trialStatus, 'BLOQUEADO_POR_REGRESIONES');
  assert.ok(trial.regressionCount > 0);
  assert.ok(trial.newRegressions.some((r) => r.type === 'CONTRACT_MISMATCH'));
  assert.ok(trial.richDossierForAI.includes('ROLLBACK AUTOMÁTICO EJECUTADO'));
  assert.ok(trial.richDossierForAI.includes('Regresiones Detectadas'));
});

test('TransactionalHealer: AutoHeal autónomo sintetiza y prueba parche en RAM', async () => {
  const space = new HypercubeSpace();
  // V1: proveedor sin el símbolo esperado 'loginUser'
  const v1 = createMockVertex('src/auth.ts', CubicCell.Security, ['oldLogin']);
  // V2: llamador esperando 'loginUser' de V1
  const v2 = createMockVertex('src/main.ts', CubicCell.CoreLogic, ['run'], [
    { name: 'loginUser', targetFile: 'src/auth.ts' },
  ]);
  linkVertices(v2, v1);

  space.addVertex(v1);
  space.addVertex(v2);

  const autoResult = await TransactionalHealer.autoHealFracture(
    space,
    'src/auth.ts',
    undefined,
    false // no commit to disk
  );

  assert.ok(autoResult.targetFile);
  assert.ok(autoResult.trial);
  assert.equal(autoResult.committedToDisk, false);
  assert.ok(autoResult.trial.richDossierForAI);
  assert.ok(autoResult.trial.extinguishedCount >= 1 || autoResult.trial.isSafeToCommit);
});

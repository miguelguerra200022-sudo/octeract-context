/**
 * Tests para la suite Google DeepMind en Octeract 8D:
 * FunSearch, AlphaGeometry (Deductive Engine), AlphaDev, Pairformer, StepVerifier (PRM)
 */

import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'node:path';
import {
  OcteractFunSearchEngine,
  OcteractDeductiveEngine,
  OcteractAlphaDevOptimizer,
  OcteractPairformer,
  OcteractStepVerifier,
} from '../src/deepmind/index.ts';
import { ProjectIndexer } from '../src/core/indexer.ts';

describe('Google DeepMind Suite en Octeract 8D', () => {
  const rootDir = process.cwd();

  test('OcteractFunSearchEngine: Especificación formal, evaluación en sandbox y modelo de islas', () => {
    const engine = new OcteractFunSearchEngine(rootDir, undefined, 3);
    const spec = engine.createSpecification(
      'computeSum',
      'function computeSum(arr: number[]): number { return arr.reduce((a, b) => a + b, 0); }',
      'Optimizar suma'
    );

    assert.ok(spec.systemPrompt.includes('FunSearch'));
    assert.strictEqual(spec.functionName, 'computeSum');

    // Evaluar candidato seguro
    const safeCandidateCode = 'function computeSum(arr) { let s = 0; for (let i = 0; i < arr.length; i++) s += arr[i]; return s; }';
    const evalResult = engine.evaluateCandidate(safeCandidateCode, 'src/sum.ts');

    assert.strictEqual(evalResult.passedSandbox, true);
    assert.ok(evalResult.score > 0);

    // Registrar en isla
    const registered = engine.registerCandidate(evalResult, 0);
    assert.strictEqual(registered.islandId, 0);
    assert.strictEqual(registered.generation, 1);

    const report = engine.getReport();
    assert.strictEqual(report.islandsCount, 3);
    assert.strictEqual(report.totalEvaluated, 1);
    assert.ok(report.globalBestScore > 0);
  });

  test('OcteractDeductiveEngine: Extracción de hechos y deducción de cláusulas de Horn (AlphaGeometry)', async () => {
    const indexer = new ProjectIndexer();
    if (!indexer.loadIndex(rootDir)) {
      indexer.indexDirectory({ rootDir });
    }
    const space = indexer.getSpace();
    const deductive = new OcteractDeductiveEngine(rootDir);

    const report = deductive.verify(space);
    assert.ok(report.totalFacts > 0);
    assert.ok(report.iterationsToFixpoint >= 1);
    assert.strictEqual(typeof report.isSymmetric, 'boolean');
  });

  test('OcteractAlphaDevOptimizer: Transformación de micro-patrones cuadráticos a hash sets O(1)', () => {
    const optimizer = new OcteractAlphaDevOptimizer(rootDir);
    const slowCode = `
function processItems(items, blacklist) {
  const result = [];
  for (const item of items) {
    if (!blacklist.includes(item)) {
      result.push(item);
    }
  }
  return result;
}
`;

    const optResult = optimizer.optimize(slowCode, 'src/process.ts');
    assert.ok(optResult.transformationsApplied.length > 0);
    assert.strictEqual(optResult.transformationsApplied[0].type, 'NESTED_INCLUDES_TO_SET');
    assert.ok(optResult.optimizedCode.includes('new Set(blacklist)'));
    assert.ok(optResult.optimizedCode.includes('.has(item)'));
    assert.strictEqual(optResult.isSyntaxValid, true);
    assert.ok(optResult.theoreticalSpeedup.includes('O(N^2)'));
  });

  test('OcteractPairformer: Tensor relacional N x N y actualizaciones triangulares (AlphaFold 3)', async () => {
    const indexer = new ProjectIndexer();
    if (!indexer.loadIndex(rootDir)) {
      indexer.indexDirectory({ rootDir });
    }
    const pairformer = new OcteractPairformer(indexer.getSpace());
    const report = pairformer.computePairTensor();

    assert.ok(report.totalVertices > 0);
    assert.ok(report.totalPairRelations >= 0);
    assert.strictEqual(typeof report.triangularDensity, 'number');
    assert.ok(Array.isArray(report.topCriticalPairs));
  });

  test('OcteractStepVerifier: Process Reward Model (PRM) con veto y recompensa paso a paso', () => {
    const verifier = new OcteractStepVerifier(rootDir);
    const origCode = `
export class TokenService {
  public verify(token: string): boolean {
    return token.length > 10;
  }
}
`;

    const safeChange = `
export class TokenService {
  public verify(token: string): boolean {
    if (!token) return false;
    return token.length > 10;
  }
}
`;

    const safeReport = verifier.verifySteps(origCode, safeChange, 'src/service.ts');
    assert.strictEqual(safeReport.overallVerdict, 'ACCEPTED');
    assert.ok(safeReport.cumulativeReward >= 70);

    // Cambio destructivo: eliminar exportación de la clase
    const destructiveChange = `
class MutilatedTokenService {
  public verify(token: string): boolean {
    return true;
  }
}
`;

    const destructiveReport = verifier.verifySteps(origCode, destructiveChange, 'src/service.ts');
    assert.strictEqual(destructiveReport.overallVerdict, 'REJECTED_BY_PRM');
    assert.ok(destructiveReport.rejectedStepsCount > 0);
  });
});

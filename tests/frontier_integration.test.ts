import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractProgramSlicer } from '../src/core/slicer.ts';
import { OcteractReproducer } from '../src/core/reproducer.ts';
import { OcteractSpeculativePatcher } from '../src/core/patcher.ts';
import { OcteractTreeSearch } from '../src/core/mcts.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { OcteractOrchestratorEngine } from '../src/core/orchestrator.ts';

describe('Octeract v4.2 Supreme Frontier Integration', () => {
  test('all 4 frontier engines instantiate and execute cooperatively', async () => {
    const space = new HypercubeSpace();
    const slicer = new OcteractProgramSlicer();
    const reproducer = new OcteractReproducer();
    const patcher = new OcteractSpeculativePatcher();
    const mcts = new OcteractTreeSearch(space);
    const orchestrator = new OcteractOrchestratorEngine('.');

    assert.ok(slicer);
    assert.ok(reproducer);
    assert.ok(patcher);
    assert.ok(mcts);
    assert.ok(orchestrator);

    // Test Slicer
    const slice = slicer.computeSlice('function f(x) { let a = 1; let b = x + a; return b; }', {
      targetVariable: 'b',
    });
    assert.ok(slice.slicedCode.includes('return b'));

    // Test Reproducer
    const script = reproducer.synthesizeReproducer({
      id: 'TEST_FRAC',
      sourceFile: 'src/core/foo.ts',
      targetSymbol: 'foo',
      description: 'Missing export foo',
    });
    assert.ok(script.reproducerCode.includes('foo'));

    // Test Patcher
    const patch = patcher.graftFunction('function oldFn() { return 1; }', 'oldFn', 'function oldFn() { return 2; }');
    assert.ok(patch.success);
    assert.ok(patch.patchedCode.includes('return 2'));

    // Test MCTS
    const mctsRes = await mcts.search({
      targetFile: 'src/core/foo.ts',
      candidatePatches: [{ id: 'p1', code: 'export function ok() {}' }],
      maxIterations: 5,
    });
    assert.ok(mctsRes.bestTrajectory.length > 0);
  });
});

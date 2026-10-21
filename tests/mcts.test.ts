import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractTreeSearch } from '../src/core/mcts.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';

describe('OcteractTreeSearch (MCTS Test-Time Compute)', () => {
  test('explores candidate refactoring tree in RAM and finds highest reward path', async () => {
    const space = new HypercubeSpace();
    const mcts = new OcteractTreeSearch(space);

    const result = await mcts.search({
      targetFile: 'src/core/sample.ts',
      candidatePatches: [
        { id: 'patch_broken', code: 'export function broken() { syntax error }', expectedDelta: -10 },
        { id: 'patch_safe', code: 'export function safe() { return 42; }', expectedDelta: +5 },
      ],
      maxIterations: 10,
    });

    assert.ok(result.totalIterations > 0);
    assert.ok(result.bestTrajectory.length > 0);
    assert.equal(result.bestTrajectory[0].patchId, 'patch_safe');
    assert.ok(result.bestTrajectory[0].rewardScore > 0);
    assert.ok(result.executionTimeMs < 100);
  });

  test('prunes destructive branches and selects multi-step optimal sequence', async () => {
    const space = new HypercubeSpace();
    const mcts = new OcteractTreeSearch(space);

    const result = await mcts.search({
      targetFile: 'src/core/indexer.ts',
      candidatePatches: [
        { id: 'step_1_bad', code: 'throw new Error()', expectedDelta: -50 },
        { id: 'step_1_good', code: 'const fastCache = new Map();', expectedDelta: 20 },
        { id: 'step_1_optimal', code: 'const fastCache = new Map(); const fdir = true;', expectedDelta: 45 },
      ],
      maxIterations: 15,
    });

    assert.equal(result.bestTrajectory[0].patchId, 'step_1_optimal');
    assert.ok(result.treeSize >= 3);
  });
});

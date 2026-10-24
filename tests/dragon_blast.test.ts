import test from 'node:test';
import assert from 'node:assert/strict';
import { OcteractDragonBlast } from '../src/dragon/dragonBlast.ts';

test('OcteractDragonBlast: propagates wavefront shockwave with Hausdorff fractal damping', () => {
  // Construct a dense dependency graph
  const graph = new Map<string, string[]>();
  graph.set('root.ts', ['core.ts', 'storage.ts', 'auth.ts']);
  graph.set('core.ts', ['math.ts', 'algo.ts', 'helper.ts']);
  graph.set('storage.ts', ['db.ts', 'disk.ts']);
  graph.set('auth.ts', ['crypto.ts', 'token.ts']);
  graph.set('math.ts', ['leaf1.ts', 'leaf2.ts']);
  graph.set('algo.ts', ['leaf3.ts']);

  const report = OcteractDragonBlast.propagateWavefront('root.ts', graph, 1.0, 5);

  assert.equal(report.epicenter, 'root.ts');
  assert.equal(report.initialEnergy, 1.0);
  assert.ok(report.totalNodesReached > 1);
  assert.ok(report.tiers.length > 0);
  assert.ok(report.primaryImpactChain.length >= 2);
  assert.equal(report.primaryImpactChain[0], 'root.ts');

  // Verify Hausdorff damping: energy strictly attenuates
  for (let i = 1; i < report.tiers.length; i++) {
    assert.ok(report.tiers[i].attenuatedEnergy < report.tiers[i - 1].attenuatedEnergy);
  }
});

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractStarlightBlast } from '../src/voxel/starlight-blast.ts';

test('OcteractStarlightBlast: propagates light from Level 15 down to 0 across graph', () => {
  const engine = new OcteractStarlightBlast();

  // Create graph nodes
  const id0 = engine.registerNode('src/core/kernel.ts');
  const id1 = engine.registerNode('src/core/memory.ts');
  const id2 = engine.registerNode('src/core/cache.ts');
  const id3 = engine.registerNode('src/ui/view.ts');

  engine.addEdge(id0, id1);
  engine.addEdge(id1, id2);
  engine.addEdge(id2, id3);

  const report = engine.propagateLight(id0, 15);

  assert.equal(report.sourceNode, 'src/core/kernel.ts');
  assert.equal(report.illuminatedNodes.length, 4);

  const node0 = report.illuminatedNodes.find(n => n.id === 'src/core/kernel.ts')!;
  const node1 = report.illuminatedNodes.find(n => n.id === 'src/core/memory.ts')!;
  const node2 = report.illuminatedNodes.find(n => n.id === 'src/core/cache.ts')!;
  const node3 = report.illuminatedNodes.find(n => n.id === 'src/ui/view.ts')!;

  assert.equal(node0.lightLevel, 15, 'La fuente debe tener luz 15');
  assert.equal(node1.lightLevel, 14, 'El salto 1 debe tener luz 14');
  assert.equal(node2.lightLevel, 13, 'El salto 2 debe tener luz 13');
  assert.equal(node3.lightLevel, 12, 'El salto 3 debe tener luz 12');

  assert.equal(node0.zone, 'DIRECT_FRACTURE_ZONE');
});

test('OcteractStarlightBlast: high-speed performance across dense synthetic graph', () => {
  const engine = new OcteractStarlightBlast();
  const nodeCount = 500;
  const nodes: number[] = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push(engine.registerNode('module_' + i));
  }

  // Connect in a mesh
  for (let i = 0; i < nodeCount - 1; i++) {
    engine.addEdge(nodes[i], nodes[i + 1]);
    if (i + 2 < nodeCount) engine.addEdge(nodes[i], nodes[i + 2]);
  }

  const start = performance.now();
  const report = engine.propagateLight(nodes[0], 15);
  const dur = performance.now() - start;

  assert.ok(dur < 15, 'La propagación Starlight debe tardar menos de 15 ms para cientos de nodos');
  assert.ok(report.illuminatedNodes.length > 0);
  assert.ok(report.nodesPerSecond > 50000);
});

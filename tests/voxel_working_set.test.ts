import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractWorkingSetHorizon } from '../src/voxel/working-set.ts';

test('OcteractWorkingSetHorizon: assigns Level 31 and attenuates outwards', () => {
  const manager = new OcteractWorkingSetHorizon();

  // Topology graph: A -> B -> C -> D
  manager.registerNeighbors('src/A.ts', ['src/B.ts']);
  manager.registerNeighbors('src/B.ts', ['src/A.ts', 'src/C.ts']);
  manager.registerNeighbors('src/C.ts', ['src/B.ts', 'src/D.ts']);
  manager.registerNeighbors('src/D.ts', ['src/C.ts']);

  // Place player/agent ticket on A with radius 2
  manager.addTicket('agent-ticket-1', 'src/A.ts', 31, 2);

  const statusA = manager.getFileLevel('src/A.ts');
  const statusB = manager.getFileLevel('src/B.ts');
  const statusC = manager.getFileLevel('src/C.ts');
  const statusD = manager.getFileLevel('src/D.ts');

  assert.equal(statusA.level, 31);
  assert.equal(statusA.state, 'ACTIVE');

  assert.equal(statusB.level, 32);
  assert.equal(statusB.state, 'CONTRACT_ONLY');

  assert.equal(statusC.level, 33);
  assert.equal(statusC.state, 'SKELETON_ONLY');

  assert.ok(statusD.level >= 34);
  assert.equal(statusD.state, 'UNLOADED');
});

test('OcteractWorkingSetHorizon: ticket removal allows clean eviction of inactive files', () => {
  const manager = new OcteractWorkingSetHorizon();
  manager.registerNeighbors('src/A.ts', ['src/B.ts']);

  manager.addTicket('agent-1', 'src/A.ts', 31, 1);
  assert.equal(manager.getFileLevel('src/A.ts').state, 'ACTIVE');

  manager.removeTicket('agent-1');
  const evicted = manager.evictInactive();

  assert.ok(evicted.includes('src/A.ts') || manager.getFileLevel('src/A.ts').level >= 34);
  assert.equal(manager.getFileLevel('src/A.ts').state, 'UNLOADED');
});

test('OcteractWorkingSetHorizon: overlapping tickets keep the most active level (min level value)', () => {
  const manager = new OcteractWorkingSetHorizon();
  manager.registerNeighbors('src/A.ts', ['src/B.ts']);
  manager.registerNeighbors('src/C.ts', ['src/B.ts']);

  // Ticket 1: A at 31, radius 1 -> B gets 32
  manager.addTicket('t1', 'src/A.ts', 31, 1);
  // Ticket 2: B at 31
  manager.addTicket('t2', 'src/B.ts', 31, 1);

  assert.equal(manager.getFileLevel('src/B.ts').level, 31, 'B debe tener nivel 31 por ticket directo');
});

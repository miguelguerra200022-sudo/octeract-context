import test from 'node:test';
import assert from 'node:assert/strict';
import { OcteractDragonIndex } from '../src/dragon/dragonIndex.ts';

test('OcteractDragonIndex: generates correct canonical Heighway folding sequence', () => {
  // First 7 turns of Heighway dragon: R, R, L, R, R, L, L
  const sequence = OcteractDragonIndex.generateFoldingSequence(7);
  assert.deepEqual(sequence, ['R', 'R', 'L', 'R', 'R', 'L', 'L']);

  // Check O(1) turn computation at individual steps
  assert.equal(OcteractDragonIndex.getTurnAtStep(1), 'R');
  assert.equal(OcteractDragonIndex.getTurnAtStep(2), 'R');
  assert.equal(OcteractDragonIndex.getTurnAtStep(3), 'L');
  assert.equal(OcteractDragonIndex.getTurnAtStep(4), 'R');
});

test('OcteractDragonIndex: encodes 8D point into Knuth-Octonionic Dragon hash', () => {
  const ptA = [0.5, -0.2, 0.8, 0.0, 0.1, -0.5, 0.3, 0.9];
  const coordA = OcteractDragonIndex.encode8DToDragon(ptA);

  assert.ok(coordA.hash.startsWith('0x'));
  assert.equal(coordA.depth, 16);
  assert.equal(coordA.octonionicVector.length, 8);
  assert.equal(coordA.turnsSequence.length, 16);
});

test('OcteractDragonIndex: calculates O(1) bitwise XOR fractal distance and shear', () => {
  const ptA = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
  const ptB = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]; // identical
  const ptC = [-1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0]; // opposite

  const coordA = OcteractDragonIndex.encode8DToDragon(ptA);
  const coordB = OcteractDragonIndex.encode8DToDragon(ptB);
  const coordC = OcteractDragonIndex.encode8DToDragon(ptC);

  // Identical points should have 0 distance
  const distIdentical = OcteractDragonIndex.computeFractalDistance(coordA.hash, coordB.hash);
  assert.equal(distIdentical.hammingDistance, 0);
  assert.equal(distIdentical.normalizedFractalShear, 0);

  // Distant points should have non-zero distance
  const distDiff = OcteractDragonIndex.computeFractalDistance(coordA.hash, coordC.hash);
  assert.ok(distDiff.hammingDistance > 0);
  assert.ok(distDiff.normalizedFractalShear > 0);
});

test('OcteractDragonIndex: sorts items along continuous space-filling Dragon path', () => {
  const items = [
    { name: 'Core', pt: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8] },
    { name: 'Storage', pt: [-0.8, -0.8, -0.8, -0.8, -0.8, -0.8, -0.8, -0.8] },
    { name: 'UI', pt: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] },
  ];

  const sorted = OcteractDragonIndex.sortAlongDragonCurve(items, (i) => i.pt);
  assert.equal(sorted.length, 3);
  assert.ok(sorted[0].dragonCoord.hash);
});

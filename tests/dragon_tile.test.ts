import test from 'node:test';
import assert from 'node:assert/strict';
import { OcteractDragonTile } from '../src/dragon/dragonTile.ts';

test('OcteractDragonTile: partitions vertices into 4 interlocking dragon sectors', () => {
  const vertices = [
    { id: 'db.ts', cell: 'Storage', dependencies: [] },
    { id: 'engine.ts', cell: 'CoreLogic', dependencies: ['db.ts'] },
    { id: 'view.ts', cell: 'UI', dependencies: ['engine.ts'] },
    { id: 'auth.ts', cell: 'Security', dependencies: ['engine.ts'] },
  ];

  const report = OcteractDragonTile.partitionRepository(vertices, 'app_root');

  assert.equal(report.totalFiles, 4);
  assert.ok(report.quadrants.ALFA_STORAGE.files.includes('db.ts'));
  assert.ok(report.quadrants.BETA_CORE.files.includes('engine.ts'));
  assert.ok(report.quadrants.GAMMA_SURFACE.files.includes('view.ts'));
  assert.ok(report.quadrants.DELTA_GOVERNANCE.files.includes('auth.ts'));
  assert.equal(report.illegalBoundaryLeaks.length, 0);
  assert.equal(report.verdict, 'PERFECT_DRAGON_TILING');
});

test('OcteractDragonTile: detects illegal direct UI-to-Storage coupling leak', () => {
  const vertices = [
    { id: 'secretDb.ts', cell: 'Storage', dependencies: [] },
    { id: 'hackedView.ts', cell: 'UI', dependencies: ['secretDb.ts'] }, // Leaking boundary!
  ];

  const report = OcteractDragonTile.partitionRepository(vertices, 'app_leak');

  assert.ok(report.illegalBoundaryLeaks.length > 0);
  assert.equal(report.illegalBoundaryLeaks[0].fromQuadrant, 'GAMMA_SURFACE');
  assert.equal(report.illegalBoundaryLeaks[0].toQuadrant, 'ALFA_STORAGE');
  assert.ok(report.tessellationPurity < 100);
});

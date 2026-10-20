import test from 'node:test';
import assert from 'node:assert/strict';
import { BinarySerializer } from '../src/core/binary.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { CubicCell } from '../src/core/types.ts';

test('BinarySerializer: Serializa y deserializa hipercubo con cabecera TESS y formato CSR', () => {
  const space = new HypercubeSpace();
  space.addVertex({
    id: 'src/a.ts',
    path: '/repo/src/a.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.1, 0.2, 0.3, 0.4],
    lines: 100,
    sizeBytes: 1024,
    tokenEstimate: 250,
    symbols: [{ name: 'fnA', kind: 'function', line: 10, isExported: true }],
    dependencies: ['src/b.ts'],
    dependents: [],
    inDegree: 0,
    outDegree: 1,
    lastModified: Date.now(),
  });
  space.addVertex({
    id: 'src/b.ts',
    path: '/repo/src/b.ts',
    cell: CubicCell.Security,
    coordinate: [0.9, 0.8, 0.7, 0.6],
    lines: 200,
    sizeBytes: 2048,
    tokenEstimate: 500,
    symbols: [{ name: 'AuthToken', kind: 'interface', line: 5, isExported: true }],
    dependencies: [],
    dependents: ['src/a.ts'],
    inDegree: 1,
    outDegree: 0,
    lastModified: Date.now(),
  });

  const buffer = BinarySerializer.serialize(space);
  assert.ok(buffer.length > 0);
  assert.equal(buffer.toString('utf8', 0, 4), 'TESS', 'Debe comenzar con la firma mágica TESS');

  const restored = BinarySerializer.deserialize(buffer);
  const vertices = restored.getVertices();
  assert.equal(vertices.length, 2);

  const vA = restored.getVertex('src/a.ts');
  assert.ok(vA);
  assert.equal(vA.id, 'src/a.ts');
  assert.equal(vA.cell, CubicCell.CoreLogic);
  assert.equal(vA.lines, 100);
  assert.deepEqual(vA.dependencies, ['src/b.ts']);
  assert.ok(Math.abs(vA.coordinate[0] - 0.1) < 1e-5);
  assert.ok(Math.abs(vA.coordinate[1] - 0.2) < 1e-5);

  const vB = restored.getVertex('src/b.ts');
  assert.ok(vB);
  assert.equal(vB.cell, CubicCell.Security);
  assert.equal(vB.symbols[0].name, 'AuthToken');
});

test('BinarySerializer: Lanza error y rechaza buffers corruptos o truncados', () => {
  const corrupted = Buffer.from('INVALID_HEADER_DATA');
  assert.throws(() => {
    BinarySerializer.deserialize(corrupted);
  }, /Cabecera mágica inválida/);
});

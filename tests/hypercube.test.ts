import test from 'node:test';
import assert from 'node:assert';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { CubicCell, type HyperVertex, type Point4D } from '../src/core/types.ts';

test('HypercubeSpace: Rotaciones ortogonales en los 6 planos 4D', () => {
  const p: Point4D = [1, 0, 0, 0];

  // Rotación de 90 grados (PI/2) en plano XY
  const rXY = HypercubeSpace.rotate4D(p, 'XY', Math.PI / 2);
  assert.ok(Math.abs(rXY[0]) < 1e-6, 'X debe ser 0 tras rotar 90 grados');
  assert.ok(Math.abs(rXY[1] - 1) < 1e-6, 'Y debe ser 1 tras rotar 90 grados');

  // Rotación de 90 grados en plano XW
  const rXW = HypercubeSpace.rotate4D(p, 'XW', Math.PI / 2);
  assert.ok(Math.abs(rXW[0]) < 1e-6, 'X debe ser 0 tras rotar en XW');
  assert.ok(Math.abs(rXW[3] - 1) < 1e-6, 'W debe ser 1 tras rotar en XW');
});

test('HypercubeSpace: Proyección de 4D a 3D con perspectiva', () => {
  const p: Point4D = [1, 1, 1, 0.5];
  const p3 = HypercubeSpace.project4Dto3D(p, 2.5); // factor = 1 / (2.5 - 0.5) = 1/2 = 0.5

  assert.strictEqual(p3[0], 0.5);
  assert.strictEqual(p3[1], 0.5);
  assert.strictEqual(p3[2], 0.5);
});

test('HypercubeSpace: Slicing con presupuesto de tokens', () => {
  const space = new HypercubeSpace();

  for (let i = 0; i < 10; i++) {
    const vertex: HyperVertex = {
      id: `file_${i}.ts`,
      hexCode: `0x${i.toString(16)}000`,
      path: `file_${i}.ts`,
      cell: i % 2 === 0 ? CubicCell.CoreLogic : CubicCell.Network,
      coordinate: [0.1 * i, 0.2, 0.3, 0.4],
      lines: 50,
      sizeBytes: 1000,
      tokenEstimate: 500,
      symbols: [{ name: `fn_${i}`, kind: 'function', lineStart: 1, lineEnd: 10, dependencies: [] }],
      dependencies: [],
      dependents: [],
      lastModified: Date.now(),
    };
    space.addVertex(vertex);
  }

  // Presupuesto limitado a 1200 tokens (deberían caber ~2 o 3 vértices)
  const sliceResult = space.slice({
    tokenBudget: 1200,
  });

  assert.ok(sliceResult.totalTokens <= 1200, 'El corte debe respetar el presupuesto de tokens');
  assert.ok(sliceResult.vertices.length > 0, 'Debe incluir al menos un vértice');
  assert.ok(sliceResult.projectedCode.includes('TESSERACT-CONTEXT'), 'El encabezado debe estar presente');
});

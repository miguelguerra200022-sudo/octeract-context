/**
 * TESSERACT-CONTEXT v2.0: Pruebas Unitarias del Panal Teseráctico {4,3,3,4} para Monorrepos
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { TesseracticHoneycomb } from '../src/core/honeycomb.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { CubicCell, type HyperVertex } from '../src/core/types.ts';

test('TesseracticHoneycomb: Asigna coordenadas de red Z^4 y detecta adyacencia de teseractos', () => {
  const honeycomb = new TesseracticHoneycomb();

  const latticeCore = honeycomb.registerPackage('@myrepo/core', 'packages/core', [0, 0, 0, 0]);
  const latticeUi = honeycomb.registerPackage('@myrepo/ui', 'packages/ui', [1, 0, 0, 0]);
  const latticeApi = honeycomb.registerPackage('@myrepo/api', 'apps/api', [0, 1, 0, 0]);

  assert.deepEqual(latticeCore, [0, 0, 0, 0]);
  assert.deepEqual(latticeUi, [1, 0, 0, 0]);
  assert.deepEqual(latticeApi, [0, 1, 0, 0]);

  // Core y UI son adyacentes a lo largo del eje X (delta = 1)
  assert.ok(TesseracticHoneycomb.areAdjacent(latticeCore, latticeUi));
  assert.equal(TesseracticHoneycomb.getAdjacencyAxis(latticeCore, latticeUi), 'X');

  // Core y API son adyacentes a lo largo del eje Y (delta = 1)
  assert.ok(TesseracticHoneycomb.areAdjacent(latticeCore, latticeApi));
  assert.equal(TesseracticHoneycomb.getAdjacencyAxis(latticeCore, latticeApi), 'Y');

  // UI y API difieren en 2 ejes (X e Y) -> NO son adyacentes por faceta cúbica directa
  assert.ok(!TesseracticHoneycomb.areAdjacent(latticeUi, latticeApi));
});

test('TesseracticHoneycomb: Detecta facetas cúbicas 3D compartidas entre paquetes adyacentes', () => {
  const honeycomb = new TesseracticHoneycomb();

  const spaceCore = new HypercubeSpace();
  const vCore: HyperVertex = {
    id: 'packages/core/src/index.ts',
    hexCode: '0x1',
    path: 'packages/core/src/index.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.95, 0.5, 0.5, 0.5],
    lines: 20,
    sizeBytes: 200,
    tokenEstimate: 100,
    symbols: [
      {
        name: 'ApiClient',
        kind: 'class',
        lineStart: 1,
        lineEnd: 20,
        dependencies: [],
        isExported: true
      }
    ],
    dependencies: [],
    dependents: ['packages/ui/src/button.ts'],
    lastModified: Date.now()
  };
  spaceCore.addVertex(vCore);

  const spaceUi = new HypercubeSpace();
  const vUi: HyperVertex = {
    id: 'packages/ui/src/button.ts',
    hexCode: '0x2',
    path: 'packages/ui/src/button.ts',
    cell: CubicCell.UI,
    coordinate: [0.05, 0.5, 0.5, 0.5],
    lines: 15,
    sizeBytes: 150,
    tokenEstimate: 80,
    symbols: [],
    dependencies: ['@myrepo/core'],
    dependents: [],
    lastModified: Date.now()
  };
  spaceUi.addVertex(vUi);

  honeycomb.registerPackage('@myrepo/core', 'packages/core', [0, 0, 0, 0], spaceCore);
  honeycomb.registerPackage('@myrepo/ui', 'packages/ui', [1, 0, 0, 0], spaceUi);

  const facets = honeycomb.findSharedFacets();
  assert.equal(facets.length, 1);
  assert.equal(facets[0].packageA, '@myrepo/core');
  assert.equal(facets[0].packageB, '@myrepo/ui');
  assert.equal(facets[0].axis, 'X');
  assert.ok(facets[0].sharedSymbols.includes('ApiClient'));
});

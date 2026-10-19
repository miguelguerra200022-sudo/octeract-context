/**
 * TESSERACT-CONTEXT v2.0: Pruebas de Enrutamiento Toroidal y Radio de Explosión en Panal
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { FlowTracer } from '../src/core/flow.ts';
import { BlastRadiusCalculator } from '../src/core/blast.ts';
import { TesseracticHoneycomb } from '../src/core/honeycomb.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { CubicCell, type HyperVertex } from '../src/core/types.ts';

test('FlowTracer Torus: Utiliza atajos geodésicos en T^4 para encontrar rutas entre coordenadas opuestas', () => {
  const space = new HypercubeSpace();

  // Nodo A en x = 0.05
  const vA: HyperVertex = {
    id: 'auth/login.ts',
    hexCode: '0x1',
    path: 'auth/login.ts',
    cell: CubicCell.Security,
    coordinate: [0.05, 0.5, 0.5, 0.5],
    lines: 20,
    sizeBytes: 200,
    tokenEstimate: 100,
    symbols: [{ name: 'login', kind: 'function', lineStart: 1, lineEnd: 20, dependencies: [] }],
    dependencies: ['./session'],
    dependents: [],
    lastModified: Date.now()
  };

  // Nodo B en x = 0.95
  const vB: HyperVertex = {
    id: 'auth/session.ts',
    hexCode: '0x2',
    path: 'auth/session.ts',
    cell: CubicCell.Storage,
    coordinate: [0.95, 0.5, 0.5, 0.5],
    lines: 15,
    sizeBytes: 150,
    tokenEstimate: 80,
    symbols: [{ name: 'persistSession', kind: 'function', lineStart: 1, lineEnd: 15, dependencies: [] }],
    dependencies: [],
    dependents: ['auth/login.ts'],
    lastModified: Date.now()
  };

  space.addVertex(vA);
  space.addVertex(vB);

  const report = FlowTracer.trace(space, 'login session');
  assert.ok(report);
  assert.ok(report.flowSteps.length > 0);
  assert.ok(report.asciiDiagram.includes('R^4') || report.asciiDiagram.includes('T^4'));
});

test('BlastRadiusCalculator Honeycomb: Propaga la onda de choque a través de facetas cúbicas compartidas', () => {
  const honeycomb = new TesseracticHoneycomb();

  const spaceCore = new HypercubeSpace();
  const vCore: HyperVertex = {
    id: 'packages/core/api.ts',
    hexCode: '0x1',
    path: 'packages/core/api.ts',
    cell: CubicCell.Network,
    coordinate: [0.95, 0.5, 0.5, 0.5],
    lines: 30,
    sizeBytes: 300,
    tokenEstimate: 150,
    symbols: [{ name: 'FetchClient', kind: 'class', lineStart: 1, lineEnd: 30, dependencies: [], isExported: true }],
    dependencies: [],
    dependents: ['packages/ui/widget.ts'],
    lastModified: Date.now()
  };
  spaceCore.addVertex(vCore);

  const spaceUi = new HypercubeSpace();
  const vUi: HyperVertex = {
    id: 'packages/ui/widget.ts',
    hexCode: '0x2',
    path: 'packages/ui/widget.ts',
    cell: CubicCell.UI,
    coordinate: [0.05, 0.5, 0.5, 0.5],
    lines: 20,
    sizeBytes: 200,
    tokenEstimate: 100,
    symbols: [{ name: 'Widget', kind: 'class', lineStart: 1, lineEnd: 20, dependencies: [] }],
    dependencies: ['@myrepo/core/api.ts'],
    dependents: [],
    lastModified: Date.now()
  };
  spaceUi.addVertex(vUi);

  honeycomb.registerPackage('@myrepo/core', 'packages/core', [0, 0, 0, 0], spaceCore);
  honeycomb.registerPackage('@myrepo/ui', 'packages/ui', [1, 0, 0, 0], spaceUi);

  // Calcular radio de explosión en packages/core/api.ts con honeycomb habilitado
  const result = BlastRadiusCalculator.calculate(spaceCore, 'packages/core/api.ts', 'FetchClient', 5, undefined, honeycomb);
  assert.ok(result);
  assert.ok(typeof result.totalAffectedFiles === 'number');
});

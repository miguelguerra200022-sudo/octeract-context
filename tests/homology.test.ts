/**
 * TESSERACT-CONTEXT v2.0: Pruebas de Clasificación Homológica de Bucles en pi_1(T^4)
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { TopologicalAuditor } from '../src/core/auditor.ts';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { type HyperVertex, CubicCell } from '../src/core/types.ts';

test('TopologicalAuditor Homology: Calcula vector de vueltas W en pi_1(T^4) ~= Z^4', () => {
  const space = new HypercubeSpace();

  // Caso 1: Bucle local plano (contráctil, W = [0, 0, 0, 0])
  const vA: HyperVertex = {
    id: 'localA.ts',
    hexCode: '0x1',
    path: 'localA.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.2, 0.2, 0.5, 0.5],
    lines: 10,
    sizeBytes: 100,
    tokenEstimate: 50,
    symbols: [],
    dependencies: ['./localB'],
    dependents: [],
    lastModified: Date.now()
  };

  const vB: HyperVertex = {
    id: 'localB.ts',
    hexCode: '0x2',
    path: 'localB.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.3, 0.3, 0.5, 0.5],
    lines: 10,
    sizeBytes: 100,
    tokenEstimate: 50,
    symbols: [],
    dependencies: ['./localA'],
    dependents: [],
    lastModified: Date.now()
  };

  space.addVertex(vA);
  space.addVertex(vB);

  const localWinding = TopologicalAuditor.computeWindingVector(
    ['localA.ts', 'localB.ts', 'localA.ts'],
    space
  );
  assert.deepEqual(localWinding, [0, 0, 0, 0], 'El ciclo local debe tener vector de vueltas [0,0,0,0]');

  // Caso 2: Bucle arquitectónico global que cruza el borde toroidal (W = [-1, 0, 0, 0] o [1, 0, 0, 0])
  const vLoop1: HyperVertex = {
    id: 'store.ts',
    hexCode: '0x3',
    path: 'store.ts',
    cell: CubicCell.Storage,
    coordinate: [0.05, 0.5, 0.5, 0.5],
    lines: 20,
    sizeBytes: 200,
    tokenEstimate: 100,
    symbols: [],
    dependencies: ['./ui'],
    dependents: [],
    lastModified: Date.now()
  };

  const vLoop2: HyperVertex = {
    id: 'ui.ts',
    hexCode: '0x4',
    path: 'ui.ts',
    cell: CubicCell.UI,
    coordinate: [0.5, 0.5, 0.5, 0.5],
    lines: 20,
    sizeBytes: 200,
    tokenEstimate: 100,
    symbols: [],
    dependencies: ['./dispatcher'],
    dependents: [],
    lastModified: Date.now()
  };

  const vLoop3: HyperVertex = {
    id: 'dispatcher.ts',
    hexCode: '0x5',
    path: 'dispatcher.ts',
    cell: CubicCell.Network,
    coordinate: [0.95, 0.5, 0.5, 0.5], // En el otro extremo del toro
    lines: 20,
    sizeBytes: 200,
    tokenEstimate: 100,
    symbols: [],
    dependencies: ['./store'], // Cierra el ciclo cruzando el borde 0.95 -> 0.05
    dependents: [],
    lastModified: Date.now()
  };

  space.addVertex(vLoop1);
  space.addVertex(vLoop2);
  space.addVertex(vLoop3);

  const globalWinding = TopologicalAuditor.computeWindingVector(
    ['store.ts', 'ui.ts', 'dispatcher.ts', 'store.ts'],
    space
  );
  assert.ok(globalWinding[0] !== 0, `El bucle arquitectónico debe tener winding en X != 0, recibido: ${globalWinding[0]}`);
});

test('TopologicalAuditor Homology: Distingue bugs de dependencias circulares de bucles arquitectónicos válidos', () => {
  const space = new HypercubeSpace();

  // Ciclo 1: Bug local tóxico
  space.addVertex({
    id: 'modA.ts',
    hexCode: '0xA',
    path: 'modA.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.2, 0.2, 0.5, 0.5],
    lines: 10,
    sizeBytes: 100,
    tokenEstimate: 50,
    symbols: [],
    dependencies: ['./modB'],
    dependents: [],
    lastModified: Date.now()
  });

  space.addVertex({
    id: 'modB.ts',
    hexCode: '0xB',
    path: 'modB.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.25, 0.25, 0.5, 0.5],
    lines: 10,
    sizeBytes: 100,
    tokenEstimate: 50,
    symbols: [],
    dependencies: ['./modA'],
    dependents: [],
    lastModified: Date.now()
  });

  // Ciclo 2: Bucle de eventos intencional en T^4 (flujo dirigido que envuelve la variedad)
  space.addVertex({
    id: 'store.ts',
    hexCode: '0xC',
    path: 'store.ts',
    cell: CubicCell.Storage,
    coordinate: [0.1, 0.5, 0.5, 0.5],
    lines: 10,
    sizeBytes: 100,
    tokenEstimate: 50,
    symbols: [],
    dependencies: ['./ui'],
    dependents: [],
    lastModified: Date.now()
  });

  space.addVertex({
    id: 'ui.ts',
    hexCode: '0xD',
    path: 'ui.ts',
    cell: CubicCell.UI,
    coordinate: [0.5, 0.5, 0.5, 0.5],
    lines: 10,
    sizeBytes: 100,
    tokenEstimate: 50,
    symbols: [],
    dependencies: ['./dispatcher'],
    dependents: [],
    lastModified: Date.now()
  });

  space.addVertex({
    id: 'dispatcher.ts',
    hexCode: '0xE',
    path: 'dispatcher.ts',
    cell: CubicCell.Network,
    coordinate: [0.9, 0.5, 0.5, 0.5],
    lines: 10,
    sizeBytes: 100,
    tokenEstimate: 50,
    symbols: [],
    dependencies: ['./store'], // Cierra el ciclo cruzando 0.9 -> 0.1
    dependents: [],
    lastModified: Date.now()
  });

  const auditor = new TopologicalAuditor();
  const report = auditor.auditSpace(space);

  // Solo modA <-> modB debe ser una fractura CIRCULAR_DEPENDENCY
  const circularFractures = report.fractures.filter(f => f.type === 'CIRCULAR_DEPENDENCY');
  assert.equal(circularFractures.length, 1, 'Solo debe reportarse 1 fractura de ciclo tóxico');
  assert.ok(circularFractures[0].source.includes('mod'));

  // El bucle de eventBus debe estar catalogado en architecturalLoops
  assert.ok(report.architecturalLoops);
  const validLoop = report.architecturalLoops.find(l => l.classification === 'VALID_ARCHITECTURAL_LOOP');
  assert.ok(validLoop, 'El bucle de eventBus debe ser clasificado como VALID_ARCHITECTURAL_LOOP');
});

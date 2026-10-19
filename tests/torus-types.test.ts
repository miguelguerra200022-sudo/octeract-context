/**
 * TESSERACT-CONTEXT v2.0: Pruebas del Sistema de Tipos Toroidales y Panal {4,3,3,4}
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  type TopologyMode,
  type LatticeVector,
  type WindingVector,
  type FacetManifold,
  type ArchitecturalLoop,
  type HypercubeVertex,
  type AuditReport
} from '../src/core/types.ts';

test('Torus & Honeycomb Types: Verifica la instanciación de tipos matemáticos', () => {
  const mode: TopologyMode = 'torus';
  assert.equal(mode, 'torus');

  const lattice: LatticeVector = [0, 1, 0, 0];
  assert.equal(lattice.length, 4);
  assert.equal(lattice[1], 1);

  const winding: WindingVector = [1, 0, -1, 0];
  assert.equal(winding.length, 4);
  assert.equal(winding[0], 1);

  const facet: FacetManifold = {
    facetId: 'facet_core_to_ui',
    packageA: 'packages/core',
    packageB: 'packages/ui',
    axis: 'X',
    boundaryCoordinate: 1.0,
    sharedSymbols: ['ButtonProps', 'ThemeContext']
  };
  assert.equal(facet.axis, 'X');
  assert.equal(facet.sharedSymbols.length, 2);

  const loop: ArchitecturalLoop = {
    cycle: ['store.ts', 'ui.ts', 'action.ts', 'store.ts'],
    windingVector: [1, 0, 0, 0],
    classification: 'VALID_ARCHITECTURAL_LOOP'
  };
  assert.equal(loop.classification, 'VALID_ARCHITECTURAL_LOOP');

  const vertex: Partial<HypercubeVertex> = {
    id: 'test.ts',
    latticeVector: [0, 0, 0, 0],
    windingVector: [0, 0, 0, 0]
  };
  assert.ok(vertex.latticeVector);
});

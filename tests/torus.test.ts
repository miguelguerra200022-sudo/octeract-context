/**
 * TESSERACT-CONTEXT v2.0: Pruebas Unitarias de la Variedad 4-Toro (T^4) y Métrica Geodésica
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { HypercubeSpace } from '../src/core/hypercube.ts';
import { type Point4D } from '../src/core/types.ts';

test('HypercubeSpace Torus: Calcula distancia geodésica periódica sin efecto de borde', () => {
  const space = new HypercubeSpace();

  // Dos puntos en extremos opuestos de la dimensión X (0.05 y 0.95)
  const p1: Point4D = [0.05, 0.5, 0.5, 0.5];
  const p2: Point4D = [0.95, 0.5, 0.5, 0.5];

  // En espacio plano euclidiano acotado: |0.95 - 0.05| = 0.90
  const flatDist = space.euclideanDistance(p1, p2);
  assert.ok(Math.abs(flatDist - 0.90) < 1e-6, `Distancia plana esperada ~0.90, recibida: ${flatDist}`);

  // En la variedad 4-Toro (T^4): min(0.90, 1 - 0.90) = 0.10
  const torusDist = space.toroidalDistance(p1, p2);
  assert.ok(Math.abs(torusDist - 0.10) < 1e-6, `Distancia toroidal esperada ~0.10, recibida: ${torusDist}`);
});

test('HypercubeSpace Torus: geodesicDelta devuelve el desplazamiento con signo más corto en S^1', () => {
  const space = new HypercubeSpace();

  // De 0.05 a 0.95: dar la vuelta a la izquierda es -0.10
  const deltaLeft = space.geodesicDelta(0.05, 0.95);
  assert.ok(Math.abs(deltaLeft - (-0.10)) < 1e-6, `Delta esperado -0.10, recibido: ${deltaLeft}`);

  // De 0.95 a 0.05: avanzar hacia la derecha cruzando el borde es +0.10
  const deltaRight = space.geodesicDelta(0.95, 0.05);
  assert.ok(Math.abs(deltaRight - 0.10) < 1e-6, `Delta esperado +0.10, recibido: ${deltaRight}`);

  // De 0.2 a 0.4: paso directo sin cruzar borde es +0.20
  const deltaDirect = space.geodesicDelta(0.2, 0.4);
  assert.ok(Math.abs(deltaDirect - 0.20) < 1e-6, `Delta esperado +0.20, recibido: ${deltaDirect}`);
});

test('HypercubeSpace Torus: Conmutación de modo topológico (bounded vs torus)', () => {
  const space = new HypercubeSpace();
  assert.equal(space.getTopologyMode(), 'torus'); // Torus por defecto en v2.0

  const p1: Point4D = [0.02, 0.02, 0.02, 0.02];
  const p2: Point4D = [0.98, 0.98, 0.98, 0.98];

  // Por defecto en torus mode: cada coordenada delta es 0.04
  // Distancia = sqrt(4 * (0.04)^2) = sqrt(4 * 0.0016) = sqrt(0.0064) = 0.08
  const defaultDist = space.distance(p1, p2);
  assert.ok(Math.abs(defaultDist - 0.08) < 1e-6);

  // Cambiando a bounded mode: cada coordenada delta es 0.96
  // Distancia = sqrt(4 * (0.96)^2) = 1.92
  space.setTopologyMode('bounded');
  assert.equal(space.getTopologyMode(), 'bounded');
  const boundedDist = space.distance(p1, p2);
  assert.ok(Math.abs(boundedDist - 1.92) < 1e-6);
});

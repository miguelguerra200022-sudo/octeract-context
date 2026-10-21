import test from 'node:test';
import assert from 'node:assert';
import { OcteractTree } from '../src/core/octeract.ts';
import { CubicCell, type HyperVertex, type Point8D } from '../src/core/types.ts';

test('OcteractTree: coordinateToHex y hexToPoint consistencia en R^8', () => {
  const tree = new OcteractTree(3);
  const point: Point8D = [0.8, 0.2, 0.6, 0.9, 0.1, 0.5, 0.7, 0.3];
  const hex = tree.coordinateToHex(point);

  assert.ok(hex.startsWith('0x'));
  // En profundidad 3, cada nivel son 2 caracteres hex (1 byte): 0x + 6 chars
  assert.strictEqual(hex.length, 8);

  const decoded = tree.hexToPoint(hex);
  assert.strictEqual(decoded.length, 8);

  for (let i = 0; i < 8; i++) {
    // La resolución para profundidad 3 es 1 / 2^3 = 0.125
    assert.ok(Math.abs(decoded[i] - point[i]) <= 0.15, `Eje ${i} distorsionado: ${decoded[i]} vs ${point[i]}`);
  }
});

test('OcteractTree: Métrica Toroidal 8D periódica en T^8 sin efecto de borde', () => {
  // Dos puntos opuestos cerca del borde 0.0 y 1.0 en las 8 dimensiones
  const p1: Point8D = [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05];
  const p2: Point8D = [0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95];

  // Distancia euclidiana plana (sin toroide): sqrt(8 * (0.90)^2) = sqrt(6.48) ~= 2.545
  const distFlat = OcteractTree.distance8D(p1, p2);
  // Distancia toroidal: delta = min(0.90, 0.10) = 0.10 -> sqrt(8 * 0.01) = sqrt(0.08) ~= 0.282
  const distTorus = OcteractTree.toroidalDistance8D(p1, p2);

  assert.ok(distTorus < distFlat, 'La distancia toroidal debe tomar el atajo geodésico periódico');
  assert.ok(Math.abs(distTorus - Math.sqrt(8 * 0.01)) < 0.001);
});

test('OcteractTree: Inserción y búsqueda por vecindad en árbol 256-ario', () => {
  const tree = new OcteractTree(2);
  const v1: HyperVertex = {
    id: 'core/engine.ts',
    hexCode: '0xA1',
    path: 'core/engine.ts',
    cell: CubicCell.CoreLogic,
    coordinate: [0.1, 0.2, 0.3, 0.4],
    coordinate8D: [0.1, 0.2, 0.3, 0.4, 0.1, 0.85, 0.2, 0.5],
    lines: 100,
    sizeBytes: 2048,
    tokenEstimate: 500,
    symbols: [],
    dependencies: [],
    dependents: [],
    lastModified: Date.now(),
  };

  const v2: HyperVertex = {
    id: 'core/storage.ts',
    hexCode: '0xF9',
    path: 'core/storage.ts',
    cell: CubicCell.Storage,
    coordinate: [0.9, 0.9, 0.8, 0.7],
    coordinate8D: [0.9, 0.9, 0.8, 0.7, 0.88, 0.35, 0.9, 0.1],
    lines: 200,
    sizeBytes: 4096,
    tokenEstimate: 1000,
    symbols: [],
    dependencies: [],
    dependents: [],
    lastModified: Date.now(),
  };

  tree.insert(v1);
  tree.insert(v2);

  assert.strictEqual(tree.getAllVertices().length, 2);

  // Buscar cerca de v1
  const searchCenter: Point8D = [0.12, 0.22, 0.31, 0.39, 0.11, 0.84, 0.21, 0.49];
  const neighbors = tree.searchNeighborhood(searchCenter, 0.20);

  assert.strictEqual(neighbors.length, 1);
  assert.strictEqual(neighbors[0].id, 'core/engine.ts');

  const stats = tree.getStats();
  assert.strictEqual(stats.totalVertices, 2);
  assert.strictEqual(stats.health8D, 'PERFECT_OCTAGONAL_SYMMETRY');
});

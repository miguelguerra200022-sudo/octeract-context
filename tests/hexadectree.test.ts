import test from 'node:test';
import assert from 'node:assert';
import { HexadecTree } from '../src/core/hexadectree.ts';
import { CubicCell, type HyperVertex } from '../src/core/types.ts';

test('HexadecTree: coordinateToHex y hexToPoint consistencia', () => {
  const tree = new HexadecTree(4);
  const point: [number, number, number, number] = [0.2, 0.8, 0.3, 0.9];
  const hex = tree.coordinateToHex(point, 4);

  assert.ok(hex.startsWith('0x'), 'El código debe comenzar con 0x');
  assert.strictEqual(hex.length, 6, '0x + 4 nibbles = 6 caracteres');

  const reconstructed = tree.hexToPoint(hex);
  assert.ok(Math.abs(reconstructed[0] - point[0]) < 0.2, 'Componente X aproximada');
  assert.ok(Math.abs(reconstructed[1] - point[1]) < 0.2, 'Componente Y aproximada');
  assert.ok(Math.abs(reconstructed[2] - point[2]) < 0.2, 'Componente Z aproximada');
  assert.ok(Math.abs(reconstructed[3] - point[3]) < 0.2, 'Componente W aproximada');
});

test('HexadecTree: Distancia de Hamming O(1)', () => {
  // 0x0000 y 0x0001 difieren solo en el bit 0 del último nibble -> dist = 1
  const d1 = HexadecTree.hammingDistance('0x0000', '0x0001');
  assert.strictEqual(d1, 1, 'Diferencia en 1 bit');

  // 0x0000 y 0xFFFF difieren en los 16 bits (4 por nibble) -> dist = 16
  const d2 = HexadecTree.hammingDistance('0x0000', '0xFFFF');
  assert.strictEqual(d2, 16, 'Diferencia total en 16 bits');

  // Idénticos -> dist = 0
  const d0 = HexadecTree.hammingDistance('0xA4F2', '0xA4F2');
  assert.strictEqual(d0, 0, 'Códigos idénticos');
});

test('HexadecTree: Inserción y búsqueda fractal en árbol 16-ario', () => {
  const tree = new HexadecTree(4);

  const v1: HyperVertex = {
    id: 'src/auth/jwt.ts',
    hexCode: '0xA4F2',
    path: 'src/auth/jwt.ts',
    cell: CubicCell.Security,
    coordinate: [0.8, 0.8, 0.7, 0.2],
    lines: 120,
    sizeBytes: 3200,
    tokenEstimate: 800,
    symbols: [],
    dependencies: [],
    dependents: [],
    lastModified: Date.now(),
  };

  const v2: HyperVertex = {
    id: 'src/db/users.ts',
    hexCode: '0xA4F3',
    path: 'src/db/users.ts',
    cell: CubicCell.Storage,
    coordinate: [0.8, 0.8, 0.7, 0.3],
    lines: 150,
    sizeBytes: 4000,
    tokenEstimate: 1000,
    symbols: [],
    dependencies: [],
    dependents: [],
    lastModified: Date.now(),
  };

  tree.insert(v1);
  tree.insert(v2);

  assert.strictEqual(tree.getAllVertices().length, 2);
  assert.strictEqual(tree.getVertex('src/auth/jwt.ts')?.id, 'src/auth/jwt.ts');

  // Comprobar zoom fractal por prefijo
  const subTree = tree.getSubTree('0xA4F');
  assert.ok(subTree !== null, 'El subárbol 0xA4F debe existir');
  assert.strictEqual(subTree?.aggregate.totalFiles, 2);
  assert.strictEqual(subTree?.aggregate.totalTokens, 1800);
});

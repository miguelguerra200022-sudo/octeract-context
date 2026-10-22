import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractPaletteStorage } from '../src/voxel/palette-storage.ts';

test('OcteractPaletteStorage: BitArray palette compression and exact reconstruction', () => {
  const storage = new OcteractPaletteStorage();
  const sampleTokens = [
    'export', 'class', 'HypercubeSpace', '{',
    'private', 'vertices', ':', 'Map', '<', 'string', ',', 'HyperVertex', '>', ';',
    'public', 'slice', '(', ')', '{', 'return', 'true', ';', '}',
    '}',
  ];

  const compressed = storage.compress(sampleTokens);

  assert.ok(compressed.palette.length > 0, 'La paleta debe contener símbolos únicos');
  assert.ok(compressed.bitWidth >= 2, 'El ancho de bits debe ser de al menos 2 bits');
  assert.ok(compressed.words.length > 0, 'Debe haber palabras de 64 bits empaquetadas');
  assert.ok(compressed.compressionRatio > 1.0, 'La compresión debe reducir el tamaño en bytes');

  const decompressed = storage.decompress(compressed);
  assert.deepEqual(decompressed, sampleTokens, 'La descompresión debe ser 100% fiel e idéntica');
});

test('OcteractPaletteStorage: compressCode and decompressCode with high compression ratio', () => {
  const storage = new OcteractPaletteStorage();
  const code = `
    export class VoxelEngine {
      private state: string = "ACTIVE";
      public tick(): boolean {
        if (this.state === "ACTIVE") {
          return true;
        }
        return false;
      }
    }
  `;

  const compressed = storage.compressCode(code);
  assert.ok(compressed.palette.length > 0);
  assert.ok(compressed.compressionRatio > 1.2);

  const restored = storage.decompressCode(compressed);
  assert.equal(restored.trim(), code.trim());
});

test('OcteractPaletteStorage: handles single-element and dynamic bit-width growth', () => {
  const storage = new OcteractPaletteStorage();
  const repetitiveTokens = new Array(100).fill('const');
  const comp = storage.compress(repetitiveTokens);

  assert.equal(comp.palette.length, 1);
  assert.equal(comp.bitWidth, 1);
  assert.deepEqual(storage.decompress(comp), repetitiveTokens);

  // Large palette forcing bitWidth >= 6
  const largeTokens = Array.from({ length: 40 }, (_, i) => 'token_' + i);
  const compLarge = storage.compress(largeTokens);
  assert.ok(compLarge.bitWidth >= 6);
  assert.deepEqual(storage.decompress(compLarge), largeTokens);
});

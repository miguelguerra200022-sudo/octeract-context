import test from 'node:test';
import assert from 'node:assert/strict';
import { getHardwareAccelerator, CpuMultithreadBackend, WebGPUComputeBackend } from '../src/core/accelerator.ts';

test('HardwareAccelerator: Detecta backend y conmuta limpiamente', async () => {
  const hal = getHardwareAccelerator();
  const backendType = hal.getBackendType();
  assert.ok(['webgpu', 'cpu_multithread'].includes(backendType));
});

test('WebGPUComputeBackend: Inicializa y degrada limpiamente si navigator.gpu no está presente', async () => {
  const backend = new WebGPUComputeBackend();
  const available = await backend.init();
  assert.equal(typeof available, 'boolean');
  assert.equal(backend.getBackendType(), available ? 'webgpu' : 'cpu_multithread');

  // Verifica que los métodos de la interfaz funcionan correctamente
  const offsets = new Uint32Array([0, 1, 1]);
  const indices = new Uint32Array([1]);
  const ranks = await backend.computePageRank(offsets, indices, 2);
  assert.equal(ranks.length, 2);
});

test('HardwareAccelerator: Calcula PageRank en matriz CSR con precisión determinista', async () => {
  const cpuBackend = new CpuMultithreadBackend();

  // Grafo dirigido de 3 nodos: 0 -> 1 -> 2
  const offsets = new Uint32Array([0, 1, 2, 2]);
  const indices = new Uint32Array([1, 2]);
  const ranks = await cpuBackend.computePageRank(offsets, indices, 3, 25, 0.85);

  assert.equal(ranks.length, 3);
  assert.ok(ranks[2] > ranks[0], 'El nodo 2 (sumidero receptor) debe tener mayor PageRank que el nodo raíz 0');
  
  // Suma de probabilidades debe aproximar a 1.0
  const sum = ranks.reduce((acc, val) => acc + val, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.05, `La suma de PageRank debe ser ~1.0, obtenido: ${sum}`);
});

test('HardwareAccelerator: Calcula distancias toroidales masivas en paralelo', async () => {
  const cpuBackend = new CpuMultithreadBackend();

  // 2 nodos con coordenadas en extremos opuestos
  const coordsFlat = new Float32Array([
    0.05, 0.05, 0.05, 0.05,
    0.95, 0.95, 0.95, 0.95
  ]);
  const target: [number, number, number, number] = [0.05, 0.05, 0.05, 0.05];

  const distances = await cpuBackend.computeToroidalGeodesics(coordsFlat, target, 2);
  assert.equal(distances.length, 2);
  assert.ok(Math.abs(distances[0] - 0.0) < 1e-5, 'Distancia a sí mismo debe ser 0');
  
  // En S^1 periódico: delta = min(|0.05 - 0.95|, 1 - 0.90) = 0.10 por eje.
  assert.ok(Math.abs(distances[1] - 0.20) < 1e-4, `Distancia toroidal debe ser 0.20, obtenido: ${distances[1]}`);
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OcteractAnvilContainer } from '../src/voxel/anvil-container.ts';

describe('OcteractAnvilContainer', () => {
  it('creates an empty anvil container with 8KB header', () => {
    const container = new OcteractAnvilContainer();
    const raw = container.serialize();
    assert.ok(raw.length >= 8192, 'Header must be at least 8192 bytes (8KB)');
    assert.strictEqual(container.chunkCount(), 0);
  });

  it('stores and retrieves chunks with exact fidelity in O(1)', () => {
    const container = new OcteractAnvilContainer();
    const sampleData1 = JSON.stringify({ cell: 'CoreLogic', symbols: ['Hypercube', 'Fracture'] });
    const sampleData2 = JSON.stringify({ cell: 'Security', tokens: [101, 202, 303, 404] });

    container.saveChunk(5, 12, sampleData1);
    container.saveChunk(31, 31, sampleData2);

    assert.strictEqual(container.hasChunk(5, 12), true);
    assert.strictEqual(container.hasChunk(31, 31), true);
    assert.strictEqual(container.hasChunk(0, 0), false);
    assert.strictEqual(container.chunkCount(), 2);

    const loaded1 = container.loadChunk(5, 12);
    assert.ok(loaded1);
    assert.strictEqual(new TextDecoder().decode(loaded1), sampleData1);

    const loaded2 = container.loadChunk(31, 31);
    assert.ok(loaded2);
    assert.strictEqual(new TextDecoder().decode(loaded2), sampleData2);
  });

  it('serializes to binary buffer and deserializes correctly', () => {
    const original = new OcteractAnvilContainer();
    const payload = 'TEST_OCTERACT_ANVIL_CHUNK_PAYLOAD_'.repeat(20);
    original.saveChunk(10, 20, payload);

    const binary = original.serialize();
    const restored = OcteractAnvilContainer.deserialize(binary);

    assert.strictEqual(restored.chunkCount(), 1);
    assert.strictEqual(restored.hasChunk(10, 20), true);
    const retrieved = restored.loadChunk(10, 20);
    assert.ok(retrieved);
    assert.strictEqual(new TextDecoder().decode(retrieved), payload);

    const metrics = restored.getMetrics();
    assert.strictEqual(metrics.storedChunks, 1);
    assert.ok(metrics.totalBytes >= 8192);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OcteractObserverPulse, type RedstoneSignal } from '../src/voxel/observer-pulse.ts';

describe('OcteractObserverPulse', () => {
  it('detects 0-tick state changes and emits immediate pulse', () => {
    const network = new OcteractObserverPulse();
    const emitted: RedstoneSignal[] = [];

    network.onPulse((sig) => emitted.push(sig));

    network.observeNode('src/core/auditor.ts', 'hash_v1');
    assert.strictEqual(emitted.length, 0);

    // State change detected
    const pulse = network.notifyStateChange('src/core/auditor.ts', 'hash_v2');
    assert.ok(pulse);
    assert.strictEqual(pulse.power, 15);
    assert.strictEqual(pulse.sourceNode, 'src/core/auditor.ts');
    assert.strictEqual(emitted.length, 1);
  });

  it('propagates redstone signal with distance attenuation across dependency links', () => {
    const network = new OcteractObserverPulse();

    // Link: A -> B -> C -> D
    network.addLink('A', 'B');
    network.addLink('B', 'C');
    network.addLink('C', 'D');

    const propagation = network.propagatePulse('A', 15);

    assert.strictEqual(propagation.get('A'), 15);
    assert.strictEqual(propagation.get('B'), 14);
    assert.strictEqual(propagation.get('C'), 13);
    assert.strictEqual(propagation.get('D'), 12);
  });

  it('schedules delayed game ticks and resolves queued signals', () => {
    const network = new OcteractObserverPulse();
    let tickCounter = 0;

    network.scheduleTick(2, () => {
      tickCounter += 10;
    });

    network.advanceTicks(1);
    assert.strictEqual(tickCounter, 0);

    network.advanceTicks(1);
    assert.strictEqual(tickCounter, 10);
  });
});

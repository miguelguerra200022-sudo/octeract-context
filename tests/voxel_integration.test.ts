import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  OcteractPaletteStorage,
  OcteractMultiNoiseBiomes,
  OcteractWorkingSetHorizon,
  OcteractStarlightBlast,
  OcteractAnvilContainer,
  OcteractJigsawSynthesis,
  OcteractGreedyContextCuller,
  OcteractObserverPulse
} from '../src/voxel/index.ts';

describe('Octeract Voxel Suite Integration', () => {
  it('successfully imports and integrates all 8 voxel engines', () => {
    // 1. Palette
    const palette = new OcteractPaletteStorage();
    const compressed = palette.compress(['SYMBOL_AUTH', 'SYMBOL_AUTH', 'TOKEN_RETURN']);
    const decompressed = palette.decompress(compressed);
    assert.strictEqual(decompressed[0], 'SYMBOL_AUTH');

    // 2. Multi-Noise
    const biomes = new OcteractMultiNoiseBiomes();
    const report = biomes.classify('src/core/kernel.ts', 'export class Kernel {}', {
      centrality: 0.9,
      churnScore: 0.05,
      astDepth: 5
    });
    assert.strictEqual(report.biome, 'DEEP_FROZEN_OCEAN');

    // 3. Working Set
    const ws = new OcteractWorkingSetHorizon();
    ws.addTicket('ticket-1', 'src/index.ts', 31, 2);
    assert.strictEqual(ws.getFileLevel('src/index.ts').level, 31);

    // 4. Starlight
    const starlight = new OcteractStarlightBlast();
    const nid = starlight.registerNode('src/core/kernel.ts');
    const blast = starlight.propagateLight(nid, 15);
    assert.strictEqual(blast.illuminatedNodes[0].lightLevel, 15);

    // 5. Anvil
    const anvil = new OcteractAnvilContainer();
    anvil.saveChunk(1, 1, 'voxel_payload');
    assert.strictEqual(anvil.hasChunk(1, 1), true);

    // 6. Jigsaw
    const jigsaw = new OcteractJigsawSynthesis();
    jigsaw.registerPiece({
      id: 'pieceA',
      template: 'hello',
      sockets: []
    });
    const assembly = jigsaw.assemble('pieceA');
    assert.strictEqual(assembly.success, true);

    // 7. Culler
    const culler = new OcteractGreedyContextCuller();
    const culled = culler.cullAndMesh('export class Test { public run() {} }');
    assert.ok(culled.compressedCode.includes('public run()'));

    // 8. Observer
    const observer = new OcteractObserverPulse();
    observer.observeNode('nodeA', 'v1');
    const pulse = observer.notifyStateChange('nodeA', 'v2');
    assert.strictEqual(pulse?.power, 15);
  });
});

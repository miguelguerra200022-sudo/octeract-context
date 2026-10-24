import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OcteractDragonIndex,
  OcteractDragonBlast,
  OcteractDragonFold,
  OcteractDragonTile,
  OcteractDragonCreaseFuzz,
} from '../src/dragon/index.ts';

test('Octeract Dragon Curve Suite: seamless end-to-end integration of all 5 engines', () => {
  // 1. Source code to fold and analyze
  const sourceCode = `
    export interface SystemConfig {
      maxTokens: number;
      securityMode: boolean;
    }

    export class DragonKernel {
      public configure(config: SystemConfig): boolean {
        if (!config) return false;
        if (config.maxTokens <= 0) return false;
        return this.initializeSubsystems(config);
      }

      private initializeSubsystems(config: SystemConfig): boolean {
        let active = 0;
        for (let i = 0; i < config.maxTokens; i++) {
          active += (i % 2 === 0 ? 1 : 0);
        }
        return active > 0;
      }
    }
  `;

  // 2. Origami Fold culls private bodies
  const foldResult = OcteractDragonFold.foldCode(sourceCode, 'kernel.ts');
  assert.ok(foldResult.foldedLines < foldResult.originalLines);
  assert.ok(foldResult.tokenSavingsPercent > 0);

  // 3. Crease Fuzz locates the stress lines
  const stressReport = OcteractDragonCreaseFuzz.evaluateStress(sourceCode, 'kernel.ts');
  assert.ok(stressReport.totalCreasesFound > 0);

  // 4. Knuth-Octonionic Dragon Address is assigned
  const coords = OcteractDragonIndex.encode8DToDragon([1, 0, 0, 0, 0, 0, 0, 0]);
  assert.ok(coords.hash);

  // 5. 4-Dragon Tessellation
  const tessellation = OcteractDragonTile.partitionRepository([
    { id: 'kernel.ts', cell: 'CoreLogic' },
    { id: 'config.ts', cell: 'Config' },
  ]);
  assert.equal(tessellation.verdict, 'PERFECT_DRAGON_TILING');

  // 6. Wavefront blast propagation
  const blast = OcteractDragonBlast.propagateWavefront(
    'kernel.ts',
    new Map([['kernel.ts', ['config.ts']]]),
    1.0,
    3
  );
  assert.equal(blast.totalNodesReached, 2);
});

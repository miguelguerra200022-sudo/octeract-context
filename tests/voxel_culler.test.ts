import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OcteractGreedyContextCuller } from '../src/voxel/context-culler.ts';

describe('OcteractGreedyContextCuller', () => {
  it('culls private implementation details while preserving public contracts', () => {
    const culler = new OcteractGreedyContextCuller();
    const code = `
export class PaymentGateway {
  private secretKey: string = "sk_123456789";
  private internalSalt: string = "xyz";

  private computeHash(raw: string): string {
    const step1 = raw.split("").reverse().join("");
    const step2 = step1 + this.internalSalt;
    return step2;
  }

  public processCharge(amount: number): boolean {
    return amount > 0;
  }
}
    `.trim();

    const result = culler.cullOccluded(code, { cullPrivateBodies: true });
    assert.ok(result.culledText.includes('public processCharge(amount: number): boolean'));
    assert.ok(!result.culledText.includes('const step1 = raw.split'));
    assert.ok(result.culledText.includes('/* [Occluded private implementation] */'));
  });

  it('greedily meshes contiguous import clusters into compact quad representation', () => {
    const culler = new OcteractGreedyContextCuller();
    const code = `
import { A } from './a';
import { B } from './b';
import { C } from './c';
import { D } from './d';
import { E } from './e';
import { F } from './f';

export function run() {
  return true;
}
    `.trim();

    const result = culler.greedyMeshBoilerplate(code);
    assert.ok(result.meshedText.includes('[GreedyMesh: 6 import statements merged]'));
    assert.ok(result.meshedText.includes('export function run()'));
    assert.ok(result.savingsRatio > 0.3);
  });

  it('performs end-to-end cull and mesh yielding high token compression', () => {
    const culler = new OcteractGreedyContextCuller();
    const code = `
import { A1 } from './a1';
import { A2 } from './a2';
import { A3 } from './a3';
import { A4 } from './a4';
import { A5 } from './a5';
import { A6 } from './a6';

export class HeavyService {
  private cache: Map<string, any> = new Map();

  private performComplexInternalWork(id: string): any {
    let x = 0;
    for (let i = 0; i < 100; i++) {
      x += (i * 2) ^ 0x5a;
    }
    const tempBuffer = new Uint8Array(256);
    for (let j = 0; j < 256; j++) {
      tempBuffer[j] = (x + j) & 0xff;
    }
    return tempBuffer;
  }

  private internalSanitize(val: string): string {
    return val.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  public execute(task: string): void {
    console.log(task);
  }
}
    `.trim();

    const output = culler.cullAndMesh(code);
    assert.ok(output.tokenSavingsPercent >= 40, `Expected >= 40% savings, got ${output.tokenSavingsPercent}%`);
    assert.ok(output.compressedCode.includes('public execute(task: string): void'));
    assert.ok(output.compressedCode.includes('[GreedyMesh: 6 import statements merged]'));
  });
});

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractEntropyGuard } from '../src/voynich/entropy-guard.ts';

test('OcteractEntropyGuard: measures healthy code within normal h2 bounds', () => {
  const guard = new OcteractEntropyGuard();

  const normalCode = `
    import { HypercubeSpace } from './hypercube.ts';
    export class ContextEngine {
      private space: HypercubeSpace;
      constructor(rootDir: string) {
        this.space = new HypercubeSpace(rootDir);
      }
      public async executeQuery(query: string): Promise<QueryResult> {
        return this.space.findClosestVertices(query);
      }
    }
  `;

  const report = guard.computeSecondOrderEntropy(normalCode);

  assert.equal(report.isSafe, true);
  assert.equal(report.verdict, 'HEALTHY');
  assert.ok(report.h2 >= 1.6 && report.h2 <= 4.2, `h2 (${report.h2}) debe estar en rango saludable [1.6, 4.2]`);
});

test('OcteractEntropyGuard: catches collapsed entropy (lazy AI boilerplate / repetition)', () => {
  const guard = new OcteractEntropyGuard();

  const collapsedCode = `
    // ... rest of code
    // ... rest of code
    // ... rest of code
    // ... rest of code
    // ... rest of code
    // ... rest of code
    // ... rest of code
    // ... rest of code
  `;

  const report = guard.computeSecondOrderEntropy(collapsedCode);

  assert.equal(report.isSafe, false);
  assert.equal(report.verdict, 'COLLAPSED_LAZY');
  assert.ok(report.h2 < 1.4, `h2 (${report.h2}) debe ser < 1.4 en código colapsado`);
});

test('OcteractEntropyGuard: catches hyper-entropy (random obfuscation / chaotic noise)', () => {
  const guard = new OcteractEntropyGuard();

  const chaoticCode = `
    const _0x9f1a = "xq7$#P9!kL0*z@Qv1&eR8^mB4~wE2(yT5)uI3+oO6_pA";
    const _0x2b3c = function(_0x4d5e) { return "9aZ!7@qW#4$eR%1^tY&8*uI(3)oP"; };
    function _0x87a9b0c(_0x111, _0x222) { return "%^&*()_+~|}{[]:;?><,./"; }
  `;

  const report = guard.computeSecondOrderEntropy(chaoticCode);

  // El texto caótico con caracteres aleatorios tiene alta entropía o entropía desbalanceada
  assert.ok(report.h1 > 4.5 || report.h2 > 3.8, 'Debe detectar alta entropía en código ofuscado');
});

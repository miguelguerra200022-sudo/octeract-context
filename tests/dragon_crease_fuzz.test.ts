import test from 'node:test';
import assert from 'node:assert/strict';
import { OcteractDragonCreaseFuzz } from '../src/dragon/dragonCreaseFuzz.ts';

test('OcteractDragonCreaseFuzz: locates critical mechanical crease bifurcation lines', () => {
  const code = `
    export function checkAccess(user: any): boolean {
      if (!user) return false;
      if (user.role === 'admin' && user.age >= 18) {
        return true;
      }
      return false;
    }
  `;

  const creases = OcteractDragonCreaseFuzz.locateCreases(code);

  assert.ok(creases.length >= 2);
  assert.ok(creases.some((c) => c.foldedType === 'BOOLEAN_NEGATION'));
  assert.ok(creases.some((c) => c.foldedType === 'BOUNDARY_OPERATOR'));
});

test('OcteractDragonCreaseFuzz: evaluates stress resistance and pinpoints fragile creases', () => {
  const code = `
    export function compute(val: number): number {
      if (val === 42) {
        return val * 2;
      }
      return 0;
    }
  `;

  const report = OcteractDragonCreaseFuzz.evaluateStress(code, 'compute.ts');

  assert.equal(report.filePath, 'compute.ts');
  assert.ok(report.totalCreasesFound > 0);
  assert.ok(report.creaseStressScore >= 0 && report.creaseStressScore <= 100);
});
